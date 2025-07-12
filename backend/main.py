import os
import io
import json
import uuid
import re
from datetime import datetime, timedelta
from typing import Dict, Optional, List, Tuple
import pdfplumber
from docx import Document
from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import anthropic
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="DocuChat API", description="Document analysis API using Claude")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001","http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Anthropic configuration
anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
client = anthropic.Anthropic(api_key=anthropic_api_key) if anthropic_api_key else None

# Simple in-memory storage for usage tracking (replace with database in production)
usage_tracker: Dict[str, Dict] = {}

# Document storage for chat functionality (replace with database in production)
document_storage: Dict[str, Dict] = {}

# Chat message models
class ChatMessage(BaseModel):
    document_id: str
    message: str

class ChatResponse(BaseModel):
    document_id: str
    user_message: str
    ai_response: str
    timestamp: datetime

def get_client_ip(request):
    """Get client IP for usage tracking"""
    return request.client.host

def count_words(text: str) -> int:
    """Count words in text"""
    return len(text.split())

def split_text_into_chunks(text: str, target_words: int = 1200, overlap_words: int = 100) -> List[str]:
    """
    Split text into chunks of approximately target_words each.
    Ensures splitting happens on paragraph boundaries or sentence boundaries.
    
    Args:
        text: The text to split
        target_words: Target number of words per chunk
        overlap_words: Number of words to overlap between chunks
    
    Returns:
        List of text chunks
    """
    if not text.strip():
        return []
    
    # First, try to split by paragraphs
    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
    
    if not paragraphs:
        # If no paragraphs, split by sentences
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        paragraphs = sentences
    
    chunks = []
    current_chunk = ""
    current_word_count = 0
    
    for paragraph in paragraphs:
        paragraph_words = count_words(paragraph)
        
        # If adding this paragraph would exceed target, start a new chunk
        if current_word_count + paragraph_words > target_words and current_chunk:
            chunks.append(current_chunk.strip())
            
            # Start new chunk with overlap from previous chunk
            if overlap_words > 0:
                words = current_chunk.split()
                overlap_text = " ".join(words[-overlap_words:]) if len(words) > overlap_words else current_chunk
                current_chunk = overlap_text + "\n\n" + paragraph
                current_word_count = count_words(overlap_text) + paragraph_words
            else:
                current_chunk = paragraph
                current_word_count = paragraph_words
        else:
            if current_chunk:
                current_chunk += "\n\n" + paragraph
            else:
                current_chunk = paragraph
            current_word_count += paragraph_words
    
    # Add the last chunk
    if current_chunk.strip():
        chunks.append(current_chunk.strip())
    
    # If we have chunks that are still too long, split them further by sentences
    final_chunks = []
    for chunk in chunks:
        if count_words(chunk) <= target_words * 1.5:  # Allow some flexibility
            final_chunks.append(chunk)
        else:
            # Split by sentences
            sentences = re.split(r'[.!?]+', chunk)
            sentences = [s.strip() for s in sentences if s.strip()]
            
            sub_chunk = ""
            sub_word_count = 0
            
            for sentence in sentences:
                sentence_words = count_words(sentence)
                
                if sub_word_count + sentence_words > target_words and sub_chunk:
                    final_chunks.append(sub_chunk.strip())
                    sub_chunk = sentence
                    sub_word_count = sentence_words
                else:
                    if sub_chunk:
                        sub_chunk += ". " + sentence
                    else:
                        sub_chunk = sentence
                    sub_word_count += sentence_words
            
            if sub_chunk.strip():
                final_chunks.append(sub_chunk.strip())
    
    return final_chunks

def should_chunk_document(text: str, word_threshold: int = 1000) -> bool:
    """Determine if a document should be chunked based on word count"""
    return count_words(text) > word_threshold

def check_usage_limit(client_ip: str):
    """Check if client has exceeded daily usage limit"""
    today = datetime.now().date()
    
    if client_ip not in usage_tracker:
        usage_tracker[client_ip] = {"date": today, "count": 0}
    
    user_data = usage_tracker[client_ip]
    
    # Reset counter if it's a new day
    if user_data["date"] != today:
        user_data["date"] = today
        user_data["count"] = 0
    
    # Check daily limit (1 request per day)
    if user_data["count"] >= 1:
        raise HTTPException(status_code=429, detail="Daily usage limit exceeded. Try again tomorrow.")
    
    # Increment counter
    user_data["count"] += 1

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF using pdfplumber"""
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            text = ""
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading PDF: {str(e)}")

def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from DOCX using python-docx"""
    try:
        doc = Document(io.BytesIO(file_bytes))
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading DOCX: {str(e)}")

