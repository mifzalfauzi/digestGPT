"""
Database migration to add timezone and last_ip_address fields to users table
Run this script to update your existing database
"""

import os
import psycopg2
from datetime import datetime

# Database connection details
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:digestextadmin180621@db.vlijwmcpzkrzbjmntbsx.supabase.co:5432/postgres?sslmode=require")

def run_migration():
    try:
        # Parse DATABASE_URL to extract connection parameters
        url = DATABASE_URL.replace("postgresql+psycopg2://", "")
        if "?" in url:
            url, params = url.split("?")
        
        user_pass, host_port_db = url.split("@")
        user, password = user_pass.split(":")
        host_port, database = host_port_db.rsplit("/", 1)
        host, port = host_port.split(":")
        
        # Connect to PostgreSQL
        conn = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=user,
            password=password,
            sslmode="require"
        )
        
        cursor = conn.cursor()
        
        print("🔄 Starting timezone migration...")
        
        # Check if columns already exist
        cursor.execute("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name IN ('timezone', 'last_ip_address');
        """)
        
        existing_columns = [row[0] for row in cursor.fetchall()]
        
        # Add timezone column if it doesn't exist
        if 'timezone' not in existing_columns:
            print("➕ Adding timezone column...")
            cursor.execute("""
                ALTER TABLE users ADD COLUMN timezone VARCHAR DEFAULT 'UTC';
            """)
            print("✅ Added timezone column")
        else:
            print("⏭️ Timezone column already exists")
        
        # Add last_ip_address column if it doesn't exist
        if 'last_ip_address' not in existing_columns:
            print("➕ Adding last_ip_address column...")
            cursor.execute("""
                ALTER TABLE users ADD COLUMN last_ip_address VARCHAR;
            """)
            print("✅ Added last_ip_address column")
        else:
            print("⏭️ Last IP address column already exists")
        
        # Commit the changes
        conn.commit()
        
        # Update existing users to have UTC timezone if NULL
        cursor.execute("""
            UPDATE users SET timezone = 'UTC' WHERE timezone IS NULL;
        """)
        
        conn.commit()
        print("✅ Migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        if 'conn' in locals():
            conn.rollback()
    
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    run_migration()