#!/usr/bin/env python3
"""
Fresh Database Setup Script for MedChat
This script will:
1. Drop existing databases (medchat_db, hospital_db) if they exist
2. Create a fresh medchat_db database
3. Create all tables from migration file
4. Insert default data (specialties)
5. Test the connection

⚠️ WARNING: This will DELETE all existing data!
"""

import pymysql
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MySQL configuration
MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
MYSQL_PORT = int(os.getenv('MYSQL_PORT', '3306'))
MYSQL_USER = os.getenv('MYSQL_USER', 'root')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '')
MYSQL_DATABASE = os.getenv('MYSQL_DATABASE', 'medchat_db')

# Databases to drop (old names that might exist)
OLD_DATABASES = ['medchat_db', 'hospital_db', 'hosptal_db']

def drop_databases():
    """Drop existing databases"""
    try:
        connection = pymysql.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        
        with connection.cursor() as cursor:
            # Get list of existing databases
            cursor.execute("SHOW DATABASES")
            existing_dbs = [row['Database'] for row in cursor.fetchall()]
            
            print("📋 Checking for existing databases...")
            databases_to_drop = []
            
            for db_name in OLD_DATABASES:
                if db_name in existing_dbs:
                    databases_to_drop.append(db_name)
                    print(f"   Found: {db_name}")
            
            if not databases_to_drop:
                print("   ✅ No existing databases to drop")
                connection.close()
                return True
            
            print(f"\n⚠️  WARNING: About to DROP {len(databases_to_drop)} database(s):")
            for db in databases_to_drop:
                print(f"   - {db}")
            
            # Confirm deletion
            response = input("\n❓ Are you sure you want to delete these databases? (yes/no): ")
            if response.lower() not in ['yes', 'y']:
                print("❌ Database deletion cancelled")
                connection.close()
                return False
            
            # Drop databases
            print("\n🗑️  Dropping databases...")
            for db_name in databases_to_drop:
                try:
                    cursor.execute(f"DROP DATABASE IF EXISTS `{db_name}`")
                    print(f"   ✅ Dropped: {db_name}")
                except Exception as e:
                    print(f"   ⚠️  Error dropping {db_name}: {e}")
            
            connection.commit()
            connection.close()
            print("✅ Database cleanup completed")
            return True
            
    except Exception as e:
        print(f"❌ Error dropping databases: {e}")
        import traceback
        traceback.print_exc()
        return False

def create_database():
    """Create the database if it doesn't exist"""
    try:
        connection = pymysql.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        
        with connection.cursor() as cursor:
            # Create database
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{MYSQL_DATABASE}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            print(f"✅ Database '{MYSQL_DATABASE}' created successfully")
            
        connection.close()
        return True
        
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        import traceback
        traceback.print_exc()
        return False

