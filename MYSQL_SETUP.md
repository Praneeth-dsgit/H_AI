# MySQL Database Setup for MedChat

This guide will help you configure MedChat to use your local MySQL database instead of SQLite.

## Prerequisites

- ✅ MySQL Server installed and running on your local machine
- ✅ MySQL root access or a dedicated user account
- ✅ Python environment with pip

## Step-by-Step Setup

### 1. Install Required Dependencies

First, install the new MySQL dependencies:

```bash
cd api
pip install PyMySQL==1.1.0 cryptography==41.0.3
```

Or install all dependencies:
```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the `api` directory with your MySQL configuration:

```bash
cd api
cp env_example.txt .env
```

Edit the `.env` file with your actual MySQL credentials:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# MySQL Database Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_root_password
MYSQL_DATABASE=medchat_db

# Email Configuration (for OTP)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_email_app_password

# Flask Configuration
FLASK_ENV=development
SECRET_KEY=your_secret_key_here
```

### 3. Create MySQL Database and Tables

Run the automated setup script:

```bash
cd api
python setup_database.py
```

This script will:
- ✅ Create the `medchat_db` database (if it doesn't exist)
- ✅ Test the database connection
- ✅ Create all required tables (users table with proper schema)

### 4. Manual Database Creation (Alternative)

If you prefer to create the database manually:

```sql
-- Connect to MySQL as root
mysql -u root -p

-- Create the database
CREATE DATABASE medchat_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create a dedicated user (optional but recommended)
CREATE USER 'medchat_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON medchat_db.* TO 'medchat_user'@'localhost';
FLUSH PRIVILEGES;

-- Exit MySQL
exit;
```

If you create a dedicated user, update your `.env` file:
```env
MYSQL_USER=medchat_user
MYSQL_PASSWORD=your_secure_password
```

### 5. Verify Setup

Test your configuration:

```bash
cd api
python -c "from app import app, db; 
with app.app_context(): 
    db.create_all(); 
    print('✅ Database connection successful!')"
```

### 6. Start the Application

```bash
cd api
python app.py
```

## Database Schema

The MySQL setup includes an enhanced User table:

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    otp VARCHAR(6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    otp_expiry INT,
    INDEX idx_email (email)
);
```

## Benefits of MySQL over SQLite

### 🚀 **Performance**
- Better concurrent access handling
- Optimized for multiple connections
- Advanced indexing capabilities

### 🔒 **Security**
- User-based access control
- Network security options
- Advanced authentication methods

### 📈 **Scalability**
- Handles larger datasets efficiently
- Better memory management
- Production-ready architecture

### 🛠 **Features**
- ACID compliance
- Transaction support
- Backup and replication tools

## Troubleshooting

### Connection Issues

**Error**: `pymysql.err.OperationalError: (2003, "Can't connect to MySQL server")`

**Solutions**:
1. Ensure MySQL server is running:
   ```bash
   # Windows
   net start mysql
   
   # macOS (with Homebrew)
   brew services start mysql
   
   # Linux
   sudo systemctl start mysql
   ```

2. Check MySQL port (default 3306):
   ```bash
   netstat -an | grep 3306
   ```

3. Verify credentials:
   ```bash
   mysql -u root -p
   ```

### Authentication Issues

**Error**: `pymysql.err.OperationalError: (1045, "Access denied for user 'root'@'localhost'")`

**Solutions**:
1. Reset MySQL root password
2. Check user permissions
3. Update `.env` file with correct credentials

### Database Creation Issues

**Error**: `pymysql.err.ProgrammingError: (1007, "Can't create database 'medchat_db'; database exists")`

**Solution**: This is normal - the database already exists and the script handles this gracefully.

## Migration from SQLite

If you have existing SQLite data:

1. **Export SQLite data**:
   ```bash
   sqlite3 instance/users.db .dump > users_backup.sql
   ```

2. **Import to MySQL** (manual process):
   - Convert SQLite SQL syntax to MySQL
   - Import user data manually
   - Verify data integrity

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MYSQL_HOST` | MySQL server hostname | `localhost` | No |
| `MYSQL_PORT` | MySQL server port | `3306` | No |
| `MYSQL_USER` | MySQL username | `root` | No |
| `MYSQL_PASSWORD` | MySQL password | `` | **Yes** |
| `MYSQL_DATABASE` | Database name | `medchat_db` | No |

## Security Recommendations

### 🔐 **Production Setup**
1. Create a dedicated MySQL user for MedChat
2. Use strong passwords
3. Limit user privileges to the specific database
4. Enable SSL connections
5. Configure firewall rules

### 📝 **Example Production User**
```sql
CREATE USER 'medchat_prod'@'localhost' IDENTIFIED BY 'very_secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON medchat_db.* TO 'medchat_prod'@'localhost';
FLUSH PRIVILEGES;
```

## Backup Strategy

### Daily Backup Script
```bash
#!/bin/bash
mysqldump -u root -p medchat_db > "medchat_backup_$(date +%Y%m%d).sql"
```

### Automated Backup
```bash
# Add to crontab for daily backup at 2 AM
0 2 * * * /path/to/backup_script.sh
```

---

## ✅ **Setup Complete!**

Your MedChat application is now configured to use MySQL for robust, production-ready user data storage. The enhanced database setup provides better performance, security, and scalability for your healthcare chatbot application.

For any issues, check the troubleshooting section or refer to the MySQL documentation. 