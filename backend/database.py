import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from supabase import create_client, Client  

load_dotenv()

# Supabase
url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_KEY")

print("Supabase URL:", url)
print("Supabase Key exists:", bool(key))

# Initialize Supabase client with error handling to avoid proxy issues
supabase: Client = None
if url and key:
    try:
        supabase = create_client(url, key)
        print("Supabase client initialized successfully")
    except Exception as e:
        print(f"Warning: Could not initialize Supabase client: {e}")
        supabase = None
else:
    print("Warning: Supabase URL or key not found in environment variables")

# Postgres
USER = os.getenv("DB_USER")
PASSWORD = os.getenv("DB_PASSWORD")
HOST = os.getenv("DB_HOST")
PORT = os.getenv("DB_PORT")
DBNAME = os.getenv("DB_NAME")

DATABASE_URL = f"postgresql+psycopg2://{USER}:{PASSWORD}@{HOST}:{PORT}/{DBNAME}?sslmode=require"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

# ✅ Add this to allow import in main.py
def get_db():
    db = SessionLocal()
    try:
        print("Connecting to:", DATABASE_URL)

        yield db
    finally:
        db.close()
