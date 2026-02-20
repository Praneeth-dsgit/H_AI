# Healthcare Application - Database Schema Documentation

## Overview

This document describes the optimized database schema for the healthcare application with **Patient ID as the central identifier**. The schema is designed for scalability, data integrity, and efficient querying.

## Database System

- **Database**: MySQL 5.7+
- **Character Set**: utf8mb4
- **Collation**: utf8mb4_unicode_ci
- **Engine**: InnoDB (for foreign key support and transactions)

---

## Entity Relationship Diagram (ERD)

```
┌─────────────┐
│    USERS    │
│─────────────│
│ id (PK)     │
│ email       │◄─────┐
│ password    │      │
│ is_verified │      │
└─────────────┘      │
                     │
                     │ 1:1
                     │
┌─────────────────────────────────────────────────────────────┐
│                      PATIENTS                               │
│─────────────────────────────────────────────────────────────│
│ patient_id (PK) ◄─── CENTRAL IDENTIFIER                    │
│ user_id (FK)                                                │
│ first_name, last_name, dob, gender, phone, email            │
│ height, weight, bmi, blood_type                            │
└─────────────────────────────────────────────────────────────┘
         │
         │ 1:N
         │
         ├─────────────────────────────────────────────────────┐
         │                                                     │
         │                                                     │
    ┌────▼────────────┐                              ┌─────────▼──────────┐
    │ FAMILY_MEMBERS  │                              │   APPOINTMENTS     │
    │─────────────────│                              │────────────────────│
    │ family_member_id│                              │ appointment_id (PK)│
    │ primary_patient │                              │ patient_id (FK)    │
    │ relationship   │                              │ doctor_id (FK)     │
    │                 │                              │ facility_id (FK)    │
    └─────────────────┘                              │ date, time, status │
         │                                            └────────────────────┘
         │ 1:N                                               │
         │                                                    │ 1:1
         │                                            ┌───────▼────────┐
         │                                            │    BILLING     │
         │                                            │────────────────│
         │                                            │ bill_id (PK)   │
         │                                            │ patient_id (FK)│
         │                                            │ appointment_id │
         │                                            │ total_amount   │
         │                                            └───────┬────────┘
         │                                                    │ 1:N
         │                                            ┌───────▼────────┐
         │                                            │   PAYMENTS     │
         │                                            │────────────────│
         │                                            │ payment_id (PK)│
         │                                            │ bill_id (FK)   │
         │                                            │ transaction_id │
         │                                            └────────────────┘
         │
         │ 1:N
         │
    ┌────▼──────────────────┐
    │  RADIOLOGY_BOOKINGS   │
    │───────────────────────│
    │ booking_id (PK)       │
    │ patient_id (FK)       │
    │ facility_id (FK)      │
    │ scan_type             │
    │ date, time, status    │
    └───────────────────────┘
         │
         │ 1:1
         │
    ┌────▼──────────────┐
    │ MEDICAL_RECORDS   │
    │───────────────────│
    │ record_id (PK)    │
    │ patient_id (FK)   │
    │ record_type       │
    │ file_path         │
    └───────────────────┘
         │
         │
    ┌────▼──────────────┐
    │ AI_CHAT_HISTORY   │
    │───────────────────│
    │ chat_id (PK)      │
    │ patient_id (FK)   │
    │ session_id        │
    │ user_message      │
    │ ai_response       │
    └───────────────────┘

┌──────────────┐         ┌──────────────────┐
│ SPECIALTIES  │         │    FACILITIES    │
│──────────────│         │──────────────────│
│ specialty_id │         │ facility_id (PK)  │
│ name         │         │ name, type       │
└──────┬───────┘         │ address          │
       │ 1:N             └────────┬─────────┘
       │                          │
┌──────▼──────────┐               │
│    DOCTORS      │               │
│─────────────────│               │
│ doctor_id (PK)  │               │
│ specialty_id(FK)│               │
│ name, qual      │               │
└──────┬──────────┘               │
       │                          │
       │ N:M                      │
       │                          │
┌──────▼──────────────────────────▼──────┐
│         DOCTOR_FACILITIES              │
│────────────────────────────────────────│
│ doctor_facility_id (PK)                │
│ doctor_id (FK)                        │
│ facility_id (FK)                      │
│ consultation_fee                      │
│ available_days, time_slots            │
└────────────────────────────────────────┘
```

---

## Core Tables

### 1. **users** - User Authentication
Primary purpose: Handle user authentication and OTP verification.

