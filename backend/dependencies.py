from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
import json

from database import get_db
from models import User, Usage, UserPlan
from auth import verify_token

# Security scheme
security = HTTPBearer()

# Plan limits configuration
PLAN_LIMITS = {
    UserPlan.FREE: {
        "doc_limit": 1,
        "chat_limit": 3,
        "token_limit": 3000
    },
    UserPlan.STANDARD: {
        "doc_limit": 50,
        "chat_limit": 100,
        "token_limit": 100000
    },
    UserPlan.PRO: {
        "doc_limit": 120,
        "chat_limit": 350,
        "token_limit": 350000
    }
}

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Verify the token
        payload = verify_token(credentials.credentials)
        if payload is None:
            raise credentials_exception
            
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
            
        # Get user from database
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise credentials_exception
            
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user"
            )
            
        return user
        
    except Exception as e:
        raise credentials_exception

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user

def get_or_create_usage(user_id: int, db: Session) -> Usage:
    """Get or create usage record for user"""
    usage = db.query(Usage).filter(Usage.user_id == user_id).first()
    if not usage:
        usage = Usage(user_id=user_id)
        db.add(usage)
        db.commit()
        db.refresh(usage)
    return usage

async def check_document_limit(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> User:
    """Check if user can upload more documents"""
    usage = get_or_create_usage(current_user.id, db)
    limits = PLAN_LIMITS[current_user.plan]
    
    if usage.docs_used >= limits["doc_limit"]:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Document limit exceeded. Your {current_user.plan.value} plan allows {limits['doc_limit']} documents per month."
        )
    
    return current_user

async def check_chat_limit(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> User:
    """Check if user can send more chat messages"""
    usage = get_or_create_usage(current_user.id, db)
    limits = PLAN_LIMITS[current_user.plan]
    
    if usage.chats_used >= limits["chat_limit"]:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Chat limit exceeded. Your {current_user.plan.value} plan allows {limits['chat_limit']} chats per month."
        )
    
    return current_user

async def check_token_limit(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    estimated_tokens: int = 0
) -> User:
    """Check if user has enough tokens remaining"""
    usage = get_or_create_usage(current_user.id, db)
    limits = PLAN_LIMITS[current_user.plan]
    
    if usage.tokens_used + estimated_tokens > limits["token_limit"]:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Token limit exceeded. Your {current_user.plan.value} plan allows {limits['token_limit']} tokens per month."
        )
    
    return current_user

def increment_document_usage(user_id: int, db: Session):
    """Increment document usage for user"""
    usage = get_or_create_usage(user_id, db)
    usage.docs_used += 1
    db.commit()

def increment_chat_usage(user_id: int, db: Session):
    """Increment chat usage for user"""
    usage = get_or_create_usage(user_id, db)
    usage.chats_used += 1
    db.commit()

def increment_token_usage(user_id: int, tokens: int, db: Session):
    """Increment token usage for user"""
    usage = get_or_create_usage(user_id, db)
    usage.tokens_used += tokens
    db.commit()

def estimate_tokens(text: str) -> int:
    """Estimate token count from text (rough approximation: 1 token ≈ 4 characters)"""
    return len(text) // 4

def get_user_limits_info(user: User, db: Session) -> dict:
    """Get user's current usage and limits"""
    usage = get_or_create_usage(user.id, db)
    limits = PLAN_LIMITS[user.plan]
    
    return {
        "plan": user.plan.value,
        "usage": {
            "documents": {
                "used": usage.docs_used,
                "limit": limits["doc_limit"],
                "remaining": max(0, limits["doc_limit"] - usage.docs_used)
            },
            "chats": {
                "used": usage.chats_used,
                "limit": limits["chat_limit"],
                "remaining": max(0, limits["chat_limit"] - usage.chats_used)
            },
            "tokens": {
                "used": usage.tokens_used,
                "limit": limits["token_limit"],
                "remaining": max(0, limits["token_limit"] - usage.tokens_used)
            }
        }
    } 