import os
import io
import uuid
import tempfile
from datetime import datetime, timedelta
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import anthropic
from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.orm import Session
from database import get_db
from models import Base, User, UserPlan
from database import engine

# Import route modules
from routes.auth import router as auth_router
from routes.documents import router as documents_router
from routes.chat import router as chat_router
from routes.usage import router as usage_router

# Load environment variables
load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DocuChat API", 
    description="Document analysis API with JWT authentication and usage tracking",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",
        "http://localhost:3000", 
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(chat_router)
app.include_router(usage_router)

# Anthropic configuration
anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
client = anthropic.Anthropic(api_key=anthropic_api_key) if anthropic_api_key else None

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "DocuChat API v2.0 is running",
        "features": [
            "JWT Authentication",
            "User Management", 
            "Document Analysis",
            "Chat with Documents",
            "Usage Tracking",
            "Plan-based Limits"
        ]
    }

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Health check with database connectivity"""
    try:
        result = db.execute(text("SELECT 1")).fetchone()
        return {
            "status": "healthy",
            "database": "connected",
            "anthropic_configured": client is not None
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }

# PDF conversion endpoint (legacy support)
@app.post("/convert-docx-to-pdf")
async def convert_docx_to_pdf(file: UploadFile = File(...)):
    """Convert DOCX to PDF (legacy endpoint)"""
    if not file.filename.lower().endswith('.docx'):
        raise HTTPException(status_code=400, detail="Only DOCX files are supported.")
    
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.lib.enums import TA_JUSTIFY
        from docx import Document
        
        # Read the DOCX file content
        file_content = await file.read()
        
        # Parse DOCX using python-docx
        doc = Document(io.BytesIO(file_content))
        
        # Create PDF using reportlab
        temp_dir = tempfile.gettempdir()
        pdf_filename = f"docx_converted_{uuid.uuid4().hex[:8]}.pdf"
        pdf_path = os.path.join(temp_dir, pdf_filename)
        
        # Create PDF document
        doc_pdf = SimpleDocTemplate(pdf_path, pagesize=A4, 
                                  leftMargin=0.75*inch, rightMargin=0.75*inch,
                                  topMargin=0.75*inch, bottomMargin=0.75*inch)
        story = []
        
        # Get styles
        styles = getSampleStyleSheet()
        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontSize=10,
            spaceAfter=4,
            alignment=TA_JUSTIFY
        )
        
        # Process all paragraphs
        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                story.append(Paragraph(paragraph.text, normal_style))
                story.append(Spacer(1, 4))
        
        # Build PDF
        doc_pdf.build(story)
        
        # Return the PDF file URL
        return {"pdf_url": f"/pdf/{pdf_filename}"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")

@app.get("/pdf/{pdf_filename}")
def serve_pdf(pdf_filename: str):
    """Serve a PDF file from the temp directory"""
    temp_dir = tempfile.gettempdir()
    pdf_path = os.path.join(temp_dir, pdf_filename)
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="PDF not found.")
    return FileResponse(pdf_path, media_type="application/pdf")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 