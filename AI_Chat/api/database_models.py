"""
SQLAlchemy Models for Healthcare Application
Optimized schema with Patient ID as central identifier

Note: Import db from app.py after db is initialized
Usage in app.py:
    from app import db
    from database_models import create_models
    Patient, FamilyMember, ... = create_models(db)
"""

from datetime import datetime
from sqlalchemy import Enum as SQLEnum, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship
from werkzeug.security import generate_password_hash, check_password_hash


def create_models(db):
    """Create all models bound to the provided db instance"""
    
    class User(db.Model):
        """User authentication table"""
        __tablename__ = 'users'
        
        id = db.Column(db.Integer, primary_key=True, autoincrement=True)
        email = db.Column(db.String(255), unique=True, nullable=False, index=True)
        password_hash = db.Column(db.String(255), nullable=False)
        is_verified = db.Column(db.Boolean, default=False, nullable=False)
        role = db.Column(db.String(50), nullable=True, index=True, comment='admin, doctor, radiology, lab_technician, non_medical_staff')
        otp = db.Column(db.String(6), nullable=True)
        otp_expiry = db.Column(db.Integer, nullable=True)  # Unix timestamp
        created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
        updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
        
        # Relationships - Using lazy loading to avoid initialization issues
        patient = relationship('Patient', backref='user', uselist=False, cascade='all, delete-orphan', lazy='select')
        
        def set_password(self, password):
            self.password_hash = generate_password_hash(password)
        
        def check_password(self, password):
            return check_password_hash(self.password_hash, password)
        
        def to_dict(self):
            return {
                'id': self.id,
                'email': self.email,
                'is_verified': self.is_verified,
                'created_at': self.created_at.isoformat() if self.created_at else None
            }

    class Patient(db.Model):
        """Patient table - Central entity with Patient ID as primary key"""
        __tablename__ = 'patients'
        
        patient_id = db.Column(db.String(50), primary_key=True, comment='Globally unique Patient ID')
        user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), unique=True, nullable=True)
        first_name = db.Column(db.String(100), nullable=False)
        last_name = db.Column(db.String(100), nullable=False)
        date_of_birth = db.Column(db.Date, nullable=False)
        gender = db.Column(SQLEnum('male', 'female', 'other'), nullable=False)
        phone = db.Column(db.String(20), index=True)
        email = db.Column(db.String(255), index=True)
        address = db.Column(db.Text)
        city = db.Column(db.String(100))
        state = db.Column(db.String(100))
        zip_code = db.Column(db.String(20))
        country = db.Column(db.String(100), default='India')
        blood_type = db.Column(db.String(10))
        height_cm = db.Column(db.Numeric(5, 2))
        weight_kg = db.Column(db.Numeric(5, 2))
        bmi = db.Column(db.Numeric(4, 2))
        emergency_contact_name = db.Column(db.String(200))
        emergency_contact_phone = db.Column(db.String(20))
        emergency_contact_relation = db.Column(db.String(50))
        is_active = db.Column(db.Boolean, default=True, index=True)
        created_at = db.Column(db.DateTime, default=datetime.utcnow)
        updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
        
        # Relationships - Using lazy loading and string references to avoid circular imports
        family_members = relationship('FamilyMember', backref='primary_patient', cascade='all, delete-orphan', lazy='select')
        # Note: Other relationships (Appointment, RadiologyBooking, etc.) are defined in their respective modules
        # These are commented out to avoid initialization errors if models don't exist
        # appointments = relationship('Appointment', backref='patient', cascade='all, delete-orphan', lazy='select')
        # radiology_bookings = relationship('RadiologyBooking', backref='patient', cascade='all, delete-orphan', lazy='select')
        # medical_records = relationship('MedicalRecord', backref='patient', cascade='all, delete-orphan', lazy='select')
        # billing = relationship('Billing', backref='patient', cascade='all, delete-orphan', lazy='select')
        # ai_chat_history = relationship('AIChatHistory', backref='patient', cascade='all, delete-orphan', lazy='select')
        # admissions = relationship('Admission', backref='patient', cascade='all, delete-orphan', lazy='select')
        
        def to_dict(self):
            return {
                'patient_id': self.patient_id,
                'user_id': self.user_id,
                'first_name': self.first_name,
                'last_name': self.last_name,
                'full_name': f"{self.first_name} {self.last_name}",
                'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
                'gender': self.gender,
                'phone': self.phone,
                'email': self.email,
                'address': self.address,
                'city': self.city,
                'state': self.state,
                'zip_code': self.zip_code,
                'country': self.country,
                'blood_type': self.blood_type,
                'height_cm': float(self.height_cm) if self.height_cm else None,
                'weight_kg': float(self.weight_kg) if self.weight_kg else None,
                'bmi': float(self.bmi) if self.bmi else None,
                'is_active': self.is_active,
                'created_at': self.created_at.isoformat() if self.created_at else None
            }

    class FamilyMember(db.Model):
        """Family members linked to primary patient"""
        __tablename__ = 'family_members'
        
        family_member_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
        primary_patient_id = db.Column(db.String(50), db.ForeignKey('patients.patient_id', ondelete='CASCADE'), nullable=False, index=True)
        first_name = db.Column(db.String(100), nullable=False)
        last_name = db.Column(db.String(100), nullable=False)
        date_of_birth = db.Column(db.Date, nullable=False)
        gender = db.Column(SQLEnum('male', 'female', 'other'), nullable=False)
        relationship_type = db.Column('relationship', SQLEnum('self', 'spouse', 'child', 'parent', 'sibling', 'other'), nullable=False, index=True)
        phone = db.Column(db.String(20))
        email = db.Column(db.String(255))
        blood_type = db.Column(db.String(10))
        height_cm = db.Column(db.Numeric(5, 2))
        weight_kg = db.Column(db.Numeric(5, 2))
        medical_history = db.Column(db.Text)
        allergies = db.Column(db.Text)
        is_active = db.Column(db.Boolean, default=True, index=True)
        created_at = db.Column(db.DateTime, default=datetime.utcnow)
        updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
        
        # Relationships - Using lazy loading to avoid initialization errors
        # Note: Other relationships are defined in their respective modules
        # appointments = relationship('Appointment', backref='family_member', cascade='all, delete-orphan', lazy='select')
        # radiology_bookings = relationship('RadiologyBooking', backref='family_member', cascade='all, delete-orphan', lazy='select')
        # medical_records = relationship('MedicalRecord', backref='family_member', cascade='all, delete-orphan', lazy='select')
        # billing = relationship('Billing', backref='family_member', cascade='all, delete-orphan', lazy='select')
        
        def to_dict(self):
            return {
                'family_member_id': self.family_member_id,
                'primary_patient_id': self.primary_patient_id,
                'first_name': self.first_name,
                'last_name': self.last_name,
                'full_name': f"{self.first_name} {self.last_name}",
                'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
                'gender': self.gender,
                'relationship': self.relationship_type,
                'phone': self.phone,
                'email': self.email,
                'blood_type': self.blood_type,
                'is_active': self.is_active
            }

    # Return all models as a dictionary
    return {
        'User': User,
        'Patient': Patient,
        'FamilyMember': FamilyMember,
        # Add other models as needed
    }

# For backward compatibility, you can also define models directly if db is available
# But the factory pattern above is preferred to avoid circular imports
