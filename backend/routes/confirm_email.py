from itsdangerous import URLSafeTimedSerializer
from dotenv import load_dotenv
import os

load_dotenv()

serializer = URLSafeTimedSerializer(os.getenv("SECRET_KEY"))

def generate_confirmation_token(email):
    return serializer.dumps(email, salt="email-confirm-salt")

def confirm_token(token, expiration=3600):
    try:
        email = serializer.loads(token, salt="email-confirm-salt", max_age=expiration)
    except:
        return False
    return email