**Key Fields:**
- `id` (PK): Auto-increment user ID
- `email`: Unique email address
- `password_hash`: Hashed password
- `is_verified`: Email verification status
- `otp`: One-time password for verification
- `otp_expiry`: OTP expiration timestamp

**Relationships:**
- 1:1 with `patients` (via `user_id`)

---

### 2. **patients** - Central Entity ⭐
**Primary purpose: Central patient record with Patient ID as primary key.**

**Key Fields:**
- `patient_id` (PK): **Globally unique Patient ID** (e.g., "PAT-550e8400-e29b-41d4-a716-446655440000")
- `user_id` (FK): Links to users table
- Demographics: name, dob, gender, contact info
- Medical: blood_type, height, weight, BMI
- Emergency contact information

**Relationships:**
- 1:1 with `users`
- 1:N with `family_members`
- 1:N with `appointments`
- 1:N with `radiology_bookings`
- 1:N with `medical_records`
- 1:N with `billing`
- 1:N with `ai_chat_history`
- 1:N with `admissions`

**Indexes:**
- `idx_user_id`: Fast lookup by user
- `idx_email`, `idx_phone`: Contact lookup
- `idx_name`: Name search
- `idx_active`: Filter active patients

---

### 3. **family_members** - Family Member Profiles
**Primary purpose: Manage family member profiles linked to primary patient.**

**Key Fields:**
- `family_member_id` (PK): Auto-increment ID
- `primary_patient_id` (FK): Links to main patient account
- `relationship`: self, spouse, child, parent, sibling, other
- Medical info: allergies, medical_history

**Relationships:**
- N:1 with `patients` (via `primary_patient_id`)
- 1:N with `appointments` (can book for family members)
- 1:N with `radiology_bookings`
- 1:N with `medical_records`
- 1:N with `billing`

**Use Cases:**
- Parent booking appointment for child
- Spouse managing records for partner
- Family health history tracking

---

### 4. **specialties** - Medical Specialties
**Primary purpose: Define medical specialties.**

**Key Fields:**
- `specialty_id` (PK): Auto-increment ID
- `name`: Unique specialty name (e.g., "Cardiology", "Orthopedics")
- `category`: General, Surgical, Diagnostic
- `description`: Specialty description

**Relationships:**
- 1:N with `doctors`

**Default Data:**
Pre-populated with common specialties (General Medicine, Cardiology, Orthopedics, etc.)

---

### 5. **doctors** - Doctor Information
**Primary purpose: Store doctor profiles and qualifications.**

**Key Fields:**
- `doctor_id` (PK): Auto-increment ID
- `specialty_id` (FK): Medical specialty
- `first_name`, `last_name`: Doctor name
- `qualification`: MD, MBBS, etc.
- `experience_years`: Years of experience
- `consultation_fee`: Default consultation fee
- `is_available`: Current availability status

**Relationships:**
- N:1 with `specialties`
- N:M with `facilities` (via `doctor_facilities`)
- 1:N with `appointments`
- 1:N with `medical_records`
- 1:N with `radiology_bookings` (as referring doctor)
- 1:N with `admissions`

---

### 6. **facilities** - Healthcare Facilities
**Primary purpose: Hospitals, clinics, diagnostic centers.**

**Key Fields:**
- `facility_id` (PK): Auto-increment ID
- `name`: Facility name
- `type`: hospital, clinic, diagnostic_center, pharmacy, other
- `address`: Full address with city, state, zip
- `services_offered`: Services available
- `operating_hours`: JSON structure for hours

**Relationships:**
- N:M with `doctors` (via `doctor_facilities`)
- 1:N with `appointments`
- 1:N with `radiology_bookings`
- 1:N with `medical_records`
- 1:N with `billing`
- 1:N with `admissions`

---

### 7. **doctor_facilities** - Doctor-Facility Relationship
**Primary purpose: Many-to-many relationship between doctors and facilities.**

**Key Fields:**
- `doctor_facility_id` (PK): Auto-increment ID
- `doctor_id` (FK): Doctor reference
- `facility_id` (FK): Facility reference
- `consultation_fee`: Fee at this specific facility
- `available_days`: JSON array of days (e.g., ["Monday", "Wednesday"])
- `available_time_slots`: JSON time slots
- `is_primary`: Primary facility for this doctor

**Unique Constraint:**
- `(doctor_id, facility_id)`: One doctor-facility relationship per pair

---

### 8. **appointments** - Appointment Bookings
**Primary purpose: Manage patient appointments.**

