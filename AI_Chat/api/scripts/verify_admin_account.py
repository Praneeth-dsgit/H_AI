"""
Script to verify an admin account
Run this script to verify an existing admin user account.

Usage:
    python scripts/verify_admin_account.py <email>
    
Example:
    python scripts/verify_admin_account.py admin@hospital.com
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import db, app


def verify_admin_account(email: str):
    """Verify an admin user account"""
    with app.app_context():
        try:
            # Check if user exists
            user_result = db.session.execute(
                db.text("SELECT id, email, role, is_verified FROM users WHERE email = :email"),
                {"email": email}
            ).fetchone()
            
            if not user_result:
                print(f"❌ User with email {email} not found")
                return False
            
            user_id = user_result[0]
            current_role = user_result[2] if len(user_result) > 2 else None
            current_verified = user_result[3] if len(user_result) > 3 else False
            
            # Check if user is admin
            if current_role and current_role.lower() != 'admin':
                print(f"⚠️  User {email} is not an admin (current role: {current_role})")
                response = input("Do you want to set this user as admin and verify? (y/n): ")
                if response.lower() != 'y':
                    return False
                # Update role to admin
                db.session.execute(
                    db.text("UPDATE users SET role = 'admin', is_verified = TRUE, updated_at = NOW() WHERE id = :user_id"),
                    {"user_id": user_id}
                )
            else:
                # Just verify the account
                db.session.execute(
                    db.text("UPDATE users SET is_verified = TRUE, updated_at = NOW() WHERE id = :user_id"),
                    {"user_id": user_id}
                )
            
            db.session.commit()
            
            if current_verified:
                print(f"✅ Admin account {email} is already verified")
            else:
                print(f"✅ Admin account {email} has been verified successfully")
            
            print(f"\n📋 Account Details:")
            print(f"   Email: {email}")
            print(f"   Role: admin")
            print(f"   Verified: TRUE")
            print(f"\n🔗 Login URL: http://localhost:5173/login")
            print(f"🔗 Admin Dashboard URL: http://localhost:5173/admin/dashboard")
            
            return True
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error verifying admin account: {e}")
            import traceback
            traceback.print_exc()
            return False


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python scripts/verify_admin_account.py <email>")
        print("Example: python scripts/verify_admin_account.py admin@hospital.com")
        sys.exit(1)
    
    email = sys.argv[1]
    success = verify_admin_account(email)
    sys.exit(0 if success else 1)