async def analyze_document_with_claude(text: str) -> dict:
    """Send text to Anthropic Claude for analysis"""
    if not client:
        raise HTTPException(status_code=500, detail="Key not configured")
    
    prompt = f"""You are an AI assistant that helps explain documents clearly. 
Given this document, do the following:
1. Explain what the document is about in 1–2 sentences.
2. Summarize key important points as bullet points.
3. Highlight any risky or confusing parts with 🚩 emoji and explain why.
4. Identify key concepts/terms that are central to understanding this document.

For each key point and risk flag, please also include a short quote (5-15 words) from the original document that supports your analysis.

For key concepts, provide the term and a brief explanation of what it means in the context of this document.

IMPORTANT: You must respond with ONLY valid JSON. Do not include any text before or after the JSON. Do not wrap the JSON in markdown code blocks. Just return pure JSON.

Use this exact JSON structure:
{{
    "summary": "Brief explanation of what the document is about",
    "key_points": [
        {{
            "text": "Point 1 description",
            "quote": "relevant quote from document"
        }},
        {{
            "text": "Point 2 description", 
            "quote": "relevant quote from document"
        }}
    ],
    "risk_flags": [
        {{
            "text": "🚩 Risk 1: explanation",
            "quote": "relevant quote from document"
        }},
        {{
            "text": "🚩 Risk 2: explanation",
            "quote": "relevant quote from document"
        }}
    ],
    "key_concepts": [
        {{
            "term": "Important Term 1",
            "explanation": "What this term means in the context of this document"
        }},
        {{
            "term": "Important Term 2",
            "explanation": "What this term means in the context of this document"
        }}
    ]
}}

Document text:
{text[:8000]}"""
    
    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            temperature=0.3,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        # Get the raw response content
        content = response.content[0].text.strip()
        print(f"Raw Claude response: {content}")  # Debug log
        
        # Try to find and extract JSON from the response
        json_start = content.find('{')
        json_end = content.rfind('}') + 1
        
        if json_start != -1 and json_end > json_start:
            json_content = content[json_start:json_end]
            try:
                result = json.loads(json_content)
                print(f"Parsed JSON successfully: {result}")  # Debug log
                return result
            except json.JSONDecodeError as e:
                print(f"JSON parsing failed: {e}")  # Debug log
                # Try to clean up the JSON
                json_content = json_content.replace('```json', '').replace('```', '').strip()
                try:
                    result = json.loads(json_content)
                    print(f"Parsed cleaned JSON successfully: {result}")  # Debug log
                    return result
                except json.JSONDecodeError:
                    pass
        
        # If we can't parse JSON, create a structured fallback
        print(f"Using fallback parsing for content: {content[:200]}...")  # Debug log
        return {
            "summary": "Document analysis completed. Raw response could not be parsed as JSON.",
            "key_points": [
                {
                    "text": "Analysis completed but response format was unexpected. Please try again or contact support.",
                    "quote": "N/A"
                }
            ],
            "risk_flags": [
                {
                    "text": "🚩 Unable to parse AI response properly. This may indicate a technical issue.",
                    "quote": "N/A"
                }
            ],
            "key_concepts": []
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anthropic API error: {str(e)}")

async def analyze_document_with_chunking(text: str, enable_synthesis: bool = True) -> dict:
    """
    Analyze a document with automatic chunking for long documents.
    
    Args:
        text: The document text to analyze
        enable_synthesis: Whether to use final synthesis for chunked documents
    
    Returns:
        Analysis result dictionary
    """
    word_count = count_words(text)
    print(f"Document word count: {word_count}")
    
    # Check if document needs chunking
    if not should_chunk_document(text):
        print("Document is short enough for single analysis")
        return await analyze_document_with_claude(text)
    
    # Split document into chunks
    chunks = split_text_into_chunks(text)
    print(f"Document split into {len(chunks)} chunks")
    
    if len(chunks) == 1:
        print("Only one chunk created, using single analysis")
        return await analyze_document_with_claude(text)
    
    # Analyze each chunk
    chunk_analyses = []
    for i, chunk in enumerate(chunks):
        print(f"Analyzing chunk {i+1}/{len(chunks)} ({count_words(chunk)} words)")
        try:
            analysis = await analyze_document_with_claude(chunk)
            chunk_analyses.append(analysis)
        except Exception as e:
            print(f"Error analyzing chunk {i+1}: {e}")
            # Continue with other chunks
    
    if not chunk_analyses:
        raise HTTPException(status_code=500, detail="Failed to analyze any document chunks")
    
    # Combine results
    if enable_synthesis and len(chunk_analyses) > 1:
        print("Performing final synthesis of chunk analyses")
        return await synthesize_final_analysis(chunk_analyses, text)
    else:
        print("Aggregating chunk analyses without synthesis")
        return aggregate_chunk_analyses(chunk_analyses)

def aggregate_chunk_analyses(chunk_analyses: List[dict]) -> dict:
    """
    Aggregate multiple chunk analyses into a single analysis.
    
    Args:
        chunk_analyses: List of analysis dictionaries from individual chunks
    
    Returns:
        Combined analysis dictionary
    """
    if not chunk_analyses:
        return {
            "summary": "No analysis data available",
            "key_points": [],
            "risk_flags": [],
            "key_concepts": []
        }
    
    if len(chunk_analyses) == 1:
        return chunk_analyses[0]
    
    # Collect all items from all chunks
    all_key_points = []
    all_risk_flags = []
    all_key_concepts = []
    
    for analysis in chunk_analyses:
        all_key_points.extend(analysis.get("key_points", []))
        all_risk_flags.extend(analysis.get("risk_flags", []))
        all_key_concepts.extend(analysis.get("key_concepts", []))
    
    # Remove duplicates based on text content
    def remove_duplicates(items, key_func=lambda x: x.get("text", "").lower()):
        seen = set()
        unique_items = []
        for item in items:
            key = key_func(item)
            if key and key not in seen:
                seen.add(key)
                unique_items.append(item)
        return unique_items
    
    # Remove duplicates and limit results
    unique_key_points = remove_duplicates(all_key_points)[:15]  # Limit to top 15
    unique_risk_flags = remove_duplicates(all_risk_flags)[:8]   # Limit to top 8
    unique_key_concepts = remove_duplicates(all_key_concepts, lambda x: x.get("term", "").lower())[:10]  # Limit to top 10
    
    # Create combined summary
    chunk_count = len(chunk_analyses)
    combined_summary = f"Document analyzed in {chunk_count} sections. "
    
    # Use the first chunk's summary as base, or create a generic one
    if chunk_analyses[0].get("summary"):
        base_summary = chunk_analyses[0]["summary"]
        if "analyzed in" not in base_summary.lower():
            combined_summary += base_summary
        else:
            combined_summary += "This is a comprehensive analysis of a large document."
    else:
        combined_summary += "This is a comprehensive analysis of a large document."
    
    return {
        "summary": combined_summary,
        "key_points": unique_key_points,
        "risk_flags": unique_risk_flags,
        "key_concepts": unique_key_concepts,
        "chunk_count": chunk_count,
        "analysis_method": "chunked"
    }

async def synthesize_final_analysis(chunk_analyses: List[dict], original_text: str) -> dict:
    """
    Send combined chunk analyses to Claude for final synthesis.
    
    Args:
        chunk_analyses: List of analysis dictionaries from individual chunks
        original_text: Original full document text
    
    Returns:
        Final synthesized analysis
    """
    if not client or len(chunk_analyses) <= 1:
        return aggregate_chunk_analyses(chunk_analyses)
    
    try:
        # Prepare the combined insights for synthesis
        combined_insights = {
            "key_points": [],
            "risk_flags": [],
            "key_concepts": []
        }
        
        for i, analysis in enumerate(chunk_analyses):
            combined_insights["key_points"].extend(analysis.get("key_points", []))
            combined_insights["risk_flags"].extend(analysis.get("risk_flags", []))
            combined_insights["key_concepts"].extend(analysis.get("key_concepts", []))
        
        # Create synthesis prompt
        synthesis_prompt = f"""You are analyzing a large document that has been split into {len(chunk_analyses)} sections for processing.

Here are the insights collected from all sections:

Key Points Found:
{json.dumps(combined_insights["key_points"], indent=2)}

Risk Flags Identified:
{json.dumps(combined_insights["risk_flags"], indent=2)}

Key Concepts Identified:
{json.dumps(combined_insights["key_concepts"], indent=2)}

Please provide a refined, comprehensive analysis that:
1. Creates an overall summary that captures the main themes and purpose of the document
2. Identifies and groups related key points, removing redundancies
3. Consolidates similar risk flags and highlights the most critical ones
4. Organizes key concepts into logical groups and explains their relationships
5. Ensures all insights are relevant and well-supported

IMPORTANT: You must respond with ONLY valid JSON. Do not include any text before or after the JSON. Do not wrap the JSON in markdown code blocks. Just return pure JSON.

Use this exact JSON structure:
{{
    "summary": "Comprehensive summary of the entire document",
    "key_points": [
        {{
            "text": "Consolidated key point description",
            "quote": "relevant quote from document"
        }}
    ],
    "risk_flags": [
        {{
            "text": "🚩 Consolidated risk description",
            "quote": "relevant quote from document"
        }}
    ],
    "key_concepts": [
        {{
            "term": "Important Term",
            "explanation": "What this term means in the context of this document"
        }}
    ]
}}"""

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1500,
            temperature=0.2,
            messages=[
                {"role": "user", "content": synthesis_prompt}
            ]
        )
        
        content = response.content[0].text.strip()
        
        # Parse JSON response
        json_start = content.find('{')
        json_end = content.rfind('}') + 1
        
        if json_start != -1 and json_end > json_start:
            json_content = content[json_start:json_end]
            try:
                result = json.loads(json_content)
                result["chunk_count"] = len(chunk_analyses)
                result["analysis_method"] = "chunked_with_synthesis"
                return result
            except json.JSONDecodeError:
                pass
        
        # Fallback to aggregation if synthesis fails
        print("Synthesis failed, falling back to aggregation")
        return aggregate_chunk_analyses(chunk_analyses)
        
    except Exception as e:
        print(f"Synthesis error: {e}, falling back to aggregation")
        return aggregate_chunk_analyses(chunk_analyses)

