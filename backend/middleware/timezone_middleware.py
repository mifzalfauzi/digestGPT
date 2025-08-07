from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from sqlalchemy.orm import Session
from database import get_db
from models import User
from timezone_service import timezone_service
from dependencies import get_current_user_optional
import logging

logger = logging.getLogger(__name__)

class TimezoneMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Process the request first
        response = await call_next(request)
        
        # Skip timezone detection for static files, docs, etc.
        path = request.url.path
        skip_paths = ["/docs", "/openapi.json", "/static", "/favicon.ico", "/health"]
        
        # Only detect timezone for authenticated users on main endpoints
        if not any(path.startswith(skip_path) for skip_path in skip_paths):
            await self.detect_and_update_timezone(request)
        
        return response
    
    async def detect_and_update_timezone(self, request: Request):
        try:
            # Get user IP address
            client_ip = self.get_client_ip(request)
            
            # For local development, keep the local IP - the timezone service will handle it
            if not client_ip or client_ip in ['127.0.0.1', 'localhost', '::1']:
                print(f"🏠 Local development detected, timezone service will use system timezone")
                client_ip = "127.0.0.1"  # Let timezone service handle local detection
            
            # Get current user if authenticated
            db: Session = next(get_db())
            try:
                user = get_current_user_optional(request, db)
                if user and client_ip:
                    self.update_user_timezone(user, client_ip, db)
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"❌ Timezone middleware error: {e}")
    
    def get_client_ip(self, request: Request) -> str:
        # Check for forwarded IP (from load balancers, proxies)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Take the first IP if there are multiple
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            # Fallback to direct connection IP
            client_ip = request.client.host if request.client else None
        
        return client_ip
    
    def update_user_timezone(self, user: User, client_ip: str, db: Session):
        try:
            # Only update if IP has changed or timezone is not set
            if user.last_ip_address == client_ip and user.timezone and user.timezone != 'UTC':
                return
            
            print(f"🌍 Detecting timezone for user {user.email} from IP {client_ip}")
            
            # Detect timezone from IP
            detected_timezone = timezone_service.get_user_timezone_from_ip(client_ip)
            
            if detected_timezone and detected_timezone != 'UTC':
                print(f"🌍 Updating timezone for user {user.email}: {user.timezone} -> {detected_timezone}")
                user.timezone = detected_timezone
                user.last_ip_address = client_ip
                db.commit()
                print(f"✅ Timezone updated successfully")
            else:
                print(f"⚠️ No timezone detected or got UTC, keeping current: {user.timezone}")
                
        except Exception as e:
            logger.error(f"❌ Error updating user timezone: {e}")
            db.rollback()