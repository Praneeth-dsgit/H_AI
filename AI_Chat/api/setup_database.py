#!/usr/bin/env python3
"""
Database Setup Script for MedChat
This script creates the MySQL database and tables for the MedChat application.
"""

import pymysql
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MySQL configuration
MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
MYSQL_PORT = int(os.getenv('MYSQL_PORT', '3306'))
MYSQL_USER = os.getenv('MYSQL_USER', 'root')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '')
MYSQL_DATABASE = os.getenv('MYSQL_DATABASE', 'medchat_db')

def create_database():
    """Create the database if it doesn't exist"""
    try:
        # Connect to MySQL server without specifying database
        connection = pymysql.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        
        with connection.cursor() as cursor:
            # Create database if it doesn't exist
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {MYSQL_DATABASE} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            print(f"✅ Database '{MYSQL_DATABASE}' created successfully (or already exists)")
            
        connection.close()
        return True
        
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        return False

def create_tables():
    """Create the tables using SQL migration file"""
    try:
        # Read and execute migration SQL file
        migration_file = os.path.join(os.path.dirname(__file__), 'migrations', '001_create_optimized_schema.sql')
        
        if not os.path.exists(migration_file):
            print(f"⚠️  Migration file not found: {migration_file}")
            print("   Falling back to Flask-SQLAlchemy table creation...")
            from app import app, db
            with app.app_context():
                db.create_all()
                print("✅ Tables created using SQLAlchemy")
            return True
        
        # Read migration SQL
        with open(migration_file, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # Connect to database
        connection = pymysql.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DATABASE,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        
        # Split SQL into individual statements and execute
        statements = [s.strip() for s in sql_content.split(';') if s.strip() and not s.strip().startswith('--')]
        
        with connection.cursor() as cursor:
            for statement in statements:
                if statement:
                    try:
                        cursor.execute(statement)
                    except Exception as e:
                        # Ignore errors for "already exists" or "duplicate key" - these are expected
                        if 'already exists' not in str(e).lower() and 'duplicate' not in str(e).lower():
                            print(f"⚠️  Warning executing statement: {e}")
        
        connection.commit()
        connection.close()
        
        print("✅ All tables created successfully from migration file")
        return True
            
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_connection():
    """Test the database connection"""
    try:
        connection = pymysql.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DATABASE,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1 as test")
            result = cursor.fetchone()
            if result and result['test'] == 1:
                print("✅ Database connection test successful")
                return True
                
        connection.close()
        
    except Exception as e:
        print(f"❌ Database connection test failed: {e}")
        return False

def main():
    """Main setup function"""
    print("🚀 Starting MedChat Database Setup...")
    print(f"📊 Target Database: {MYSQL_DATABASE}")
    print(f"🔌 MySQL Host: {MYSQL_HOST}:{MYSQL_PORT}")
    print(f"👤 MySQL User: {MYSQL_USER}")
    print("-" * 50)
    
    # Step 1: Create database
    print("1️⃣ Creating database...")
    if not create_database():
        print("❌ Database setup failed!")
        return False
    
    # Step 2: Test connection
    print("\n2️⃣ Testing database connection...")
    if not test_connection():
        print("❌ Database connection failed!")
        return False
    
    # Step 3: Create tables
    print("\n3️⃣ Creating tables...")
    if not create_tables():
        print("❌ Table creation failed!")
        return False
    
    print("\n" + "=" * 50)
    print("🎉 Database setup completed successfully!")
    print("✅ Your MedChat application is ready to use with MySQL")
    print("=" * 50)
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        exit(1) 