def find_quote_position(text: str, quote: str) -> Dict:
    """Find the position of a quote in the document text"""
    if not quote or not quote.strip():
        return {"start": -1, "end": -1, "found": False}
    
    # Clean up the quote for better matching
    clean_quote = quote.strip().lower()
    clean_text = text.lower()
    
    # Try exact match first
    start_pos = clean_text.find(clean_quote)
    if start_pos != -1:
        return {
            "start": start_pos,
            "end": start_pos + len(clean_quote),
            "found": True
        }
    
    # Try partial matching with individual words
    words = clean_quote.split()
    if len(words) > 3:
        # Try matching with first and last few words
        partial_quote = f"{words[0]} {words[1]}.*{words[-2]} {words[-1]}"
        import re
        match = re.search(partial_quote, clean_text)
        if match:
            return {
                "start": match.start(),
                "end": match.end(),
                "found": True
            }
    
    return {"start": -1, "end": -1, "found": False}

def store_document(text: str, filename: str = None) -> str:
    """Store document text and return a unique document ID"""
    document_id = str(uuid.uuid4())
    document_storage[document_id] = {
        "text": text,
        "filename": filename,
        "created_at": datetime.now(),
        "chat_history": []
    }
    return document_id

def get_document(document_id: str) -> Dict:
    """Retrieve document by ID"""
    if document_id not in document_storage:
        raise HTTPException(status_code=404, detail="Document not found")
    return document_storage[document_id]

