from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import anthropic, openai
from openai import OpenAI
from dotenv import load_dotenv
import os
import uuid
import tiktoken
import re
import secrets
import json

from database import get_db
from models import User, Document, ChatHistory, PublicChatShare, PublicChatView
from dependencies import (
    get_current_active_user,
    check_chat_limit,
    check_token_limit,
    get_user_limits_info,
    increment_chat_usage,
    increment_token_usage,
    estimate_tokens,
)

load_dotenv()

# Import Anthropic client configuration
anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")

# Initialize Anthropic client with better error handling
client = None
if anthropic_api_key:
    try:
        # Try basic initialization first
        import anthropic
        client = anthropic.Anthropic(api_key=anthropic_api_key)
        print("✅ Anthropic client initialized successfully in chat.py")
    except TypeError as e:
        if "proxies" in str(e):
            print(f"⚠️  Anthropic client proxy error in chat.py, trying alternative initialization: {e}")
            try:
                # Alternative: Try initializing with minimal parameters
                import httpx
                http_client = httpx.Client()
                client = anthropic.Anthropic(
                    api_key=anthropic_api_key,
                    http_client=http_client
                )
                print("✅ Anthropic client initialized with custom http client in chat.py")
            except Exception as e2:
                print(f"❌ Alternative Anthropic initialization also failed in chat.py: {e2}")
                client = None
        else:
            print(f"❌ Anthropic client initialization failed in chat.py: {e}")
            client = None
    except Exception as e:
        print(f"❌ Anthropic client initialization failed in chat.py: {e}")
        client = None
else:
    print("⚠️  ANTHROPIC_API_KEY not found in environment variables for chat.py")
    client = None

openai_client = OpenAI(
    base_url="https://openrouter.ai/api/v1", api_key=os.getenv("OPENROUTER_API_KEY")
)
router = APIRouter(prefix="/chat", tags=["chat"])


class CasualChatRequest(BaseModel):
    message: str


class CasualChatResponse(BaseModel):
    ai_response: str
    timestamp: str


# Pydantic models
class ChatRequest(BaseModel):
    document_id: Optional[uuid.UUID] = None
    message: str


class ChatResponse(BaseModel):
    success: bool
    document_id: uuid.UUID
    user_message: str
    ai_response: str
    timestamp: str


class ChatHistoryItem(BaseModel):
    id: uuid.UUID
    user_message: str
    ai_response: str
    timestamp: str


class ChatHistoryResponse(BaseModel):
    document_id: uuid.UUID
    filename: str
    chat_history: List[ChatHistoryItem]
    total: int


class CreatePublicShareRequest(BaseModel):
    document_id: uuid.UUID
    title: str
    description: Optional[str] = None


class CreatePublicShareResponse(BaseModel):
    success: bool
    share_token: str
    share_url: str
    title: str
    description: Optional[str]
    created_at: str


class PublicShareData(BaseModel):
    title: str
    description: Optional[str]
    document_filename: str
    chat_history: List[ChatHistoryItem]
    view_count: int
    created_at: str
    # Document analysis data for rich public viewing
    overview: Optional[str] = None
    key_concepts: Optional[List[dict]] = None
    key_points: Optional[List[dict]] = None
    risk_flags: Optional[List[dict]] = None
    swot_analysis: Optional[dict] = None
    extracted_text: Optional[str] = None
    file_url: Optional[str] = None


def estimate_tokens_tiktoken(text: str, model: str = "gpt-3.5-turbo") -> int:
    """Estimate token count for a given text using tiktoken"""
    try:
        encoding = tiktoken.encoding_for_model(model)
        return len(encoding.encode(text))
    except:
        # Fallback estimation: roughly 4 characters per token
        return len(text) // 4


def chunk_document(document_content: str, max_chunk_tokens: int = 3000, overlap_tokens: int = 200) -> List[Dict[str, Any]]:
    """
    Split document into overlapping chunks that fit within token limits
    """
    if not document_content:
        return []
    
    # Estimate characters per token (rough approximation)
    chars_per_token = 4
    max_chunk_chars = max_chunk_tokens * chars_per_token
    overlap_chars = overlap_tokens * chars_per_token
    
    chunks = []
    start = 0
    chunk_index = 0
    
    while start < len(document_content):
        # Calculate end position for this chunk
        end = min(start + max_chunk_chars, len(document_content))
        
        # Try to break at a natural boundary (paragraph, sentence, etc.)
        if end < len(document_content):
            # Look for paragraph break first
            last_paragraph = document_content.rfind('\n\n', start, end)
            if last_paragraph > start:
                end = last_paragraph
            else:
                # Look for sentence break
                last_sentence = document_content.rfind('.', start, end)
                if last_sentence > start:
                    end = last_sentence + 1
                else:
                    # Look for any whitespace
                    last_space = document_content.rfind(' ', start, end)
                    if last_space > start:
                        end = last_space
        
        chunk_text = document_content[start:end].strip()
        
        if chunk_text:
            chunks.append({
                'index': chunk_index,
                'text': chunk_text,
                'start_pos': start,
                'end_pos': end,
                'token_count': estimate_tokens_tiktoken(chunk_text)
            })
            chunk_index += 1
        
        # Move start position, accounting for overlap
        if end >= len(document_content):
            break
        start = max(end - overlap_chars, start + 1)
    
    return chunks


