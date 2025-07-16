#!/usr/bin/env python3
"""
Seed subscription plans in the database.
Run this script to populate the subscription_plans table with default plans.
"""

from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, SubscriptionPlan

def create_subscription_plans():
    """Create default subscription plans"""
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Check if plans already exist
        existing_plans = db.query(SubscriptionPlan).count()
        if existing_plans > 0:
            print(f"Found {existing_plans} existing plans. Skipping seed.")
            return
        
        # Create subscription plans
        plans = [
            SubscriptionPlan(
                name="Free",
                price=0.0,
                doc_limit=1,
                chat_limit=3,
                token_limit=3000
            ),
            SubscriptionPlan(
                name="Standard",
                price=9.99,
                doc_limit=50,
                chat_limit=100,
                token_limit=100000
            ),
            SubscriptionPlan(
                name="Pro",
                price=29.99,
                doc_limit=120,
                chat_limit=350,
                token_limit=350000
            )
        ]
        
        # Add plans to database
        for plan in plans:
            db.add(plan)
        
        db.commit()
        
        print("✅ Successfully created subscription plans:")
        for plan in plans:
            print(f"  - {plan.name}: ${plan.price}/month")
            print(f"    └── {plan.doc_limit} docs, {plan.chat_limit} chats, {plan.token_limit:,} tokens")
        
    except Exception as e:
        print(f"❌ Error creating subscription plans: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🌱 Seeding subscription plans...")
    create_subscription_plans()
    print("✨ Done!") 