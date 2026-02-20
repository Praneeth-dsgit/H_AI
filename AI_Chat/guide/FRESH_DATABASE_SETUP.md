# Fresh Database Setup Guide

This guide will help you set up a completely fresh database for the MedChat application.

## ⚠️ WARNING

**This will DELETE all existing databases and data!** Make sure you have backups if needed.

## Prerequisites

1. ✅ MySQL Server installed and running
2. ✅ Python 3.8+ installed
3. ✅ All Python dependencies installed (`pip install -r requirements.txt`)
4. ✅ Access to MySQL root user (or user with CREATE/DROP privileges)

## Step 1: Configure Environment Variables

1. Navigate to the API directory:
   ```bash
   cd AI_Chat/api
   ```

2. Create or update `.env` file:
   ```env
   # MySQL Database Configuration
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_USER=root
   MYSQL_PASSWORD=your_mysql_password_here
   MYSQL_DATABASE=medchat_db

   # OpenAI API (required for AI features)
   OPENAI_API_KEY=your_openai_api_key_here

   # CORS Origins (for frontend)
   CORS_ORIGINS=http://localhost:3000,http://localhost:5173
   ```

   **Important:** Replace `your_mysql_password_here` with your actual MySQL root password.

## Step 2: Run Fresh Database Setup

Execute the fresh setup script:

```bash
cd AI_Chat/api
python fresh_database_setup.py
```

### What the script does:

1. **Drops existing databases** (`medchat_db`, `hospital_db`, `hosptal_db`)
   - Asks for confirmation before deletion
   - Only drops databases that exist

2. **Creates fresh database** (`medchat_db`)
   - Uses UTF8MB4 character set
   - Unicode collation

3. **Creates all tables** from migration file
   - 14+ tables with proper relationships
   - Indexes and foreign keys
   - Views for common queries

4. **Inserts default data**
   - Medical specialties (Cardiology, Orthopedics, etc.)
   - Other default data as needed

5. **Tests connection**
   - Verifies database is accessible
   - Checks table structure

6. **Verifies setup**
   - Confirms all required tables exist
   - Validates schema

### Expected Output:

```
============================================================
🚀 FRESH DATABASE SETUP FOR MEDCHAT
============================================================
📊 Target Database: medchat_db
🔌 MySQL Host: localhost:3306
👤 MySQL User: root
============================================================
⚠️  WARNING: This will DELETE existing databases!
============================================================

1️⃣ Dropping existing databases...
📋 Checking for existing databases...
   Found: medchat_db
   Found: hospital_db

⚠️  WARNING: About to DROP 2 database(s):
   - medchat_db
   - hospital_db

❓ Are you sure you want to delete these databases? (yes/no): yes

🗑️  Dropping databases...
   ✅ Dropped: medchat_db
   ✅ Dropped: hospital_db
✅ Database cleanup completed

2️⃣ Creating fresh database...
✅ Database 'medchat_db' created successfully

3️⃣ Creating tables...
📝 Executing 50+ SQL statements...
✅ Executed 50+ statements successfully
✅ All tables created successfully

4️⃣ Inserting default data...
✅ Default specialties found (10 specialties)
   Examples: General Medicine, Cardiology, Orthopedics

5️⃣ Testing database connection...
✅ Database connection test successful
✅ Found 14 tables
✅ Patients table has 20 columns
✅ Patient ID column confirmed

6️⃣ Verifying setup...
✅ All required tables present (14 total)

============================================================
🎉 FRESH DATABASE SETUP COMPLETED SUCCESSFULLY!
============================================================
✅ Database 'medchat_db' is ready
✅ All tables created
✅ Default data inserted
✅ Connection tested

📝 Next steps:
   1. Make sure your .env file has:
      MYSQL_DATABASE=medchat_db
   2. Restart your Flask application
   3. Test the patient portal
============================================================
```

## Step 3: Verify Database Setup

### Option A: Using MySQL Command Line

```bash
mysql -u root -p medchat_db
```

Then run:
```sql
-- List all tables
SHOW TABLES;

-- Check patients table structure
DESCRIBE patients;

-- Check if specialties were inserted
SELECT * FROM specialties;

-- Check database name
SELECT DATABASE();
```

### Option B: Using Python

```python
import pymysql
from dotenv import load_dotenv
import os

load_dotenv()

connection = pymysql.connect(
    host=os.getenv('MYSQL_HOST', 'localhost'),
    port=int(os.getenv('MYSQL_PORT', '3306')),
    user=os.getenv('MYSQL_USER', 'root'),
    password=os.getenv('MYSQL_PASSWORD', ''),
    database=os.getenv('MYSQL_DATABASE', 'medchat_db'),
    charset='utf8mb4'
)

with connection.cursor() as cursor:
    cursor.execute("SHOW TABLES")
    tables = cursor.fetchall()
    print(f"Tables: {[t[0] for t in tables]}")

connection.close()
```

## Step 4: Restart Flask Application

After database setup, restart your Flask application:

```bash
cd AI_Chat/api
python app.py
```

## Database Schema Overview

The fresh database includes:

### Core Tables:
- ✅ `users` - User authentication
- ✅ `patients` - Patient records (with unique `patient_id`)
- ✅ `family_members` - Family member profiles
- ✅ `specialties` - Medical specialties
- ✅ `doctors` - Doctor information
- ✅ `facilities` - Healthcare facilities
- ✅ `doctor_facilities` - Doctor-facility relationships
- ✅ `appointments` - Appointment bookings
- ✅ `radiology_bookings` - Radiology scan bookings
- ✅ `medical_records` - Medical records
- ✅ `billing` - Billing information
- ✅ `payments` - Payment records
- ✅ `ai_chat_history` - AI chat history
- ✅ `admissions` - Hospital admissions

### Views:
- `v_patient_user` - Patient with user info
- `v_doctor_specialty` - Doctor with specialty
- `v_upcoming_appointments` - Upcoming appointments

## Troubleshooting

### Error: "Access denied for user"
- Check MySQL username and password in `.env`
- Verify MySQL user has CREATE/DROP privileges

### Error: "Database already exists"
- The script will drop it if you confirm
- Or manually drop: `DROP DATABASE medchat_db;`

### Error: "Table already exists"
- The migration uses `CREATE TABLE IF NOT EXISTS`, so this shouldn't happen
- If it does, the script will continue

### Error: "Connection refused"
- Check MySQL is running: `sudo service mysql start` (Linux) or check MySQL service (Windows)
- Verify host and port in `.env`

## Alternative: Manual Setup

If you prefer to set up manually:

```sql
-- 1. Drop existing databases
DROP DATABASE IF EXISTS medchat_db;
DROP DATABASE IF EXISTS hospital_db;
DROP DATABASE IF EXISTS hosptal_db;

-- 2. Create fresh database
CREATE DATABASE medchat_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. Use the database
USE medchat_db;

-- 4. Run migration file
SOURCE AI_Chat/api/migrations/001_create_optimized_schema.sql;
```

## Next Steps

After database setup:

1. ✅ Test patient portal login/signup
2. ✅ Verify patient_id is generated correctly
3. ✅ Test API endpoints (`/api/patient/profile`, etc.)
4. ✅ Check that specialties are available
5. ✅ Test appointment booking (if applicable)

## Support

If you encounter issues:
1. Check Flask logs: `AI_Chat/api/app.log`
2. Check MySQL error logs
3. Verify `.env` file configuration
4. Ensure MySQL server is running

