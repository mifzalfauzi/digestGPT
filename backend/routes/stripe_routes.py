from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
import stripe
import os
from datetime import datetime, timedelta, timezone
from database import get_db
from models import User, UserPlan
from dependencies import get_current_active_user
from email_service import email_service
from invoice_generator import invoice_generator
from timezone_service import timezone_service

# Configure Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

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

@router.post("/update-plan-manual")
async def update_plan_manual(
    request: ManualUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Manually update user plan after successful payment (no webhooks)"""
    try:
        print(f"🔄 Manual plan update requested by: {current_user.email}")
        print(f"📋 Session ID: {request.session_id}")
        
        # Check if this session has already been processed to prevent duplicate emails
        session_processed_key = f"processed_session_{request.session_id}"
        
        # Simple in-memory check (for production, use Redis or database)
        if not hasattr(update_plan_manual, 'processed_sessions'):
            update_plan_manual.processed_sessions = set()
        
        if request.session_id in update_plan_manual.processed_sessions:
            print(f"⚠️ Session {request.session_id} already processed, skipping email")
            # Return success but don't send email again - include subscription_end_date
            return {
                "status": "already_processed",
                "message": "Session already processed",
                "new_plan": current_user.plan.value,
                "user_email": current_user.email,
                "subscription_end_date": current_user.subscription_end_date.isoformat() if current_user.subscription_end_date else None,
                "skip_email": True
            }
        
        # Mark session as being processed
        update_plan_manual.processed_sessions.add(request.session_id)
        
        # Retrieve the checkout session from Stripe
        session = stripe.checkout.Session.retrieve(request.session_id)
        print(f"💳 Session payment status: {session.payment_status}")
        print(f"🏪 Session customer: {session.customer}")
        print(f"👤 User customer ID: {current_user.stripe_customer_id}")
        
        # Validate session belongs to current user and payment is successful
        if session.payment_status != 'paid':
            raise HTTPException(
                status_code=400, 
                detail=f"Payment not completed. Status: {session.payment_status}"
            )
        
        if session.customer != current_user.stripe_customer_id:
            raise HTTPException(
                status_code=400, 
                detail="Session does not belong to current user"
            )
        
        # Get subscription details
        subscription_id = session.subscription
        if not subscription_id:
            raise HTTPException(
                status_code=400, 
                detail="No subscription found in session"
            )
        
        print(f"🔍 Retrieving subscription: {subscription_id}")
        subscription = stripe.Subscription.retrieve(subscription_id)
        
        # Get price_id safely - handle both object and dict access patterns
        try:
            # Try object-style access first (most common)
            price_id = subscription.items.data[0].price.id
            print(f"🔍 Found price_id (object): {price_id}")
        except (AttributeError, IndexError):
            try:
                # Fallback to dictionary-style access
                price_id = subscription['items']['data'][0]['price']['id']
                print(f"🔍 Found price_id (dict): {price_id}")
            except (KeyError, IndexError, TypeError) as e:
                print(f"❌ Error getting price_id: {e}")
                print(f"🔍 Subscription type: {type(subscription)}")
                print(f"🔍 Subscription items: {getattr(subscription, 'items', 'No items attr')}")
                raise HTTPException(
                    status_code=400, 
                    detail="Could not extract price information from subscription"
                )
        
        # Store old plan for logging
        old_plan = current_user.plan.value
        
        # Update user plan based on price_id
        plan_name = ""
        amount = ""
        
        if price_id == os.getenv("STRIPE_PRICE_ID_STANDARD"):
            current_user.plan = UserPlan.STANDARD
            plan_name = "Standard"
            amount = "$3.99"
            print("✅ Setting plan to STANDARD")
        elif price_id == os.getenv("STRIPE_PRICE_ID_PRO"):
            current_user.plan = UserPlan.PRO
            plan_name = "Pro"
            amount = "$7.99"
            print("✅ Setting plan to PRO")
        else:
            print(f"⚠️ Unknown price_id: {price_id}")
            print(f"🔍 Expected STANDARD: {os.getenv('STRIPE_PRICE_ID_STANDARD')}")
            print(f"🔍 Expected PRO: {os.getenv('STRIPE_PRICE_ID_PRO')}")
            raise HTTPException(
                status_code=400, 
                detail=f"Unknown price_id: {price_id}. Check your environment variables."
            )
        
        # Get subscription end date safely - handle both object and dict access
        now = datetime.now(timezone.utc)
        try:
            # Try object-style access first
            current_period_end = subscription.current_period_end
            subscription_end = datetime.fromtimestamp(current_period_end, timezone.utc)
            subscription_start = datetime.fromtimestamp(subscription.current_period_start, timezone.utc)
            print(f"✅ Subscription period (object): {subscription_start} to {subscription_end}")
        except (AttributeError, TypeError):
            try:
                # Fallback to dictionary-style access
                current_period_end = subscription['current_period_end']
                current_period_start = subscription['current_period_start']
                subscription_end = datetime.fromtimestamp(current_period_end, timezone.utc)
                subscription_start = datetime.fromtimestamp(current_period_start, timezone.utc)
                print(f"✅ Subscription period (dict): {subscription_start} to {subscription_end}")
            except (KeyError, TypeError) as e:
                print(f"⚠️ Could not get subscription period: {e}")
                # Fallback: set to 30 days from now
                subscription_start = now
                subscription_end = now + timedelta(days=30)
                print(f"🔄 Using fallback period: {subscription_start} to {subscription_end}")
        
        # Update all subscription info
        current_user.stripe_subscription_id = subscription_id
        current_user.subscription_status = "active"
        current_user.subscription_end_date = subscription_end
        current_user.last_payment_check = now
        current_user.updated_at = now
        
        # Commit changes
        db.commit()
        db.refresh(current_user)
        
        print(f"✅ Successfully updated user {current_user.email}")
        print(f"✅ Plan changed from {old_plan} to {current_user.plan.value}")
        print(f"✅ Subscription ID: {subscription_id}")
        print(f"✅ Expires: {subscription_end}")
        
        # Generate consistent invoice ID first
        now = datetime.now(timezone.utc)
        invoice_id = f"INV-{now.strftime('%Y%m%d')}-{subscription_id[:8].upper()}"
        
        # Generate invoice PDF
        print("📄 Generating invoice PDF...")
        try:
            # Get user timezone for invoice generation
            user_timezone = current_user.timezone or 'UTC'
            
            invoice_result = invoice_generator.generate_invoice(
                user_name=current_user.name or current_user.email,
                user_email=current_user.email,
                plan_name=plan_name,
                amount=amount,
                stripe_subscription_id=subscription_id,
                stripe_payment_intent_id=getattr(session, 'payment_intent', None),
                subscription_start_date=subscription_start,
                subscription_end_date=subscription_end,
                custom_invoice_id=invoice_id,
                user_timezone=user_timezone
            )
            
            if invoice_result and invoice_result[0]:
                invoice_path, generated_invoice_id, invoice_filename = invoice_result
                print(f"✅ Invoice generated: {invoice_path}")
            else:
                print("⚠️ Invoice generation failed")
                invoice_path = None
                invoice_filename = None
                
        except Exception as e:
            print(f"❌ Error generating invoice: {e}")
            invoice_path = None
            invoice_filename = None
        
        # Send payment success email (only once!)
        print("📧 Sending payment confirmation email...")
        try:
            # Create invoice download URL if invoice was generated
            invoice_download_url = None
            if invoice_filename:
                invoice_download_url = f"http://localhost:8000/stripe/download-invoice/{invoice_filename}"
            
            # Format date in user's timezone
            user_timezone = current_user.timezone or 'UTC'
            formatted_end_date = timezone_service.format_user_datetime(
                user_timezone=user_timezone,
                utc_datetime=subscription_end,
                format_string='%B %d, %Y'
            )
            
            email_sent = email_service.send_payment_success_email(
                user_email=current_user.email,
                user_name=current_user.name or current_user.email,
                plan_name=plan_name,
                amount=amount,
                invoice_id=invoice_id,
                subscription_end_date=formatted_end_date,
                invoice_download_url=invoice_download_url,
                invoice_pdf_path=invoice_path,
                user_timezone=user_timezone
            )
            
            if email_sent:
                print(f"✅ Payment confirmation email sent to {current_user.email}")
            else:
                print(f"⚠️ Failed to send confirmation email to {current_user.email}")
                
        except Exception as e:
            print(f"❌ Error sending email: {e}")
        
        return {
            "status": "success", 
            "old_plan": old_plan,
            "new_plan": current_user.plan.value,
            "subscription_id": subscription_id,
            "subscription_end_date": subscription_end.isoformat(),
            "days_until_expiry": (subscription_end - now).days,
            "user_email": current_user.email,
            "invoice_generated": invoice_filename is not None,
            "invoice_filename": invoice_filename,
            "email_sent": True,  # Simplified for now
            "invoice_data": invoice_generator.get_invoice_data(
                user_name=current_user.name or current_user.email,
                user_email=current_user.email,
                plan_name=plan_name,
                amount=amount,
                subscription_id=subscription_id,
                subscription_start_date=subscription_start.strftime('%B %d, %Y'),
                subscription_end_date=subscription_end.strftime('%B %d, %Y')
            )
        }
        
    except stripe.error.StripeError as e:
        print(f"❌ Stripe error: {str(e)}")
        
        # Send payment failure email
        try:
            email_service.send_payment_failure_email(
                user_email=current_user.email,
                user_name=current_user.name or current_user.email,
                plan_name="Subscription",
                amount="N/A",
                error_message=str(e)
            )
            print(f"📧 Payment failure email sent to {current_user.email}")
        except Exception as email_error:
            print(f"❌ Error sending failure email: {email_error}")
        
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        print(f"❌ Error manually updating plan: {str(e)}")
        import traceback
        print(f"❌ Full traceback: {traceback.format_exc()}")
        
        # Send payment failure email for unexpected errors
        try:
            email_service.send_payment_failure_email(
                user_email=current_user.email,
                user_name=current_user.name or current_user.email,
                plan_name="Subscription",
                amount="N/A",
                error_message="Unexpected error during payment processing"
            )
            print(f"📧 Payment failure email sent to {current_user.email}")
        except Exception as email_error:
            print(f"❌ Error sending failure email: {email_error}")
        
        raise HTTPException(status_code=500, detail=f"Failed to update plan: {str(e)}")

@router.get("/subscription-status")
async def get_subscription_status(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's subscription status"""
    try:
        now = datetime.now(timezone.utc)
        
        if not current_user.stripe_customer_id:
            return {
                "has_subscription": False,
                "plan": current_user.plan.value,
                "status": "no_customer",
                "subscription_end_date": None,
                "days_until_expiry": None,
                "is_expired": False
            }
        
        # Check if we have local subscription data
        if current_user.subscription_end_date:
            days_until_expiry = (current_user.subscription_end_date - now).days
            is_expired = current_user.subscription_end_date < now
            
            # If expired, check if we should downgrade
            if is_expired and current_user.plan != UserPlan.FREE:
                # Grace period check (optional)
                GRACE_PERIOD_DAYS = 3
                days_since_expiry = abs(days_until_expiry)
                
                if days_since_expiry > GRACE_PERIOD_DAYS:
                    # Downgrade to free
                    old_plan = current_user.plan.value
                    current_user.plan = UserPlan.FREE
                    current_user.subscription_status = "expired"
                    current_user.stripe_subscription_id = None
                    current_user.subscription_end_date = None
                    current_user.last_payment_check = now
                    
                    db.commit()
                    
                    return {
                        "has_subscription": False,
                        "plan": current_user.plan.value,
                        "status": "downgraded_expired",
                        "old_plan": old_plan,
                        "days_since_expiry": days_since_expiry,
                        "is_expired": True
                    }
            
            return {
                "has_subscription": bool(current_user.stripe_subscription_id),
                "plan": current_user.plan.value,
                "status": current_user.subscription_status or "unknown",
                "subscription_end_date": current_user.subscription_end_date.isoformat(),
                "days_until_expiry": days_until_expiry,
                "is_expired": is_expired,
                "subscription_id": current_user.stripe_subscription_id
            }
        else:
            return {
                "has_subscription": False,
                "plan": current_user.plan.value,
                "status": "no_subscription_data",
                "subscription_end_date": None,
                "days_until_expiry": None,
                "is_expired": False
            }
            
    except Exception as e:
        print(f"❌ Subscription status error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get subscription status: {str(e)}"
        )

@router.post("/sync-subscription-status")
async def sync_subscription_status(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Manually sync subscription status from Stripe (no webhooks)"""
    try:
        if not current_user.stripe_customer_id:
            return {"status": "no_customer", "plan": current_user.plan.value}
        
        print(f"🔄 Syncing subscription status for: {current_user.email}")
        
        # Get all subscriptions for the customer
        subscriptions = stripe.Subscription.list(
            customer=current_user.stripe_customer_id,
            limit=10
        )
        
        print(f"🔍 Found {len(subscriptions.data)} subscription(s)")
        
        now = datetime.now(timezone.utc)
        active_subscription = None
        
        # Find the most recent active subscription
        for subscription in subscriptions.data:
            print(f"  - {subscription.id}: {subscription.status}")
            if subscription.status in ["active", "trialing"]:
                active_subscription = subscription
                break
        
        if active_subscription:
            # Update user based on active subscription - handle both object and dict access
            try:
                # Try object-style access first
                price_id = active_subscription.items.data[0].price.id
                print(f"🔍 Active subscription price_id (object): {price_id}")
            except (AttributeError, IndexError):
                try:
                    # Fallback to dictionary-style access
                    price_id = active_subscription['items']['data'][0]['price']['id']
                    print(f"🔍 Active subscription price_id (dict): {price_id}")
                except (KeyError, IndexError, TypeError):
                    print("❌ Could not get price_id from active subscription")
                    raise HTTPException(
                        status_code=400, 
                        detail="Could not get subscription details"
                    )
            
            # Get subscription end date safely
            try:
                # Try object-style access first
                subscription_end = datetime.fromtimestamp(active_subscription.current_period_end, timezone.utc)
            except (AttributeError, TypeError):
                try:
                    # Fallback to dictionary-style access
                    subscription_end = datetime.fromtimestamp(active_subscription['current_period_end'], timezone.utc)
                except (KeyError, TypeError):
                    subscription_end = now + timedelta(days=30)
                    print("⚠️ Using fallback subscription end date")
            
            old_plan = current_user.plan.value
            
            # Update plan
            if price_id == os.getenv("STRIPE_PRICE_ID_STANDARD"):
                current_user.plan = UserPlan.STANDARD
            elif price_id == os.getenv("STRIPE_PRICE_ID_PRO"):
                current_user.plan = UserPlan.PRO
            
            current_user.stripe_subscription_id = active_subscription.id
            current_user.subscription_status = active_subscription.status
            current_user.subscription_end_date = subscription_end
            current_user.last_payment_check = now
            current_user.updated_at = now
            
            db.commit()
            
            print(f"✅ Synced: {old_plan} -> {current_user.plan.value}")
            
            return {
                "status": "synced",
                "subscription_status": active_subscription.status,
                "plan": current_user.plan.value,
                "old_plan": old_plan,
                "subscription_end_date": subscription_end.isoformat(),
                "days_until_expiry": (subscription_end - now).days
            }
        else:
            # No active subscription found - downgrade if needed
            old_plan = current_user.plan.value
            
            if current_user.plan != UserPlan.FREE:
                current_user.plan = UserPlan.FREE
                current_user.subscription_status = "inactive"
                current_user.stripe_subscription_id = None
                current_user.subscription_end_date = None
                current_user.last_payment_check = now
                current_user.updated_at = now
                
                db.commit()
                
                print(f"⬇️ Downgraded: {old_plan} -> FREE")
                
                return {
                    "status": "downgraded_to_free",
                    "old_plan": old_plan,
                    "plan": current_user.plan.value
                }
            else:
                return {
                    "status": "already_free",
                    "plan": current_user.plan.value
                }
            
    except Exception as e:
        print(f"❌ Error syncing subscription status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync subscription status: {str(e)}"
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

@router.post("/cancel-subscription")
async def cancel_subscription(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Cancel user's subscription (no webhooks - manual update)"""
    try:
        print(f"🚫 Cancel subscription request from user: {current_user.email}")
        print(f"📋 Current user plan: {current_user.plan.value}")
        print(f"🔍 Stripe customer ID: {current_user.stripe_customer_id}")
        print(f"🔍 Stripe subscription ID: {current_user.stripe_subscription_id}")
        
        # If user has a paid plan but no Stripe IDs, suggest syncing first
        if current_user.plan != UserPlan.FREE and not current_user.stripe_customer_id:
            print("⚠️ User has paid plan but no Stripe customer ID")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No Stripe customer found. Please try syncing your subscription first by contacting support."
            )
        
        if not current_user.stripe_subscription_id:
            print("❌ No stripe_subscription_id found")
            
            # If they have a customer ID, try to find their subscription
            if current_user.stripe_customer_id:
                print("🔍 Attempting to find subscription for existing customer...")
                try:
                    subscriptions = stripe.Subscription.list(
                        customer=current_user.stripe_customer_id,
                        status='active',
                        limit=1
                    )
                    
                    if subscriptions.data:
                        subscription = subscriptions.data[0]
                        print(f"✅ Found active subscription: {subscription.id}")
                        
                        # Update the user's subscription ID
                        current_user.stripe_subscription_id = subscription.id
                        current_user.subscription_status = subscription.status
                        db.commit()
                        
                        print("✅ Updated user with found subscription ID")
                    else:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="No active subscription found in Stripe"
                        )
                except stripe.error.StripeError as e:
                    print(f"❌ Error finding subscription: {e}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Could not locate your subscription. Please contact support."
                    )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No active subscription found"
                )
        
        print(f"📡 Calling Stripe to cancel subscription: {current_user.stripe_subscription_id}")
        
        # Cancel subscription at period end
        subscription = stripe.Subscription.modify(
            current_user.stripe_subscription_id,
            cancel_at_period_end=True
        )
        
        print(f"✅ Stripe subscription modified successfully")
        print(f"📋 New subscription status: {subscription.status}")
        print(f"📋 Cancel at period end: {subscription.cancel_at_period_end}")
        
        # Update user status locally
        current_user.subscription_status = "cancel_at_period_end"
        current_user.last_payment_check = datetime.now(timezone.utc)
        current_user.updated_at = datetime.now(timezone.utc)
        
        db.commit()
        print(f"✅ Database updated successfully")
        
        return {
            "status": "success",
            "message": "Subscription will be cancelled at the end of the current period",
            "subscription_end_date": current_user.subscription_end_date.isoformat() if current_user.subscription_end_date else None,
            "days_remaining": (current_user.subscription_end_date - datetime.now(timezone.utc)).days if current_user.subscription_end_date else None
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except stripe.error.StripeError as e:
        print(f"❌ Stripe error cancelling subscription: {str(e)}")
        print(f"❌ Stripe error type: {type(e).__name__}")
        print(f"❌ Stripe error code: {getattr(e, 'code', 'N/A')}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Stripe error: {str(e)}"
        )
    except Exception as e:
        print(f"❌ Unexpected error cancelling subscription: {str(e)}")
        print(f"❌ Error type: {type(e).__name__}")
        import traceback
        print(f"❌ Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Failed to cancel subscription: {str(e)}"
        )

@router.get("/subscription-health")
async def get_subscription_health(
    current_user: User = Depends(get_current_active_user)
):
    """Get comprehensive subscription health status"""
    try:
        now = datetime.now(timezone.utc)
        health_status = {
            "user_id": str(current_user.id),
            "email": current_user.email,
            "current_plan": current_user.plan.value,
            "subscription_status": current_user.subscription_status,
            "has_stripe_customer": bool(current_user.stripe_customer_id),
            "has_active_subscription": bool(current_user.stripe_subscription_id),
            "last_check": current_user.last_payment_check.isoformat() if current_user.last_payment_check else None
        }
        
        if current_user.subscription_end_date:
            days_until_expiry = (current_user.subscription_end_date - now).days
            health_status.update({
                "subscription_end_date": current_user.subscription_end_date.isoformat(),
                "days_until_expiry": days_until_expiry,
                "is_expired": days_until_expiry < 0,
                "expires_soon": 0 <= days_until_expiry <= 7,  # Expires within a week
                "needs_attention": days_until_expiry <= 3 or current_user.subscription_status in ["past_due", "payment_failed"]
            })
        else:
            health_status.update({
                "subscription_end_date": None,
                "days_until_expiry": None,
                "is_expired": False,
                "expires_soon": False,
                "needs_attention": current_user.plan != UserPlan.FREE and not current_user.stripe_subscription_id
            })
        
        return health_status
        
    except Exception as e:
        print(f"❌ Error getting subscription health: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get subscription health: {str(e)}"
        )

@router.post("/fix-missing-stripe-data")
async def fix_missing_stripe_data(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Fix users who have paid plans but missing Stripe customer/subscription data"""
    try:
        print(f"🔧 Fixing missing Stripe data for user: {current_user.email}")
        print(f"📋 Current plan: {current_user.plan.value}")
        print(f"🔍 Stripe customer ID: {current_user.stripe_customer_id}")
        print(f"🔍 Stripe subscription ID: {current_user.stripe_subscription_id}")
        
        if current_user.plan == UserPlan.FREE:
            return {"status": "no_action_needed", "message": "User is on free plan"}
        
        # First, try to find a Stripe customer by email
        if not current_user.stripe_customer_id:
            print("🔍 Searching for Stripe customer by email...")
            try:
                customers = stripe.Customer.list(email=current_user.email, limit=10)
                
                if customers.data:
                    customer = customers.data[0]  # Take the first match
                    print(f"✅ Found Stripe customer: {customer.id}")
                    
                    current_user.stripe_customer_id = customer.id
                    db.commit()
                    print("✅ Updated user with found customer ID")
                else:
                    print("⚠️ No Stripe customer found by email")
                    # For now, just downgrade them to free
                    old_plan = current_user.plan.value
                    current_user.plan = UserPlan.FREE
                    current_user.subscription_status = None
                    current_user.stripe_subscription_id = None
                    current_user.subscription_end_date = None
                    db.commit()
                    
                    return {
                        "status": "downgraded_to_free",
                        "message": f"No Stripe customer found. Downgraded from {old_plan} to free",
                        "old_plan": old_plan,
                        "new_plan": "free"
                    }
                    
            except stripe.error.StripeError as e:
                print(f"❌ Error searching for customer: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error searching for Stripe customer: {str(e)}"
                )
        
        # Now try to find an active subscription
        if not current_user.stripe_subscription_id and current_user.stripe_customer_id:
            print("🔍 Searching for active subscription...")
            try:
                subscriptions = stripe.Subscription.list(
                    customer=current_user.stripe_customer_id,
                    status='active',
                    limit=10
                )
                
                if subscriptions.data:
                    subscription = subscriptions.data[0]
                    print(f"✅ Found active subscription: {subscription.id}")
                    
                    # Get subscription details
                    price_id = subscription.items.data[0].price.id
                    subscription_end = datetime.fromtimestamp(subscription.current_period_end, timezone.utc)
                    
                    # Update user with subscription data
                    current_user.stripe_subscription_id = subscription.id
                    current_user.subscription_status = subscription.status
                    current_user.subscription_end_date = subscription_end
                    current_user.last_payment_check = datetime.now(timezone.utc)
                    
                    # Verify the plan matches the price
                    old_plan = current_user.plan.value
                    if price_id == os.getenv("STRIPE_PRICE_ID_STANDARD"):
                        current_user.plan = UserPlan.STANDARD
                    elif price_id == os.getenv("STRIPE_PRICE_ID_PRO"):
                        current_user.plan = UserPlan.PRO
                    
                    db.commit()
                    
                    print(f"✅ Fixed user subscription data")
                    
                    return {
                        "status": "fixed",
                        "message": "Successfully synced Stripe data",
                        "customer_id": current_user.stripe_customer_id,
                        "subscription_id": current_user.stripe_subscription_id,
                        "old_plan": old_plan,
                        "current_plan": current_user.plan.value,
                        "subscription_end_date": subscription_end.isoformat(),
                        "days_until_expiry": (subscription_end - datetime.now(timezone.utc)).days
                    }
                else:
                    print("⚠️ No active subscription found")
                    # Downgrade to free
                    old_plan = current_user.plan.value
                    current_user.plan = UserPlan.FREE
                    current_user.subscription_status = "no_active_subscription"
                    current_user.stripe_subscription_id = None
                    current_user.subscription_end_date = None
                    db.commit()
                    
                    return {
                        "status": "downgraded_to_free",
                        "message": f"No active subscription found. Downgraded from {old_plan} to free",
                        "old_plan": old_plan,
                        "new_plan": "free"
                    }
                    
            except stripe.error.StripeError as e:
                print(f"❌ Error searching for subscription: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error searching for subscription: {str(e)}"
                )
        
        return {
            "status": "already_synced",
            "message": "User already has complete Stripe data",
            "customer_id": current_user.stripe_customer_id,
            "subscription_id": current_user.stripe_subscription_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fixing Stripe data: {str(e)}")
        import traceback
        print(f"❌ Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fix Stripe data: {str(e)}"
        )

@router.get("/download-invoice/{invoice_filename}")
async def download_invoice(
    invoice_filename: str,
    current_user: User = Depends(get_current_active_user)
):
    """Download invoice PDF"""
    try:
        # Security: Only allow downloading invoices for the current user
        # In a production system, you'd want to store invoice-user relationships in the database
        
        invoice_path = os.path.join(invoice_generator.invoices_dir, invoice_filename)
        
        if not os.path.exists(invoice_path):
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Additional security check - make sure filename is safe
        if not invoice_filename.startswith('invoice_') or not invoice_filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Invalid invoice filename")
        
        return FileResponse(
            path=invoice_path,
            filename=invoice_filename,
            media_type='application/pdf'
        )
        
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Invoice file not found")
    except Exception as e:
        print(f"❌ Error downloading invoice: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to download invoice"
        )

@router.get("/invoice-data/{session_id}")
async def get_invoice_data(
    session_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get invoice data for display"""
    try:
        # Retrieve the checkout session from Stripe
        session = stripe.checkout.Session.retrieve(session_id)
        
        if session.customer != current_user.stripe_customer_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        if session.payment_status != 'paid':
            raise HTTPException(status_code=400, detail="Payment not completed")
        
        # Get subscription details
        subscription_id = session.subscription
        if subscription_id:
            subscription = stripe.Subscription.retrieve(subscription_id)
            price_id = subscription.items.data[0].price.id
            
            # Determine plan and amount
            plan_name = ""
            amount = ""
            
            if price_id == os.getenv("STRIPE_PRICE_ID_STANDARD"):
                plan_name = "Standard"
                amount = "$3.99"
            elif price_id == os.getenv("STRIPE_PRICE_ID_PRO"):
                plan_name = "Pro"
                amount = "$7.99"
            
            subscription_start = datetime.fromtimestamp(subscription.current_period_start, timezone.utc)
            subscription_end = datetime.fromtimestamp(subscription.current_period_end, timezone.utc)
            
            invoice_data = invoice_generator.get_invoice_data(
                user_name=current_user.name or current_user.email,
                user_email=current_user.email,
                plan_name=plan_name,
                amount=amount,
                subscription_id=subscription_id,
                subscription_start_date=subscription_start.strftime('%B %d, %Y'),
                subscription_end_date=subscription_end.strftime('%B %d, %Y'),
                payment_intent_id=getattr(session, 'payment_intent', None)
            )
            
            return invoice_data
        else:
            raise HTTPException(status_code=400, detail="No subscription found")
            
    except stripe.error.StripeError as e:
        print(f"❌ Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        print(f"❌ Error getting invoice data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get invoice data"
        )