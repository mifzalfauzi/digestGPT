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
print(f"🔧 ==============================")

def set_access_token_cookie(response: Response, access_token: str):
    """Set access token as HttpOnly cookie with debug output"""
    print(f"🍪 === SETTING ACCESS TOKEN COOKIE ===")
    print(f"🍪 Cookie name: {ACCESS_TOKEN_COOKIE_NAME}")
    print(f"🍪 Token length: {len(access_token)}")
    print(f"🍪 Token preview: {access_token[:30]}...")
    print(f"🍪 Secure setting: {SECURE_COOKIES}")
    print(f"🍪 Domain setting: {COOKIE_DOMAIN}")
    print(f"🍪 Max age: {1 * 60} seconds")
    
    try:
        response.set_cookie(
            key=ACCESS_TOKEN_COOKIE_NAME,
            value=access_token,
            httponly=True,
            max_age=1 * 60,  # 15 minutes
            secure=SECURE_COOKIES,  # Should be False for localhost
            samesite="lax",
            path="/",
            domain=COOKIE_DOMAIN  # Should be None for localhost
        )
        print(f"✅ ACCESS TOKEN COOKIE SET SUCCESSFULLY")
        print(f"✅ Cookie should be: {ACCESS_TOKEN_COOKIE_NAME}={access_token[:20]}...")
        
    except Exception as e:
        print(f"❌ ERROR SETTING ACCESS TOKEN COOKIE: {e}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")

def set_refresh_token_cookie(response: Response, refresh_token: str):
    """Set refresh token as HttpOnly cookie with debug output"""
    print(f"🍪 === SETTING REFRESH TOKEN COOKIE ===")
    print(f"🍪 Cookie name: {REFRESH_TOKEN_COOKIE_NAME}")
    print(f"🍪 Token length: {len(refresh_token)}")
    print(f"🍪 Token preview: {refresh_token[:30]}...")
    print(f"🍪 Secure setting: {SECURE_COOKIES}")
    print(f"🍪 Domain setting: {COOKIE_DOMAIN}")
    print(f"🍪 Max age: {7 * 24 * 60 * 60} seconds")
    
    try:
        response.set_cookie(
            key=REFRESH_TOKEN_COOKIE_NAME,
            value=refresh_token,
            httponly=True,
            max_age=7 * 24 * 60 * 60,  # 7 days
            secure=SECURE_COOKIES,  # Should be False for localhost
            samesite="lax",
            path="/",
            domain=COOKIE_DOMAIN  # Should be None for localhost
        )
        print(f"✅ REFRESH TOKEN COOKIE SET SUCCESSFULLY")
        print(f"✅ Cookie should be: {REFRESH_TOKEN_COOKIE_NAME}={refresh_token[:20]}...")
        
    except Exception as e:
        print(f"❌ ERROR SETTING REFRESH TOKEN COOKIE: {e}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")

def clear_access_token_cookie(response: Response):
    """Clear access token cookie"""
    response.delete_cookie(
        key=ACCESS_TOKEN_COOKIE_NAME,
        httponly=True,
        secure=SECURE_COOKIES,
        samesite="lax",
        path="/",
        domain=COOKIE_DOMAIN
    )

def clear_refresh_token_cookie(response: Response):
    """Clear refresh token cookie"""
    response.delete_cookie(
        key=REFRESH_TOKEN_COOKIE_NAME,
        httponly=True,
        secure=SECURE_COOKIES,
        samesite="lax",
        path="/",
        domain=COOKIE_DOMAIN
    )


def clear_all_auth_cookies(response: Response):
    """Clear both access and refresh token cookies"""
    print(f"🗑️  === CLEARING ALL AUTH COOKIES ===")
    try:
        response.delete_cookie(
            key=ACCESS_TOKEN_COOKIE_NAME,
            httponly=True,
            secure=SECURE_COOKIES,
            samesite="lax",
            path="/",
            domain=COOKIE_DOMAIN
        )
        response.delete_cookie(
            key=REFRESH_TOKEN_COOKIE_NAME,
            httponly=True,
            secure=SECURE_COOKIES,
            samesite="lax",
            path="/",
            domain=COOKIE_DOMAIN
        )
        print(f"✅ ALL COOKIES CLEARED SUCCESSFULLY")
    except Exception as e:
        print(f"❌ ERROR CLEARING COOKIES: {e}")

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