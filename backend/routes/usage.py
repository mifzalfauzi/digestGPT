from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from dependencies import get_current_user
from database import get_db
from models import Usage, User

router = APIRouter(prefix="/usage", tags=["usage"])

@router.get("/me")
def get_my_usage(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current user's usage statistics"""
    usage = db.query(Usage).filter(Usage.user_id == current_user.id).first()
    
    if not usage:
        # Create usage record if it doesn't exist
        usage = Usage(
            user_id=current_user.id,
            docs_used=0,
            chats_used=0,
            tokens_used=0
        )
        db.add(usage)
        db.commit()
        db.refresh(usage)
    
    return {
        "user_id": current_user.id,
        "docs_used": usage.docs_used,
        "chats_used": usage.chats_used,
        "tokens_used": usage.tokens_used,
        "last_reset": usage.last_reset
    }

@router.post("/reset")
def reset_usage(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Reset usage statistics for current user (admin only or monthly reset)"""
    usage = db.query(Usage).filter(Usage.user_id == current_user.id).first()
    
    if usage:
        usage.docs_used = 0
        usage.chats_used = 0
        usage.tokens_used = 0
        db.commit()
        db.refresh(usage)
    
    return {"message": "Usage statistics reset successfully"} 