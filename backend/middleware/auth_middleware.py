# middleware/auth_middleware.py
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User
from auth_backend import verify_token, create_access_token, create_refresh_token
from dependencies import get_access_token_from_cookie, get_refresh_token_from_cookie
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class AutoTokenRefreshMiddleware(BaseHTTPMiddleware):
    """
    Middleware that automatically refreshes expired access tokens using refresh tokens.
    Provides seamless authentication experience similar to ChatGPT.
    """
    
    def __init__(
        self, 
        app: ASGIApp, 
        excluded_paths: Optional[list] = None,
        access_token_cookie_name: str = "ACCESS_NWST",
        refresh_token_cookie_name: str = "REFRESH_NWST"
    ):
        super().__init__(app)
        # Paths that don't need authentication or auto-refresh
        self.excluded_paths = excluded_paths or [
            "/auth/login",
            "/auth/register", 
            "/auth/google",
            "/auth/refresh",  # Exclude explicit refresh endpoint
            "/docs",
            "/redoc",
            "/openapi.json",
            "/health",
            "/",
            "/favicon.ico"
        ]
        self.access_token_cookie_name = access_token_cookie_name
        self.refresh_token_cookie_name = refresh_token_cookie_name

    async def dispatch(self, request: Request, call_next):
        # Skip middleware for excluded paths
        if self._should_skip_middleware(request):
            return await call_next(request)
        
        # Check if we need to refresh the access token
        refresh_result = await self._attempt_token_refresh(request)
        
        if refresh_result:
            # Token was refreshed successfully
            response = await call_next(request)
            
            # Set the new tokens in cookies
            self._set_token_cookies(response, refresh_result)
            return response
        
        # No refresh needed or refresh failed, proceed normally
        return await call_next(request)

    def _should_skip_middleware(self, request: Request) -> bool:
        """Check if middleware should be skipped for this path"""
        path = request.url.path
        
        # Skip for excluded paths
        for excluded_path in self.excluded_paths:
            if path.startswith(excluded_path):
                return True
        
        # Skip for non-authenticated methods that typically don't need auth
        if request.method in ["OPTIONS"]:
            return True
            
        return False

    async def _attempt_token_refresh(self, request: Request) -> Optional[dict]:
        """
        Attempt to refresh access token if needed.
        Returns dict with new tokens if refresh was successful, None otherwise.
        """
        try:
            # Get tokens from cookies
            access_token = get_access_token_from_cookie(request)
            refresh_token = get_refresh_token_from_cookie(request)
            
            # If no refresh token, can't auto-refresh
            if not refresh_token:
                return None
            
            # Check if access token exists and is valid
            access_token_valid = False
            if access_token:
                payload = verify_token(access_token, token_type="access")
                access_token_valid = payload is not None
            
            # If access token is valid, no refresh needed
            if access_token_valid:
                return None
            
            # Access token is missing or expired, try to refresh
            logger.info("Access token expired or missing, attempting refresh")
            
            # Verify refresh token
            refresh_payload = verify_token(refresh_token, token_type="refresh")
            if not refresh_payload:
                logger.warning("Invalid refresh token during auto-refresh")
                return None
            
            user_id = refresh_payload.get("sub")
            if not user_id:
                logger.warning("No user ID in refresh token")
                return None
            
            # Get user from database
            db = SessionLocal()
            try:
                user = db.query(User).filter(User.id == user_id).first()
                if not user or not user.is_active:
                    logger.warning(f"User {user_id} not found or inactive during auto-refresh")
                    return None
                
                # Create new tokens
                new_access_token = create_access_token(data={"sub": str(user.id)})
                new_refresh_token = create_refresh_token(data={"sub": str(user.id)})
                
                print(f"New access token: {new_access_token}")
                print(f"New refresh token: {new_refresh_token}")
                
                # Update request with new access token for downstream processing
                self._update_request_with_token(request, new_access_token)
                
                logger.info(f"Successfully refreshed tokens for user {user_id}")
                
                return {
                    "access_token": new_access_token,
                    "refresh_token": new_refresh_token
                }
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error during auto token refresh: {str(e)}")
            return None

    def _update_request_with_token(self, request: Request, access_token: str):
        """Update request with new access token for downstream dependencies"""
        # Update the cookie in the request for downstream processing
        request.cookies[self.access_token_cookie_name] = access_token

    def _set_token_cookies(self, response: Response, tokens: dict):
        """Set new tokens as HttpOnly cookies"""
        # Import here to avoid circular imports
        from auth_helpers import set_access_token_cookie, set_refresh_token_cookie
        
        set_access_token_cookie(response, tokens["access_token"])
        set_refresh_token_cookie(response, tokens["refresh_token"])


# Remove the dependency function from here since it's now in auth_helpers.py