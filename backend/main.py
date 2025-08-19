import os
import io
import uuid
import tempfile
from datetime import datetime, timedelta
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from auth_backend import create_access_token, verify_token
from dependencies import get_access_token_from_cookie, get_refresh_token_from_cookie
from fastapi.responses import FileResponse
from pydantic import BaseModel
import anthropic
from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.orm import Session
from database import get_db
from models import Base, User, UserPlan
from database import engine
from starlette.middleware.base import BaseHTTPMiddleware
# Import route modules
from routes.auth import router as auth_router
from routes.documents import router as documents_router
from routes.chat import router as chat_router
from routes.usage import router as usage_router
from routes.collections import router as collections_router
from routes.stripe_routes import router as stripe_router
from routes.feedback import router as feedback_router
from middleware.auth_middleware import AutoTokenRefreshMiddleware
from middleware.timezone_middleware import TimezoneMiddleware
from auth_helpers import get_current_user_with_auto_refresh

# Load environment variables
load_dotenv()

# Base.metadata.drop_all(bind=engine)

# Create database tables
# Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DocuChat API", 
    description="Document analysis API with JWT authentication and usage tracking",
    version="2.0.0"
)

class SimpleTestMiddleware(BaseHTTPMiddleware):
    """Simple test middleware to see if middleware system is working"""
    
    async def dispatch(self, request: Request, call_next):
        print(f"🧪 SIMPLE MIDDLEWARE START: {request.method} {request.url.path}")
        print(f"🧪 About to call next middleware (should be AutoTokenRefreshMiddleware)")
        
        response = await call_next(request)
        
        print(f"🧪 SIMPLE MIDDLEWARE END: {request.url.path}")
        print(f"🧪 Response from next middleware received")
        return response

print("🔧 Adding CORS middleware...")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",
        "http://localhost:3000", 
        "http://localhost:5173",
        "https://drop2chat.com",
        "https://www.drop2chat.com",
        "https://accounts.google.com",
        "https://drop2chat-git-sit-mifzalfauzis-projects.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Set-Cookie"],
)


print("🔧 Adding SimpleTestMiddleware...")
app.add_middleware(SimpleTestMiddleware)

print("🔧 Adding TimezoneMiddleware...")
app.add_middleware(TimezoneMiddleware)

print("🔧 Adding AutoTokenRefreshMiddleware...")
try:
    app.add_middleware(
        AutoTokenRefreshMiddleware,
        excluded_paths=[
            # "/",
            "/health",
            "/docs", 
            "/redoc",
            "/openapi.json",
            "/favicon.ico",
            "/auth/login",
            "/auth/register",
            "/auth/google",
            "/auth/refresh", 
            "/auth/logout",
            "/convert-docx-to-pdf",
            "/pdf/",
            "/chat/public-share/",
            "/debug/test-middleware",
            "/debug/force-expire-token",
            "/debug/test-cookie-setting"
            # NOTE: /debug/protected-simple is NOT excluded
        ]
    )
    print("✅ AutoTokenRefreshMiddleware added successfully")
except Exception as e:
    print(f"❌ ERROR adding AutoTokenRefreshMiddleware: {e}")
    import traceback
    print(f"❌ Traceback: {traceback.format_exc()}")

print("🔧 Adding security headers middleware...")
@app.middleware("http")
async def add_security_headers(request, call_next):
    print(f"🔒 SECURITY MIDDLEWARE: {request.url.path}")
    response = await call_next(request)
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
    response.headers["Cross-Origin-Embedder-Policy"] = "unsafe-none"
    print(f"🔒 SECURITY MIDDLEWARE COMPLETE: {request.url.path}")
    return response

print("🔧 All middleware setup complete!")

# Include routers
app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(chat_router)
app.include_router(usage_router)
app.include_router(collections_router)
app.include_router(stripe_router)   
app.include_router(feedback_router)
# Anthropic configuration
anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")

