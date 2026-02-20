"""
Admin Routes
Handles user management, role assignment, and access control for HR/Admin users.
"""
from flask import Blueprint, request, jsonify
import logging
import traceback
from datetime import datetime
from config import db
# Note: User model import removed to avoid SQLAlchemy mapper initialization issues
# Using raw SQL queries instead
from werkzeug.security import generate_password_hash

logger = logging.getLogger(__name__)

# Create blueprint
admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@admin_bp.route('/users', methods=['GET'])
def list_users():
    """List all users with their roles and status"""
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
        except Exception:
            db.session.rollback()
            pass
        
        # Check if admin (for now, we'll add proper admin check later)
        # For now, allow any authenticated user to list users
        
        # Get query parameters
        role_filter = request.args.get('role')
        search = request.args.get('search')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 50))
        
        # Build query
        query = """
            SELECT 
                u.id,
                u.email,
                u.is_verified,
                u.created_at,
                u.updated_at,
                u.last_login,
                COALESCE(u.role, 'patient') as role,
                p.patient_id,
                e.employee_id,
                d.doctor_id,
                d.specialty_id,
                s.name as specialty_name,
                CASE 
                    WHEN LOWER(TRIM(COALESCE(u.role, ''))) = 'admin' THEN 'admin'
                    WHEN LOWER(TRIM(COALESCE(u.role, ''))) = 'lab_technician' THEN 'lab_technician'
                    WHEN LOWER(TRIM(COALESCE(u.role, ''))) = 'non_medical_staff' THEN 'non_medical_staff'
                    WHEN LOWER(TRIM(COALESCE(u.role, ''))) = 'radiology' THEN 'radiology'
                    WHEN d.doctor_id IS NOT NULL THEN 'doctor'
                    WHEN p.patient_id IS NOT NULL THEN 'patient'
                    ELSE 'patient'
                END as user_role
            FROM users u
            LEFT JOIN patients p ON u.id = p.user_id
            LEFT JOIN employees e ON u.id = e.user_id
            LEFT JOIN doctors d ON u.email = d.email
            LEFT JOIN specialties s ON d.specialty_id = s.specialty_id
            WHERE u.is_verified = TRUE
        """
        
        params = {}
        
        if search:
            query += " AND (u.email LIKE :search OR p.first_name LIKE :search OR p.last_name LIKE :search)"
            params['search'] = f'%{search}%'
        
        if role_filter:
            if role_filter == 'doctor':
                query += " AND d.doctor_id IS NOT NULL AND (u.role IS NULL OR u.role != 'radiology')"
            elif role_filter == 'patient':
                query += " AND p.patient_id IS NOT NULL AND d.doctor_id IS NULL"
            elif role_filter == 'radiology':
                query += " AND LOWER(TRIM(COALESCE(u.role, ''))) = 'radiology'"
            elif role_filter == 'admin':
                query += " AND LOWER(TRIM(COALESCE(u.role, ''))) = 'admin'"
            elif role_filter in ['lab_technician', 'non_medical_staff']:
                query += " AND u.role = :role_filter"
                params['role_filter'] = role_filter
        
        query += " ORDER BY u.created_at DESC LIMIT :limit OFFSET :offset"
        params['limit'] = per_page
        params['offset'] = (page - 1) * per_page
        
        # Debug logging for admin filter
        if role_filter == 'admin':
            logger.info(f"Admin filter query: {query}")
            logger.info(f"Admin filter params: {params}")
            # Also check what admins exist in DB
            admin_check = db.session.execute(
                db.text("SELECT id, email, role, is_verified FROM users WHERE LOWER(TRIM(COALESCE(role, ''))) = 'admin'")
            ).fetchall()
            logger.info(f"Admins found in DB (all): {[(r[0], r[1], r[2], r[3]) for r in admin_check]}")
            verified_admins = db.session.execute(
                db.text("SELECT id, email, role, is_verified FROM users WHERE LOWER(TRIM(COALESCE(role, ''))) = 'admin' AND is_verified = TRUE")
            ).fetchall()
            logger.info(f"Verified admins found in DB: {[(r[0], r[1], r[2], r[3]) for r in verified_admins]}")
        
        result = db.session.execute(db.text(query), params).fetchall()
        
        # Debug logging for admin filter
        if role_filter == 'admin':
            logger.info(f"Admin filter returned {len(result)} rows")
        
        users = []
        for row in result:
            user = dict(row._mapping) if hasattr(row, '_mapping') else dict(zip(row.keys(), row))
            # Format dates
            if user.get('created_at'):
                user['created_at'] = user['created_at'].isoformat() if hasattr(user['created_at'], 'isoformat') else str(user['created_at'])
            if user.get('updated_at'):
                user['updated_at'] = user['updated_at'].isoformat() if hasattr(user['updated_at'], 'isoformat') else str(user['updated_at'])
            if user.get('last_login'):
                user['last_login'] = user['last_login'].isoformat() if hasattr(user['last_login'], 'isoformat') else str(user['last_login'])
            users.append(user)
        
        # Get total count
        count_query = """
            SELECT COUNT(*) as total
            FROM users u
            LEFT JOIN patients p ON u.id = p.user_id
            LEFT JOIN employees e ON u.id = e.user_id
            LEFT JOIN doctors d ON u.email = d.email
            WHERE u.is_verified = TRUE
        """
        count_params = {}
        
        if search:
            count_query += " AND (u.email LIKE :search OR p.first_name LIKE :search OR p.last_name LIKE :search)"
            count_params['search'] = f'%{search}%'
        
        if role_filter:
            if role_filter == 'doctor':
                count_query += " AND d.doctor_id IS NOT NULL AND (u.role IS NULL OR u.role != 'radiology')"
            elif role_filter == 'patient':
                count_query += " AND p.patient_id IS NOT NULL AND d.doctor_id IS NULL"
            elif role_filter == 'radiology':
                count_query += " AND LOWER(TRIM(COALESCE(u.role, ''))) = 'radiology'"
            elif role_filter == 'admin':
                count_query += " AND LOWER(TRIM(COALESCE(u.role, ''))) = 'admin'"
            elif role_filter in ['lab_technician', 'non_medical_staff']:
                count_query += " AND u.role = :role_filter"
                count_params['role_filter'] = role_filter
        
        total_result = db.session.execute(db.text(count_query), count_params).fetchone()
        total = total_result[0] if total_result else 0
        
        return jsonify({
            'success': True,
            'users': users,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error listing users: {e}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': f'Failed to list users: {str(e)}'
        }), 500

