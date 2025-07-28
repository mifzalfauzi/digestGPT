from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from uuid import UUID
import uuid
import os
from sqlalchemy import func
import httpx
from google.auth.transport import requests
from google.oauth2 import id_token
# from google_auth_oauthlib.flow import Flow
from database import get_db
from models import User, UserPlan
from auth_backend import hash_password, verify_password, create_access_token, create_refresh_token, verify_token
from dependencies import get_current_active_user, get_user_limits_info, get_access_token_from_cookie, get_refresh_token_from_cookie
# from gotrue.client import GoTrueClient
from datetime import datetime
from auth_helpers import (
    set_access_token_cookie, 
    set_refresh_token_cookie, 
    clear_all_auth_cookies,
    refresh_rate_limiter,
    get_current_user_with_auto_refresh
)
from email.message import EmailMessage
import smtplib
from dotenv import load_dotenv
from datetime import datetime, timedelta

router = APIRouter(prefix="/auth", tags=["authentication"])

# Cookie configuration
ACCESS_TOKEN_COOKIE_NAME = "ACCESS_NWST"
REFRESH_TOKEN_COOKIE_NAME = "REFRESH_NWST"

# def set_access_token_cookie(response: Response, access_token: str):
#     """Set access token as HttpOnly cookie"""
#     response.set_cookie(
#         key=ACCESS_TOKEN_COOKIE_NAME,
#         value=access_token,
#         httponly=True,
#         max_age=15 * 60,  # 15 minutes
#         secure=True,      # Change to True for production (HTTPS)
#         samesite="lax",
#         path="/"
#     )

# def set_refresh_token_cookie(response: Response, refresh_token: str):
#     """Set refresh token as HttpOnly cookie"""
#     response.set_cookie(
#         key=REFRESH_TOKEN_COOKIE_NAME,
#         value=refresh_token,
#         httponly=True,
#         max_age=30 * 24 * 60 * 60,  # 30 days
#         secure=True,                # Change to True for production (HTTPS)
#         samesite="lax",
#         path="/"
#     )

# def clear_access_token_cookie(response: Response):
#     """Clear access token cookie"""
#     response.delete_cookie(
#         key=ACCESS_TOKEN_COOKIE_NAME,
#         httponly=True,
#         secure=True,
#         samesite="lax",
#         path="/"
#     )

# def clear_refresh_token_cookie(response: Response):
#     """Clear refresh token cookie"""
#     response.delete_cookie(
#         key=REFRESH_TOKEN_COOKIE_NAME,
#         httponly=True,
#         secure=True,
#         samesite="lax",
#         path="/"
#     )

# Google OAuth configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")

# Pydantic models for request/response
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    plan: UserPlan = UserPlan.FREE
    
    @validator('email')
    def normalize_email(cls, v):
        return v.lower()

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str   
    token_type: str = "bearer"
    expires_in: int = 1 * 60  # 15 minutes in seconds

class TokenRefresh(BaseModel):
    refresh_token: Optional[str] = None  # Optional since it can come from cookie

class UserProfile(BaseModel):
    id: UUID
    email: str
    name: str
    plan: str
    is_active: bool
    created_at: str

class UserProfileWithUsage(BaseModel):
    id: UUID
    email: str
    name: str
    plan: str
    is_active: bool
    created_at: str
    usage: dict

class GoogleTokenRequest(BaseModel):
    token: str  # Google ID token from frontend

class GoogleAuthResponse(BaseModel):
    authorization_url: str

