"""
Background service to check subscription statuses and downgrade users when needed
Run this periodically (e.g., daily via cron job)
"""
import os
import sys
from datetime import datetime, timedelta, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import stripe
import logging

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models import User, UserPlan, Base
from database import DATABASE_URL

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

def get_db_session():
    """Create database session"""
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()

def check_expired_subscriptions():
    """Check for expired subscriptions and downgrade users"""
    db = get_db_session()
    try:
        # Find users with subscriptions that might be expired
        now = datetime.now(timezone.utc)
        
        # Users with subscription end dates in the past and not checked recently
        users_to_check = db.query(User).filter(
            User.subscription_end_date < now,
            User.plan != UserPlan.FREE,
            User.stripe_customer_id.isnot(None)
        ).all()
        
        logger.info(f"Found {len(users_to_check)} users with potentially expired subscriptions")
        
        for user in users_to_check:
            try:
                logger.info(f"Checking subscription for user: {user.email}")
                
                # Get current subscription status from Stripe
                subscriptions = stripe.Subscription.list(
                    customer=user.stripe_customer_id,
                    status="all",
                    limit=10
                )
                
                active_subscription = None
                for subscription in subscriptions.data:
                    if subscription.status in ["active", "trialing"]:
                        active_subscription = subscription
                        break
                
                if active_subscription:
                    # Subscription is still active, update our records
                    price_id = active_subscription['items']['data'][0]['price']['id']
                    
                    if price_id == os.getenv("STRIPE_PRICE_ID_STANDARD"):
                        user.plan = UserPlan.STANDARD
                    elif price_id == os.getenv("STRIPE_PRICE_ID_PRO"):
                        user.plan = UserPlan.PRO
                    
                    user.subscription_status = active_subscription.status
                    user.subscription_end_date = datetime.fromtimestamp(active_subscription.current_period_end, timezone.utc)
                    user.last_payment_check = now
                    user.updated_at = now
                    
                    logger.info(f"✅ Updated active subscription for {user.email}")
                else:
                    # No active subscription, downgrade to free
                    if user.plan != UserPlan.FREE:
                        user.plan = UserPlan.FREE
                        user.subscription_status = "expired"
                        user.stripe_subscription_id = None
                        user.subscription_end_date = None
                        user.last_payment_check = now
                        user.updated_at = now
                        
                        logger.info(f"⬇️ Downgraded {user.email} to free plan (subscription expired)")
                
            except Exception as e:
                logger.error(f"❌ Error checking user {user.email}: {str(e)}")
                # Mark as checked to avoid repeated errors
                user.last_payment_check = now
                user.updated_at = now
        
        db.commit()
        
    except Exception as e:
        logger.error(f"❌ Error in subscription check: {str(e)}")
        db.rollback()
    finally:
        db.close()

def check_overdue_payments():
    """Check for users who haven't been checked in a while"""
    db = get_db_session()
    try:
        # Find users who haven't been checked in over 24 hours
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=24)
        
        users_to_check = db.query(User).filter(
            User.plan != UserPlan.FREE,
            User.stripe_customer_id.isnot(None),
            (User.last_payment_check < cutoff_time) | (User.last_payment_check.is_(None))
        ).all()
        
        logger.info(f"Found {len(users_to_check)} users needing payment status check")
        
        for user in users_to_check:
            try:
                logger.info(f"Checking payment status for user: {user.email}")
                
                # Get subscription status from Stripe
                subscriptions = stripe.Subscription.list(
                    customer=user.stripe_customer_id,
                    status="all",
                    limit=5
                )
                
                active_subscription = None
                for subscription in subscriptions.data:
                    if subscription.status in ["active", "trialing", "past_due"]:
                        active_subscription = subscription
                        break
                
                if active_subscription:
                    # Update subscription info
                    user.subscription_status = active_subscription.status
                    # Handle subscription end date safely
                    if hasattr(active_subscription, 'current_period_end') and active_subscription.current_period_end:
                        user.subscription_end_date = datetime.fromtimestamp(active_subscription.current_period_end, timezone.utc)
                    else:
                        logger.warning(f"No current_period_end found for subscription {active_subscription.id}")
                        user.subscription_end_date = None
                    
                    # If past_due, keep current plan but flag status
                    if active_subscription.status == "past_due":
                        logger.warning(f"⚠️ User {user.email} has past due payment")
                    
                else:
                    # No active subscription
                    if user.plan != UserPlan.FREE:
                        user.plan = UserPlan.FREE
                        user.subscription_status = "inactive"
                        user.stripe_subscription_id = None
                        user.subscription_end_date = None
                        logger.info(f"⬇️ Downgraded {user.email} to free plan (no active subscription)")
                
                user.last_payment_check = datetime.now(timezone.utc)
                user.updated_at = datetime.now(timezone.utc)
                
            except Exception as e:
                logger.error(f"❌ Error checking payment for user {user.email}: {str(e)}")
                # Mark as checked to avoid repeated errors
                user.last_payment_check = datetime.now(timezone.utc)
                user.updated_at = datetime.now(timezone.utc)
        
        db.commit()
        
    except Exception as e:
        logger.error(f"❌ Error in payment check: {str(e)}")
        db.rollback()
    finally:
        db.close()

def main():
    """Main function to run all checks"""
    logger.info("🔄 Starting subscription status check...")
    
    if not stripe.api_key:
        logger.error("❌ STRIPE_SECRET_KEY not found in environment variables")
        return
    
    # Check expired subscriptions
    check_expired_subscriptions()
    
    # Check overdue payments
    check_overdue_payments()
    
    logger.info("✅ Subscription status check completed")

if __name__ == "__main__":
    main()