from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from uuid import UUID
import uuid, jwt
import os
from sqlalchemy import func
import httpx
from google.auth.transport import requests
from google.oauth2 import id_token
from database import get_db
from models import User, UserPlan
from auth_backend import hash_password, verify_password, create_access_token, create_refresh_token, verify_token
from dependencies import get_current_active_user, get_user_limits_info, get_access_token_from_cookie, get_refresh_token_from_cookie
from datetime import datetime, timedelta
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

router = APIRouter(prefix="/auth", tags=["authentication"])

BASE_FRONTEND_URL = os.getenv("BASE_FRONTEND_URL")
BASE_BACKEND_URL = os.getenv("BASE_BACKEND_URL")

# Cookie configuration
ACCESS_TOKEN_COOKIE_NAME = "ACCESS_NWST"
REFRESH_TOKEN_COOKIE_NAME = "REFRESH_NWST"

# Google OAuth configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", f"{BASE_FRONTEND_URL}/auth/google/callback")

# Load environment variables
load_dotenv()
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD")

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

class EmailLoginRequest(BaseModel):
    email: EmailStr

class ResendVerificationRequest(BaseModel):
    email: EmailStr

class Token(BaseModel):
    access_token: str   
    token_type: str = "bearer"
    expires_in: int = 1 * 60 * 60  # 1 hour in seconds

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
    subscription_end_date: Optional[str] = None
    timezone: Optional[str] = None
    usage: dict

class GoogleTokenRequest(BaseModel):
    token: str  # Google ID token from frontend

class GoogleAuthResponse(BaseModel):
    authorization_url: str
    

JWT_SECRET = os.getenv("JWT_SECRET_KEY")

