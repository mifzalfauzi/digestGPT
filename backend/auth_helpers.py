# auth_helpers.py
from fastapi import Response, Request, HTTPException, status, Depends
from sqlalchemy.orm import Session
import os
from typing import Optional
from collections import defaultdict
from datetime import datetime, timedelta

# Import your existing auth functions
from auth_backend import verify_token, create_access_token, create_refresh_token
from dependencies import get_access_token_from_cookie, get_refresh_token_from_cookie, get_db
from models import User

# Cookie configuration
ACCESS_TOKEN_COOKIE_NAME = "ACCESS_NWST"
REFRESH_TOKEN_COOKIE_NAME = "REFRESH_NWST"

# Environment-based configuration
IS_PRODUCTION = os.getenv("ENVIRONMENT", "development") == "production"
SECURE_COOKIES = IS_PRODUCTION or os.getenv("SECURE_COOKIES", "false").lower() == "true"
COOKIE_DOMAIN = os.getenv("COOKIE_DOMAIN")

print(f"🔧 === COOKIE CONFIGURATION ===")
print(f"🔧 ENVIRONMENT: {os.getenv('ENVIRONMENT', 'development')}")
print(f"🔧 IS_PRODUCTION: {IS_PRODUCTION}")
print(f"🔧 SECURE_COOKIES env: {os.getenv('SECURE_COOKIES', 'false')}")
print(f"🔧 SECURE_COOKIES final: {SECURE_COOKIES}")
print(f"🔧 COOKIE_DOMAIN: {COOKIE_DOMAIN}")
if IS_PRODUCTION:
    print(f"🔧 COOKIE MODE: Production (secure=True, samesite=lax)")
else:
    print(f"🔧 COOKIE MODE: Development (secure=False, no samesite restriction)")
print(f"🔧 ==============================")

def set_access_token_cookie(response: Response, access_token: str):
    """Set access token as HttpOnly cookie"""
    # For development, we need more permissive cookie settings
    if IS_PRODUCTION:
        response.set_cookie(
            key=ACCESS_TOKEN_COOKIE_NAME,
            value=access_token,
            httponly=True,
            max_age=60 * 60,  # 1 hour
            secure=True,
            samesite="none",
            path="/"
        )
    else:
        # Development: No SameSite restriction to allow cross-port cookies
        response.set_cookie(
            key=ACCESS_TOKEN_COOKIE_NAME,
            value=access_token,
            httponly=True,
            max_age=60 * 60,  # 1 hour
            secure=False,
            samesite="lax",
            path="/"
        )

def set_refresh_token_cookie(response: Response, refresh_token: str):
    """Set refresh token as HttpOnly cookie"""
    # For development, we need more permissive cookie settings
    if IS_PRODUCTION:
        response.set_cookie(
            key=REFRESH_TOKEN_COOKIE_NAME,
            value=refresh_token,
            httponly=True,
            max_age=30 * 24 * 60 * 60,  # 30 days
            secure=True,
            samesite="none",
            path="/"
        )
    else:
        # Development: No SameSite restriction to allow cross-port cookies
        response.set_cookie(
            key=REFRESH_TOKEN_COOKIE_NAME,
            value=refresh_token,
            httponly=True,
            max_age=30 * 24 * 60 * 60,  # 30 days
            secure=False,
            samesite="lax",
            path="/"
        )



# def clear_access_token_cookie(response: Response):
#     """Clear access token cookie"""
#     response.delete_cookie(
#         key=ACCESS_TOKEN_COOKIE_NAME,
#         httponly=True,
#         secure=SECURE_COOKIES,
#         samesite="lax",
#         path="/",
#         domain=COOKIE_DOMAIN
#     )

# def clear_refresh_token_cookie(response: Response):
#     """Clear refresh token cookie"""
#     response.delete_cookie(
#         key=REFRESH_TOKEN_COOKIE_NAME,
#         httponly=True,
#         secure=SECURE_COOKIES,
#         samesite="lax",
#         path="/",
#         domain=COOKIE_DOMAIN
#     )


def clear_all_auth_cookies(response: Response):
    """Clear all authentication cookies"""
    if IS_PRODUCTION:
        response.delete_cookie(
            key=ACCESS_TOKEN_COOKIE_NAME,
            httponly=True,
            secure=True,
            samesite="none",
            path="/"
        )
        response.delete_cookie(
            key=REFRESH_TOKEN_COOKIE_NAME,
            httponly=True,
            secure=True,
            samesite="none",
            path="/"
        )
    else:
        # Development: Match the permissive settings used when setting cookies
        response.delete_cookie(
            key=ACCESS_TOKEN_COOKIE_NAME,
            httponly=True,
            secure=False,
            samesite="lax",
            path="/"
        )
        response.delete_cookie(
            key=REFRESH_TOKEN_COOKIE_NAME,
            httponly=True,
            secure=False,
            samesite="lax",
            path="/"
        )

# Enhanced dependency that works with auto-refresh middleware
async def get_current_user_with_auto_refresh(request: Request, db: Session = Depends(get_db)) -> User:
    """
    Enhanced dependency that works with auto-refresh middleware.
    Provides better error messages when auto-refresh fails.
    """
    try:
        access_token = get_access_token_from_cookie(request)
        
        if not access_token:
            # Check if refresh token exists to provide better error message
            refresh_token = get_refresh_token_from_cookie(request)
            if refresh_token:
                # This means auto-refresh failed
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Session expired. Please log in again."
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
        
        # Verify access token
        payload = verify_token(access_token, token_type="access")
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        
        # Get user from database
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user"
            )
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error in get_current_user_with_auto_refresh: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication error"
        )

# Rate limiting for refresh attempts
class RefreshRateLimiter:
    """Simple in-memory rate limiter for refresh attempts."""
    def __init__(self, max_attempts: int = 5, window_minutes: int = 15):
        self.max_attempts = max_attempts
        self.window = timedelta(minutes=window_minutes)
        self.attempts = defaultdict(list)
    
    def is_allowed(self, identifier: str) -> bool:
        """Check if refresh attempt is allowed for this identifier"""
        now = datetime.utcnow()
        
        # Clean old attempts
        self.attempts[identifier] = [
            attempt_time for attempt_time in self.attempts[identifier]
            if now - attempt_time < self.window
        ]
        
        # Check if under limit
        if len(self.attempts[identifier]) >= self.max_attempts:
            return False
        
        # Record this attempt
        self.attempts[identifier].append(now)
        return True

# Global rate limiter instance
refresh_rate_limiter = RefreshRateLimiter()