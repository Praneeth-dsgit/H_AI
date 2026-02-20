# Healthcare Application - Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the optimized healthcare application database schema and features.

---

## Phase 1: Database Setup

### Step 1: Run Database Migration

```bash
cd AI_Chat/api
python setup_database.py
```

This will:
- Create the database if it doesn't exist
- Execute the migration SQL file
- Create all tables with proper relationships
- Insert default specialties

### Step 2: Verify Database Schema

```sql
-- Connect to MySQL
mysql -u root -p medchat_db

-- Check tables
SHOW TABLES;

-- Verify Patient ID structure
DESCRIBE patients;

-- Check indexes
SHOW INDEXES FROM patients;
```

---

## Phase 2: Backend Implementation

### Step 1: Update App Imports

Add to `app.py`:

```python
from database_models import (
    Patient, FamilyMember, Specialty, Doctor, Facility,
    DoctorFacility, Appointment, RadiologyBooking,
    MedicalRecord, Billing, Payment, AIChatHistory, Admission
)
from utils.patient_id_generator import generate_patient_id
```

### Step 2: Update Signup/Login Flow

✅ **Already Updated**: The signup and OTP verification endpoints now:
- Generate Patient ID upon OTP verification
- Create patient record automatically
- Return Patient ID in response

### Step 3: Create API Endpoints

#### Patient Profile Management

```python
@app.route('/api/patient/profile', methods=['GET'])
@require_auth  # Add authentication decorator
def get_patient_profile():
    """Get patient profile by Patient ID"""
    patient_id = request.headers.get('X-Patient-ID')
    patient = Patient.query.filter_by(patient_id=patient_id).first()
    if not patient:
        return jsonify({'error': 'Patient not found'}), 404
    return jsonify({'success': True, 'patient': patient.to_dict()}), 200

@app.route('/api/patient/profile', methods=['PUT'])
@require_auth
def update_patient_profile():
    """Update patient profile"""
    patient_id = request.headers.get('X-Patient-ID')
    patient = Patient.query.filter_by(patient_id=patient_id).first()
    if not patient:
        return jsonify({'error': 'Patient not found'}), 404
    
    data = request.get_json()
    # Update fields
    if 'first_name' in data:
        patient.first_name = data['first_name']
    if 'last_name' in data:
        patient.last_name = data['last_name']
    # ... update other fields
    
    db.session.commit()
    return jsonify({'success': True, 'patient': patient.to_dict()}), 200
```

#### Family Member Management

```python
@app.route('/api/patient/family-members', methods=['POST'])
@require_auth
def add_family_member():
    """Add a family member"""
    patient_id = request.headers.get('X-Patient-ID')
    data = request.get_json()
    
    family_member = FamilyMember(
        primary_patient_id=patient_id,
        first_name=data['first_name'],
        last_name=data['last_name'],
        date_of_birth=datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date(),
        gender=data['gender'],
        relationship=data['relationship']
    )
    
    db.session.add(family_member)
    db.session.commit()
    
    return jsonify({'success': True, 'family_member': family_member.to_dict()}), 201

@app.route('/api/patient/family-members', methods=['GET'])
@require_auth
def get_family_members():
    """Get all family members for a patient"""
    patient_id = request.headers.get('X-Patient-ID')
    family_members = FamilyMember.query.filter_by(
        primary_patient_id=patient_id,
        is_active=True
    ).all()
    
    return jsonify({
        'success': True,
        'family_members': [fm.to_dict() for fm in family_members]
    }), 200
```

#### Appointment Booking

```python
@app.route('/api/appointments', methods=['POST'])
@require_auth
def book_appointment():
    """Book an appointment"""
    patient_id = request.headers.get('X-Patient-ID')
    data = request.get_json()
    
    # Check for conflicts
    existing = Appointment.query.filter_by(
        doctor_id=data['doctor_id'],
        facility_id=data['facility_id'],
        appointment_date=datetime.strptime(data['appointment_date'], '%Y-%m-%d').date(),
        appointment_time=datetime.strptime(data['appointment_time'], '%H:%M:%S').time(),
        status='scheduled'
    ).first()
    
    if existing:
        return jsonify({'error': 'Time slot already booked'}), 409
    
    appointment = Appointment(
        patient_id=patient_id,
        family_member_id=data.get('family_member_id'),
        doctor_id=data['doctor_id'],
        facility_id=data['facility_id'],
        appointment_date=datetime.strptime(data['appointment_date'], '%Y-%m-%d').date(),
        appointment_time=datetime.strptime(data['appointment_time'], '%H:%M:%S').time(),
        appointment_type=data.get('appointment_type', 'consultation'),
        reason=data.get('reason'),
        status='scheduled'
    )
    
    db.session.add(appointment)
    db.session.commit()
    
    return jsonify({'success': True, 'appointment': appointment.to_dict()}), 201
```