**Key Fields:**
- `appointment_id` (PK): Auto-increment ID
- `patient_id` (FK): **Primary patient ID** (central identifier)
- `family_member_id` (FK): If booking for family member
- `doctor_id` (FK): Selected doctor
- `facility_id` (FK): Selected facility
- `appointment_date`, `appointment_time`: Date and time
- `appointment_type`: consultation, follow_up, emergency, routine
- `status`: scheduled, confirmed, completed, cancelled, no_show

**Relationships:**
- N:1 with `patients` (via `patient_id`)
- N:1 with `family_members` (optional)
- N:1 with `doctors`
- N:1 with `facilities`
- 1:1 with `billing` (one bill per appointment)
- 1:N with `medical_records`

**Indexes:**
- `idx_date_time`: Fast querying by date/time
- `idx_status`: Filter by status

---

### 9. **radiology_bookings** - Radiology Scan Bookings
**Primary purpose: Book MRI, CT, X-ray, Ultrasound, etc.**

**Key Fields:**
- `booking_id` (PK): Auto-increment ID
- `patient_id` (FK): **Primary patient ID**
- `family_member_id` (FK): If booking for family member
- `facility_id` (FK): Diagnostic center
- `scan_type`: mri, ct, xray, ultrasound, mammography, pet_scan, other
- `body_part`: Head, Chest, Abdomen, etc.
- `appointment_date`, `appointment_time`: Booking date/time
- `referring_doctor_id` (FK): Doctor who referred the scan
- `status`: scheduled, completed, cancelled, rescheduled
- `report_available`: Boolean flag
- `report_url`: Link to radiology report

**Relationships:**
- N:1 with `patients` (via `patient_id`)
- N:1 with `family_members` (optional)
- N:1 with `facilities`
- N:1 with `doctors` (referring doctor)
- 1:1 with `billing`
- 1:N with `medical_records`

---

### 10. **medical_records** - Health Records
**Primary purpose: Store prescriptions, lab reports, radiology reports, visit summaries.**

**Key Fields:**
- `record_id` (PK): Auto-increment ID
- `patient_id` (FK): **Primary patient ID**
- `family_member_id` (FK): If record belongs to family member
- `record_type`: prescription, lab_report, radiology_report, visit_summary, discharge_summary, other
- `title`: Record title
- `file_path`: Path to stored file
- `file_type`: PDF, image, etc.
- `file_size`: Size in bytes
- `visit_date`: Date of visit
- `doctor_id` (FK): Associated doctor
- `facility_id` (FK): Associated facility
- `appointment_id` (FK): Linked appointment
- `radiology_booking_id` (FK): Linked radiology booking

**Relationships:**
- N:1 with `patients` (via `patient_id`)
- N:1 with `family_members` (optional)
- N:1 with `doctors` (optional)
- N:1 with `facilities` (optional)
- N:1 with `appointments` (optional)
- N:1 with `radiology_bookings` (optional)

**Indexes:**
- `idx_record_type`: Filter by type
- `idx_visit_date`: Sort by date

---

### 11. **billing** - Billing Information
**Primary purpose: Generate and track bills for services.**

**Key Fields:**
- `bill_id` (PK): Auto-increment ID
- `bill_number`: Unique bill number (e.g., "BILL-20240115-001")
- `patient_id` (FK): **Primary patient ID**
- `family_member_id` (FK): If bill is for family member
- `bill_type`: consultation, radiology, lab, pharmacy, other
- `appointment_id` (FK): Linked appointment
- `radiology_booking_id` (FK): Linked radiology booking
- `facility_id` (FK): Billing facility
- `subtotal`, `tax_amount`, `discount_amount`, `total_amount`: Financial fields
- `status`: pending, paid, partially_paid, cancelled, refunded
- `due_date`, `paid_date`: Payment dates

**Relationships:**
- N:1 with `patients` (via `patient_id`)
- N:1 with `family_members` (optional)
- N:1 with `appointments` (optional)
- N:1 with `radiology_bookings` (optional)
- N:1 with `facilities`
- 1:N with `payments`

---

### 12. **payments** - Payment Transactions
**Primary purpose: Track payment transactions.**

**Key Fields:**
- `payment_id` (PK): Auto-increment ID
- `bill_id` (FK): Linked bill
- `patient_id` (FK): **Primary patient ID**
- `payment_method`: cash, card, upi, netbanking, wallet, other
- `payment_amount`: Amount paid
- `transaction_id`: Unique transaction ID from gateway
- `payment_status`: pending, completed, failed, refunded
- `payment_date`: When payment was made
- `payment_gateway`: Gateway used
- `gateway_response`: JSON response from gateway
- `refund_amount`, `refund_date`, `refund_reason`: Refund information