def find_relevant_chunks(chunks: List[Dict[str, Any]], query: str, top_k: int = 3) -> List[Dict[str, Any]]:
    """
    Find the most relevant chunks for a given query using keyword matching
    """
    query_words = set(query.lower().split())
    
    chunk_scores = []
    for chunk in chunks:
        chunk_words = set(chunk['text'].lower().split())
        # Simple scoring based on word overlap
        overlap = len(query_words.intersection(chunk_words))
        score = overlap / len(query_words) if query_words else 0
        
        # Boost score for exact phrase matches
        query_lower = query.lower()
        chunk_lower = chunk['text'].lower()
        if query_lower in chunk_lower:
            score += 0.5
        
        chunk_scores.append({
            'chunk': chunk,
            'score': score
        })
    
    # Sort by relevance score
    chunk_scores.sort(key=lambda x: x['score'], reverse=True)
    
    return [item['chunk'] for item in chunk_scores[:top_k]]


async def chat_about_document(
    document: Document, user_message: str, chat_history: List
) -> str:
    """Enhanced chat with Claude about a specific document using chunking"""
    if not client:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Anthropic API key not configured",
        )

    document_text = document.document_text
    
    # Calculate available tokens for document content
    max_context_tokens = 8000  # Conservative limit for Claude
    
    # Reserve tokens for user message and chat history
    reserved_tokens = estimate_tokens_tiktoken(user_message) + 2000  # 2000 for response buffer
    
    # Add chat history tokens
    history_text = ""
    if chat_history:
        for chat in chat_history[-5:]:  # Include last 5 exchanges
            history_text += f"User: {chat.question}\nAssistant: {chat.answer}\n\n"
    reserved_tokens += estimate_tokens_tiktoken(history_text)
    
    available_tokens = max_context_tokens - reserved_tokens
    
    # Check if document fits in available context
    document_tokens = estimate_tokens_tiktoken(document_text)
    
    if document_tokens <= available_tokens:
        # Document fits, use it directly
        context = f"Document content:\n{document_text}\n\n"
    else:
        # Document is too large, use chunking
        chunks = chunk_document(document_text, max_chunk_tokens=available_tokens // 3)
        
        if not chunks:
            return "Sorry, I couldn't process this document. It appears to be empty or unreadable."
        
        # Find most relevant chunks
        relevant_chunks = find_relevant_chunks(chunks, user_message, top_k=3)
        
        # Combine relevant chunks
        combined_content = ""
        chunk_info = []
        
        for i, chunk in enumerate(relevant_chunks):
            combined_content += f"\n--- Document Section {chunk['index'] + 1} ---\n{chunk['text']}\n"
            chunk_info.append(f"Section {chunk['index'] + 1}")
        
        context = f"Document content (showing most relevant sections):\n{combined_content}\n\n"
        
        # Add note about chunking if we're not showing the full document
        if len(chunks) > len(relevant_chunks):
            context += f"Note: This document has {len(chunks)} sections total. Showing sections: {', '.join(chunk_info)}\n\n"

    # Add chat history to context
    if history_text:
        context += f"Previous conversation:\n{history_text}"

    prompt = f"""{context}

The user has a question about the document above. Please provide a helpful, accurate response based on the document content.

User question: {user_message}

Please respond naturally and refer to specific parts of the document when relevant."""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            temperature=0.3,
            messages=[{"role": "user", "content": prompt}],
        )

        ai_response = response.content[0].text
        
        # Add contextual note if we used chunking
        if document_tokens > available_tokens:
            total_chunks = len(chunk_document(document_text, max_chunk_tokens=available_tokens // 3))
            relevant_count = min(3, total_chunks)
            if total_chunks > relevant_count:
                ai_response += f"\n\n*Note: I analyzed the most relevant sections of your document for this question. If you need information from other parts, please ask more specific questions.*"
        
        return ai_response

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Anthropic API error: {str(e)}",
        )


@router.post("/casual-chat", response_model=CasualChatResponse)
async def casual_chat(
    chat_request: CasualChatRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if not client:
        raise HTTPException(status_code=500, detail="Anthropic not configured")

    prompt = f"""This is a casual Q&A with the assistant. Please answer naturally.

User: {chat_request.message}
Assistant:"""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            temperature=0.7,
            messages=[{"role": "user", "content": prompt}],
        )

        ai_response = response.content[0].text

        print(f"AI response: {ai_response}")

        # Store chat in ChatHistory
        chat_entry = ChatHistory(
            user_id=current_user.id,
            document_id=None,
            question=chat_request.message,
            answer=ai_response,
        )

        print(f"Chat entry: {chat_entry}")

        db.add(chat_entry)
        db.commit()
        db.refresh(chat_entry)

        # Usage tracking
        print(
            f"Current user ID: {current_user.id}",
            increment_chat_usage(current_user.id, db),
        )
        total_text = chat_request.message + ai_response
        estimated_tokens = estimate_tokens(total_text)
        increment_token_usage(current_user.id, estimated_tokens, db)

        get_user_limits_info(current_user, db)

        print(
            f"Current user ID: {current_user.id}",
            get_user_limits_info(current_user, db),
        )

        return CasualChatResponse(
            ai_response=ai_response, timestamp=chat_entry.timestamp.isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anthropic error: {str(e)}")


@router.post("/casual-chat-gemini", response_model=CasualChatResponse)
async def casual_chat_gemini(chat_request: CasualChatRequest):
    if not openai_client:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    try:
        print("Sending request to OpenRouter...")
        print(f"OpenRouter API key is set: {bool(os.getenv('OPENROUTER_API_KEY'))}")
        print("Chat message:", chat_request.message)

        response = openai_client.chat.completions.create(
            model="google/gemini-2.5-pro",
            messages=[
                {
                    "role": "user",
                    "content": [{"type": "text", "text": chat_request.message}],
                }
            ],
           
        )

        print(f"Response: {response}")

        ai_response = response.choices[0].message.content  # Fixed attribute access
        print(f"AI response: {ai_response}")

        return CasualChatResponse(
            ai_response=ai_response, timestamp=datetime.utcnow().isoformat()
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI error: {str(e)}")


@router.post("/", response_model=ChatResponse)
async def chat_with_document(
    chat_request: ChatRequest,
    current_user: User = Depends(check_chat_limit),
    db: Session = Depends(get_db),
):
    """Chat about a previously analyzed document with chunking support"""
    print(
        f"Chat request received: document_id={chat_request.document_id}, message='{chat_request.message[:50]}...'"
    )
    print(f"Document ID type: {type(chat_request.document_id)}")
    
    # Validate that document_id is provided
    if not chat_request.document_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="document_id is required for document chat"
        )
    
    # Get the document
    document = (
        db.query(Document)
        .filter(
            Document.id == chat_request.document_id, Document.user_id == current_user.id
        )
        .first()
    )

    print(f"Document: {document}")

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
        )

    try:
        # Get existing chat history for context
        chat_history = (
            db.query(ChatHistory)
            .filter(
                ChatHistory.document_id == chat_request.document_id,
                ChatHistory.user_id == current_user.id,
            )
            .order_by(ChatHistory.timestamp.desc())
            .limit(10)
            .all()
        )

        # Estimate tokens for the user message (AI response tokens will be estimated after)
        estimated_input_tokens = estimate_tokens(chat_request.message + (document.document_text or "")[:2000])  # Sample of document for estimation
        
        # Check if user has enough tokens before making AI call
        await check_token_limit(current_user, db, estimated_input_tokens)
        
        # Get AI response using enhanced chunking approach
        ai_response = await chat_about_document(
            document, chat_request.message, chat_history
        )

        print(f"AI response: {ai_response}")

        # Store chat exchange in history
        chat_entry = ChatHistory(
            user_id=current_user.id,
            document_id=chat_request.document_id,
            question=chat_request.message,
            answer=ai_response,
        )

        db.add(chat_entry)
        db.commit()
        db.refresh(chat_entry)
        
        # Store timestamp immediately after refresh to avoid connection issues
        timestamp_iso = chat_entry.timestamp.isoformat()

        # Update usage tracking
        increment_chat_usage(current_user.id, db)

        # Estimate tokens used (user message + AI response)
        total_text = chat_request.message + ai_response
        estimated_tokens = estimate_tokens(total_text)
        increment_token_usage(current_user.id, estimated_tokens, db)

        return ChatResponse(
            success=True,
            document_id=chat_request.document_id,
            user_message=chat_request.message,
            ai_response=ai_response,
            timestamp=timestamp_iso,
        )

    except HTTPException:
        raise
    except Exception as e:
        import traceback

        print("Chat exception occurred:", str(e))
        print("Full traceback:", traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in chat: {str(e)}",
        )


@router.get("/history/{document_id}", response_model=ChatHistoryResponse)
async def get_chat_history(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
):
    """Get chat history for a document"""
    # Verify document belongs to user
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
        )

    # Get chat history
    chat_history = (
        db.query(ChatHistory)
        .filter(
            ChatHistory.document_id == document_id,
            ChatHistory.user_id == current_user.id,
        )
        .order_by(ChatHistory.timestamp.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    # Get total count
    total = (
        db.query(ChatHistory)
        .filter(
            ChatHistory.document_id == document_id,
            ChatHistory.user_id == current_user.id,
        )
        .count()
    )

    chat_items = [
        ChatHistoryItem(
            id=chat.id,
            user_message=chat.question,
            ai_response=chat.answer,
            timestamp=chat.timestamp.isoformat(),
        )
        for chat in reversed(chat_history)  # Reverse to show oldest first
    ]

    return ChatHistoryResponse(
        document_id=document_id,
        filename=document.filename,
        chat_history=chat_items,
        total=total,
    )


@router.get("/history", response_model=List[ChatHistoryResponse])
async def get_all_chat_history(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 10,
):
    """Get chat history for all user's documents"""
    # Get user's documents that have chat history
    documents_with_chats = (
        db.query(Document)
        .join(ChatHistory, Document.id == ChatHistory.document_id)
        .filter(Document.user_id == current_user.id)
        .distinct()
        .offset(skip)
        .limit(limit)
        .all()
    )

    result = []
    for document in documents_with_chats:
        # Get recent chat history for this document
        recent_chats = (
            db.query(ChatHistory)
            .filter(
                ChatHistory.document_id == document.id,
                ChatHistory.user_id == current_user.id,
            )
            .order_by(ChatHistory.timestamp.desc())
            .limit(5)  # Show only recent chats in summary
            .all()
        )

        # Get total count for this document
        total_chats = (
            db.query(ChatHistory)
            .filter(
                ChatHistory.document_id == document.id,
                ChatHistory.user_id == current_user.id,
            )
            .count()
        )

        chat_items = [
            ChatHistoryItem(
                id=chat.id,
                user_message=chat.question,
                ai_response=chat.answer,
                timestamp=chat.timestamp.isoformat(),
            )
            for chat in reversed(recent_chats)
        ]

        result.append(
            ChatHistoryResponse(
                document_id=document.id,
                filename=document.filename,
                chat_history=chat_items,
                total=total_chats,
            )
        )

    return result


@router.delete("/history/{document_id}")
async def delete_chat_history(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Delete all chat history for a document"""
    # Verify document belongs to user
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
        )

    # Delete chat history
    deleted_count = (
        db.query(ChatHistory)
        .filter(
            ChatHistory.document_id == document_id,
            ChatHistory.user_id == current_user.id,
        )
        .delete()
    )

    db.commit()

    return {"message": f"Deleted {deleted_count} chat messages"}


@router.post("/create-public-share", response_model=CreatePublicShareResponse)
async def create_public_share(
    share_request: CreatePublicShareRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create a public share link for a document's chat conversation"""
    
    # Verify document belongs to user
    document = (
        db.query(Document)
        .filter(
            Document.id == share_request.document_id, 
            Document.user_id == current_user.id
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Document not found"
        )

    # Check if document has any chat history
    chat_history_exists = (
        db.query(ChatHistory)
        .filter(
            ChatHistory.document_id == share_request.document_id,
            ChatHistory.user_id == current_user.id,
        )
        .first()
    )

    if not chat_history_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot share a conversation with no chat history"
        )

    # Generate unique share token and chat session ID
    share_token = secrets.token_urlsafe(32)
    chat_session_id = uuid.uuid4()
    
    # Ensure token is unique (very unlikely to collide, but be safe)
    while db.query(PublicChatShare).filter(PublicChatShare.share_token == share_token).first():
        share_token = secrets.token_urlsafe(32)

    try:
        # Create the public share record
        public_share = PublicChatShare(
            user_id=current_user.id,
            document_id=share_request.document_id,
            chat_session_id=chat_session_id,
            share_token=share_token,
            title=share_request.title,
            description=share_request.description,
            is_active=True,
            allow_download=False,  # Default to false for simple implementation
            password_protected=False,  # Default to false for simple implementation
            view_count=0
        )

        db.add(public_share)
        db.commit()
        db.refresh(public_share)

        # Construct the public URL (you may want to make this configurable)
        base_url = os.getenv("BASE_FRONTEND_URL")
        share_url = f"{base_url}/share/{share_token}"

        return CreatePublicShareResponse(
            success=True,
            share_token=share_token,
            share_url=share_url,
            title=share_request.title,
            description=share_request.description,
            created_at=public_share.created_at.isoformat()
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create public share: {str(e)}"
        )


@router.get("/public-share/{share_token}", response_model=PublicShareData)
async def get_public_share(
    share_token: str,
    db: Session = Depends(get_db),
):
    """Get public share data by share token (accessible without authentication)"""
    
    # Find the public share
    public_share = (
        db.query(PublicChatShare)
        .filter(
            PublicChatShare.share_token == share_token,
            PublicChatShare.is_active == True
        )
        .first()
    )

    if not public_share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Shared conversation not found or no longer available"
        )

    # Check if share has expired (if expiration is set)
    if public_share.expires_at and datetime.utcnow() > public_share.expires_at:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This shared conversation has expired"
        )

    # Check view limits (if set)
    if public_share.max_views and public_share.view_count >= public_share.max_views:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This shared conversation has reached its view limit"
        )

    # Get the document
    document = (
        db.query(Document)
        .filter(Document.id == public_share.document_id)
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated document not found"
        )

    # Get chat history for this document
    chat_history = (
        db.query(ChatHistory)
        .filter(
            ChatHistory.document_id == public_share.document_id,
            ChatHistory.user_id == public_share.user_id,
        )
        .order_by(ChatHistory.timestamp.asc())  # Chronological order for public view
        .all()
    )

    # Convert to response format
    chat_items = [
        ChatHistoryItem(
            id=chat.id,
            user_message=chat.question,
            ai_response=chat.answer,
            timestamp=chat.timestamp.isoformat(),
        )
        for chat in chat_history
    ]

    # Parse document analysis data for public viewing
    overview = document.summary if document.summary else None  # Use 'summary' field not 'overview'
    extracted_text = document.document_text if document.document_text else None  # Use 'document_text' field
    file_url = document.file_url if document.file_url else None
    
    # Parse key concepts
    key_concepts = []
    if document.key_concepts:
        try:
            key_concepts = json.loads(document.key_concepts)
            if not isinstance(key_concepts, list):
                key_concepts = []
        except (json.JSONDecodeError, TypeError):
            key_concepts = []
    
    # Parse key points
    key_points = []
    if document.key_points:
        try:
            key_points = json.loads(document.key_points)
            if not isinstance(key_points, list):
                key_points = []
        except (json.JSONDecodeError, TypeError):
            key_points = []
    
    # Parse risk flags
    risk_flags = []
    if document.risk_flags:
        try:
            risk_flags = json.loads(document.risk_flags)
            if not isinstance(risk_flags, list):
                risk_flags = []
        except (json.JSONDecodeError, TypeError):
            risk_flags = []
    
    # Parse SWOT analysis
    swot_analysis = {}
    if document.swot_analysis:
        try:
            parsed_swot = json.loads(document.swot_analysis)
            if isinstance(parsed_swot, dict):
                swot_analysis = {
                    "strengths": parsed_swot.get("strengths", []),
                    "weaknesses": parsed_swot.get("weaknesses", []),
                    "opportunities": parsed_swot.get("opportunities", []),
                    "threats": parsed_swot.get("threats", [])
                }
        except (json.JSONDecodeError, TypeError):
            swot_analysis = {}

    # Increment view count and log the view
    try:
        public_share.view_count += 1
        public_share.last_accessed = datetime.utcnow()
        
        # Log the view for analytics (optional: could extract IP, user agent from request)
        view_log = PublicChatView(
            share_id=public_share.id,
            viewed_at=datetime.utcnow()
        )
        db.add(view_log)
        db.commit()
    except Exception as e:
        print(f"Warning: Failed to update view count: {e}")
        db.rollback()

    return PublicShareData(
        title=public_share.title,
        description=public_share.description,
        document_filename=document.filename,
        chat_history=chat_items,
        view_count=public_share.view_count,
        created_at=public_share.created_at.isoformat(),
        overview=overview,
        key_concepts=key_concepts,
        key_points=key_points,
        risk_flags=risk_flags,
        swot_analysis=swot_analysis,
        extracted_text=extracted_text,
        file_url=file_url
    )