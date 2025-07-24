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
    """Create the tables using Flask-SQLAlchemy"""
    try:
        # Import app after database creation
        from app import app, db
        
        with app.app_context():
            # Create all tables
            db.create_all()
            print("✅ All tables created successfully")
            return True
            
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
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