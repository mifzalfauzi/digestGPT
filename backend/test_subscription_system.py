"""
Test script to verify subscription tracking system
"""
import os
import sys
from datetime import datetime, timedelta, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models import User, UserPlan
from database import DATABASE_URL
from subscription_checker import main as check_subscriptions

def setup_test_user():
    """Create a test user with expired subscription"""
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Find an existing user or create one for testing
        test_user = db.query(User).filter(User.email.like('%test%')).first()
        
        if not test_user:
            print("No test user found. Please create a user first or use an existing user.")
            return
        
        print(f"Using test user: {test_user.email}")
        print(f"Current plan: {test_user.plan}")
        
        # Set subscription to expired (1 day ago)
        expired_date = datetime.now(timezone.utc) - timedelta(days=1)
        test_user.subscription_end_date = expired_date
        test_user.plan = UserPlan.STANDARD  # Set to paid plan
        test_user.stripe_customer_id = "test_customer_id"
        test_user.stripe_subscription_id = "test_sub_id"
        test_user.subscription_status = "active"
        test_user.last_payment_check = datetime.now(timezone.utc) - timedelta(days=2)
        
        db.commit()
        
        print(f"✅ Set up test user with expired subscription:")
        print(f"   - Plan: {test_user.plan}")
        print(f"   - Subscription end: {test_user.subscription_end_date}")
        print(f"   - Status: {test_user.subscription_status}")
        
        return test_user.id
        
    except Exception as e:
        print(f"❌ Error setting up test user: {str(e)}")
        db.rollback()
    finally:
        db.close()

def verify_downgrade(user_id):
    """Check if user was downgraded"""
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            print(f"✅ After check - User plan: {user.plan}")
            print(f"✅ After check - Status: {user.subscription_status}")
            
            if user.plan == UserPlan.FREE:
                print("🎉 SUCCESS: User was downgraded to FREE plan!")
            else:
                print("⚠️ User was NOT downgraded - check logic")
        
    except Exception as e:
        print(f"❌ Error verifying downgrade: {str(e)}")
    finally:
        db.close()

def main():
    print("🧪 Testing Subscription System...")
    
    # Step 1: Set up test user
    user_id = setup_test_user()
    if not user_id:
        return
    
    print("\n" + "="*50)
    print("🔄 Running subscription checker...")
    
    # Step 2: Run the subscription checker
    try:
        check_subscriptions()
    except Exception as e:
        print(f"❌ Subscription checker failed: {str(e)}")
        return
    
    print("="*50 + "\n")
    
    # Step 3: Verify the result
    verify_downgrade(user_id)

if __name__ == "__main__":
    main()