**Relationships:**
- N:1 with `billing`
- N:1 with `patients` (via `patient_id`)

**Indexes:**
- `idx_transaction`: Fast lookup by transaction ID
- `idx_payment_date`: Sort by date

---

### 13. **ai_chat_history** - AI Chat History
**Primary purpose: Store AI chat conversations linked to Patient ID.**

**Key Fields:**
- `chat_id` (PK): Auto-increment ID
- `patient_id` (FK): **Primary patient ID**
- `session_id`: Chat session identifier
- `user_message`: User's message
- `ai_response`: AI's response
- `capability`: general, radiology, lab, engagement
- `message_type`: question, home_remedy, general_health
- `created_at`: Timestamp

**Relationships:**
- N:1 with `patients` (via `patient_id`)

**Indexes:**
- `idx_session`: Group by session
- `idx_capability`: Filter by capability

---

### 14. **admissions** - Hospital Admissions
**Primary purpose: Track hospital admissions (existing functionality).**

**Key Fields:**
- `admission_id` (PK): Auto-increment ID
- `patient_id` (FK): **Primary patient ID**
- `facility_id` (FK): Hospital
- `admit_date`, `discharge_date`: Admission dates
- `diagnosis`: Medical diagnosis
- `room_number`: Room assignment
- `doctor_id` (FK): Attending doctor
- `status`: admitted, discharged, transferred

**Relationships:**
- N:1 with `patients` (via `patient_id`)
- N:1 with `facilities`
- N:1 with `doctors`

---

## Key Design Principles

### 1. **Patient ID as Central Identifier** ⭐
- `patient_id` is the PRIMARY KEY in `patients` table
- All related tables use `patient_id` as FOREIGN KEY
- Patient ID format: `PAT-{UUID}` (e.g., "PAT-550e8400-e29b-41d4-a716-446655440000")
- Generated using UUID for global uniqueness

### 2. **Normalization**
- 3NF (Third Normal Form) compliance
- No redundant data
- Proper foreign key relationships

### 3. **Scalability**
- Indexed columns for fast queries
- Composite indexes for common query patterns
- JSON fields for flexible data (operating_hours, available_days)

### 4. **Data Integrity**
- Foreign key constraints with appropriate CASCADE/SET NULL/RESTRICT
- Unique constraints where needed
- NOT NULL constraints for required fields
- ENUM types for controlled values

### 5. **Family Member Support**
- `family_members` table linked to primary patient
- All bookings/records can be for family members
- Maintains separate medical history per family member

### 6. **Audit Trail**
- `created_at` and `updated_at` timestamps on all tables
- Status tracking (is_active, is_available, etc.)
- Cancellation tracking with reasons

---

## Database Views

### 1. **v_patient_user**
Combines patient and user information for quick lookups.

### 2. **v_doctor_specialty**
Joins doctors with specialties for display.

### 3. **v_upcoming_appointments**
Shows upcoming appointments with patient, doctor, and facility details.

---

## Indexes Summary

| Table | Indexes | Purpose |
|-------|---------|---------|
| `patients` | user_id, email, phone, name, active | Fast patient lookup |
| `appointments` | patient_id, doctor_id, date_time, status | Query appointments |
| `radiology_bookings` | patient_id, facility_id, scan_type, date_time | Query bookings |
| `medical_records` | patient_id, record_type, visit_date | Filter records |
| `billing` | patient_id, bill_number, status, due_date | Track bills |
| `payments` | bill_id, transaction_id, payment_date | Payment lookup |
| `ai_chat_history` | patient_id, session_id, capability | Chat history |

---

## Migration Strategy

1. **Run migration SQL**: Execute `001_create_optimized_schema.sql`
2. **Migrate existing data**: If migrating from old schema
3. **Generate Patient IDs**: For existing patients
4. **Update foreign keys**: Link all records to Patient ID

---

## Security Considerations

1. **Password Hashing**: Uses Werkzeug's password hashing
2. **OTP Expiry**: Time-based OTP validation
3. **Data Privacy**: Patient data access controlled by Patient ID
4. **Audit Logging**: All changes tracked with timestamps

---

## Performance Optimization

1. **Indexes**: Strategic indexes on foreign keys and frequently queried columns
2. **Composite Indexes**: For date/time queries
3. **JSON Fields**: For flexible but queryable data
4. **Views**: Pre-joined views for common queries

---

## Next Steps

1. ✅ Run migration SQL file
2. ✅ Update signup endpoint to generate Patient ID
3. ✅ Update all endpoints to use Patient ID
4. ✅ Create API endpoints for new features
5. ✅ Build frontend components

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0

