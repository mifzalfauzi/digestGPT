# from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum
# from sqlalchemy.sql import func
# from sqlalchemy.ext.declarative import declarative_base
# import enum

# Base = declarative_base()

# # Enum for user plans
# class UserPlan(str, enum.Enum):
#     FREE = "free"
#     STANDARD = "standard"
#     PRO = "pro"

# # 1. User table
# class User(Base):
#     __tablename__ = "users"

#     id = Column(Integer, primary_key=True, index=True)
#     email = Column(String, unique=True, index=True)
#     password_hash = Column(String, nullable=False)
#     name = Column(String)
#     plan = Column(Enum(UserPlan), default=UserPlan.FREE)
#     is_active = Column(Boolean, default=True)
#     created_at = Column(DateTime(timezone=True), server_default=func.now())

# # 2. Document table
# class Document(Base):
#     __tablename__ = "documents"

#     id = Column(Integer, primary_key=True, index=True)
#     user_id = Column(Integer, ForeignKey("users.id"))
#     collection_id = Column(Integer, ForeignKey("collections.id"), nullable=True)
#     filename = Column(String)
#     filesize = Column(Integer)  # in bytes
#     document_text = Column(Text)  # Store full document text
#     summary = Column(Text)
#     key_points = Column(Text)  # JSON string of key points
#     risk_flags = Column(Text)  # JSON string of risk flags  
#     key_concepts = Column(Text)  # JSON string of key concepts
#     word_count = Column(Integer)
#     analysis_method = Column(String)  # 'single' or 'chunked'
#     uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

# # 3. Chat history table
# class ChatHistory(Base):
#     __tablename__ = "chat_history"

#     id = Column(Integer, primary_key=True, index=True)
#     user_id = Column(Integer, ForeignKey("users.id"))
#     document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
#     question = Column(Text)
#     answer = Column(Text)
#     timestamp = Column(DateTime(timezone=True), server_default=func.now())

# # 4. Usage table
# class Usage(Base):
#     __tablename__ = "usage"

#     id = Column(Integer, primary_key=True, index=True)
#     user_id = Column(Integer, ForeignKey("users.id"), unique=True)
#     docs_used = Column(Integer, default=0)
#     chats_used = Column(Integer, default=0)
#     tokens_used = Column(Integer, default=0)
#     last_reset = Column(DateTime(timezone=True), server_default=func.now())

# # 5. Subscription plans table
# class SubscriptionPlan(Base):
#     __tablename__ = "subscription_plans"

#     id = Column(Integer, primary_key=True, index=True)
#     name = Column(String, unique=True)  # Free, Standard, Pro
#     price = Column(Float)               # Monthly price in USD
#     doc_limit = Column(Integer)
#     chat_limit = Column(Integer)
#     token_limit = Column(Integer)       # Token limit per month

# # 6. User subscription table
# class UserSubscription(Base):
#     __tablename__ = "user_subscriptions"

#     id = Column(Integer, primary_key=True, index=True)
#     user_id = Column(Integer, ForeignKey("users.id"))
#     plan_id = Column(Integer, ForeignKey("subscription_plans.id"))
#     is_active = Column(Boolean, default=True)
#     subscribed_at = Column(DateTime(timezone=True), server_default=func.now())

# # 7. Feedback table
# class Feedback(Base):
#     __tablename__ = "feedback"

#     id = Column(Integer, primary_key=True, index=True)
#     user_id = Column(Integer, ForeignKey("users.id"))
#     message = Column(Text)
#     submitted_at = Column(DateTime(timezone=True), server_default=func.now())

# # 8. Admin users table
# class AdminUser(Base):
#     __tablename__ = "admin_users"

#     id = Column(Integer, primary_key=True, index=True)
#     email = Column(String, unique=True)
#     password_hash = Column(String)
#     created_at = Column(DateTime(timezone=True), server_default=func.now())
    
# # 9. Collection table
# class Collection(Base):
#     __tablename__ = "collections"

#     id = Column(Integer, primary_key=True, index=True)
#     user_id = Column(Integer, ForeignKey("users.id"))
#     name = Column(String, nullable=False)  # Name of the collection/folder
#     description = Column(Text, nullable=True)
#     created_at = Column(DateTime(timezone=True), server_default=func.now())

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
    password_hash = Column(String, nullable=False)
    name = Column(String)
    plan = Column(Enum(UserPlan), default=UserPlan.FREE)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # email_confirmed_at = Column(DateTime, nullable=True)

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
    key_concepts = Column(Text)
    word_count = Column(Integer)
    analysis_method = Column(String)
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
