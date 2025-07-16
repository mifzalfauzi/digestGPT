from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import anthropic
import os

from database import get_db
from models import User, Document, ChatHistory
from dependencies import (
    get_current_active_user,
    check_chat_limit,
    increment_chat_usage,
    increment_token_usage,
    estimate_tokens
)

# Import Anthropic client configuration
anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
client = anthropic.Anthropic(api_key=anthropic_api_key) if anthropic_api_key else None

router = APIRouter(prefix="/chat", tags=["chat"])

# Pydantic models
class ChatRequest(BaseModel):
    document_id: int
    message: str

class ChatResponse(BaseModel):
    success: bool
    document_id: int
    user_message: str
    ai_response: str
    timestamp: str

class ChatHistoryItem(BaseModel):
    id: int
    user_message: str
    ai_response: str
    timestamp: str

class ChatHistoryResponse(BaseModel):
    document_id: int
    filename: str
    chat_history: List[ChatHistoryItem]
    total: int

async def chat_about_document(document: Document, user_message: str, chat_history: List) -> str:
    """Chat with Claude about a specific document"""
    if not client:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Anthropic API key not configured"
        )
    
    document_text = document.document_text
    
    # Build context with document and chat history
    context = f"Document content:\n{document_text[:6000]}\n\n"
    
    if chat_history:
        context += "Previous conversation:\n"
        for chat in chat_history[-5:]:  # Include last 5 exchanges
            context += f"User: {chat.question}\n"
            context += f"Assistant: {chat.answer}\n\n"
    
    prompt = f"""{context}

The user has a question about the document above. Please provide a helpful, accurate response based on the document content.

User question: {user_message}

Please respond naturally and refer to specific parts of the document when relevant."""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            temperature=0.3,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        ai_response = response.content[0].text
        return ai_response
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Anthropic API error: {str(e)}"
        )

@router.post("/", response_model=ChatResponse)
async def chat_with_document(
    chat_request: ChatRequest,
    current_user: User = Depends(check_chat_limit),
    db: Session = Depends(get_db)
):
    """Chat about a previously analyzed document"""
    # Get the document
    document = (
        db.query(Document)
        .filter(
            Document.id == chat_request.document_id,
            Document.user_id == current_user.id
        )
        .first()
    )
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    try:
        # Get existing chat history for context
        chat_history = (
            db.query(ChatHistory)
            .filter(
                ChatHistory.document_id == chat_request.document_id,
                ChatHistory.user_id == current_user.id
            )
            .order_by(ChatHistory.timestamp.desc())
            .limit(10)
            .all()
        )
        
        # Get AI response
        ai_response = await chat_about_document(document, chat_request.message, chat_history)
        
        # Store chat exchange in history
        chat_entry = ChatHistory(
            user_id=current_user.id,
            document_id=chat_request.document_id,
            question=chat_request.message,
            answer=ai_response
        )
        
        db.add(chat_entry)
        db.commit()
        db.refresh(chat_entry)
        
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
            timestamp=chat_entry.timestamp.isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in chat: {str(e)}"
        )

@router.get("/history/{document_id}", response_model=ChatHistoryResponse)
async def get_chat_history(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50
):
    """Get chat history for a document"""
    # Verify document belongs to user
    document = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.user_id == current_user.id
        )
        .first()
    )
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Get chat history
    chat_history = (
        db.query(ChatHistory)
        .filter(
            ChatHistory.document_id == document_id,
            ChatHistory.user_id == current_user.id
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
            ChatHistory.user_id == current_user.id
        )
        .count()
    )
    
    chat_items = [
        ChatHistoryItem(
            id=chat.id,
            user_message=chat.question,
            ai_response=chat.answer,
            timestamp=chat.timestamp.isoformat()
        )
        for chat in reversed(chat_history)  # Reverse to show oldest first
    ]
    
    return ChatHistoryResponse(
        document_id=document_id,
        filename=document.filename,
        chat_history=chat_items,
        total=total
    )

@router.get("/history", response_model=List[ChatHistoryResponse])
async def get_all_chat_history(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 10
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
                ChatHistory.user_id == current_user.id
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
                ChatHistory.user_id == current_user.id
            )
            .count()
        )
        
        chat_items = [
            ChatHistoryItem(
                id=chat.id,
                user_message=chat.question,
                ai_response=chat.answer,
                timestamp=chat.timestamp.isoformat()
            )
            for chat in reversed(recent_chats)
        ]
        
        result.append(ChatHistoryResponse(
            document_id=document.id,
            filename=document.filename,
            chat_history=chat_items,
            total=total_chats
        ))
    
    return result

@router.delete("/history/{document_id}")
async def delete_chat_history(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete all chat history for a document"""
    # Verify document belongs to user
    document = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.user_id == current_user.id
        )
        .first()
    )
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Delete chat history
    deleted_count = (
        db.query(ChatHistory)
        .filter(
            ChatHistory.document_id == document_id,
            ChatHistory.user_id == current_user.id
        )
        .delete()
    )
    
    db.commit()
    
    return {"message": f"Deleted {deleted_count} chat messages"} 