#### Radiology Booking

```python
@app.route('/api/radiology/bookings', methods=['POST'])
@require_auth
def book_radiology():
    """Book a radiology scan"""
    patient_id = request.headers.get('X-Patient-ID')
    data = request.get_json()
    
    booking = RadiologyBooking(
        patient_id=patient_id,
        family_member_id=data.get('family_member_id'),
        facility_id=data['facility_id'],
        scan_type=data['scan_type'],
        body_part=data.get('body_part'),
        appointment_date=datetime.strptime(data['appointment_date'], '%Y-%m-%d').date(),
        appointment_time=datetime.strptime(data['appointment_time'], '%H:%M:%S').time(),
        referring_doctor_id=data.get('referring_doctor_id'),
        reason=data.get('reason'),
        status='scheduled'
    )
    
    db.session.add(booking)
    db.session.commit()
    
    return jsonify({'success': True, 'booking': booking.to_dict()}), 201
```

#### Medical Records

```python
@app.route('/api/patient/medical-records', methods=['GET'])
@require_auth
def get_medical_records():
    """Get all medical records for a patient"""
    patient_id = request.headers.get('X-Patient-ID')
    record_type = request.args.get('type')  # Optional filter
    
    query = MedicalRecord.query.filter_by(patient_id=patient_id)
    if record_type:
        query = query.filter_by(record_type=record_type)
    
    records = query.order_by(MedicalRecord.visit_date.desc()).all()
    
    return jsonify({
        'success': True,
        'records': [r.to_dict() for r in records]
    }), 200
```

#### Doctor Search

```python
@app.route('/api/doctors/search', methods=['GET'])
def search_doctors():
    """Search doctors by specialty, name, or facility"""
    specialty_id = request.args.get('specialty_id')
    facility_id = request.args.get('facility_id')
    search_term = request.args.get('search')
    
    query = Doctor.query.filter_by(is_active=True, is_available=True)
    
    if specialty_id:
        query = query.filter_by(specialty_id=specialty_id)
    
    if search_term:
        query = query.filter(
            db.or_(
                Doctor.first_name.like(f'%{search_term}%'),
                Doctor.last_name.like(f'%{search_term}%')
            )
        )
    
    doctors = query.all()
    
    # If facility_id specified, filter by doctor_facilities
    if facility_id:
        doctor_ids = [df.doctor_id for df in DoctorFacility.query.filter_by(
            facility_id=facility_id,
            is_active=True
        ).all()]
        doctors = [d for d in doctors if d.doctor_id in doctor_ids]
    
    return jsonify({
        'success': True,
        'doctors': [d.to_dict() for d in doctors]
    }), 200
```

#### Facility Search

```python
@app.route('/api/facilities/search', methods=['GET'])
def search_facilities():
    """Search healthcare facilities"""
    facility_type = request.args.get('type')
    city = request.args.get('city')
    search_term = request.args.get('search')
    
    query = Facility.query.filter_by(is_active=True)
    
    if facility_type:
        query = query.filter_by(type=facility_type)
    
    if city:
        query = query.filter_by(city=city)
    
    if search_term:
        query = query.filter(Facility.name.like(f'%{search_term}%'))
    
    facilities = query.all()
    
    return jsonify({
        'success': True,
        'facilities': [f.to_dict() for f in facilities]
    }), 200
```

#### Billing & Payments

```python
@app.route('/api/patient/billing', methods=['GET'])
@require_auth
def get_billing_history():
    """Get billing history for a patient"""
    patient_id = request.headers.get('X-Patient-ID')
    
    bills = Billing.query.filter_by(patient_id=patient_id).order_by(
        Billing.created_at.desc()
    ).all()
    
    return jsonify({
        'success': True,
        'bills': [b.to_dict() for b in bills]
    }), 200

@app.route('/api/payments', methods=['POST'])
@require_auth
def process_payment():
    """Process a payment"""
    patient_id = request.headers.get('X-Patient-ID')
    data = request.get_json()
    
    bill = Billing.query.filter_by(bill_id=data['bill_id']).first()
    if not bill:
        return jsonify({'error': 'Bill not found'}), 404
    
    payment = Payment(
        bill_id=data['bill_id'],
        patient_id=patient_id,
        payment_method=data['payment_method'],
        payment_amount=data['payment_amount'],
        transaction_id=data.get('transaction_id'),
        payment_status='pending'
    )
    
    db.session.add(payment)
    
    # Update bill status
    if payment.payment_amount >= bill.total_amount:
        bill.status = 'paid'
        bill.paid_date = datetime.now().date()
    
    db.session.commit()
    
    return jsonify({'success': True, 'payment': payment.to_dict()}), 201
```

