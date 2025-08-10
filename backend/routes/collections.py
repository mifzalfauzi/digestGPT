from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime

from database import get_db
from models import User, Collection, Document
from dependencies import get_current_active_user

# Helper function to check and delete empty collections
def check_and_delete_empty_collection(db: Session, collection_id: uuid.UUID, user_id: uuid.UUID):
    """Check if a collection is empty and delete it if so"""
    remaining_documents_count = db.query(Document).filter(
        Document.collection_id == collection_id,
        Document.user_id == user_id
    ).count()
    
    print(f"Collection {collection_id} has {remaining_documents_count} remaining documents")
    
    if remaining_documents_count == 0:
        # Delete the empty collection
        collection_to_delete = db.query(Collection).filter(
            Collection.id == collection_id,
            Collection.user_id == user_id
        ).first()
        
        if collection_to_delete:
            db.delete(collection_to_delete)
            db.commit()
            print(f"Deleted empty collection {collection_id}")
            return True
    
    return False

router = APIRouter(prefix="/collections", tags=["collections"])

# Pydantic models
class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CollectionResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    created_at: str
    document_count: int = 0

class CollectionWithDocuments(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    created_at: str
    documents: List[dict] = []

@router.post("/", response_model=CollectionResponse)
async def create_collection(
    collection_data: CollectionCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new collection"""
    
    # Create new collection
    new_collection = Collection(
        user_id=current_user.id,
        name=collection_data.name.strip(),
        description=collection_data.description.strip() if collection_data.description else None
    )
    
    db.add(new_collection)
    db.commit()
    db.refresh(new_collection)
    
    return CollectionResponse(
        id=new_collection.id,
        name=new_collection.name,
        description=new_collection.description,
        created_at=new_collection.created_at.isoformat(),
        document_count=0
    )

@router.get("/", response_model=List[CollectionResponse])
async def get_user_collections(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50
):
    """Get user's collections with document counts"""
    from sqlalchemy import func
    
    # Get collections with document counts
    collections_query = (
        db.query(
            Collection,
            func.count(Document.id).label('document_count')
        )
        .outerjoin(Document, Collection.id == Document.collection_id)
        .filter(Collection.user_id == current_user.id)
        .group_by(Collection.id)
        .order_by(Collection.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    
    results = collections_query.all()
    
    print("Results:", results)
    
    collection_responses = []
    for collection, doc_count in results:
        collection_responses.append(CollectionResponse(
            id=collection.id,
            name=collection.name,
            description=collection.description,
            created_at=collection.created_at.isoformat(),
            document_count=doc_count or 0
        ))
        
        print("Collection:", collection)
        print("Doc count:", doc_count)
        
    print("Collection responses:", collection_responses)
    
    return collection_responses

@router.get("/{collection_id}", response_model=CollectionWithDocuments)
async def get_collection_with_documents(
    collection_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific collection with its documents"""
    
    # Get collection
    collection = (
        db.query(Collection)
        .filter(Collection.id == collection_id, Collection.user_id == current_user.id)
        .first()
    )
    
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found"
        )
    
    # Get documents in this collection
    documents = (
        db.query(Document)
        .filter(Document.collection_id == collection_id, Document.user_id == current_user.id)
        .order_by(Document.uploaded_at.desc())
        .all()
    )
    
    print("Documents:", documents)
    
    document_list = []
    for doc in documents:
        document_list.append({
            "id": doc.id,
            "filename": doc.filename,
            "filesize": doc.filesize,
            "word_count": doc.word_count,
            "summary": doc.summary[:200] + "..." if doc.summary and len(doc.summary) > 200 else doc.summary,
            "uploaded_at": doc.uploaded_at.isoformat()
        })
    
    return CollectionWithDocuments(
        id=collection.id,
        name=collection.name,
        description=collection.description,
        created_at=collection.created_at.isoformat(),
        documents=document_list
    )

@router.put("/{collection_id}", response_model=CollectionResponse)
async def update_collection(
    collection_id: uuid.UUID,
    collection_data: CollectionCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a collection"""
    
    # Get collection
    collection = (
        db.query(Collection)
        .filter(Collection.id == collection_id, Collection.user_id == current_user.id)
        .first()
    )
    
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found"
        )
    
    # Update collection
    collection.name = collection_data.name.strip()
    collection.description = collection_data.description.strip() if collection_data.description else None
    
    db.commit()
    db.refresh(collection)
    
    # Get document count
    document_count = db.query(Document).filter(Document.collection_id == collection_id).count()
    
    return CollectionResponse(
        id=collection.id,
        name=collection.name,
        description=collection.description,
        created_at=collection.created_at.isoformat(),
        document_count=document_count
    )

@router.post("/delete")
async def delete_collection(
    collection_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a collection and optionally its documents"""
    try:
        collection_uuid = uuid.UUID(collection_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid collection ID format")
    
    # Get collection
    collection = (
        db.query(Collection)
        .filter(Collection.id == collection_uuid, Collection.user_id == current_user.id)
        .first()
    )
    
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found"
        )
    
    # Remove collection_id from all documents in this collection
    # (This keeps the documents but removes them from the collection)
    db.query(Document).filter(
        Document.collection_id == collection_uuid,
        Document.user_id == current_user.id
    ).update({"collection_id": None})
    
    # Delete the collection
    db.delete(collection)
    db.commit()
    
    return {"message": "Collection deleted successfully"}

@router.get("/by-document/{document_id}", response_model=CollectionWithDocuments)
async def get_collection_by_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get collection that contains a specific document"""
    
    # Get document to find its collection
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
    
    if not document.collection_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document is not part of a collection"
        )
        
    # Get collection with its documents
    collection = (
        db.query(Collection)
        .filter(Collection.id == document.collection_id, Collection.user_id == current_user.id)
        .first()
    )
    
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found"
        )
    
    # Get all documents in this collection
    documents = (
        db.query(Document)
        .filter(Document.collection_id == collection.id, Document.user_id == current_user.id)
        .order_by(Document.uploaded_at.desc())
        .all()
    )
    
    document_list = []
    for doc in documents:
        document_list.append({
            "id": doc.id,
            "filename": doc.filename,
            "filesize": doc.filesize,
            "word_count": doc.word_count,
            "summary": doc.summary[:200] + "..." if doc.summary and len(doc.summary) > 200 else doc.summary,
            "uploaded_at": doc.uploaded_at.isoformat()
        })
    
    return CollectionWithDocuments(
        id=collection.id,
        name=collection.name,
        description=collection.description,
        created_at=collection.created_at.isoformat(),
        documents=document_list
    ) 