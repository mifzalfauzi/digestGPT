import requests
import pytz
from datetime import datetime, timezone
from typing import Optional, Tuple
import logging
import time

logger = logging.getLogger(__name__)

class TimezoneService:
    def __init__(self):
        self.default_timezone = 'UTC'
        self.fallback_timezone = 'America/New_York'  # Reasonable fallback
        
    def get_user_timezone_from_ip(self, ip_address: str) -> Optional[str]:
        """Get user timezone from IP address using multiple services"""
        if not ip_address or ip_address == '127.0.0.1' or ip_address.startswith('192.168.'):
            # For local/development environments, detect system timezone
            logger.info("🏠 Local development detected, using system timezone")
            return self.get_system_timezone()
            
        # Try multiple services for reliability
        services = [
            self._get_timezone_from_ipapi,
            self._get_timezone_from_worldtimeapi,
        ]
        
        for service in services:
            try:
                timezone_name = service(ip_address)
                if timezone_name and self._is_valid_timezone(timezone_name):
                    logger.info(f"✅ Got timezone {timezone_name} for IP {ip_address}")
                    return timezone_name
            except Exception as e:
                logger.warning(f"⚠️ Timezone service failed: {e}")
                continue
        
        logger.warning(f"⚠️ Could not determine timezone for IP {ip_address}, using system timezone")
        return self.get_system_timezone()
    
    def _get_timezone_from_ipapi(self, ip_address: str) -> Optional[str]:
        """Get timezone from ip-api.com (free, no key required)"""
        try:
            url = f"http://ip-api.com/json/{ip_address}?fields=timezone"
            response = requests.get(url, timeout=5)
            response.raise_for_status()
            data = response.json()
            return data.get('timezone')
        except Exception as e:
            logger.warning(f"ip-api service failed: {e}")
            return None
    
    def _get_timezone_from_worldtimeapi(self, ip_address: str) -> Optional[str]:
        """Get timezone from worldtimeapi.org (backup service)"""
        try:
            url = f"http://worldtimeapi.org/api/ip/{ip_address}"
            response = requests.get(url, timeout=5)
            response.raise_for_status()
            data = response.json()
            return data.get('timezone')
        except Exception as e:
            logger.warning(f"worldtimeapi service failed: {e}")
            return None
    
    def _is_valid_timezone(self, timezone_name: str) -> bool:
        """Check if timezone name is valid"""
        try:
            pytz.timezone(timezone_name)
            return True
        except pytz.exceptions.UnknownTimeZoneError:
            return False
    
    def get_system_timezone(self) -> str:
        """Detect the system's timezone for local development"""
        try:
            # Method 1: Try to get system timezone name directly
            import time
            import os
            
            # On Windows, try to get timezone from environment
            if os.name == 'nt':  # Windows
                import subprocess
                try:
                    # Get timezone using Windows command
                    result = subprocess.run(['powershell', '-Command', '(Get-TimeZone).Id'], 
                                          capture_output=True, text=True, timeout=5)
                    if result.returncode == 0:
                        windows_tz = result.stdout.strip()
                        # Convert Windows timezone to IANA timezone
                        windows_to_iana = {
                            'Eastern Standard Time': 'America/New_York',
                            'Central Standard Time': 'America/Chicago', 
                            'Mountain Standard Time': 'America/Denver',
                            'Pacific Standard Time': 'America/Los_Angeles',
                            'GMT Standard Time': 'Europe/London',
                            'Central European Standard Time': 'Europe/Berlin',
                            'Tokyo Standard Time': 'Asia/Tokyo',
                            'China Standard Time': 'Asia/Shanghai',
                            'Singapore Standard Time': 'Asia/Kuala_Lumpur',
                            'Malay Peninsula Standard Time': 'Asia/Kuala_Lumpur',
                            'India Standard Time': 'Asia/Kolkata',
                        }
                        iana_tz = windows_to_iana.get(windows_tz)
                        if iana_tz and self._is_valid_timezone(iana_tz):
                            logger.info(f"🕰️ Detected Windows timezone: {windows_tz} -> {iana_tz}")
                            return iana_tz
                except Exception as e:
                    logger.warning(f"Windows timezone detection failed: {e}")
            
            # Method 2: Try to detect timezone from UTC offset
            utc_offset_seconds = -time.timezone
            utc_offset_hours = utc_offset_seconds / 3600
            
            # Map common UTC offsets to timezones (prioritize Kuala Lumpur for +8)
            offset_to_timezone = {
                -8: 'America/Los_Angeles',  # PST/PDT
                -7: 'America/Denver',       # MST/MDT  
                -6: 'America/Chicago',      # CST/CDT
                -5: 'America/New_York',     # EST/EDT
                0: 'Europe/London',         # GMT/BST
                1: 'Europe/Berlin',         # CET/CEST
                8: 'Asia/Kuala_Lumpur',     # Malaysia Standard Time (default for +8)
                8.1: 'Asia/Shanghai',       # China Standard Time (alternative for +8)
                9: 'Asia/Tokyo',            # JST
                5.5: 'Asia/Kolkata',        # IST
            }
            
            detected_tz = offset_to_timezone.get(utc_offset_hours)
            if detected_tz and self._is_valid_timezone(detected_tz):
                logger.info(f"🕰️ Detected timezone from UTC offset {utc_offset_hours}: {detected_tz}")
                return detected_tz
                
            logger.warning(f"⚠️ Could not map UTC offset {utc_offset_hours} to timezone, using fallback")
            return self.fallback_timezone
            
        except Exception as e:
            logger.error(f"❌ System timezone detection failed: {e}")
            return self.fallback_timezone
    
    def get_user_datetime(self, user_timezone: str = None, utc_datetime: datetime = None) -> datetime:
        """Convert UTC datetime to user's timezone"""
        if utc_datetime is None:
            utc_datetime = datetime.now(timezone.utc)
        
        if user_timezone is None:
            user_timezone = self.default_timezone
        
        try:
            user_tz = pytz.timezone(user_timezone)
            if utc_datetime.tzinfo is None:
                # Assume it's UTC if no timezone info
                utc_datetime = utc_datetime.replace(tzinfo=timezone.utc)
            
            return utc_datetime.astimezone(user_tz)
        except Exception as e:
            logger.error(f"Error converting timezone: {e}")
            return utc_datetime
    
    def format_user_datetime(self, user_timezone: str = None, utc_datetime: datetime = None, format_string: str = '%B %d, %Y at %I:%M %p') -> str:
        """Format datetime in user's timezone"""
        user_dt = self.get_user_datetime(user_timezone, utc_datetime)
        return user_dt.strftime(format_string)
    
    def get_utc_datetime(self) -> datetime:
        """Get current UTC datetime (for database storage)"""
        return datetime.now(timezone.utc)
    
    def parse_user_datetime(self, user_datetime_str: str, user_timezone: str, format_string: str = '%Y-%m-%d %H:%M:%S') -> datetime:
        """Parse user datetime string and convert to UTC for database storage"""
        try:
            user_tz = pytz.timezone(user_timezone)
            # Parse as naive datetime first
            naive_dt = datetime.strptime(user_datetime_str, format_string)
            # Localize to user timezone
            user_dt = user_tz.localize(naive_dt)
            # Convert to UTC
            return user_dt.astimezone(timezone.utc)
        except Exception as e:
            logger.error(f"Error parsing user datetime: {e}")
            return datetime.now(timezone.utc)

# Global timezone service instance
timezone_service = TimezoneService()