import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from models import Invoice, User
from database import get_db, supabase
from dependencies import get_current_active_user
from datetime import datetime
import uuid
import requests

router = APIRouter(prefix="/invoices", tags=["invoices"])

INVOICE_BUCKET_NAME = os.getenv("INVOICE_BUCKET_NAME", "invoices")

# Pydantic models
class InvoiceResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    invoice_id: str
    invoice_date: datetime
    file_url: Optional[str] = None
    uploaded_at: datetime

class InvoiceListResponse(BaseModel):
    invoices: List[InvoiceResponse]
    total: int

class StoreInvoiceRequest(BaseModel):
    invoice_id: str
    invoice_date: datetime
    file_path: str  # Local file path

@router.post("/store-invoice", response_model=InvoiceResponse)
async def store_invoice(
    request: StoreInvoiceRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Store invoice in database and Supabase storage"""
    try:
        # Check if invoice already exists
        existing_invoice = db.query(Invoice).filter(
            Invoice.user_id == current_user.id,
            Invoice.invoice_id == request.invoice_id
        ).first()
        
        if existing_invoice:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invoice already exists"
            )
        
        # Read the local invoice file
        if not os.path.exists(request.file_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice file not found"
            )
        
        with open(request.file_path, 'rb') as file:
            file_bytes = file.read()
        
        # Generate unique filename for storage
        filename = os.path.basename(request.file_path)
        file_path_in_bucket = f"{current_user.id}/{filename}"
        
        # Upload to Supabase storage
        response = supabase.storage.from_(INVOICE_BUCKET_NAME).upload(
            file_path_in_bucket,
            file_bytes,
            file_options={"content-type": "application/pdf"}
        )
        
        if not response:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload invoice to storage"
            )
        
        # Get public URL
        file_url = None
        try:
            file_url_response = supabase.storage.from_(INVOICE_BUCKET_NAME).get_public_url(file_path_in_bucket)
            file_url = file_url_response['publicUrl'] if isinstance(file_url_response, dict) else str(file_url_response)
            file_url = file_url.rstrip('?')
            
            # Test URL accessibility
            test_response = requests.head(file_url, timeout=5)
            if test_response.status_code != 200:
                raise Exception(f"Public URL returned {test_response.status_code}")
                
        except Exception as e:
            print(f"Public URL failed: {e}, trying signed URL")
            try:
                signed_url_response = supabase.storage.from_(INVOICE_BUCKET_NAME).create_signed_url(file_path_in_bucket, 86400)
                file_url = signed_url_response['signedURL'] if isinstance(signed_url_response, dict) else str(signed_url_response)
            except Exception as signed_e:
                print(f"Signed URL also failed: {signed_e}")
                file_url = None
        
        # Store in database
        invoice = Invoice(
            user_id=current_user.id,
            invoice_id=request.invoice_id,
            invoice_date=request.invoice_date,
            file_url=file_url
        )
        
        db.add(invoice)
        db.commit()
        db.refresh(invoice)
        
        return InvoiceResponse(
            id=invoice.id,
            user_id=invoice.user_id,
            invoice_id=invoice.invoice_id,
            invoice_date=invoice.invoice_date,
            file_url=invoice.file_url,
            uploaded_at=invoice.uploaded_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error storing invoice: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to store invoice"
        )

@router.get("/", response_model=InvoiceListResponse)
async def get_user_invoices(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all invoices for the current user"""
    invoices = db.query(Invoice).filter(Invoice.user_id == current_user.id).order_by(Invoice.invoice_date.desc()).all()
    
    invoice_responses = [
        InvoiceResponse(
            id=invoice.id,
            user_id=invoice.user_id,
            invoice_id=invoice.invoice_id,
            invoice_date=invoice.invoice_date,
            file_url=invoice.file_url,
            uploaded_at=invoice.uploaded_at
        )
        for invoice in invoices
    ]
    
    return InvoiceListResponse(
        invoices=invoice_responses,
        total=len(invoice_responses)
    )

@router.get("/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific invoice"""
    invoice = db.query(Invoice).filter(
        Invoice.user_id == current_user.id,
        Invoice.invoice_id == invoice_id
    ).first()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    return InvoiceResponse(
        id=invoice.id,
        user_id=invoice.user_id,
        invoice_id=invoice.invoice_id,
        invoice_date=invoice.invoice_date,
        file_url=invoice.file_url,
        uploaded_at=invoice.uploaded_at
    )

@router.post("/migrate-local-invoices")
async def migrate_local_invoices(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Migrate invoices from local storage to database and Supabase"""
    invoices_dir = os.path.join(os.getcwd(), "invoices")
    
    if not os.path.exists(invoices_dir):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Local invoices directory not found"
        )
    
    migrated_count = 0
    errors = []
    
    try:
        for filename in os.listdir(invoices_dir):
            if filename.endswith('.pdf'):
                file_path = os.path.join(invoices_dir, filename)
                
                # Extract invoice ID from filename (assuming format: invoice_INV-20250829-65CB4B64.pdf)
                if filename.startswith('invoice_'):
                    invoice_id = filename.replace('invoice_', '').replace('.pdf', '')
                else:
                    invoice_id = filename.replace('.pdf', '')
                
                # Check if already migrated
                existing = db.query(Invoice).filter(
                    Invoice.user_id == current_user.id,
                    Invoice.invoice_id == invoice_id
                ).first()
                
                if existing:
                    continue
                
                try:
                    # Extract date from invoice ID (format: INV-20250829-XXXX)
                    date_part = invoice_id.split('-')[1] if '-' in invoice_id else datetime.now().strftime('%Y%m%d')
                    invoice_date = datetime.strptime(date_part, '%Y%m%d')
                    
                    # Store the invoice
                    await store_invoice(
                        StoreInvoiceRequest(
                            invoice_id=invoice_id,
                            invoice_date=invoice_date,
                            file_path=file_path
                        ),
                        current_user,
                        db
                    )
                    
                    migrated_count += 1
                    
                except Exception as e:
                    errors.append(f"Failed to migrate {filename}: {str(e)}")
        
        return {
            "migrated_count": migrated_count,
            "errors": errors
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Migration failed: {str(e)}"
        )