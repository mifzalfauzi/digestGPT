import os
import io
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, Optional, List
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

app = FastAPI(title="DigestGPT API", description="Document analysis API using Claude")

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

Please format your response as JSON with the following structure:
{{
    "summary": "Brief explanation of what the document is about",
    "key_points": ["Point 1", "Point 2", "Point 3"],
    "risk_flags": ["🚩 Risk 1: explanation", "🚩 Risk 2: explanation"]
}}

Document text:
{text[:8000]}"""
    
    try:
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1000,
            temperature=0.3,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        # Parse the JSON response
        result = json.loads(response.content[0].text)
        return result
    except json.JSONDecodeError:
        # Fallback if Claude doesn't return valid JSON
        content = response.content[0].text
        return {
            "summary": "Document analysis completed",
            "key_points": [content],
            "risk_flags": []
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anthropic API error: {str(e)}")

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
            model="claude-3-5-sonnet-20241022",
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
    return {"message": "DigestGPT API is running"}

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
        
        # Store document for chat functionality
        document_id = store_document(text, file.filename)
        
        # Analyze with Claude
        analysis = await analyze_document_with_claude(text)
        
        return {
            "success": True,
            "document_id": document_id,
            "filename": file.filename,
            "analysis": analysis
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
        # Store document for chat functionality
        document_id = store_document(text, "Pasted Text")
        
        # Analyze with Claude
        analysis = await analyze_document_with_claude(text)
        
        return {
            "success": True,
            "document_id": document_id,
            "analysis": analysis
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