async def chat_about_document(document_id: str, user_message: str) -> str:
    """Chat with Claude about a specific document"""
    if not client:
        raise HTTPException(status_code=500, detail="Anthropic API key not configured")
    
    document = get_document(document_id)
    document_text = document["text"]
    chat_history = document["chat_history"]
    
    # Build context with document and chat history
    context = f"Document content:\n{document_text[:6000]}\n\n"
    
    if chat_history:
        context += "Previous conversation:\n"
        for chat in chat_history[-5:]:  # Include last 5 exchanges
            context += f"User: {chat['user_message']}\n"
            context += f"Assistant: {chat['ai_response']}\n\n"
    
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
        
        # Store chat exchange in history
        chat_entry = {
            "user_message": user_message,
            "ai_response": ai_response,
            "timestamp": datetime.now()
        }
        document["chat_history"].append(chat_entry)
        
        return ai_response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anthropic API error: {str(e)}")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "DocuChat API is running"}

@app.post("/analyze-file")
async def analyze_file(file: UploadFile = File(...)):
    """Analyze uploaded PDF or DOCX file"""
    # Check file type
    if not file.filename.lower().endswith(('.pdf', '.docx')):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")
    
    # Check file size (limit to 10MB)
    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")
    
    # Extract text based on file type
    try:
        if file.filename.lower().endswith('.pdf'):
            text = extract_text_from_pdf(file_bytes)
        else:  # .docx
            text = extract_text_from_docx(file_bytes)
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="No text found in the document")
        
        # Calculate document statistics
        word_count = count_words(text)
        chunks = split_text_into_chunks(text) if should_chunk_document(text) else [text]
        
        # Store document for chat functionality
        document_id = store_document(text, file.filename)
        
        # Analyze with chunking if needed
        analysis = await analyze_document_with_chunking(text)
        
        # Add position information for highlighting
        for key_point in analysis.get("key_points", []):
            if isinstance(key_point, dict) and "quote" in key_point:
                position = find_quote_position(text, key_point["quote"])
                key_point["position"] = position
        
        for risk_flag in analysis.get("risk_flags", []):
            if isinstance(risk_flag, dict) and "quote" in risk_flag:
                position = find_quote_position(text, risk_flag["quote"])
                risk_flag["position"] = position
        
        return {
            "success": True,
            "document_id": document_id,
            "filename": file.filename,
            "file_size": len(file_bytes),
            "text_length": len(text),
            "word_count": word_count,
            "chunk_count": len(chunks),
            "analysis_method": analysis.get("analysis_method", "single"),
            "document_text": text,
            "analysis": analysis,
            "analyzed_at": datetime.now().isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.post("/analyze-text")
async def analyze_text(text: str = Form(...)):
    """Analyze pasted text directly"""
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text content is required")
    
    if len(text) > 50000:
        raise HTTPException(status_code=400, detail="Text too long. Maximum length is 50,000 characters")
    
    try:
        # Calculate document statistics
        word_count = count_words(text)
        chunks = split_text_into_chunks(text) if should_chunk_document(text) else [text]
        
        # Store document for chat functionality
        document_id = store_document(text, "Pasted Text")
        
        # Analyze with chunking if needed
        analysis = await analyze_document_with_chunking(text)
        
        # Add position information for highlighting
        for key_point in analysis.get("key_points", []):
            if isinstance(key_point, dict) and "quote" in key_point:
                position = find_quote_position(text, key_point["quote"])
                key_point["position"] = position
        
        for risk_flag in analysis.get("risk_flags", []):
            if isinstance(risk_flag, dict) and "quote" in risk_flag:
                position = find_quote_position(text, risk_flag["quote"])
                risk_flag["position"] = position
        
        return {
            "success": True,
            "document_id": document_id,
            "text_length": len(text),
            "word_count": word_count,
            "chunk_count": len(chunks),
            "analysis_method": analysis.get("analysis_method", "single"),
            "document_text": text,
            "analysis": analysis,
            "analyzed_at": datetime.now().isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing text: {str(e)}")

@app.post("/chat")
async def chat_with_document(chat_message: ChatMessage):
    """Chat about a previously analyzed document"""
    try:
        ai_response = await chat_about_document(chat_message.document_id, chat_message.message)
        
        return {
            "success": True,
            "document_id": chat_message.document_id,
            "user_message": chat_message.message,
            "ai_response": ai_response,
            "timestamp": datetime.now().isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in chat: {str(e)}")

@app.get("/document/{document_id}/history")
async def get_chat_history(document_id: str):
    """Get chat history for a document"""
    try:
        document = get_document(document_id)
        
        return {
            "success": True,
            "document_id": document_id,
            "filename": document.get("filename"),
            "chat_history": document["chat_history"],
            "created_at": document["created_at"].isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving chat history: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 