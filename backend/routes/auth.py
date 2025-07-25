from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
import os
import httpx
from google.auth.transport import requests
from google.oauth2 import id_token
# from google_auth_oauthlib.flow import Flow
from database import get_db
from models import User, UserPlan
from auth import hash_password, verify_password, create_access_token, create_refresh_token, verify_token
from dependencies import get_current_active_user, get_user_limits_info
# from gotrue.client import GoTrueClient

router = APIRouter(prefix="/auth", tags=["authentication"])

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

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenRefresh(BaseModel):
    refresh_token: str

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

@router.post("/register", response_model=Token)
async def register(user: UserRegister, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = hash_password(user.password)
    new_user = User(
        email=user.email,
        password_hash=hashed_password,
        name=user.name,
        plan=user.plan
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create tokens
    access_token = create_access_token(data={"sub": str(new_user.id)})
    refresh_token = create_refresh_token(data={"sub": str(new_user.id)})
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token
    )

@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """Login user and return JWT tokens"""
    user = db.query(User).filter(User.email == user_credentials.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    if not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account uses Google login. Please sign in with Google."
        )

    if not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return Token(
        access_token=access_token,
        refresh_token=refresh_token
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(token_data: TokenRefresh, db: Session = Depends(get_db)):
    """Refresh access token using refresh token"""
    # Verify refresh token
    payload = verify_token(token_data.refresh_token, token_type="refresh")
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
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
    
    return Token(
        access_token=access_token,
        refresh_token=new_refresh_token
    )

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
async def google_auth(google_request: GoogleTokenRequest, db: Session = Depends(get_db)):
    """Authenticate user with Google ID token"""
    if not GOOGLE_CLIENT_ID:
      
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth not configured"
        )
    
    try:
        
        
        # Verify the Google ID token
        idinfo = id_token.verify_oauth2_token(
            google_request.token, 
            requests.Request(), 
            GOOGLE_CLIENT_ID
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
            # Check if user exists by email (for linking accounts)
            existing_email_user = db.query(User).filter(User.email == email).first()
            
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
                    password_hash=None  # No password for Google OAuth users
                )
                
                db.add(new_user)
                db.commit()
                db.refresh(new_user)
                user = new_user
        
        # Create JWT tokens
        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
     
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token
        )
        
    except ValueError as e:
  
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid Google token: {str(e)}"
        )
    except Exception as e:
      
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Google authentication failed: {str(e)}"
        )