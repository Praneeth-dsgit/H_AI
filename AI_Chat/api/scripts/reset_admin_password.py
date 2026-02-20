"""
Script to reset admin user password
Usage: python scripts/reset_admin_password.py <email> <new_password>
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import db, app
from werkzeug.security import generate_password_hash, check_password_hash

def reset_admin_password(email: str, new_password: str):
    """Reset admin user password"""
    with app.app_context():
        try:
            # Check if user exists
            user_result = db.session.execute(
                db.text("SELECT id, email, password_hash, role FROM users WHERE email = :email"),
                {"email": email}
            ).fetchone()
            
            if not user_result:
                print(f"❌ User with email {email} not found")
                return False
            
            user_id, user_email, old_hash, role = user_result
            print(f"✅ Found user: {user_email} (ID: {user_id}, Role: {role})")
            
            # Generate new password hash
            new_password_hash = generate_password_hash(new_password)
            
            # Update password
            db.session.execute(
                db.text("UPDATE users SET password_hash = :password_hash WHERE id = :user_id"),
                {"password_hash": new_password_hash, "user_id": user_id}
            )
            db.session.commit()
            
            # Verify the new password
            verify_result = db.session.execute(
                db.text("SELECT password_hash FROM users WHERE id = :user_id"),
                {"user_id": user_id}
            ).fetchone()
            
            if verify_result and check_password_hash(verify_result[0], new_password):
                print(f"✅ Password reset successful for {email}")
                print(f"\n📋 Updated credentials:")
                print(f"   Email: {email}")
                print(f"   Password: {new_password}")
                print(f"   Role: {role}")
                return True
            else:
                print(f"❌ Password verification failed after reset")
                return False
                
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error resetting password: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python reset_admin_password.py <email> <new_password>")
        print("\nExample:")
        print("  python reset_admin_password.py admin@hospital.com admin123")
        sys.exit(1)
    
    email = sys.argv[1]
    password = sys.argv[2]
    
    print(f"Resetting password for: {email}")
    success = reset_admin_password(email, password)
    
    if success:
        print(f"\n🔗 Login URL: http://localhost:5173/login/admin")
        print(f"🔗 Dashboard URL: http://localhost:5173/admin/dashboard")
    else:
        sys.exit(1)