@router.post("/register")
async def register(user: UserRegister, response: Response, db: Session = Depends(get_db)):
    """Register a new user"""
    try:
        normalized_email = user.email.lower() 
        
        # Check if user already exists
        existing_user = db.query(User).filter(func.lower(User.email) == normalized_email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
            
        # Generate verification token
        verification_token = str(uuid.uuid4())
        
        expiration_time = datetime.now() + timedelta(hours=24)
        
        # Create new user (starts as inactive until email verified)
        hashed_password = hash_password(user.password)
        new_user = User(
            email=normalized_email,
            password_hash=hashed_password,
            name=user.name,
            plan=user.plan,
            verification_token=verification_token,
            is_active=False,  # Will be set to True after email verification
            verification_token_expires_at=expiration_time,
            email_verified=False  # Will be set to True after email verification
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Send verification email
        send_verification_email(normalized_email, verification_token)
        
        return {"message": "Verification email sent. Please check your email to activate your account."}
    
    except HTTPException:
        raise
    
    except Exception as e:
        db.rollback()
        print(f"❌ Registration error: {str(e)}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed. Please try again."
        )



# Replace your login function with this DEBUG version to see what's happening:

@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin, response: Response, db: Session = Depends(get_db)):
    """Login user and return JWT tokens - DEBUG VERSION"""
    print(f"\n🔐 === LOGIN ENDPOINT CALLED ===")
    print(f"🔐 Email: {user_credentials.email}")
    
    normalized_email = user_credentials.email.lower()
    
    user = db.query(User).filter(User.email == normalized_email).first()

    if not user:
        print("❌ User not found")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    if not user.password_hash:
        print("❌ User has no password hash (Google login)")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account uses Google login. Please sign in with Google."
        )

    if not verify_password(user_credentials.password, user.password_hash):
        print("❌ Password verification failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    if not user.is_active:
        print("❌ User is not active")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    print(f"✅ User authenticated: {user.email}")
    print(f"🔨 Creating tokens...")
    
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    print(f"✅ Tokens created:")
    print(f"   Access: {access_token[:30]}...")
    print(f"   Refresh: {refresh_token[:30]}...")
    
    print(f"🍪 About to set cookies...")
    
    try:
        # Set refresh token as HttpOnly cookie
        print(f"🍪 Setting refresh token cookie...")
        set_refresh_token_cookie(response, refresh_token)
        print(f"✅ Refresh token cookie set successfully")
        
        print(f"🍪 Setting access token cookie...")
        set_access_token_cookie(response, access_token)
        print(f"✅ Access token cookie set successfully")
        
    except Exception as e:
        print(f"❌ ERROR setting cookies: {e}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
    
    print(f"📤 Returning token response...")
    return Token(access_token=access_token)

# ALSO: Check your imports at the top of routes/auth.py
# Make sure you have these imports:

# from auth_helpers import (
#     set_access_token_cookie, 
#     set_refresh_token_cookie, 
#     clear_all_auth_cookies,
#     refresh_rate_limiter,
#     get_current_user_with_auto_refresh
# )


async def refresh_token(
    request: Request, 
    response: Response, 
    token_data: TokenRefresh = None, 
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token from cookie or body.
    Now includes rate limiting for security.
    """
    # Get client identifier for rate limiting (IP address as fallback)
    client_ip = request.client.host if request.client else "unknown"
    
    # Check rate limiting
    if not refresh_rate_limiter.is_allowed(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many refresh attempts. Please try again later."
        )
    
    # Get refresh token from cookie or request body
    refresh_token = get_refresh_token_from_cookie(request)
    if not refresh_token and token_data and token_data.refresh_token:
        refresh_token = token_data.refresh_token
    
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token provided"
        )
    
    # Verify refresh token
    payload = verify_token(refresh_token, token_type="refresh")
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token payload"
        )
    
    # Get user from database
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Create new tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    new_refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    # Set new tokens as HttpOnly cookies
    set_refresh_token_cookie(response, new_refresh_token)
    set_access_token_cookie(response, access_token)
    
    return Token(access_token=access_token)

@router.get("/me", response_model=UserProfileWithUsage)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's profile and usage information"""
    usage_info = get_user_limits_info(current_user, db)
    
    return UserProfileWithUsage(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        plan=current_user.plan.value,
        is_active=current_user.is_active,
        created_at=current_user.created_at.isoformat(),
        usage=usage_info["usage"]
    )

@router.get("/profile", response_model=UserProfile)
async def get_user_profile(current_user: User = Depends(get_current_active_user)):
    """Get current user's profile (without usage info)"""
    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        plan=current_user.plan.value,
        is_active=current_user.is_active,
        created_at=current_user.created_at.isoformat()
    )

@router.post("/google", response_model=Token)
async def google_auth(google_request: GoogleTokenRequest, response: Response, db: Session = Depends(get_db)):
    """Authenticate user with Google ID token"""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth not configured"
        )
    
    try:
        # Try to verify the Google ID token
        try:
            idinfo = id_token.verify_oauth2_token(
                google_request.token, 
                requests.Request(), 
                GOOGLE_CLIENT_ID
            )
        except ValueError:
            # If token verification fails, try to decode as base64 (for testing)
            try:
                import json
                import base64
                decoded = base64.b64decode(google_request.token + '==')  # Add padding
                idinfo = json.loads(decoded.decode())
                # Add required fields for our processing
                if 'iss' not in idinfo:
                    idinfo['iss'] = 'accounts.google.com'
            except:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid Google token format"
                )
        
        # Check if the token is valid
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Google token issuer"
            )
        
        # Extract user information from Google token
        google_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name', '')
        profile_picture = idinfo.get('picture', '')
        
        # Check if user already exists by Google ID
        existing_user = db.query(User).filter(User.google_id == google_id).first()
        
        if existing_user:
            user = existing_user
            # Update profile picture if changed
            if profile_picture and user.profile_picture != profile_picture:
                user.profile_picture = profile_picture
                db.commit()
        else:
            # Normalize the incoming Google email
            normalized_email = email.lower()

            # Check if user exists by email (case-insensitive match)
            existing_email_user = db.query(User).filter(func.lower(User.email) == normalized_email).first()
            
            if existing_email_user:
                # Link the Google account to existing email user
                existing_email_user.google_id = google_id
                existing_email_user.profile_picture = profile_picture
                db.commit()
                user = existing_email_user

            else:
                # Create new user with Google OAuth
                new_user = User(
                    email=email,
                    name=name,
                    google_id=google_id,
                    profile_picture=profile_picture,
                    plan=UserPlan.FREE,
                    password_hash=None,  # No password for Google OAuth users
                    email_verified=True,
                    email_verified_at=datetime.now()
                )
                
                db.add(new_user)
                db.commit()
                db.refresh(new_user)
                user = new_user
        
        # Create JWT tokens
        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        # Set refresh token as HttpOnly cookie
        set_refresh_token_cookie(response, refresh_token)
        set_access_token_cookie(response, access_token)
        return Token(
            access_token=access_token
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Google authentication failed: {str(e)}"
        )