@admin_bp.route('/users', methods=['POST'])
def create_user():
    """
    Create a new user with role assignment
    
    Supported roles and their access:
    - patient: Patient portal access
    - doctor: Doctor access (General or Radiology based on specialty_id)
      * General: General Practitioner Dashboard access
      * Radiology: Radiology Dashboard access
    - lab_technician: Lab capabilities access
    - non_medical_staff: Patient Engagement capabilities access
    - admin: Full system access
    """
    try:
        data = request.get_json()
        
        email = data.get('email')
        password = data.get('password')
        role = data.get('role', 'doctor')  # doctor, radiology, lab_technician, non_medical_staff, admin
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        phone = data.get('phone')
        specialty_id = data.get('specialty_id')  # For doctors/radiology - determines specialty
        doctor_id = data.get('doctor_id')  # For assigning role to existing doctor
        
        # If assigning to existing doctor, get their info
        if doctor_id:
            doctor_info = db.session.execute(
                db.text("SELECT first_name, last_name, email, phone, specialty_id FROM doctors WHERE doctor_id = :doctor_id"),
                {"doctor_id": doctor_id}
            ).fetchone()
            if doctor_info:
                first_name = doctor_info[0] or first_name
                last_name = doctor_info[1] or last_name
                # Use doctor's email if email not provided, or use provided email
                if not email:
                    email = doctor_info[2]
                phone = doctor_info[3] or phone
                # Use doctor's specialty if specialty_id not provided
                if not specialty_id:
                    specialty_id = doctor_info[4]
        
        # If radiology role, automatically find Radiology specialty if not provided
        if role == 'radiology' and not specialty_id:
            radiology_spec = db.session.execute(
                db.text("SELECT specialty_id FROM specialties WHERE LOWER(name) LIKE '%radiology%' LIMIT 1")
            ).fetchone()
            if radiology_spec:
                specialty_id = radiology_spec[0]
        
        if not email or not password:
            return jsonify({
                'success': False,
                'error': 'Email and password are required'
            }), 400
        
        # Check if user already exists using raw SQL
        existing_user_result = db.session.execute(
            db.text("SELECT id FROM users WHERE email = :email"),
            {"email": email}
        ).fetchone()
        
        if existing_user_result:
            return jsonify({
                'success': False,
                'error': 'User with this email already exists'
            }), 409
        
        # Ensure role column exists
        try:
            db.session.execute(
                db.text("ALTER TABLE users ADD COLUMN role VARCHAR(50) NULL")
            )
            db.session.commit()
        except Exception:
            # Column might already exist
            db.session.rollback()
            pass
        
        # Create user using raw SQL to avoid ORM issues
        from werkzeug.security import generate_password_hash
        password_hash = generate_password_hash(password)
        
        db.session.execute(
            db.text("""
                INSERT INTO users (email, password_hash, is_verified, otp, otp_expiry, role, created_at, updated_at)
                VALUES (:email, :password_hash, :is_verified, :otp, :otp_expiry, :role, NOW(), NOW())
            """),
            {
                'email': email,
                'password_hash': password_hash,
                'is_verified': True,
                'otp': None,
                'otp_expiry': None,
                'role': role if role in ['lab_technician', 'non_medical_staff', 'admin', 'radiology'] else None
            }
        )
        db.session.flush()
        
        # Get the newly created user ID
        user_result = db.session.execute(
            db.text("SELECT id FROM users WHERE email = :email"),
            {"email": email}
        ).fetchone()
        user_id = user_result[0] if user_result else None
        
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
        except Exception:
            db.session.rollback()
            pass
        
        # Create employee record for admin, lab_technician, non_medical_staff, radiology
        if role in ['admin', 'lab_technician', 'non_medical_staff', 'radiology']:
            from utils.employee_id_generator import generate_employee_id
            employee_id = generate_employee_id(prefix="EMP", format_type="short")
            
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
        
        # Create or update doctor record if role is doctor or radiology
        elif role in ['doctor', 'radiology']:
            if not specialty_id:
                return jsonify({
                    'success': False,
                    'error': 'Specialty ID is required for doctors'
                }), 400
            
            # If doctor_id provided, update existing doctor record
            if doctor_id:
                # Update doctor's email if it's different
                db.session.execute(
                    db.text("UPDATE doctors SET email = :email, phone = :phone, specialty_id = :specialty_id WHERE doctor_id = :doctor_id"),
                    {
                        'email': email,
                        'phone': phone,
                        'specialty_id': specialty_id,
                        'doctor_id': doctor_id
                    }
                )
            else:
                # Create new doctor record
                doctor_id_result = db.session.execute(
                    db.text("SELECT COALESCE(MAX(doctor_id), 0) + 1 as next_id FROM doctors")
                ).fetchone()
                new_doctor_id = doctor_id_result[0] if doctor_id_result else 1
                
                db.session.execute(
                    db.text("""
                        INSERT INTO doctors (doctor_id, first_name, last_name, specialty_id, email, phone, is_active)
                        VALUES (:doctor_id, :first_name, :last_name, :specialty_id, :email, :phone, :is_active)
                    """),
                    {
                        'doctor_id': new_doctor_id,
                        'first_name': first_name,
                        'last_name': last_name,
                        'specialty_id': specialty_id,
                        'email': email,
                        'phone': phone,
                        'is_active': True
                    }
                )
            
            # Also create employee record for doctors/radiology
            from utils.employee_id_generator import generate_employee_id
            employee_id = generate_employee_id(prefix="EMP", format_type="short")
            
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
                    'role': role,  # Store as 'radiology' or 'doctor'
                    'email': email,
                    'phone': phone,
                    'is_active': True
                }
            )
        
        db.session.commit()
        
        logger.info(f"Admin created user {email} with role {role}")
        
        return jsonify({
            'success': True,
            'message': f'User created successfully with role: {role}',
            'user_id': user_id,
            'email': email,
            'role': role
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        logger.error(traceback.format_exc())
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Failed to create user: {str(e)}'
        }), 500

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """Update user information and role"""
    try:
        data = request.get_json()
        
        # Check if user exists using raw SQL
        user_result = db.session.execute(
            db.text("SELECT id, email FROM users WHERE id = :user_id"),
            {"user_id": user_id}
        ).fetchone()
        
        if not user_result:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        current_email = user_result[1]
        
        # Update role if provided
        new_role = data.get('role')
        specialty_id = data.get('specialty_id')
        
        # If radiology role, automatically find Radiology specialty if not provided
        if new_role == 'radiology' and not specialty_id:
            radiology_spec = db.session.execute(
                db.text("SELECT specialty_id FROM specialties WHERE LOWER(name) LIKE '%radiology%' LIMIT 1")
            ).fetchone()
            if radiology_spec:
                specialty_id = radiology_spec[0]
        
        if new_role and new_role in ['lab_technician', 'non_medical_staff', 'admin', 'doctor', 'radiology']:
            try:
                # Ensure role column exists
                try:
                    db.session.execute(db.text("ALTER TABLE users ADD COLUMN role VARCHAR(50) NULL"))
                    db.session.commit()
                except Exception:
                    db.session.rollback()
                    pass
                
                db.session.execute(
                    db.text("UPDATE users SET role = :role WHERE id = :user_id"),
                    {"role": new_role, "user_id": user_id}
                )
                
                # Handle doctor/radiology roles - create doctor record if needed
                if new_role in ['doctor', 'radiology']:
                    # Check if doctor record exists
                    doctor_result = db.session.execute(
                        db.text("SELECT doctor_id FROM doctors WHERE email = :email"),
                        {"email": current_email}
                    ).fetchone()
                    
                    if not doctor_result:
                        # Require specialty_id for doctor/radiology roles
                        if not specialty_id:
                            return jsonify({
                                'success': False,
                                'error': 'Specialty ID is required when assigning doctor or radiology role'
                            }), 400
                        
                        # Get next doctor_id
                        doctor_id_result = db.session.execute(
                            db.text("SELECT COALESCE(MAX(doctor_id), 0) + 1 as next_id FROM doctors")
                        ).fetchone()
                        doctor_id = doctor_id_result[0] if doctor_id_result else 1
                        
                        # Get name from patient table if available
                        name_result = db.session.execute(
                            db.text("SELECT first_name, last_name, phone FROM patients WHERE user_id = :user_id LIMIT 1"),
                            {"user_id": user_id}
                        ).fetchone()
                        
                        first_name = name_result[0] if name_result else ""
                        last_name = name_result[1] if name_result else ""
                        phone = name_result[2] if name_result else None
                        
                        # Create doctor record
                        db.session.execute(
                            db.text("""
                                INSERT INTO doctors (doctor_id, first_name, last_name, specialty_id, email, phone, is_active)
                                VALUES (:doctor_id, :first_name, :last_name, :specialty_id, :email, :phone, :is_active)
                            """),
                            {
                                'doctor_id': doctor_id,
                                'first_name': first_name,
                                'last_name': last_name,
                                'specialty_id': specialty_id,
                                'email': current_email,
                                'phone': phone,
                                'is_active': True
                            }
                        )
                    elif specialty_id:
                        # Update existing doctor's specialty if provided
                        db.session.execute(
                            db.text("UPDATE doctors SET specialty_id = :specialty_id WHERE email = :email"),
                            {"specialty_id": specialty_id, "email": current_email}
                        )
                
                # If changing to admin/lab_technician/non_medical_staff/doctor/radiology, ensure employee record exists
                if new_role in ['admin', 'lab_technician', 'non_medical_staff', 'doctor', 'radiology']:
                    # Check if employee record exists
                    emp_result = db.session.execute(
                        db.text("SELECT employee_id FROM employees WHERE user_id = :user_id"),
                        {"user_id": user_id}
                    ).fetchone()
                    
                    if not emp_result:
                        # Create employee record
                        from utils.employee_id_generator import generate_employee_id
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
                            {"user_id": user_id, "email": current_email}
                        ).fetchone()
                        
                        first_name = name_result[0] if name_result else ""
                        last_name = name_result[1] if name_result else ""
                        phone = name_result[2] if name_result else None
                        
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
                                'role': new_role,
                                'email': current_email,
                                'phone': phone,
                                'is_active': True
                            }
                        )
                    else:
                        # Update existing employee record role
                        db.session.execute(
                            db.text("UPDATE employees SET role = :role WHERE user_id = :user_id"),
                            {"role": new_role, "user_id": user_id}
                        )
            except Exception as e:
                logger.warning(f"Could not update role: {e}")
                logger.error(traceback.format_exc())
        
        # Update password if provided
        if data.get('password'):
            from werkzeug.security import generate_password_hash
            password_hash = generate_password_hash(data['password'])
            db.session.execute(
                db.text("UPDATE users SET password_hash = :password_hash WHERE id = :user_id"),
                {"password_hash": password_hash, "user_id": user_id}
            )
        
        # Update email if provided
        if data.get('email') and data['email'] != current_email:
            # Check if new email already exists
            existing_result = db.session.execute(
                db.text("SELECT id FROM users WHERE email = :email"),
                {"email": data['email']}
            ).fetchone()
            
            if existing_result and existing_result[0] != user_id:
                return jsonify({
                    'success': False,
                    'error': 'Email already in use'
                }), 409
            
            db.session.execute(
                db.text("UPDATE users SET email = :email WHERE id = :user_id"),
                {"email": data['email'], "user_id": user_id}
            )
        
        db.session.commit()
        
        logger.info(f"Admin updated user {user_id}")
        
        return jsonify({
            'success': True,
            'message': 'User updated successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating user: {e}")
        logger.error(traceback.format_exc())
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Failed to update user: {str(e)}'
        }), 500

