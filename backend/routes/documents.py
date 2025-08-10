from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
from io import BytesIO
from datetime import datetime
from database import supabase
import uuid

from database import get_db
from models import User, Document, ChatHistory, Collection
from dependencies import (
    get_current_active_user, 
    check_document_limit,
    check_token_limit,
    increment_document_usage,
    increment_token_usage,
    estimate_tokens
)
from routes.collections import check_and_delete_empty_collection

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
    id: uuid.UUID
    collection_id: Optional[uuid.UUID] = None
    filename: str
    filesize: int
    word_count: int
    summary: str
    analysis_method: str
    file_url: Optional[str] = None
    uploaded_at: str

class DocumentAnalysisResponse(BaseModel):
    success: bool
    document_id: uuid.UUID
    collection_id: Optional[uuid.UUID] = None
    filename: str
    file_size: int
    text_length: int
    word_count: int
    chunk_count: int
    analysis_method: str
    analysis: dict
    document_text: str  # Add document text for frontend highlighting
    analyzed_at: str

class TextAnalysisRequest(BaseModel):
    text: str
    collection_id: Optional[str] = None

class DocumentListResponse(BaseModel):
    documents: List[DocumentResponse]
    total: int

@router.post("/upload", response_model=DocumentAnalysisResponse)
async def upload_and_analyze_document(
    file: UploadFile = File(...),
    current_user: User = Depends(check_document_limit),
    collection_id: Optional[str] = Form(None),
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
        
        print("Supabase URL:", supabase.supabase_url)
        print("Supabase Key exists from upload:", bool(supabase.supabase_key))
        try:
            buckets = supabase.storage.list_buckets()
            print("Available Buckets:", buckets)

            bucket_info = supabase.storage.get_bucket("documents-uploaded-digestifile")
            print("Bucket info:", bucket_info)
            print("Bucket public:", getattr(bucket_info, 'public', 'unknown'))
        except Exception as e:
            print("Bucket error:", e)
        
        
            
        unique_id = uuid.uuid4().hex[:8]  
        filename_parts = file.filename.rsplit('.', 1)
        safe_filename = f"{filename_parts[0]}_{unique_id}.{filename_parts[1]}" if len(filename_parts) == 2 else f"{file.filename}_{unique_id}"

        file_path = f"{current_user.id}/{safe_filename}"
        print(f"Upload path: {file_path}")

        response = supabase.storage.from_("documents-uploaded-digestifile").upload(
            file_path,
            file_bytes,
            file_options={"content-type": file.content_type}
        )
        print("Upload response:", response)

        if not response:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload file to Supabase"
            )

        try:
            # Try public URL first
            file_url_response = supabase.storage.from_("documents-uploaded-digestifile").get_public_url(file_path)
            file_url = file_url_response['publicUrl'] if isinstance(file_url_response, dict) else str(file_url_response)
            
            # Clean up the URL - remove any trailing characters
            file_url = file_url.rstrip('?')
            print(f"Public URL: {file_url}")
            
            # Test if the public URL is accessible
            import requests
            test_response = requests.head(file_url, timeout=5)
            print(f"Public URL accessibility: {test_response.status_code}")
            
            if test_response.status_code != 200:
                raise Exception(f"Public URL returned {test_response.status_code}")
                
        except Exception as e:
            print(f"Public URL failed: {e}, trying signed URL")
            try:
                # Fallback to signed URL (24 hour expiry)
                signed_url_response = supabase.storage.from_("documents-uploaded-digestifile").create_signed_url(file_path, 86400)
                file_url = signed_url_response['signedURL'] if isinstance(signed_url_response, dict) else str(signed_url_response)
                print(f"Signed URL: {file_url}")
            except Exception as signed_e:
                print(f"Signed URL also failed: {signed_e}")
                file_url = None
        
        
        # Extract text based on file type
        if file.filename.lower().endswith('.pdf'):
            text = extract_text_from_pdf(file_bytes)
            print("Text from PDF:", text)
        else:  # .docx
            text = extract_text_from_docx(file_bytes)
            # print("Text from DOCX:", text)
        
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
        
        # Check if user has enough tokens before analysis
        await check_token_limit(current_user, db, estimated_tokens)
        
        # Analyze document with chunking if needed
        analysis = await analyze_document_with_chunking(text)
        print("Analysis result:", analysis)
        
        print("Key points:", analysis.get("key_points"))
        print("Risk flags:", analysis.get("risk_flags"))
        print("Key concepts:", analysis.get("key_concepts"))
        print("SWOT analysis:", analysis.get("swot_analysis"))
        
        # Add position information for highlighting
        for key_point in analysis.get("key_points", []):
            if isinstance(key_point, dict) and "quote" in key_point:
                position = find_quote_position(text, key_point["quote"])
                key_point["position"] = position
        
        for risk_flag in analysis.get("risk_flags", []):
            if isinstance(risk_flag, dict) and "quote" in risk_flag:
                position = find_quote_position(text, risk_flag["quote"])
                risk_flag["position"] = position
                
        parsed_collection_id = None
        if collection_id:
            try:
                parsed_collection_id = uuid.UUID(collection_id)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid collection ID.")

        
        # Store document in database
        new_document = Document(
            user_id=current_user.id,
            collection_id=parsed_collection_id,
            filename=file.filename,
            filesize=len(file_bytes),
            document_text=text,
            summary=analysis.get("summary", ""),
            key_points=json.dumps(analysis.get("key_points", [])),
            risk_flags=json.dumps(analysis.get("risk_flags", [])),
            key_concepts=json.dumps(analysis.get("key_concepts", [])),
            swot_analysis=json.dumps(analysis.get("swot_analysis", {})), 
            word_count=word_count,
            analysis_method=analysis.get("analysis_method", "single"),
            file_url=file_url  # Store the file URL for later retrieval
        )
        
        print(f"Creating document with user_id: {current_user.id}, collection_id: {parsed_collection_id}, file_url: {file_url}")
        
        db.add(new_document)
        db.commit()
        db.refresh(new_document)
        
        print(f"Document saved with ID: {new_document.id}, file_url: {new_document.file_url}")
        
        # Update usage tracking
        increment_document_usage(current_user.id, db)
        increment_token_usage(current_user.id, estimated_tokens, db)
        
        return DocumentAnalysisResponse(
            success=True,
            document_id=new_document.id,
            collection_id=parsed_collection_id,
            filename=file.filename,
            file_size=len(file_bytes),
            text_length=len(text),
            word_count=word_count,
            chunk_count=len(chunks),
            analysis_method=analysis.get("analysis_method", "single"),
            analysis=analysis,
            document_text=text, # Add document_text to the response
            analyzed_at=datetime.now().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print("Exception occurred:", str(e))
        print("Full traceback:", traceback.format_exc())
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
        
        # Check if user has enough tokens before analysis
        await check_token_limit(current_user, db, estimated_tokens)
        
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
        
        # Parse collection_id if provided
        parsed_collection_id = None
        if request.collection_id:
            try:
                parsed_collection_id = uuid.UUID(request.collection_id)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid collection ID.")
        
        # Store document in database
        new_document = Document(
            user_id=current_user.id,
            collection_id=parsed_collection_id,
            filename="Pasted Text",
            filesize=len(text.encode('utf-8')),
            document_text=text,
            summary=analysis.get("summary", ""),
            key_points=json.dumps(analysis.get("key_points", [])),
            risk_flags=json.dumps(analysis.get("risk_flags", [])),
            key_concepts=json.dumps(analysis.get("key_concepts", [])),
            swot_analysis=json.dumps(analysis.get("swot_analysis", {})),
            word_count=word_count,
            analysis_method=analysis.get("analysis_method", "single"),
            file_url=None  # Text documents don't have file URLs
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
            collection_id=parsed_collection_id,
            filename="Pasted Text",
            file_size=len(text.encode('utf-8')),
            text_length=len(text),
            word_count=word_count,
            chunk_count=len(chunks),
            analysis_method=analysis.get("analysis_method", "single"),
            analysis=analysis,
            document_text=text, # Add document_text to the response
            analyzed_at=datetime.now().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print("Exception occurred:", str(e))
        print("Full traceback:", traceback.format_exc())
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
            collection_id=doc.collection_id,
            filename=doc.filename,
            filesize=doc.filesize,
            word_count=doc.word_count,
            summary=doc.summary,
            analysis_method=doc.analysis_method,
            file_url=getattr(doc, 'file_url', None),
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
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific document with full analysis"""
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
    
    # ✅ FIXED - Parse JSON fields correctly
    try:
        key_points = json.loads(document.key_points) if document.key_points else []
        risk_flags = json.loads(document.risk_flags) if document.risk_flags else []
        key_concepts = json.loads(document.key_concepts) if document.key_concepts else []
        
        # ✅ FIXED - Parse SWOT as object, with proper fallback
        swot_analysis = {}
        if document.swot_analysis:
            try:
                parsed_swot = json.loads(document.swot_analysis)
                # Ensure it has the correct structure
                if isinstance(parsed_swot, dict):
                    swot_analysis = {
                        "strengths": parsed_swot.get("strengths", []),
                        "weaknesses": parsed_swot.get("weaknesses", []),
                        "opportunities": parsed_swot.get("opportunities", []),
                        "threats": parsed_swot.get("threats", [])
                    }
                else:
                    # If it's somehow still an array, convert to empty structure
                    swot_analysis = {
                        "strengths": [],
                        "weaknesses": [],
                        "opportunities": [],
                        "threats": []
                    }
            except json.JSONDecodeError:
                swot_analysis = {
                    "strengths": [],
                    "weaknesses": [],
                    "opportunities": [],
                    "threats": []
                }
        else:
            swot_analysis = {
                "strengths": [],
                "weaknesses": [],
                "opportunities": [],
                "threats": []
            }
            
        print("Parsed SWOT analysis:", swot_analysis)
        print("SWOT analysis type:", type(swot_analysis))
        print("SWOT strengths count:", len(swot_analysis.get("strengths", [])))
        
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        key_points = []
        risk_flags = []
        key_concepts = []
        swot_analysis = {
            "strengths": [],
            "weaknesses": [],
            "opportunities": [],
            "threats": []
        }
    
    return {
        "id": document.id,
        "collection_id": document.collection_id,
        "filename": document.filename,
        "filesize": document.filesize,
        "word_count": document.word_count,
        "summary": document.summary,
        "analysis_method": document.analysis_method,
        "uploaded_at": document.uploaded_at.isoformat(),
        "document_text": document.document_text,
        "file_url": getattr(document, 'file_url', None),
        "key_points": key_points,
        "risk_flags": risk_flags,
        "key_concepts": key_concepts,
        "swot_analysis": swot_analysis,  # ✅ FIXED - Now properly structured
        "analysis": {
            "summary": document.summary,
            "key_points": key_points,
            "risk_flags": risk_flags,
            "key_concepts": key_concepts,
            "swot_analysis": swot_analysis  # ✅ FIXED - Now properly structured
        }
    }

@router.post("/delete")
async def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a document:
    1. Delete from Supabase storage (exact match using file_url)
    2. Delete related chat history
    3. Delete document record from DB
    """

    try:
        # Validate UUID format
        document_uuid = uuid.UUID(document_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid document ID format")

    # Fetch document from DB
    document = (
        db.query(Document)
        .filter(Document.id == document_uuid, Document.user_id == current_user.id)
        .first()
    )

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    bucket_name = "documents-uploaded-digestifile"

    # Extract storage key from file_url
    try:
        storage_key = document.file_url.split(f"/{bucket_name}/", 1)[1]
    except IndexError:
        raise HTTPException(status_code=500, detail="Invalid file URL format stored in DB")

    print(f"Deleting file from bucket: {storage_key}")

    # Delete from Supabase storage
    try:
        response = supabase.storage.from_(bucket_name).remove([storage_key])
        print(f"Supabase storage delete response: {response}")
    except Exception as e:
        print(f"Error deleting file from Supabase storage: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete file from storage")

    # Store collection_id before deletion to check if collection becomes empty
    collection_id = document.collection_id

    # Delete related chat messages
    chat_deleted = db.query(ChatHistory).filter(
        ChatHistory.document_id == document_uuid,
        ChatHistory.user_id == current_user.id
    ).delete(synchronize_session=False)
    print(f"Deleted {chat_deleted} chat messages for document {document_uuid}")

    # Delete document record
    db.delete(document)
    db.commit()
    print(f"Deleted document {document_uuid} from the database")

    # Check if the collection becomes empty and delete it if so
    if collection_id:
        collection_was_deleted = check_and_delete_empty_collection(db, collection_id, current_user.id)
        if collection_was_deleted:
            return {"message": "Document deleted successfully. Empty collection was also removed."}

    return {"message": "Document deleted successfully"}

    
    
@router.post("/delete-all")
async def delete_all_user_data(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete ALL user data: documents, chat history, and collections"""
    try:
        deletion_summary = {
            "documents_deleted": 0,
            "chat_history_deleted": 0,
            "collections_deleted": 0,
            "storage_files_deleted": 0,
            "storage_errors": []
        }
        
        print(f"Starting complete data deletion for user: {current_user.id}")
        
        # Step 1: Get all user documents first (to get file URLs for storage deletion)
        user_documents = db.query(Document).filter(
            Document.user_id == current_user.id
        ).all()
        
        deletion_summary["documents_deleted"] = len(user_documents)
        print(f"Found {len(user_documents)} documents to delete")
        
        # Step 2: Delete files from Supabase storage
        storage_files_to_delete = []
        for document in user_documents:
            if document.file_url:
                # Use document ID as storage filename
                storage_filename = str(document.id)
                storage_files_to_delete.append(storage_filename)
        
        if storage_files_to_delete:
            try:
                print(f"Deleting {len(storage_files_to_delete)} files from storage")
                response = supabase.storage.from_("documents-uploaded-digestifile").remove(storage_files_to_delete)
                
                if isinstance(response, list):
                    for file_result in response:
                        if isinstance(file_result, dict) and 'error' in file_result and file_result['error']:
                            deletion_summary["storage_errors"].append(file_result['error'])
                        else:
                            deletion_summary["storage_files_deleted"] += 1
                else:
                    deletion_summary["storage_files_deleted"] = len(storage_files_to_delete)
                    
                print(f"Storage deletion response: {response}")
                
            except Exception as storage_error:
                print(f"Storage deletion failed: {storage_error}")
                deletion_summary["storage_errors"].append(str(storage_error))
        
        # Step 3: Delete all chat history for the user
        chat_deleted = db.query(ChatHistory).filter(
            ChatHistory.user_id == current_user.id
        ).delete(synchronize_session=False)
        
        deletion_summary["chat_history_deleted"] = chat_deleted
        print(f"Deleted {chat_deleted} chat history records")
        
        # Step 4: Delete all collections for the user
        collections_deleted = db.query(Collection).filter(
            Collection.user_id == current_user.id
        ).delete(synchronize_session=False)
        
        deletion_summary["collections_deleted"] = collections_deleted
        print(f"Deleted {collections_deleted} collections")
        
        # Step 5: Delete all documents for the user
        documents_deleted = db.query(Document).filter(
            Document.user_id == current_user.id
        ).delete(synchronize_session=False)
        
        print(f"Deleted {documents_deleted} documents from database")
        
        # Commit all deletions
        db.commit()
        
        # Build response message
        message = f"Successfully deleted all user data: {deletion_summary['documents_deleted']} documents, {deletion_summary['chat_history_deleted']} chat messages, {deletion_summary['collections_deleted']} collections"
        
        if deletion_summary["storage_files_deleted"] > 0:
            message += f", {deletion_summary['storage_files_deleted']} files from storage"
        
        if deletion_summary["storage_errors"]:
            message += f" (with {len(deletion_summary['storage_errors'])} storage errors)"
        
        return {
            "message": message,
            "summary": deletion_summary
        }
        
    except Exception as error:
        db.rollback()
        print(f"Complete deletion failed: {error}")
        import traceback
        print("Full traceback:", traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete all user data: {str(error)}"
        )
        
@router.get("/deletion-preview")
async def get_deletion_preview(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a preview of what would be deleted"""
    try:
        # Count documents
        documents_count = db.query(Document).filter(
            Document.user_id == current_user.id
        ).count()
        
        # Count chat history
        chat_count = db.query(ChatHistory).filter(
            ChatHistory.user_id == current_user.id
        ).count()
        
        # Count collections
        collections_count = db.query(Collection).filter(
            Collection.user_id == current_user.id
        ).count()
        
        # Count storage files (documents with file_url)
        storage_files_count = db.query(Document).filter(
            Document.user_id == current_user.id,
            Document.file_url.isnot(None)
        ).count()
        
        return {
            "preview": {
                "documents_to_delete": documents_count,
                "chat_messages_to_delete": chat_count,
                "collections_to_delete": collections_count,
                "storage_files_to_delete": storage_files_count
            },
            "warning": "This action cannot be undone. All data will be permanently deleted."
        }
        
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get deletion preview: {str(error)}"
        )
  