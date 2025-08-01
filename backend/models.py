

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
    
    stripe_customer_id = Column(String, nullable=True, index=True)
    stripe_subscription_id = Column(String, nullable=True, index=True)
    subscription_status = Column(String, nullable=True) # active, inactive, past_due, incomplete, incomplete_expired, trialing, paused, canceled, unpaid
    subscription_end_date = Column(DateTime(timezone=True), nullable=True)  # When subscription expires
    last_payment_check = Column(DateTime(timezone=True), nullable=True)     # Last time we checked payment status
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
    key_points = Column(Text)
    risk_flags = Column(Text)
    swot_analysis = Column(Text)
    key_concepts = Column(Text)
    word_count = Column(Integer)
    analysis_method = Column(String)
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
    plan_id = Column(UUID(as_uuid=True), ForeignKey("subscription_plans.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    subscribed_at = Column(DateTime(timezone=True), server_default=func.now())
    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)
    cancel_at = Column(DateTime(timezone=True), nullable=True)


# 7. Feedback
class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    message = Column(Text)
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