@admin_bp.route('/users/<int:user_id>/verify', methods=['PUT'])
def verify_user(user_id):
    """Verify or unverify a user account"""
    try:
        data = request.get_json()
        is_verified = data.get('is_verified', True)
        
        # Check if user exists
        user_result = db.session.execute(
            db.text("SELECT id, email, is_verified FROM users WHERE id = :user_id"),
            {"user_id": user_id}
        ).fetchone()
        
        if not user_result:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        current_verified = user_result[2]
        
        # Update verification status
        db.session.execute(
            db.text("UPDATE users SET is_verified = :is_verified, updated_at = NOW() WHERE id = :user_id"),
            {"user_id": user_id, "is_verified": is_verified}
        )
        db.session.commit()
        
        action = "verified" if is_verified else "unverified"
        logger.info(f"Admin {action} user {user_id} (email: {user_result[1]})")
        
        return jsonify({
            'success': True,
            'message': f'User account {action} successfully',
            'is_verified': is_verified
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating user verification status: {e}")
        logger.error(traceback.format_exc())
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Failed to update verification status: {str(e)}'
        }), 500

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete a user (soft delete by deactivating)"""
    try:
        
        # Check if user exists using raw SQL
        user_result = db.session.execute(
            db.text("SELECT id, email, role FROM users WHERE id = :user_id"),
            {"user_id": user_id}
        ).fetchone()
        
        if not user_result:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        user_email = user_result[1]
        user_role = user_result[2] if len(user_result) > 2 else None
        
        # Soft delete: deactivate patient records
        db.session.execute(
            db.text("UPDATE patients SET is_active = FALSE WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        
        # Soft delete: deactivate doctor records
        db.session.execute(
            db.text("UPDATE doctors SET is_active = FALSE WHERE email = :email"),
            {"email": user_email}
        )
        
        # Soft delete: deactivate employee records (for admin, lab_technician, non_medical_staff, doctor)
        try:
            db.session.execute(
                db.text("UPDATE employees SET is_active = FALSE WHERE user_id = :user_id"),
                {"user_id": user_id}
            )
        except Exception as emp_error:
            # If employees table doesn't exist or column doesn't exist, continue
            logger.warning(f"Could not update employees table: {emp_error}")
            pass
        
        # Soft delete: deactivate user account by setting is_verified to False
        # This effectively prevents login while preserving data
        try:
            db.session.execute(
                db.text("UPDATE users SET is_verified = FALSE WHERE id = :user_id"),
                {"user_id": user_id}
            )
        except Exception as user_error:
            logger.warning(f"Could not update users table: {user_error}")
            pass
        
        db.session.commit()
        
        logger.info(f"Admin deleted/deactivated user {user_id} (role: {user_role})")
        
        return jsonify({
            'success': True,
            'message': 'User deactivated successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error deleting user: {e}")
        logger.error(traceback.format_exc())
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Failed to delete user: {str(e)}'
        }), 500

@admin_bp.route('/unassigned-staff', methods=['GET'])
def list_unassigned_staff():
    """List doctors and staff who don't have user accounts yet"""
    try:
        # Get all doctors who don't have a corresponding user account
        query = """
            SELECT 
                d.doctor_id,
                d.first_name,
                d.last_name,
                d.email,
                d.phone,
                d.specialty_id,
                s.name as specialty_name,
                d.qualification,
                d.experience_years,
                d.is_active,
                d.created_at
            FROM doctors d
            LEFT JOIN specialties s ON d.specialty_id = s.specialty_id
            LEFT JOIN users u ON d.email = u.email
            WHERE u.id IS NULL
            AND d.is_active = TRUE
            ORDER BY d.created_at DESC, d.first_name, d.last_name
        """
        
        result = db.session.execute(db.text(query)).fetchall()
        
        unassigned_staff = []
        for row in result:
            staff = dict(row._mapping) if hasattr(row, '_mapping') else dict(zip(row.keys(), row))
            # Format created_at date if present
            if staff.get('created_at'):
                if hasattr(staff['created_at'], 'isoformat'):
                    staff['created_at'] = staff['created_at'].isoformat()
                else:
                    staff['created_at'] = str(staff['created_at'])
            unassigned_staff.append(staff)
        
        return jsonify({
            'success': True,
            'staff': unassigned_staff,
            'count': len(unassigned_staff)
        }), 200
        
    except Exception as e:
        logger.error(f"Error listing unassigned staff: {e}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': f'Failed to list unassigned staff: {str(e)}'
        }), 500

@admin_bp.route('/specialties', methods=['GET'])
def get_specialties():
    """Get all specialties for doctor role assignment"""
    try:
        result = db.session.execute(
            db.text("SELECT specialty_id, name, description FROM specialties WHERE is_active = TRUE ORDER BY name")
        ).fetchall()
        
        specialties = []
        for row in result:
            specialty = dict(row._mapping) if hasattr(row, '_mapping') else dict(zip(row.keys(), row))
            specialties.append(specialty)
        
        return jsonify({
            'success': True,
            'specialties': specialties
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching specialties: {e}")
        return jsonify({
            'success': False,
            'error': f'Failed to fetch specialties: {str(e)}'
        }), 500