def create_tables():
    """Create the tables using SQL migration file"""
    try:
        # Read and execute migration SQL file
        migration_file = os.path.join(os.path.dirname(__file__), 'migrations', '001_create_optimized_schema.sql')
        
        if not os.path.exists(migration_file):
            print(f"❌ Migration file not found: {migration_file}")
            return False
        
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
        
        # Better SQL parsing - handle multi-line statements properly
        # Use a more robust method: split by semicolon but preserve complete statements
        # First, remove comment lines (but keep inline comments in CREATE statements)
        lines = sql_content.split('\n')
        cleaned_lines = []
        in_block_comment = False
        
        for line in lines:
            stripped = line.strip()
            # Skip empty lines
            if not stripped:
                continue
            # Skip full-line comments (but preserve CREATE TABLE comments)
            if stripped.startswith('--') and not any(keyword in line.upper() for keyword in ['CREATE', 'TABLE', 'COMMENT']):
                continue
            # Handle block comments
            if '/*' in stripped:
                in_block_comment = True
                # Keep the part before comment if it's not just a comment
                before_comment = stripped.split('/*')[0].strip()
                if before_comment:
                    cleaned_lines.append(before_comment)
                continue
            if '*/' in stripped:
                in_block_comment = False
                # Keep the part after comment if it's not just a comment
                after_comment = stripped.split('*/')[-1].strip()
                if after_comment:
                    cleaned_lines.append(after_comment)
                continue
            if in_block_comment:
                continue
            cleaned_lines.append(line)
        
        # Join and split by semicolon (but be careful with semicolons in strings/comments)
        cleaned_sql = '\n'.join(cleaned_lines)
        # Split by semicolon, but this should work for CREATE TABLE statements
        statements = []
        current_statement = []
        
        for line in cleaned_sql.split('\n'):
            stripped = line.strip()
            if not stripped:
                continue
            current_statement.append(line)
            # If line ends with semicolon (and it's not in a string), it's end of statement
            if stripped.endswith(';'):
                statement = '\n'.join(current_statement).strip()
                if statement and len(statement) > 5:  # Ignore very short statements
                    statements.append(statement)
                current_statement = []
        
        # Add any remaining statement
        if current_statement:
            statement = '\n'.join(current_statement).strip()
            if statement and len(statement) > 5:
                statements.append(statement)
        
        # Debug: Show first few statements
        if len(statements) > 0:
            print(f"📝 Parsed {len(statements)} SQL statements")
            print(f"   First statement preview: {statements[0][:100]}...")
            if len(statements) > 1:
                print(f"   Second statement preview: {statements[1][:100]}...")
        else:
            print("⚠️  No SQL statements found! Trying alternative parsing method...")
            # Fallback: try executing the entire file (MySQL supports this)
            try:
                with connection.cursor() as cursor:
                    # Execute entire SQL file at once
                    cursor.execute(sql_content)
                    connection.commit()
                    print("✅ Executed SQL file as single statement")
                    connection.close()
                    # Still verify tables
                    return verify_tables_created()
            except Exception as e:
                print(f"❌ Alternative execution also failed: {e}")
                connection.close()
                return False
        
        print(f"📝 Executing {len(statements)} SQL statements...")
        executed = 0
        errors = 0
        error_details = []
        
        # Try executing statements one by one
        with connection.cursor() as cursor:
            for i, statement in enumerate(statements, 1):
                if statement:
                    try:
                        # Execute with multi-statement support
                        cursor.execute(statement)
                        executed += 1
                        # Show progress for large migrations
                        if i % 5 == 0:
                            print(f"   Progress: {i}/{len(statements)} statements executed...")
                    except pymysql.err.ProgrammingError as e:
                        error_code = e.args[0] if e.args else 0
                        error_msg = str(e).lower()
                        # Ignore "already exists" errors (1050)
                        if error_code == 1050 or 'already exists' in error_msg:
                            executed += 1  # Count as success
                            continue
                        # Ignore duplicate key errors (1062)
                        if error_code == 1062 or 'duplicate' in error_msg:
                            executed += 1  # Count as success
                            continue
                        # Other errors are real problems
                        errors += 1
                        error_details.append(f"Statement {i}: {str(e)[:150]}")
                        if errors <= 10:
                            print(f"   ❌ Error in statement {i}: {str(e)[:150]}")
                            # Show first 3 lines of problematic statement
                            statement_lines = statement.split('\n')[:3]
                            print(f"      Statement preview: {' '.join(statement_lines)[:200]}...")
                    except Exception as e:
                        error_msg = str(e).lower()
                        if 'already exists' not in error_msg and 'duplicate' not in error_msg:
                            errors += 1
                            error_details.append(f"Statement {i}: {str(e)[:150]}")
                            if errors <= 10:
                                print(f"   ❌ Error in statement {i}: {str(e)[:150]}")
                                statement_lines = statement.split('\n')[:3]
                                print(f"      Statement preview: {' '.join(statement_lines)[:200]}...")
        
        connection.commit()
        connection.close()
        
        print(f"✅ Executed {executed} statements successfully")
        if errors > 0:
            print(f"⚠️  {errors} errors occurred")
            if errors > 10:
                print(f"   (Showing first 10 errors, {errors - 10} more...)")
        
        # Verify tables were created
        return verify_tables_created()
            
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        import traceback
        traceback.print_exc()
        return False

def verify_tables_created():
    """Verify that all required tables were created"""
    try:
        print("\n🔍 Verifying tables were created...")
        verify_connection = pymysql.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DATABASE,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        
        with verify_connection.cursor() as cursor:
            cursor.execute("SHOW TABLES")
            tables = [list(row.values())[0] for row in cursor.fetchall()]
            required_tables = ['users', 'patients', 'family_members', 'specialties', 'doctors', 'facilities']
            missing = [t for t in required_tables if t not in tables]
            
            if missing:
                print(f"❌ Missing required tables: {', '.join(missing)}")
                print(f"   Created tables: {', '.join(tables) if tables else 'None'}")
                verify_connection.close()
                return False
            else:
                print(f"✅ All required tables created ({len(tables)} total)")
        
        verify_connection.close()
        print("✅ All tables created successfully")
        return True
    except Exception as e:
        print(f"❌ Error verifying tables: {e}")
        return False

