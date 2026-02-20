# Quick Start Guide - Database Setup

## 🚀 Step-by-Step Setup Instructions

### Prerequisites
- ✅ MySQL Server installed and running
- ✅ Python 3.8+ installed
- ✅ All Python dependencies installed (`pip install -r requirements.txt`)

---

## Step 1: Configure Environment Variables

1. Navigate to the API directory:
   ```bash
   cd AI_Chat/api
   ```

2. Create or update `.env` file:
   ```bash
   # If .env doesn't exist, create it
   # Copy from env_example.txt if available
   ```

3. Add/Update MySQL configuration in `.env`:
   ```env
   # MySQL Database Configuration
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_USER=root
   MYSQL_PASSWORD=your_mysql_password_here
   MYSQL_DATABASE=medchat_db

   # OpenAI API (required for AI features)
   OPENAI_API_KEY=your_openai_api_key_here

   # Email Configuration (for OTP)
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_email_app_password
   ```

---

## Step 2: Run Database Setup Script

Execute the setup script:

```bash
cd AI_Chat/api
python setup_database.py
```

**Expected Output:**
```
🚀 Starting MedChat Database Setup...
📊 Target Database: medchat_db
🔌 MySQL Host: localhost:3306
👤 MySQL User: root
--------------------------------------------------
1️⃣ Creating database...
✅ Database 'medchat_db' created successfully (or already exists)

2️⃣ Testing database connection...
✅ Database connection test successful

3️⃣ Creating tables...
✅ All tables created successfully from migration file

==================================================
🎉 Database setup completed successfully!
✅ Your MedChat application is ready to use with MySQL
==================================================
```

---

## Step 3: Verify Database Schema

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

-- Verify Patient ID is primary key
SHOW INDEXES FROM patients;

-- Check if default specialties were inserted
SELECT * FROM specialties;

-- Exit MySQL
EXIT;
```

### Option B: Using Python

```bash
cd AI_Chat/api
python -c "
from app import app, db
with app.app_context():
    from sqlalchemy import inspect
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    print('✅ Tables created:', len(tables))
    for table in tables:
        print(f'  - {table}')
"
```

---

## Step 4: Test Patient ID Generation

Test that Patient ID generation works:

```bash
cd AI_Chat/api
python -c "
from utils.patient_id_generator import generate_patient_id, validate_patient_id

# Generate a Patient ID
patient_id = generate_patient_id()
print(f'Generated Patient ID: {patient_id}')

# Validate it
is_valid = validate_patient_id(patient_id)
print(f'Is valid: {is_valid}')
"
```

**Expected Output:**
```
Generated Patient ID: PAT-550e8400-e29b-41d4-a716-446655440000
Is valid: True
```

---

## Step 5: Start the Application

### Start Flask Backend

```bash
cd AI_Chat/api
python app.py
```

Or if using Flask run:
```bash
flask run --host=0.0.0.0 --port=5000
```

**Expected Output:**
```
 * Running on http://127.0.0.1:5000
 * Running on http://0.0.0.0:5000
```

### Start Frontend (in another terminal)

```bash
cd AI_Chat/frontend
npm install  # If not already installed
npm run dev
```

**Expected Output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## Step 6: Test Signup Flow

### Using cURL

```bash
# 1. Sign up
curl -X POST http://localhost:5000/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'

# 2. Check email for OTP, then verify
curl -X POST http://localhost:5000/api/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'
```

### Using Browser/Postman

1. **Sign Up**: `POST http://localhost:5000/api/signup`
   ```json
   {
     "email": "test@example.com",
     "password": "Test1234"
   }
   ```

2. **Check Email** for OTP code

3. **Verify OTP**: `POST http://localhost:5000/api/verify-otp`
   ```json
   {
     "email": "test@example.com",
     "otp": "123456"
   }
   ```

4. **Expected Response** (should include Patient ID):
   ```json
   {
     "message": "OTP verified. Account activated.",
     "patient_id": "PAT-550e8400-e29b-41d4-a716-446655440000",
     "email": "test@example.com"
   }
   ```

---

## Step 7: Verify Patient Record Created

### Using MySQL

