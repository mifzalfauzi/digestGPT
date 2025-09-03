

import uuid
from sqlalchemy import (
    Column, String, Float, Boolean, DateTime, ForeignKey, Text, Enum, Integer
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base
import enum

Base = declarative_base()

# Enum for user plans
class UserPlan(str, enum.Enum):
    FREE = "free"
    STANDARD = "standard"
    PRO = "pro"

# 1. User table
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)  # Made nullable for Google OAuth users
    name = Column(String)
    plan = Column(Enum(UserPlan), default=UserPlan.FREE)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Google OAuth fields
    google_id = Column(String, unique=True, nullable=True, index=True)  # Google user ID
    profile_picture = Column(String, nullable=True)  # Google profile picture URL
    # email_confirmed_at = Column(DateTime, nullable=True)
    email_verified = Column(Boolean, nullable=True, default=False)
    email_verified_at = Column(DateTime(timezone=True), nullable=True)
    verification_token = Column(String, nullable=True)
    verification_token_expires_at = Column(DateTime, nullable=True)
    
    # Timezone support
    timezone = Column(String, nullable=True, default='UTC')  # User's timezone (e.g., 'America/New_York')
    last_ip_address = Column(String, nullable=True)  # For timezone detection
    
   
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    



# 2. Document table
class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    collection_id = Column(UUID(as_uuid=True), ForeignKey("collections.id"), nullable=True)
    filename = Column(String)
    filesize = Column(Integer)
    document_text = Column(Text)
    summary = Column(Text)
    problem_context = Column(Text)
    key_points = Column(Text)
    risk_flags = Column(Text)
    swot_analysis = Column(Text)
    key_concepts = Column(Text)
    word_count = Column(Integer)
    analysis_method = Column(String)
    recommendations = Column(Text)
    impact = Column(Text)
    file_url = Column(String, nullable=True)  # Add file URL for PDF viewing
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

# 3. Chat history
class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=True)
    question = Column(Text)
    answer = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    chat_session_id = Column(UUID(as_uuid=True), nullable=True, index=True)


# 4. Usage
class Usage(Base):
    __tablename__ = "usage"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    docs_used = Column(Integer, default=0)
    chats_used = Column(Integer, default=0)
    tokens_used = Column(Integer, default=0)
    last_reset = Column(DateTime(timezone=True), server_default=func.now())

# 5. SubscriptionPlan
class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, unique=True, nullable=False)
    price = Column(Float)
    doc_limit = Column(Integer)
    chat_limit = Column(Integer)
    token_limit = Column(Integer)

# 6. UserSubscription
class UserSubscription(Base):
    __tablename__ = "user_subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("subscription_plans.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    subscribed_at = Column(DateTime(timezone=True), server_default=func.now())
    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)
    cancel_at = Column(DateTime(timezone=True), nullable=True)
    subscription_status = Column(String, nullable=True) # active, inactive, past_due, incomplete, incomplete_expired, trialing, paused, canceled, unpaid
    subscription_end_date = Column(DateTime(timezone=True), nullable=True)  # When subscription expires
    last_payment_check = Column(DateTime(timezone=True), nullable=True) 
    auto_debit_enabled = Column(Boolean, default=True)
    current_period_end = Column(DateTime(timezone=True), nullable=True)
    


# 7. Feedback
class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    message = Column(Text)
    feedback_category = Column(String, nullable=True)
    feedback_type = Column(String, nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    
    

# 8. AdminUser
class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# 9. Collection
class Collection(Base):
    __tablename__ = "collections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
#10. Payments
class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    stripe_payment_intent_id = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="usd")
    status = Column(String)  # e.g., "succeeded", "pending", etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    invoice_url = Column(String, nullable=True)
    
class PublicChatShare(Base):
    __tablename__ = "public_chat_shares"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    chat_session_id = Column(UUID(as_uuid=True), nullable=False, index=True)  # Links to ChatHistory
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=True)  # Optional: link to document
    
    # Public sharing details
    share_token = Column(String, unique=True, nullable=False, index=True)  # Unique public URL token
    title = Column(String, nullable=True)  # Optional: custom title for the shared chat
    description = Column(Text, nullable=True)  # Optional: description of the chat
    
    # Sharing settings
    is_active = Column(Boolean, default=True)  # Can be disabled without deleting
    allow_download = Column(Boolean, default=False)  # Allow downloading chat transcript
    password_protected = Column(Boolean, default=False)  # Require password to view
    access_password = Column(String, nullable=True)  # Hashed password if protected
    
    # Analytics and limits
    view_count = Column(Integer, default=0)  # Track how many times it's been viewed
    max_views = Column(Integer, nullable=True)  # Optional: limit number of views
    expires_at = Column(DateTime(timezone=True), nullable=True)  # Optional: expiration date
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_accessed = Column(DateTime(timezone=True), nullable=True)  # When last viewed by public
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

# 5. NEW: Public Chat Views (for analytics)
class PublicChatView(Base):
    __tablename__ = "public_chat_views"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    share_id = Column(UUID(as_uuid=True), ForeignKey("public_chat_shares.id"), nullable=False)
    
    # Viewer information (anonymous)
    ip_address = Column(String, nullable=True)  # For basic analytics
    user_agent = Column(String, nullable=True)  # Browser/device info
    country = Column(String, nullable=True)  # Detected country
    referrer = Column(String, nullable=True)  # Where they came from
    
    # View details
    viewed_at = Column(DateTime(timezone=True), server_default=func.now())
    session_duration = Column(Integer, nullable=True)  # How long they stayed (seconds)
    
    
class Invoice(Base):    
    __tablename__ = "invoices"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    invoice_id = Column(String, nullable=False)
    invoice_date = Column(DateTime(timezone=True), nullable=False)
    file_url = Column(String, nullable=True)  # Add file URL for PDF viewing
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

class Issues(Base):
    __tablename__ = "issues"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=True)
    issue_id = Column(String, nullable=False)
    issue_date = Column(DateTime(timezone=True), server_default=func.now())
    issue_description = Column(Text, nullable=False)
    issue_status = Column(String, nullable=False, default="open")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())