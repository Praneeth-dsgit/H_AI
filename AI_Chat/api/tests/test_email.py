#!/usr/bin/env python3
"""
Test Email Configuration for MedChat
"""

import smtplib
import os
from email.mime.text import MIMEText
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_gmail_connection():
    """Test Gmail SMTP connection"""
    
    smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.getenv('SMTP_PORT', 587))
    smtp_user = os.getenv('SMTP_USER')
    smtp_pass = os.getenv('SMTP_PASS')
    
    print("🧪 Testing Gmail Configuration...")
    print(f"📧 Email: {smtp_user}")
    print(f"🔐 Password: {'*' * len(smtp_pass) if smtp_pass else 'NOT SET'}")
    print(f"🌐 Server: {smtp_server}:{smtp_port}")
    print("-" * 40)
    
    if not smtp_user or not smtp_pass:
        print("❌ SMTP_USER or SMTP_PASS not set in .env file")
        return False
    
    try:
        # Test connection
        print("1️⃣ Connecting to Gmail SMTP...")
        server = smtplib.SMTP(smtp_server, smtp_port)
        
        print("2️⃣ Starting TLS encryption...")
        server.starttls()
        
        print("3️⃣ Attempting login...")
        server.login(smtp_user, smtp_pass)
        
        print("4️⃣ Sending test email...")
        # Send test email to yourself
        msg = MIMEText("MedChat email configuration test successful! 🎉")
        msg['Subject'] = 'MedChat Email Test'
        msg['From'] = smtp_user
        msg['To'] = smtp_user
        
        server.sendmail(smtp_user, [smtp_user], msg.as_string())
        server.quit()
        
        print("✅ Email test successful!")
        print(f"📬 Test email sent to {smtp_user}")
        return True
        
    except Exception as e:
        print(f"❌ Email test failed: {e}")
        print("\n🔧 Common solutions:")
        print("1. Check if 2-Factor Authentication is enabled")
        print("2. Generate a new Gmail App Password")
        print("3. Remove spaces from app password")
        print("4. Make sure SMTP_USER and SMTP_PASS are set correctly")
        return False

if __name__ == "__main__":
    success = test_gmail_connection()
    if not success:
        exit(1) 