---

## Phase 3: Frontend Implementation

### Step 1: Update Types

Add to `frontend/src/types.ts`:

```typescript
export interface Patient {
  patient_id: string;
  user_id?: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  phone?: string;
  email?: string;
  // ... other fields
}

export interface FamilyMember {
  family_member_id: number;
  primary_patient_id: string;
  first_name: string;
  last_name: string;
  relationship: 'self' | 'spouse' | 'child' | 'parent' | 'sibling' | 'other';
  // ... other fields
}

export interface Appointment {
  appointment_id: number;
  patient_id: string;
  family_member_id?: number;
  doctor_id: number;
  facility_id: number;
  appointment_date: string;
  appointment_time: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  // ... other fields
}

// ... more interfaces
```

### Step 2: Create API Service

Create `frontend/src/services/patientService.ts`:

```typescript
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export const patientService = {
  getProfile: async (patientId: string) => {
    const response = await axios.get(`${API_BASE}/patient/profile`, {
      headers: { 'X-Patient-ID': patientId }
    });
    return response.data;
  },
  
  updateProfile: async (patientId: string, data: any) => {
    const response = await axios.put(`${API_BASE}/patient/profile`, data, {
      headers: { 'X-Patient-ID': patientId }
    });
    return response.data;
  },
  
  getFamilyMembers: async (patientId: string) => {
    const response = await axios.get(`${API_BASE}/patient/family-members`, {
      headers: { 'X-Patient-ID': patientId }
    });
    return response.data;
  },
  
  addFamilyMember: async (patientId: string, data: any) => {
    const response = await axios.post(`${API_BASE}/patient/family-members`, data, {
      headers: { 'X-Patient-ID': patientId }
    });
    return response.data;
  },
  
  // ... more methods
};
```

### Step 3: Create UI Components

#### Patient Dashboard

```typescript
// frontend/src/components/PatientDashboard.tsx
import React, { useEffect, useState } from 'react';
import { patientService } from '../services/patientService';

export const PatientDashboard: React.FC = () => {
  const [patient, setPatient] = useState(null);
  const patientId = localStorage.getItem('patient_id');
  
  useEffect(() => {
    if (patientId) {
      patientService.getProfile(patientId).then(setPatient);
    }
  }, [patientId]);
  
  return (
    <div className="dashboard">
      <h1>Welcome, {patient?.first_name}!</h1>
      {/* Dashboard content */}
    </div>
  );
};
```

---

## Phase 4: Testing

### Test Database Schema

```python
# test_database.py
from app import app, db
from database_models import Patient, User
from utils.patient_id_generator import generate_patient_id

with app.app_context():
    # Test Patient ID generation
    patient_id = generate_patient_id()
    print(f"Generated Patient ID: {patient_id}")
    
    # Test patient creation
    patient = Patient(
        patient_id=patient_id,
        first_name="Test",
        last_name="User",
        date_of_birth=datetime.now().date(),
        gender='male',
        email="test@example.com"
    )
    db.session.add(patient)
    db.session.commit()
    
    print(f"Patient created: {patient.patient_id}")
```

---

## Phase 5: Deployment Checklist

- [ ] Run database migration
- [ ] Update environment variables
- [ ] Test Patient ID generation
- [ ] Test signup/OTP flow
- [ ] Test appointment booking
- [ ] Test family member management
- [ ] Test medical records access
- [ ] Test billing and payments
- [ ] Test AI chat history
- [ ] Set up authentication middleware
- [ ] Configure CORS
- [ ] Set up error handling
- [ ] Add logging
- [ ] Performance testing
- [ ] Security audit

---

## Next Steps

1. **Authentication Middleware**: Create `@require_auth` decorator
2. **Error Handling**: Centralized error handling
3. **Validation**: Request validation for all endpoints
4. **Documentation**: API documentation with Swagger
5. **Testing**: Unit and integration tests
6. **Frontend**: Complete UI implementation

---

**Last Updated**: 2024-01-15