def create_short_lived_token(user_id: str, access_token: str, refresh_token: str) -> str:
    """Create a very short-lived token containing the auth tokens"""
    payload = {
        "user_id": user_id,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "exp": datetime.utcnow() + timedelta(minutes=2),  # Very short expiry
        "iat": datetime.utcnow(),
        "type": "auth_exchange"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def verify_short_lived_token(token: str) -> dict:
    """Verify and decode the short-lived token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        if payload.get("type") != "auth_exchange":
            raise jwt.InvalidTokenError("Invalid token type")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# TRADITIONAL REGISTRATION
@router.post("/register")
async def register(user: UserRegister, response: Response, db: Session = Depends(get_db)):
    """Register a new user with traditional email/password"""
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

# TRADITIONAL LOGIN
@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin, response: Response, db: Session = Depends(get_db)):
    """Login user with email and password"""
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
        print("❌ User has no password hash (Google/Magic link login)")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account uses passwordless login. Please use the magic link option."
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
            detail="Please verify your email first"
        )

    print(f"✅ User authenticated: {user.email}")
    
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    # Set authentication cookies
    set_refresh_token_cookie(response, refresh_token)
    set_access_token_cookie(response, access_token)
    
    return Token(access_token=access_token)

# PASSWORDLESS MAGIC LINK
@router.post("/send-magic-link")
async def send_magic_link(request: EmailLoginRequest, db: Session = Depends(get_db)):
    """Send magic link for passwordless login/signup"""
    print(f"\n🔗 === MAGIC LINK REQUEST ===")
    print(f"📧 Email: {request.email}")
    
    try:
        normalized_email = request.email.lower()
        
        # Check if user exists
        user = db.query(User).filter(func.lower(User.email) == normalized_email).first()
        
        if user:
            print(f"✅ Existing user found: {user.email}")
            # Generate new magic link token
            user.verification_token = str(uuid.uuid4())
            # Set expiration (15 minutes for magic links)
            user.verification_token_expires_at = datetime.now() + timedelta(minutes=15)
        else:
            print(f"🆕 Creating new user: {normalized_email}")
            # Create new user for passwordless auth
            user = User(
                email=normalized_email,
                password_hash=None,  # No password needed for magic link
                name=None,           # Optional: ask for name later
                plan=UserPlan.FREE,
                verification_token=str(uuid.uuid4()),
                verification_token_expires_at=datetime.now() + timedelta(minutes=15),
                is_active=False,
                email_verified=False
            )
            db.add(user)
        
        db.commit()
        db.refresh(user)
        
        print(f"🔗 Generated magic link token: {user.verification_token}")
        
        # Send magic link email
        send_magic_link_email(normalized_email, user.verification_token)
        
        return {
            "message": "Magic link sent! Check your email to sign in.",
            "success": True
        }
    
    except Exception as e:
        db.rollback()
        print(f"❌ Magic link error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send magic link. Please try again."
        )

@router.get("/magic-login")
async def magic_login_simple(token: str, response: Response, db: Session = Depends(get_db)):
    """Simple magic login with short-lived URL token (no database needed)"""
    print(f"\n🔗 === SIMPLE MAGIC LOGIN ===")
    
    try:
        # Verify magic link token (same validation as before)
        user = db.query(User).filter(User.verification_token == token).first()
        
        if not user:
            return RedirectResponse(
                url=f"{BASE_FRONTEND_URL}/signin?error=invalid_link",  
                status_code=302
            )
        
        # Check expiration
        if user.verification_token_expires_at and datetime.now() > user.verification_token_expires_at:
            user.verification_token = None
            user.verification_token_expires_at = None
            db.commit()
            return RedirectResponse(
                url=f"{BASE_FRONTEND_URL}/signin?error=link_expired",
                status_code=302
            )
        
        # Activate user
        user.email_verified = True
        user.email_verified_at = datetime.now()
        user.is_active = True
        user.verification_token = None
        user.verification_token_expires_at = None
        db.commit()
        
        # Create auth tokens
        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        # Create short-lived token containing the auth tokens
        short_token = create_short_lived_token(
            user_id=str(user.id),
            access_token=access_token,
            refresh_token=refresh_token
        )
        
        print(f"✅ Created short-lived token (expires in 2 minutes)")
        
        # Redirect with the short-lived token
        redirect_url = f"{BASE_FRONTEND_URL}/auth-callback?token={short_token}&welcome=true"
        
        return RedirectResponse(url=redirect_url, status_code=302)
        
    except Exception as e:
        db.rollback()
        print(f"❌ Magic login error: {str(e)}")
        return RedirectResponse(
            url=f"{BASE_FRONTEND_URL}/signin?error=login_failed",
            status_code=302
        )

@router.post("/extract-auth")
async def extract_auth_tokens(
    token_request: dict, 
    response: Response
):
    """Extract auth tokens from short-lived token and set cookies"""
    print(f"\n🔓 === EXTRACT AUTH TOKENS ===")
    
    short_token = token_request.get("token")
    if not short_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token required"
        )
    
    try:
        # Verify and decode the short-lived token
        payload = verify_short_lived_token(short_token)
        
        access_token = payload["access_token"]
        refresh_token = payload["refresh_token"]
        user_id = payload["user_id"]
        
        print(f"✅ Extracted tokens for user: {user_id}")
        
        # Set authentication cookies
        set_access_token_cookie(response, access_token)
        set_refresh_token_cookie(response, refresh_token)
        
        return {
            "message": "Authentication successful",
            "user_id": user_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Token extraction error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token extraction failed"
        )


# Also add a debug endpoint to check if cookies are working
@router.get("/debug/check-cookies")
async def debug_check_cookies(request: Request):
    """Debug endpoint to check what cookies are being received"""
    print(f"\n🍪 === COOKIE DEBUG ===")
    
    # Get all cookies
    cookies = request.cookies
    print(f"🍪 All cookies received:")
    for name, value in cookies.items():
        print(f"   - {name}: {value[:30]}..." if len(value) > 30 else f"   - {name}: {value}")
    
    # Check specific auth cookies
    access_token = cookies.get("ACCESS_NWST")
    refresh_token = cookies.get("REFRESH_NWST")
    
    print(f"🍪 Auth cookies:")
    print(f"   - ACCESS_NWST: {'✅ Present' if access_token else '❌ Missing'}")
    print(f"   - REFRESH_NWST: {'✅ Present' if refresh_token else '❌ Missing'}")
    
    if access_token:
        # Try to verify the access token
        try:
            payload = verify_token(access_token, token_type="access")
            print(f"✅ Access token is valid: {payload}")
        except Exception as e:
            print(f"❌ Access token invalid: {e}")
    
    return {
        "cookies_found": len(cookies),
        "access_token_present": access_token is not None,
        "refresh_token_present": refresh_token is not None,
        "cookies": {name: "present" for name in cookies.keys()}
    }

# EMAIL VERIFICATION (for traditional registration)
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

# RESEND VERIFICATION
@router.post("/resend-verification")
async def resend_verification_email(
    request: ResendVerificationRequest, 
    db: Session = Depends(get_db)
):
    """Resend verification email for unverified users"""
    print(f"\n📧 === RESEND VERIFICATION REQUEST ===")
    print(f"📧 Email: {request.email}")
    
    try:
        normalized_email = request.email.lower()
        
        # Find user by email
        user = db.query(User).filter(func.lower(User.email) == normalized_email).first()
        
        if not user:
            print(f"❌ User not found: {normalized_email}")
            # Don't reveal if email exists or not for security
            return {
                "message": "If the email exists and is unverified, a verification email has been sent.",
                "success": True
            }
        
        print(f"✅ Found user: {user.email}")
        
        # Check if user is already verified
        if user.email_verified and user.is_active:
            print(f"ℹ️ User already verified")
            return {
                "message": "This email is already verified. You can log in.",
                "success": True,
                "already_verified": True
            }
        
        # Generate new verification token (important for security)
        old_token = user.verification_token
        user.verification_token = str(uuid.uuid4())
        user.verification_token_expires_at = datetime.now() + timedelta(hours=24)
        
        # DON'T VERIFY THE USER HERE - JUST UPDATE THE TOKEN!
        
        print(f"🔄 Updating verification token:")
        print(f"   - Old token: {old_token}")
        print(f"   - New token: {user.verification_token}")
        
        db.commit()
        print(f"✅ New token saved to database")
        
        # Send new verification email with the NEW token
        send_verification_email(normalized_email, user.verification_token)
        
        return {
            "message": "Verification email sent successfully. Please check your email.",
            "success": True
        }
    
    except Exception as e:
        db.rollback()
        print(f"❌ Resend verification error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to resend verification email. Please try again."
        )

# GOOGLE OAUTH
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
                    email_verified_at=datetime.now(),
                    is_active=True  # Google users are automatically active
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
        
        return Token(access_token=access_token)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Google authentication failed: {str(e)}"
        )

# TOKEN REFRESH
@router.post("/refresh")
async def refresh_token(
    request: Request, 
    response: Response, 
    token_data: TokenRefresh = None, 
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token from cookie or body"""
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

# USER PROFILE ENDPOINTS
@router.get("/me", response_model=UserProfileWithUsage)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's profile and usage information"""
    usage_info = get_user_limits_info(current_user, db)
    
    # Get subscription data from UserSubscription table
    from models import UserSubscription
    user_subscription = db.query(UserSubscription).filter(
        UserSubscription.user_id == current_user.id
    ).first()
    
    return UserProfileWithUsage(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name or "User",  # Default name if none provided
        plan=current_user.plan.value,
        is_active=current_user.is_active,
        created_at=current_user.created_at.isoformat(),
        subscription_end_date=user_subscription.subscription_end_date.isoformat() if user_subscription and user_subscription.subscription_end_date else None,
        timezone=current_user.timezone,
        usage=usage_info["usage"]
    )

@router.get("/profile", response_model=UserProfile)
async def get_user_profile(current_user: User = Depends(get_current_active_user)):
    """Get current user's profile (without usage info)"""
    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name or "User",
        plan=current_user.plan.value,
        is_active=current_user.is_active,
        created_at=current_user.created_at.isoformat()
    )

