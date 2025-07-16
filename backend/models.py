from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# 1. User table
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# 2. Document table
class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String)
    filesize = Column(Integer)  # in bytes
    summary = Column(Text)
    insights = Column(Text)
    key_concepts = Column(Text)
    risk_assessment = Column(Text)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

# 3. Chat history table
class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    question = Column(Text)
    answer = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

# 4. Usage table
class Usage(Base):
    __tablename__ = "usage"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    docs_used = Column(Integer, default=0)
    chats_used = Column(Integer, default=0)
    tokens_used = Column(Integer, default=0)
    last_reset = Column(DateTime(timezone=True), server_default=func.now())

# 5. Subscription plans table
class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)  # Basic, Pro
    price = Column(Float)               # Monthly price in USD
    doc_limit = Column(Integer)
    chat_limit = Column(Integer)

# 6. User subscription table
class UserSubscription(Base):
    __tablename__ = "user_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    plan_id = Column(Integer, ForeignKey("subscription_plans.id"))
    is_active = Column(Boolean, default=True)
    subscribed_at = Column(DateTime(timezone=True), server_default=func.now())

# 7. Feedback table
class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(Text)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

# 8. Admin users table
class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True)
    password_hash = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