```sql
mysql -u root -p medchat_db

SELECT 
    u.email,
    p.patient_id,
    p.first_name,
    p.last_name,
    p.created_at
FROM users u
LEFT JOIN patients p ON u.id = p.user_id
WHERE u.email = 'test@example.com';
```

### Using Python

```bash
cd AI_Chat/api
python -c "
from app import app, db
from sqlalchemy import text

with app.app_context():
    result = db.session.execute(
        text('SELECT patient_id, email FROM patients WHERE email = :email'),
        {'email': 'test@example.com'}
    ).fetchone()
    
    if result:
        print(f'✅ Patient found!')
        print(f'  Patient ID: {result[0]}')
        print(f'  Email: {result[1]}')
    else:
        print('❌ Patient not found')
"
```

---

## Troubleshooting

### Issue 1: MySQL Connection Error

**Error**: `Can't connect to MySQL server`

**Solutions**:
```bash
# Check if MySQL is running
# Windows
net start mysql

# Linux/Mac
sudo systemctl start mysql
# or
brew services start mysql
```

### Issue 2: Database Already Exists

**Error**: `Database 'medchat_db' already exists`

**Solution**: This is normal! The script handles this gracefully. Continue to next step.

### Issue 3: Table Already Exists

**Error**: `Table 'patients' already exists`

**Solutions**:
1. **Option A**: Drop existing tables (⚠️ **WARNING**: This deletes all data!)
   ```sql
   mysql -u root -p medchat_db
   DROP TABLE IF EXISTS payments, billing, ai_chat_history, medical_records, 
        radiology_bookings, appointments, doctor_facilities, facilities, 
        doctors, specialties, family_members, patients, users;
   EXIT;
   ```
   Then run `python setup_database.py` again.

2. **Option B**: Keep existing tables and manually add new ones
   - Check which tables exist
   - Run only the CREATE TABLE statements for missing tables

### Issue 4: Import Error for database_models

**Error**: `ImportError: cannot import name 'Patient' from 'database_models'`

**Solution**: This is expected! The models use a factory pattern. They'll be created when needed. The signup flow uses raw SQL to avoid this.

### Issue 5: Patient ID Not Generated

**Error**: Patient ID is NULL or not returned

**Solutions**:
1. Check that `utils/patient_id_generator.py` exists
2. Verify the import works:
   ```python
   from utils.patient_id_generator import generate_patient_id
   print(generate_patient_id())
   ```
3. Check app.log for errors

---

## Verification Checklist

- [ ] MySQL server is running
- [ ] `.env` file configured with correct MySQL credentials
- [ ] Database `medchat_db` created
- [ ] All 14 tables created successfully
- [ ] Default specialties inserted
- [ ] Patient ID generator works
- [ ] Signup endpoint works
- [ ] OTP verification works
- [ ] Patient ID generated and returned
- [ ] Patient record created in database

---

## Next Steps

Once setup is complete:

1. ✅ **Test the signup flow** - Verify Patient ID generation
2. 📝 **Read IMPLEMENTATION_GUIDE.md** - For API endpoint implementation
3. 🎨 **Build frontend components** - Patient dashboard, booking UI, etc.
4. 🔐 **Add authentication middleware** - JWT tokens, session management
5. 🧪 **Write tests** - Unit and integration tests

---

## Quick Commands Reference

```bash
# Setup database
cd AI_Chat/api && python setup_database.py

# Start backend
cd AI_Chat/api && python app.py

# Start frontend
cd AI_Chat/frontend && npm run dev

# Test Patient ID generation
cd AI_Chat/api && python -c "from utils.patient_id_generator import generate_patient_id; print(generate_patient_id())"

# Check database tables
mysql -u root -p medchat_db -e "SHOW TABLES;"

# View patients
mysql -u root -p medchat_db -e "SELECT patient_id, email, created_at FROM patients LIMIT 5;"
```

---

**Need Help?** Check the detailed documentation:
- `DATABASE_SCHEMA.md` - Complete schema documentation
- `IMPLEMENTATION_GUIDE.md` - API implementation guide
- `SCHEMA_OPTIMIZATION_SUMMARY.md` - Summary of changes

