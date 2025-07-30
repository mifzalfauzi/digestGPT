# Update your stripe_routes.py
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
import stripe
import os
from datetime import datetime
from database import get_db
from models import User, UserPlan
from dependencies import get_current_active_user
import logging
import json

# Configure Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")  # This can be None

router = APIRouter(prefix="/stripe", tags=["stripe"])

class CheckoutRequest(BaseModel):
    price_id: str
    success_url: str = "http://localhost:3000/stripe-success"
    cancel_url: str = "http://localhost:3000/stripe-cancel"

class PortalRequest(BaseModel):
    return_url: str = "http://localhost:3000/dashboard"
    
class ManualUpdateRequest(BaseModel):
    session_id: str

@router.post("/create-checkout-session")
async def create_checkout_session(
    request: CheckoutRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a Stripe Checkout Session for subscription"""
    try:
        print(f"🛒 Creating checkout session for user: {current_user.email}")
        print(f"📋 Price ID: {request.price_id}")
        
        # Create or get Stripe customer
        stripe_customer_id = current_user.stripe_customer_id
        
        if not stripe_customer_id:
            # Create new Stripe customer
            customer = stripe.Customer.create(
                email=current_user.email,
                name=current_user.name,
                metadata={
                    "user_id": str(current_user.id),
                    "plan": current_user.plan.value
                }
            )
            stripe_customer_id = customer.id
            
            # Save customer ID to user
            current_user.stripe_customer_id = stripe_customer_id
            db.commit()
            print(f"✅ Created Stripe customer: {stripe_customer_id}")
        
        # Create checkout session
        checkout_session = stripe.checkout.Session.create(
            customer=stripe_customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price': request.price_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=request.success_url + "?session_id={CHECKOUT_SESSION_ID}",
            cancel_url=request.cancel_url,
            metadata={
                "user_id": str(current_user.id),
                "user_email": current_user.email
            }
        )
        
        print(f"✅ Created checkout session: {checkout_session.id}")
        
        return {
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id
        }
        
    except Exception as e:
        print(f"❌ Checkout session error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create checkout session: {str(e)}"
        )

@router.post("/create-portal-session")
async def create_portal_session(
    request: PortalRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Create a Stripe Customer Portal Session"""
    try:
        if not current_user.stripe_customer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No Stripe customer found for this user"
            )
        
        portal_session = stripe.billing_portal.Session.create(
            customer=current_user.stripe_customer_id,
            return_url=request.return_url,
        )
        
        return {"portal_url": portal_session.url}
        
    except Exception as e:
        print(f"❌ Portal session error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create portal session: {str(e)}"
        )

