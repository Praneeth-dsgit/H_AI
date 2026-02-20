"""
Script to assign Employee IDs to existing admin, doctor, lab_technician, and non_medical_staff users
Run this script to retroactively assign employee IDs to users who should have them
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import db, app
from utils.employee_id_generator import generate_employee_id
from datetime import datetime

def assign_employee_ids():
    """Assign employee IDs to users who should have them but don't"""
    with app.app_context():
        try:
            # Ensure employees table exists
            try:
                db.session.execute(
                    db.text("""
                        CREATE TABLE IF NOT EXISTS employees (
                            employee_id VARCHAR(50) PRIMARY KEY COMMENT 'Globally unique Employee ID',
                            user_id INT UNIQUE,
                            first_name VARCHAR(100) NOT NULL,
                            last_name VARCHAR(100) NOT NULL,
                            role VARCHAR(50) NOT NULL COMMENT 'admin, doctor, lab_technician, non_medical_staff',
                            email VARCHAR(255),
                            phone VARCHAR(20),
                            is_active BOOLEAN DEFAULT TRUE,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                            INDEX idx_user_id (user_id),
                            INDEX idx_email (email),
                            INDEX idx_role (role),
                            INDEX idx_active (is_active)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                    """)
                )
                db.session.commit()
                print("✅ Employees table created/verified")
            except Exception as e:
                db.session.rollback()
                print(f"⚠️ Employees table already exists or error: {e}")
            
            # Find users who need employee IDs
            # 1. Users with role = 'admin', 'lab_technician', 'non_medical_staff'
            users_with_roles = db.session.execute(
                db.text("""
                    SELECT u.id, u.email, u.role
                    FROM users u
                    WHERE u.role IN ('admin', 'lab_technician', 'non_medical_staff')
                    AND NOT EXISTS (
                        SELECT 1 FROM employees e WHERE e.user_id = u.id
                    )
                """)
            ).fetchall()
            
            # 2. Doctors (users with doctor records)
            doctors = db.session.execute(
                db.text("""
                    SELECT DISTINCT u.id, u.email, 'doctor' as role
                    FROM users u
                    INNER JOIN doctors d ON u.email = d.email
                    WHERE NOT EXISTS (
                        SELECT 1 FROM employees e WHERE e.user_id = u.id
                    )
                """)
            ).fetchall()
            
            all_users = list(users_with_roles) + list(doctors)
            
            if not all_users:
                print("✅ All users already have employee IDs assigned")
                return
            
            print(f"\n📋 Found {len(all_users)} users who need employee IDs:")
            
            for user in all_users:
                user_id, email, role = user
                print(f"  - User ID {user_id} ({email}) - Role: {role}")
            
            print(f"\n🔄 Assigning employee IDs...")
            
            assigned_count = 0
            for user in all_users:
                user_id, email, role = user
                try:
                    # Generate employee ID
                    employee_id = generate_employee_id(prefix="EMP", format_type="short")
                    
                    # Get name from patient or doctor table if available
                    name_result = db.session.execute(
                        db.text("""
                            SELECT first_name, last_name, phone 
                            FROM patients WHERE user_id = :user_id
                            UNION ALL
                            SELECT first_name, last_name, phone 
                            FROM doctors WHERE email = :email
                            LIMIT 1
                        """),
                        {"user_id": user_id, "email": email}
                    ).fetchone()
                    
                    first_name = name_result[0] if name_result else ""
                    last_name = name_result[1] if name_result else ""
                    phone = name_result[2] if name_result else None
                    
                    # Insert employee record
                    db.session.execute(
                        db.text("""
                            INSERT INTO employees (employee_id, user_id, first_name, last_name, role, email, phone, is_active)
                            VALUES (:employee_id, :user_id, :first_name, :last_name, :role, :email, :phone, :is_active)
                        """),
                        {
                            'employee_id': employee_id,
                            'user_id': user_id,
                            'first_name': first_name,
                            'last_name': last_name,
                            'role': role,
                            'email': email,
                            'phone': phone,
                            'is_active': True
                        }
                    )
                    
                    assigned_count += 1
                    print(f"  ✅ Assigned {employee_id} to {email} ({role})")
                    
                except Exception as e:
                    print(f"  ❌ Error assigning employee ID to {email}: {e}")
                    db.session.rollback()
                    continue
            
            db.session.commit()
            print(f"\n✅ Successfully assigned {assigned_count} employee IDs")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
            db.session.rollback()

if __name__ == '__main__':
    print("=" * 60)
    print("Employee ID Assignment Script")
    print("=" * 60)
    assign_employee_ids()
    print("=" * 60)