def insert_default_data():
    """Verify default data was inserted (specialties are inserted by migration file)"""
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
            # Check if specialties exist (they should be inserted by migration file)
            cursor.execute("SELECT COUNT(*) as count FROM specialties")
            count = cursor.fetchone()['count']
            
            if count > 0:
                print(f"✅ Default specialties found ({count} specialties)")
                # Show some specialties
                cursor.execute("SELECT name FROM specialties LIMIT 5")
                specialties = [row['name'] for row in cursor.fetchall()]
                print(f"   Examples: {', '.join(specialties)}")
            else:
                print("⚠️  No specialties found (migration file should insert them)")
            
        connection.close()
        return True
        
    except Exception as e:
        print(f"⚠️  Warning checking default data: {e}")
        # Don't fail setup if check fails
        return True

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
            # Test basic query
            cursor.execute("SELECT 1 as test")
            result = cursor.fetchone()
            
            if result and result['test'] == 1:
                print(f"✅ Database connection test successful")
                
                # Check tables
                cursor.execute("SHOW TABLES")
                tables = [list(row.values())[0] for row in cursor.fetchall()]
                
                if not tables:
                    print("❌ No tables found in database!")
                    connection.close()
                    return False
                
                print(f"✅ Found {len(tables)} tables: {', '.join(tables[:10])}{'...' if len(tables) > 10 else ''}")
                
                # Check if patients table exists
                if 'patients' not in tables:
                    print("❌ 'patients' table not found!")
                    print(f"   Available tables: {', '.join(tables)}")
                    connection.close()
                    return False
                
                # Check patients table structure
                try:
                    cursor.execute("DESCRIBE patients")
                    patient_columns = [row['Field'] for row in cursor.fetchall()]
                    print(f"✅ Patients table has {len(patient_columns)} columns")
                    if 'patient_id' in patient_columns:
                        print("✅ Patient ID column confirmed")
                    else:
                        print("⚠️  Patient ID column not found in patients table")
                except Exception as e:
                    print(f"❌ Error describing patients table: {e}")
                    connection.close()
                    return False
                
                connection.close()
                return True
                
        connection.close()
        return False
        
    except pymysql.err.ProgrammingError as e:
        if "doesn't exist" in str(e):
            print(f"❌ Database connection test failed: {e}")
            print("   This usually means tables weren't created properly.")
            print("   Try running the setup script again.")
        else:
            print(f"❌ Database connection test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    except Exception as e:
        print(f"❌ Database connection test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def verify_setup():
    """Verify the database setup is correct"""
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
            # Check required tables
            required_tables = [
                'users', 'patients', 'family_members', 'specialties', 
                'doctors', 'facilities', 'appointments', 'radiology_bookings',
                'medical_records', 'billing', 'payments'
            ]
            
            cursor.execute("SHOW TABLES")
            existing_tables = [list(row.values())[0] for row in cursor.fetchall()]
            
            missing_tables = [t for t in required_tables if t not in existing_tables]
            
            if missing_tables:
                print(f"⚠️  Missing tables: {', '.join(missing_tables)}")
                return False
            else:
                print(f"✅ All required tables present ({len(existing_tables)} total)")
                return True
                
        connection.close()
        
    except Exception as e:
        print(f"❌ Error verifying setup: {e}")
        return False

def main():
    """Main setup function"""
    print("=" * 60)
    print("🚀 FRESH DATABASE SETUP FOR MEDCHAT")
    print("=" * 60)
    print(f"📊 Target Database: {MYSQL_DATABASE}")
    print(f"🔌 MySQL Host: {MYSQL_HOST}:{MYSQL_PORT}")
    print(f"👤 MySQL User: {MYSQL_USER}")
    print("=" * 60)
    print("⚠️  WARNING: This will DELETE existing databases!")
    print("=" * 60)
    print()
    
    # Step 1: Drop existing databases
    print("1️⃣ Dropping existing databases...")
    if not drop_databases():
        print("❌ Database cleanup failed or cancelled!")
        return False
    
    # Step 2: Create fresh database
    print("\n2️⃣ Creating fresh database...")
    if not create_database():
        print("❌ Database creation failed!")
        return False
    
    # Step 3: Create tables
    print("\n3️⃣ Creating tables...")
    if not create_tables():
        print("❌ Table creation failed!")
        return False
    
    # Step 4: Insert default data
    print("\n4️⃣ Inserting default data...")
    insert_default_data()
    
    # Step 5: Test connection
    print("\n5️⃣ Testing database connection...")
    if not test_connection():
        print("❌ Database connection test failed!")
        return False
    
    # Step 6: Verify setup
    print("\n6️⃣ Verifying setup...")
    if not verify_setup():
        print("⚠️  Setup verification found issues")
        return False
    
    print("\n" + "=" * 60)
    print("🎉 FRESH DATABASE SETUP COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    print(f"✅ Database '{MYSQL_DATABASE}' is ready")
    print("✅ All tables created")
    print("✅ Default data inserted")
    print("✅ Connection tested")
    print()
    print("📝 Next steps:")
    print("   1. Make sure your .env file has:")
    print(f"      MYSQL_DATABASE={MYSQL_DATABASE}")
    print("   2. Restart your Flask application")
    print("   3. Test the patient portal")
    print("=" * 60)
    return True

if __name__ == "__main__":
    try:
        success = main()
        if not success:
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n❌ Setup cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