@router.get("/subscription-status")
async def get_subscription_status(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's subscription status"""
    try:
        if not current_user.stripe_customer_id:
            return {
                "has_subscription": False,
                "plan": current_user.plan.value,
                "status": "no_customer"
            }
        
        # Get active subscriptions
        subscriptions = stripe.Subscription.list(
            customer=current_user.stripe_customer_id,
            status="active"
        )
        
        if subscriptions.data:
            subscription = subscriptions.data[0]
            return {
                "has_subscription": True,
                "subscription_id": subscription.id,
                "status": subscription.status,
                "current_period_end": subscription.current_period_end,
                "plan": current_user.plan.value
            }
        else:
            return {
                "has_subscription": False,
                "plan": current_user.plan.value,
                "status": "no_active_subscription"
            }
            
    except Exception as e:
        print(f"❌ Subscription status error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get subscription status: {str(e)}"
        )

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhooks - gracefully handle missing webhook secret"""
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    try:
        # If webhook secret is not configured, just log and return success
        if not STRIPE_WEBHOOK_SECRET:
            print("⚠️ Webhook received but STRIPE_WEBHOOK_SECRET not configured")
            print("💡 Payments will work, but plan updates won't be automatic")
            print("🔧 Set up webhook secret later for automatic plan updates")
            
            # Parse the event without verification (for development only)
            try:
                event = json.loads(payload)
                print(f"🔔 Webhook event type: {event.get('type', 'unknown')}")
            except:
                print("📦 Could not parse webhook payload")
            
            return {"status": "received", "message": "webhook secret not configured"}
        
        # If webhook secret is configured, verify the signature
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
        print(f"🔔 Verified webhook: {event['type']}")
        
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            await handle_successful_payment(session, db)
            
        elif event['type'] == 'customer.subscription.updated':
            subscription = event['data']['object']
            await handle_subscription_updated(subscription, db)
            
        elif event['type'] == 'customer.subscription.deleted':
            subscription = event['data']['object']
            await handle_subscription_cancelled(subscription, db)
            
        return {"status": "success"}
        
    except ValueError as e:
        print(f"❌ Invalid payload: {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        print(f"❌ Invalid signature: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        print(f"❌ Webhook error: {e}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")

# Manual plan update endpoint for when webhooks aren't configured
@router.post("/update-plan-manual")
async def update_plan_manual(
    request: ManualUpdateRequest,  # Changed: now properly receives the request body
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Manually update user plan after successful payment (for when webhooks aren't set up)"""
    try:
        print(f"🔄 Manual plan update requested by: {current_user.email}")
        print(f"📋 Session ID: {request.session_id}")
        print(f"👤 Current user plan: {current_user.plan.value}")
        
        # Retrieve the checkout session from Stripe
        session = stripe.checkout.Session.retrieve(request.session_id)
        print(f"💳 Session payment status: {session.payment_status}")
        print(f"🏪 Session customer: {session.customer}")
        print(f"👤 User customer ID: {current_user.stripe_customer_id}")
        
        if session.payment_status == 'paid' and session.customer == current_user.stripe_customer_id:
            # Get subscription details
            subscription_id = session.subscription
            subscription = stripe.Subscription.retrieve(subscription_id)
            price_id = subscription['items']['data'][0]['price']['id']
            
            print(f"🔍 Found price_id: {price_id}")
            print(f"🔍 STRIPE_PRICE_ID_STANDARD: {os.getenv('STRIPE_PRICE_ID_STANDARD')}")
            print(f"🔍 STRIPE_PRICE_ID_PRO: {os.getenv('STRIPE_PRICE_ID_PRO')}")
            
            # Store old plan for logging
            old_plan = current_user.plan.value
            
            # Update user plan based on price_id
            if price_id == os.getenv("STRIPE_PRICE_ID_STANDARD"):
                current_user.plan = UserPlan.STANDARD
                print("✅ Setting plan to STANDARD")
            elif price_id == os.getenv("STRIPE_PRICE_ID_PRO"):
                current_user.plan = UserPlan.PRO
                print("✅ Setting plan to PRO")
            else:
                print(f"⚠️ Unknown price_id: {price_id}")
                raise HTTPException(
                    status_code=400, 
                    detail=f"Unknown price_id: {price_id}. Check your environment variables."
                )
            
            # Update subscription info
            current_user.stripe_subscription_id = subscription_id
            current_user.subscription_status = "active"
            
            # Commit changes
            db.commit()
            db.refresh(current_user)  # Refresh to get updated data
            
            print(f"✅ Successfully updated user {current_user.email}")
            print(f"✅ Plan changed from {old_plan} to {current_user.plan.value}")
            print(f"✅ Subscription ID: {subscription_id}")
            
            return {
                "status": "success", 
                "old_plan": old_plan,
                "new_plan": current_user.plan.value,
                "subscription_id": subscription_id,
                "user_email": current_user.email
            }
        else:
            error_msg = f"Validation failed - Payment status: {session.payment_status}, Customer match: {session.customer == current_user.stripe_customer_id}"
            print(f"❌ {error_msg}")
            raise HTTPException(status_code=400, detail=error_msg)
            
    except stripe.error.StripeError as e:
        print(f"❌ Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        print(f"❌ Error manually updating plan: {str(e)}")
        import traceback
        print(f"❌ Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to update plan: {str(e)}")

async def handle_successful_payment(session, db: Session):
    """Handle successful payment from checkout"""
    try:
        user_id = session['metadata']['user_id']
        user = db.query(User).filter(User.id == user_id).first()
        
        if user:
            # Get subscription details
            subscription_id = session['subscription']
            subscription = stripe.Subscription.retrieve(subscription_id)
            price_id = subscription['items']['data'][0]['price']['id']
            
            # Update user plan based on price_id
            if price_id == os.getenv("STRIPE_PRICE_ID_STANDARD"):
                user.plan = UserPlan.STANDARD
            elif price_id == os.getenv("STRIPE_PRICE_ID_PRO"):
                user.plan = UserPlan.PRO
            
            user.stripe_subscription_id = subscription_id
            user.subscription_status = "active"
            user.updated_at = datetime.utcnow()
            
            db.commit()
            print(f"✅ Updated user {user.email} to {user.plan.value} plan")
            
    except Exception as e:
        print(f"❌ Error handling successful payment: {e}")

async def handle_subscription_updated(subscription, db: Session):
    """Handle subscription updates"""
    try:
        customer_id = subscription['customer']
        user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
        
        if user:
            user.subscription_status = subscription['status']
            user.updated_at = datetime.utcnow()
            db.commit()
            print(f"✅ Updated subscription status for {user.email}: {subscription['status']}")
            
    except Exception as e:
        print(f"❌ Error handling subscription update: {e}")

async def handle_subscription_cancelled(subscription, db: Session):
    """Handle subscription cancellation"""
    try:
        customer_id = subscription['customer']
        user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
        
        if user:
            user.plan = UserPlan.FREE
            user.subscription_status = "cancelled"
            user.stripe_subscription_id = None
            user.updated_at = datetime.utcnow()
            
            db.commit()
            print(f"✅ Downgraded user {user.email} to free plan")
            
    except Exception as e:
        print(f"❌ Error handling subscription cancellation: {e}")