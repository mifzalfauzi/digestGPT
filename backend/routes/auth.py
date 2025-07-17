from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from database import get_db
from models import User, UserPlan
from auth import hash_password, verify_password, create_access_token, create_refresh_token, verify_token
from dependencies import get_current_active_user, get_user_limits_info

router = APIRouter(prefix="/auth", tags=["authentication"])

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
    # Get user by email
    user = db.query(User).filter(User.email == user_credentials.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Verify password
    if not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Create tokens
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