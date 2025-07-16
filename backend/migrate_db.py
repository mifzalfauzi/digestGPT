#!/usr/bin/env python3
"""
Database migration script to update schema to match current models.
"""

from sqlalchemy import text
from database import engine, SessionLocal
from models import Base

def check_and_update_schema():
    """Check current schema and update if needed"""
    
    with engine.connect() as conn:
        # Check if subscription_plans table exists and what columns it has
        try:
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'subscription_plans' 
                ORDER BY ordinal_position;
            """))
            current_columns = [row[0] for row in result]
            print(f"Current subscription_plans columns: {current_columns}")
            
            # Check if token_limit column exists
            if 'token_limit' not in current_columns:
                print("Adding missing token_limit column...")
                conn.execute(text("""
                    ALTER TABLE subscription_plans 
                    ADD COLUMN token_limit INTEGER;
                """))
                conn.commit()
                print("✅ Added token_limit column")
            else:
                print("✅ token_limit column already exists")
                
        except Exception as e:
            print(f"Error checking subscription_plans: {e}")
        
        # Check User table updates
        try:
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                ORDER BY ordinal_position;
            """))
            user_columns = [row[0] for row in result]
            print(f"Current users columns: {user_columns}")
            
            # Add missing columns to users table
            missing_user_columns = []
            
            if 'password_hash' not in user_columns:
                missing_user_columns.append("ADD COLUMN password_hash VARCHAR")
                
            if 'plan' not in user_columns:
                missing_user_columns.append("ADD COLUMN plan VARCHAR DEFAULT 'free'")
                
            if 'is_active' not in user_columns:
                missing_user_columns.append("ADD COLUMN is_active BOOLEAN DEFAULT TRUE")
            
            if missing_user_columns:
                print("Adding missing user columns...")
                for column_stmt in missing_user_columns:
                    conn.execute(text(f"ALTER TABLE users {column_stmt};"))
                conn.commit()
                print("✅ Updated users table")
            else:
                print("✅ Users table up to date")
                
        except Exception as e:
            print(f"Error checking users table: {e}")
        
        # Check Document table updates
        try:
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'documents' 
                ORDER BY ordinal_position;
            """))
            doc_columns = [row[0] for row in result]
            print(f"Current documents columns: {doc_columns}")
            
            # Add missing columns to documents table
            missing_doc_columns = []
            
            if 'document_text' not in doc_columns:
                missing_doc_columns.append("ADD COLUMN document_text TEXT")
                
            if 'key_points' not in doc_columns:
                missing_doc_columns.append("ADD COLUMN key_points TEXT")
                
            if 'risk_flags' not in doc_columns:
                missing_doc_columns.append("ADD COLUMN risk_flags TEXT")
                
            if 'word_count' not in doc_columns:
                missing_doc_columns.append("ADD COLUMN word_count INTEGER")
                
            if 'analysis_method' not in doc_columns:
                missing_doc_columns.append("ADD COLUMN analysis_method VARCHAR")
            
            if missing_doc_columns:
                print("Adding missing document columns...")
                for column_stmt in missing_doc_columns:
                    conn.execute(text(f"ALTER TABLE documents {column_stmt};"))
                conn.commit()
                print("✅ Updated documents table")
            else:
                print("✅ Documents table up to date")
                
        except Exception as e:
            print(f"Error checking documents table: {e}")

def create_all_tables():
    """Create any missing tables"""
    try:
        print("Creating any missing tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created/updated")
    except Exception as e:
        print(f"Error creating tables: {e}")

if __name__ == "__main__":
    print("🔄 Migrating database schema...")
    check_and_update_schema()
    create_all_tables()
    print("✨ Migration complete!") 