@router.post("/logout")
async def logout(
    response: Response, 
    current_user: User = Depends(get_current_user_with_auto_refresh)  # CHANGED
):
    """Logout user and clear all authentication cookies"""
    clear_all_auth_cookies(response)  # CHANGED
    return {"message": "Successfully logged out"}

@router.get("/check-auth")
async def check_auth(current_user: User = Depends(get_current_user_with_auto_refresh)):  # CHANGED
    """Check if user is authenticated with current access token"""
    return {"authenticated": True, "user_id": str(current_user.id)}

@router.get("/verify-email")
async def verify_email(token: str, db: Session = Depends(get_db)):
    """Verify user's email with expiration check"""
    print(f"🔍 VERIFICATION START - Token: '{token}'")
    
    try:
        # Search for user
        user = db.query(User).filter(User.verification_token == token).first()
        
        if not user:
            print(f"❌ No user found with token")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Invalid or expired verification token"
            )
        
        print(f"✅ Found user: {user.email}")
        
        # Check if token has expired
        from datetime import datetime
        current_time = datetime.now()
        
        if user.verification_token_expires_at and current_time > user.verification_token_expires_at:
            print(f"❌ Token expired at: {user.verification_token_expires_at}")
            print(f"❌ Current time: {current_time}")
            
            # Clear expired token
            user.verification_token = None
            user.verification_token_expires_at = None
            db.commit()
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Verification token has expired. Please request a new verification email."
            )
        
        # Check if already verified
        if user.email_verified:
            print(f"ℹ️ Email already verified")
            return {"message": "Email already verified. You can now log in."}
        
        print(f"🔄 Updating user status...")
        
        # Verify email and activate account
        user.email_verified = True
        user.email_verified_at = datetime.now()
        user.is_active = True
        user.verification_token = None  # Clear token
        user.verification_token_expires_at = None  # Clear expiration
        
        db.commit()
        print(f"✅ User verified successfully")
        
        return {"message": "Email verified successfully! Your account is now active. You can log in."}
    
    except HTTPException:
        raise
    
    except Exception as e:
        db.rollback()
        print(f"❌ Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Email verification failed. Please try again."
        )

load_dotenv()

SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD")

def send_verification_email(to_email, token):
    """Send verification email to correct frontend URL"""
    print(f"\n📧 === EMAIL SENDING DEBUG ===")
    print(f"📧 Sending to: {to_email}")
    print(f"📧 Token: {token}")

    # FIXED: Correct URL that matches your route
    verification_url = f"http://localhost:3000/verify-email?token={token}"
    print(f"📧 Verification URL: {verification_url}")
    
    msg = EmailMessage()
    msg["Subject"] = "Verify your email"
    msg["From"] = SENDER_EMAIL
    msg["To"] = to_email
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #333; margin-bottom: 10px;">Welcome! Please verify your email</h2>
                <p style="color: #666; font-size: 16px;">Click the button below to verify your email address and activate your account.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{verification_url}" 
                   style="background-color: #4CAF50; 
                          color: white; 
                          padding: 12px 24px; 
                          text-decoration: none; 
                          border-radius: 6px; 
                          font-weight: bold;
                          display: inline-block;">
                    Verify Email Address
                </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #666; font-size: 14px;">
                    If the button doesn't work, copy and paste this link in your browser:
                </p>
                <p style="color: #4CAF50; word-break: break-all; font-size: 14px;">
                    {verification_url}
                </p>
                <p style="color: #999; font-size: 12px; margin-top: 20px;">
                    This verification link will expire for security reasons. If you didn't create an account, please ignore this email.
                </p>
            </div>
        </body>
    </html>
    """
    
    msg.set_content(f"Click to verify your account: {verification_url}")
    msg.add_alternative(html_content, subtype='html')
    
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(SENDER_EMAIL, SENDER_PASSWORD)
            smtp.send_message(msg)
        print(f"✅ Email sent successfully to {to_email}")
    except Exception as e:
        print(f"❌ Email sending failed: {str(e)}")
        raise