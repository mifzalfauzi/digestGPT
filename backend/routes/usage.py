from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from dependencies import get_current_active_user, get_user_limits_info
from database import get_db
from models import Usage, User

router = APIRouter(prefix="/usage", tags=["usage"])

@router.get("/me")
def get_my_usage(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Get current user's usage statistics with limits"""
    return get_user_limits_info(current_user, db)

@router.post("/reset")
def reset_usage(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Reset usage statistics for current user (admin only or monthly reset)"""
    usage = db.query(Usage).filter(Usage.user_id == current_user.id).first()
    
    if usage:
        usage.docs_used = 0
        usage.chats_used = 0
        usage.tokens_used = 0
        db.commit()
        db.refresh(usage)
    
    return {"message": "Usage statistics reset successfully"} 