# Initialize Anthropic client with better error handling
client = None
if anthropic_api_key:
    try:
        # Try basic initialization first
        import anthropic
        client = anthropic.Anthropic(api_key=anthropic_api_key)
        print("✅ Anthropic client initialized successfully in main.py")
    except TypeError as e:
        if "proxies" in str(e):
            print(f"⚠️  Anthropic client proxy error in main.py, trying alternative initialization: {e}")
            try:
                # Alternative: Try initializing with minimal parameters
                import httpx
                http_client = httpx.Client()
                client = anthropic.Anthropic(
                    api_key=anthropic_api_key,
                    http_client=http_client
                )
                print("✅ Anthropic client initialized with custom http client in main.py")
            except Exception as e2:
                print(f"❌ Alternative Anthropic initialization also failed in main.py: {e2}")
                client = None
        else:
            print(f"❌ Anthropic client initialization failed in main.py: {e}")
            client = None
    except Exception as e:
        print(f"❌ Anthropic client initialization failed in main.py: {e}")
        client = None
else:
    print("⚠️  ANTHROPIC_API_KEY not found in environment variables for main.py")
    client = None

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

@app.get("/debug/test-middleware")
async def test_middleware_debug(request: Request):
    """Test endpoint specifically for debugging middleware"""
    print(f"\n🧪 === DEBUG TEST ENDPOINT CALLED ===")
    
    # Get tokens manually
    access_token = get_access_token_from_cookie(request)
    refresh_token = get_refresh_token_from_cookie(request)
    
    result = {
        "timestamp": datetime.now().isoformat(),
        "cookies_received": {
            "ACCESS_NWST": {
                "present": bool(access_token),
                "length": len(access_token) if access_token else 0,
                "valid": False
            },
            "REFRESH_NWST": {
                "present": bool(refresh_token),
                "length": len(refresh_token) if refresh_token else 0,
                "valid": False
            }
        },
        "middleware_should_trigger": False
    }
    
    # Check access token validity
    if access_token:
        try:
            payload = verify_token(access_token, token_type="access")
            result["cookies_received"]["ACCESS_NWST"]["valid"] = bool(payload)
            if payload:
                result["cookies_received"]["ACCESS_NWST"]["payload"] = payload
        except Exception as e:
            result["cookies_received"]["ACCESS_NWST"]["error"] = str(e)
    
    # Check refresh token validity
    if refresh_token:
        try:
            payload = verify_token(refresh_token, token_type="refresh")
            result["cookies_received"]["REFRESH_NWST"]["valid"] = bool(payload)
            if payload:
                result["cookies_received"]["REFRESH_NWST"]["payload"] = payload
        except Exception as e:
            result["cookies_received"]["REFRESH_NWST"]["error"] = str(e)
    
    # Determine if middleware should trigger
    has_refresh = result["cookies_received"]["REFRESH_NWST"]["present"]
    access_invalid = not result["cookies_received"]["ACCESS_NWST"]["valid"]
    result["middleware_should_trigger"] = has_refresh and access_invalid
    
    print(f"🧪 Test result: {result}")
    return result

@app.get("/debug/force-expire-token")
async def force_expire_token(response: Response):
    """Create an expired access token for testing"""
    from auth_helpers import set_access_token_cookie
    
    # Create an expired token (expired 1 minute ago)
    expired_token = create_access_token(
        data={"sub": "test-user-123"}, 
        expires_delta=timedelta(minutes=-1)
    )
    
    # Set it as a cookie
    set_access_token_cookie(response, expired_token)
    
    return {
        "message": "Set an expired access token",
        "token": expired_token[:50] + "...",
        "instructions": "Now call /debug/test-middleware to see if auto-refresh triggers"
    }

@app.get("/debug/protected-simple")
async def simple_protected_endpoint(request: Request):
    """Simple protected endpoint that doesn't use dependencies - for debugging"""
    print(f"\n🔒 === SIMPLE PROTECTED ENDPOINT CALLED ===")
    
    access_token = get_access_token_from_cookie(request)
    if not access_token:
        print("❌ No access token in simple protected endpoint")
        return {"error": "No access token", "middleware_worked": False}
    
    try:
        payload = verify_token(access_token, token_type="access")
        if not payload:
            print("❌ Invalid access token in simple protected endpoint")
            return {"error": "Invalid access token", "middleware_worked": False}
        
        print(f"✅ Valid access token found: {payload}")
        return {
            "message": "SUCCESS! You are authenticated",
            "user_id": payload.get("sub"),
            "middleware_worked": True,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        print(f"❌ Error in simple protected endpoint: {e}")
        return {"error": str(e), "middleware_worked": False}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 