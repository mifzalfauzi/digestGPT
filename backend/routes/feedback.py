
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from models import Feedback
from database import get_db
from dependencies import get_current_active_user
from models import User

router = APIRouter(prefix="/feedback", tags=["feedback"])

class FeedbackCreate(BaseModel):
    feedback_type: str  # 'positive' or 'negative'
    feedback_category: str  # e.g., 'swot', 'insight', 'risk', 'chat'
    message: str  # The content being feedbacked

@router.post("/")
async def submit_feedback(
    feedback: FeedbackCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        new_feedback = Feedback(
            user_id=current_user.id,
            feedback_type=feedback.feedback_type,
            feedback_category=feedback.feedback_category,
            message=feedback.message
        )
        db.add(new_feedback)
        db.commit()
        db.refresh(new_feedback)
        return {"message": "Feedback submitted successfully", "feedback_id": new_feedback.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
