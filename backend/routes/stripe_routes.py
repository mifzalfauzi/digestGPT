# Create a new file: stripe_routes.py
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

# Configure Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

router = APIRouter(prefix="/stripe", tags=["stripe"])

class CheckoutRequest(BaseModel):
    price_id: str
    success_url: str = "http://localhost:3000/stripe-success"
    cancel_url: str = "http://localhost:3000/stripe-cancel"

class PortalRequest(BaseModel):
    return_url: str = "http://localhost:3000/dashboard"

@router.post("/create-checkout-session")
async def create_checkout_session(
    request: CheckoutRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a Stripe Checkout Session for subscription"""
    try:
        print(f"🛒 Creating checkout session for user: {current_user.email}")
        
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
    """Handle Stripe webhooks"""
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
        print(f"🔔 Received Stripe webhook: {event['type']}")
        
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