# LOGOUT AND AUTH CHECK
@router.post("/logout")
async def logout(
    response: Response, 
    current_user: User = Depends(get_current_user_with_auto_refresh)
):
    """Logout user and clear all authentication cookies"""
    clear_all_auth_cookies(response)
    return {"message": "Successfully logged out"}

@router.get("/check-auth")
async def check_auth(current_user: User = Depends(get_current_user_with_auto_refresh)):
    """Check if user is authenticated with current access token"""
    return {"authenticated": True, "user_id": str(current_user.id)}

# EMAIL SENDING FUNCTIONS
def send_verification_email(to_email, token):
    """Send verification email for traditional registration"""
    print(f"\n📧 === SENDING VERIFICATION EMAIL ===")
    print(f"📧 To: {to_email}")
    print(f"📧 Token: {token}")

    verification_url = f"{BASE_FRONTEND_URL}/verify-email?token={token}"
    print(f"📧 Verification URL: {verification_url}")
    
    msg = EmailMessage()
    msg["Subject"] = "Verify your email - Link expires in 24 hours"
    msg["From"] = SENDER_EMAIL
    msg["To"] = to_email
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #333; margin-bottom: 10px;">Welcome! Please verify your email</h2>
                <p style="color: #666; font-size: 16px;">Click the button below to verify your email address and activate your account.</p>
                <p style="color: #e74c3c; font-size: 14px; font-weight: bold;">⏰ This link expires in 24 hours</p>
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
                    This verification link will expire in 24 hours for security reasons. If you didn't create an account, please ignore this email.
                </p>
            </div>
        </body>
    </html>
    """
    
    msg.set_content(f"Click to verify your account (expires in 24 hours): {verification_url}")
    msg.add_alternative(html_content, subtype='html')
    
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(SENDER_EMAIL, SENDER_PASSWORD)
            smtp.send_message(msg)
        print(f"✅ Verification email sent successfully")
    except Exception as e:
        print(f"❌ Email sending failed: {str(e)}")
        raise

def send_magic_link_email(to_email, token):
    """Send magic link email for passwordless authentication"""
    print(f"\n📧 === SENDING MAGIC LINK ===")
    print(f"📧 To: {to_email}")
    print(f"📧 Token: {token}")

    # Magic link URL (goes directly to backend)
    magic_url = f"{BASE_BACKEND_URL}/auth/magic-login?token={token}"
    print(f"📧 Magic URL: {magic_url}")
    
    msg = EmailMessage()
    msg["Subject"] = "Your secure sign-in link"
    msg["From"] = SENDER_EMAIL
    msg["To"] = to_email
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #333; margin-bottom: 10px;">Your secure sign-in link</h2>
                <p style="color: #666; font-size: 16px;">Click the button below to securely sign in to your account.</p>
                <p style="color: #e74c3c; font-size: 14px; font-weight: bold;">⏰ This link expires in 15 minutes</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{magic_url}" 
                   style="background-color: #4CAF50; 
                          color: white; 
                          padding: 12px 24px; 
                          text-decoration: none; 
                          border-radius: 6px; 
                          font-weight: bold;
                          display: inline-block;">
                    Sign In Securely
                </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #666; font-size: 14px;">
                    If the button doesn't work, copy and paste this link:
                </p>
                <p style="color: #4CAF50; word-break: break-all; font-size: 14px;">
                    {magic_url}
                </p>
                <p style="color: #999; font-size: 12px; margin-top: 20px;">
                    This link will expire in 15 minutes for security. If you didn't request this, please ignore this email.
                </p>
            </div>
        </body>
    </html>
    """
    
    msg.set_content(f"Sign in securely: {magic_url}")
    msg.add_alternative(html_content, subtype='html')
    
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(SENDER_EMAIL, SENDER_PASSWORD)
            smtp.send_message(msg)
        print(f"✅ Magic link email sent successfully")
    except Exception as e:
        print(f"❌ Email sending failed: {str(e)}")
        raise