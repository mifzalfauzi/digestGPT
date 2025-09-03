
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from models import Issues, User
from database import get_db
from dependencies import get_current_active_user
from datetime import datetime
import uuid

router = APIRouter(prefix="/issues", tags=["issues"])

class IssueCreate(BaseModel):
    docId: str
    email: str
    message: str

@router.post("/create-issue")
async def create_issue(
    issue: IssueCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        # Convert docId string to UUID if provided
        document_uuid = None
        if issue.docId:
            try:
                document_uuid = uuid.UUID(issue.docId)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid document ID format")
        
        new_issue = Issues(
            user_id=current_user.id,
            document_id=document_uuid,
            issue_id=f"ISSUE-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}",
            issue_description=issue.message,
            issue_status="open"
        )
        db.add(new_issue)
        db.commit()
        db.refresh(new_issue)
        return {"message": "Issue created successfully", "issue_id": new_issue.issue_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

