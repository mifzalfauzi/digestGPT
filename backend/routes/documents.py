from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import io
from datetime import datetime

from database import get_db
from models import User, Document
from dependencies import (
    get_current_active_user, 
    check_document_limit,
    increment_document_usage,
    increment_token_usage,
    estimate_tokens
)

# Import document processing functions from utility module
from document_utils import (
    extract_text_from_pdf,
    extract_text_from_docx,
    analyze_document_with_chunking,
    count_words,
    split_text_into_chunks,
    should_chunk_document,
    find_quote_position
)

router = APIRouter(prefix="/documents", tags=["documents"])

# Pydantic models
class DocumentResponse(BaseModel):
    id: int
    filename: str
    filesize: int
    word_count: int
    summary: str
    analysis_method: str
    uploaded_at: str

class DocumentAnalysisResponse(BaseModel):
    success: bool
    document_id: int
    filename: str
    file_size: int
    text_length: int
    word_count: int
    chunk_count: int
    analysis_method: str
    analysis: dict
    analyzed_at: str

class TextAnalysisRequest(BaseModel):
    text: str

class DocumentListResponse(BaseModel):
    documents: List[DocumentResponse]
    total: int

@router.post("/upload", response_model=DocumentAnalysisResponse)
async def upload_and_analyze_document(
    file: UploadFile = File(...),
    current_user: User = Depends(check_document_limit),
    db: Session = Depends(get_db)
):
    """Upload and analyze a PDF or DOCX file"""
    # Check file type
    if not file.filename.lower().endswith(('.pdf', '.docx')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and DOCX files are supported"
        )
    
    # Check file size (limit to 10MB)
    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 10MB"
        )
    
    try:
        # Extract text based on file type
        if file.filename.lower().endswith('.pdf'):
            text = extract_text_from_pdf(file_bytes)
        else:  # .docx
            text = extract_text_from_docx(file_bytes)
        
        if not text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No text found in the document"
            )
        
        # Calculate document statistics
        word_count = count_words(text)
        chunks = split_text_into_chunks(text) if should_chunk_document(text) else [text]
        
        # Estimate tokens for usage tracking
        estimated_tokens = estimate_tokens(text)
        
        # Analyze document with chunking if needed
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
        
        # Store document in database
        new_document = Document(
            user_id=current_user.id,
            filename=file.filename,
            filesize=len(file_bytes),
            document_text=text,
            summary=analysis.get("summary", ""),
            key_points=json.dumps(analysis.get("key_points", [])),
            risk_flags=json.dumps(analysis.get("risk_flags", [])),
            key_concepts=json.dumps(analysis.get("key_concepts", [])),
            word_count=word_count,
            analysis_method=analysis.get("analysis_method", "single")
        )
        
        db.add(new_document)
        db.commit()
        db.refresh(new_document)
        
        # Update usage tracking
        increment_document_usage(current_user.id, db)
        increment_token_usage(current_user.id, estimated_tokens, db)
        
        return DocumentAnalysisResponse(
            success=True,
            document_id=new_document.id,
            filename=file.filename,
            file_size=len(file_bytes),
            text_length=len(text),
            word_count=word_count,
            chunk_count=len(chunks),
            analysis_method=analysis.get("analysis_method", "single"),
            analysis=analysis,
            analyzed_at=datetime.now().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing file: {str(e)}"
        )

@router.post("/analyze-text", response_model=DocumentAnalysisResponse)
async def analyze_text_direct(
    request: TextAnalysisRequest,
    current_user: User = Depends(check_document_limit),
    db: Session = Depends(get_db)
):
    """Analyze pasted text directly"""
    text = request.text.strip()
    
    if not text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text content is required"
        )
    
    if len(text) > 50000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text too long. Maximum length is 50,000 characters"
        )
    
    try:
        # Calculate document statistics
        word_count = count_words(text)
        chunks = split_text_into_chunks(text) if should_chunk_document(text) else [text]
        
        # Estimate tokens for usage tracking
        estimated_tokens = estimate_tokens(text)
        
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
        
        # Store document in database
        new_document = Document(
            user_id=current_user.id,
            filename="Pasted Text",
            filesize=len(text.encode('utf-8')),
            document_text=text,
            summary=analysis.get("summary", ""),
            key_points=json.dumps(analysis.get("key_points", [])),
            risk_flags=json.dumps(analysis.get("risk_flags", [])),
            key_concepts=json.dumps(analysis.get("key_concepts", [])),
            word_count=word_count,
            analysis_method=analysis.get("analysis_method", "single")
        )
        
        db.add(new_document)
        db.commit()
        db.refresh(new_document)
        
        # Update usage tracking
        increment_document_usage(current_user.id, db)
        increment_token_usage(current_user.id, estimated_tokens, db)
        
        return DocumentAnalysisResponse(
            success=True,
            document_id=new_document.id,
            filename="Pasted Text",
            file_size=len(text.encode('utf-8')),
            text_length=len(text),
            word_count=word_count,
            chunk_count=len(chunks),
            analysis_method=analysis.get("analysis_method", "single"),
            analysis=analysis,
            analyzed_at=datetime.now().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing text: {str(e)}"
        )

@router.get("/", response_model=DocumentListResponse)
async def get_user_documents(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 10
):
    """Get user's documents with pagination"""
    # Get user's documents
    documents = (
        db.query(Document)
        .filter(Document.user_id == current_user.id)
        .order_by(Document.uploaded_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    # Get total count
    total = db.query(Document).filter(Document.user_id == current_user.id).count()
    
    document_responses = [
        DocumentResponse(
            id=doc.id,
            filename=doc.filename,
            filesize=doc.filesize,
            word_count=doc.word_count,
            summary=doc.summary,
            analysis_method=doc.analysis_method,
            uploaded_at=doc.uploaded_at.isoformat()
        )
        for doc in documents
    ]
    
    return DocumentListResponse(
        documents=document_responses,
        total=total
    )

@router.get("/{document_id}")
async def get_document(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific document with full analysis"""
    # Get document
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Parse JSON fields
    try:
        key_points = json.loads(document.key_points) if document.key_points else []
        risk_flags = json.loads(document.risk_flags) if document.risk_flags else []
        key_concepts = json.loads(document.key_concepts) if document.key_concepts else []
    except json.JSONDecodeError:
        key_points = []
        risk_flags = []
        key_concepts = []
    
    return {
        "id": document.id,
        "filename": document.filename,
        "filesize": document.filesize,
        "word_count": document.word_count,
        "summary": document.summary,
        "analysis_method": document.analysis_method,
        "uploaded_at": document.uploaded_at.isoformat(),
        "document_text": document.document_text,
        "analysis": {
            "summary": document.summary,
            "key_points": key_points,
            "risk_flags": risk_flags,
            "key_concepts": key_concepts
        }
    }

@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a document"""
    # Get document
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Delete document
    db.delete(document)
    db.commit()
    
    return {"message": "Document deleted successfully"} 