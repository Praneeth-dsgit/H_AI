# General Health Assistant - Capabilities Documentation

## Overview
The General Health Assistant is an AI-powered medical assistant designed for healthcare professionals (General Practitioners) in the Acufore Health system. It provides medical information, patient care guidance, and database query capabilities.

---

## Current Capabilities

### 1. **Medical Information & Guidance**
The assistant can provide information on:

- **Medical Conditions & Diagnosis**
  - Condition names and descriptions
  - Key symptoms and red flags
  - Differential diagnosis
  - Diagnostic workup recommendations
  - Clinical notes with patient-specific considerations

- **Treatment Protocols**
  - First-line lifestyle/conservative options
  - Pharmacotherapy (medication names, dosages, frequencies, durations, monitoring)
  - Surgical/procedural options
  - Clinical notes (contraindications, follow-up needs)

- **Medication Information**
  - Drug class & indication
  - Dosing & administration
  - Side effects & monitoring
  - Contraindications & interactions
  - Personalized clinical notes

- **Chronic Condition Management**
  - Long-term lifestyle changes
  - Medication strategies with monitoring
  - Specialist referral/coordination
  - Progression prevention notes

- **Emergency Situations**
  - Immediate actions (ABCDE, first aid)
  - Stabilization steps
  - Definitive care recommendations
  - Red flags and prevention

- **General Medical Questions**
  - Key points and definitions
  - Clinical relevance & practical applications
  - Additional resources
  - Patient education and follow-up guidance

### 2. **Database Read Operations**

The assistant can **READ** data from the following database tables:

#### **Patient Data**
- Patient demographics (name, age, gender, DOB, phone, email, address)
- Patient identifiers (patient_id)
- Physical attributes (height, weight, BMI, blood type)
- Emergency contact information
- Patient medical history (from admissions table)
- Patient conditions/diagnosis (from admissions.diagnosis field)

#### **Appointments**
- Appointment records (appointment_id, patient_id, doctor_id)
- Appointment dates and times
- Appointment reasons and status
- Appointment history and upcoming appointments

#### **Doctors & Departments**
- Doctor information (doctor_id, name, department)
- Department information (department_id, name)
- Doctor specialties and affiliations

#### **Admissions**
- Admission records (admission_id, patient_id)
- Diagnosis information
- Admit and discharge dates
- Room assignments

### 3. **General Practitioner Dashboard Module Data Access**

The assistant can access data from all four modules in the General Practitioner Dashboard:

#### **1. Appointments Module**
The assistant can query and retrieve:
- **Doctor's Appointments**: All appointments for the logged-in doctor
- **Appointment Filtering**: 
  - All appointments
  - Upcoming appointments (future dates, not completed/cancelled)
  - Today's appointments
  - Past appointments (completed or past dates)
- **Appointment Details**:
  - Patient information (name, ID, email)
  - Family member information (if appointment is for family member)
  - Appointment date and time
  - Appointment reason
  - Appointment status (scheduled, confirmed, completed, cancelled, no_show, pending)
  - Facility information
  - Doctor information
  - Appointment notes
- **Search Capabilities**: Search by patient name, doctor name, reason, or facility

**Example Queries:**
- "Show me my upcoming appointments"
- "What appointments do I have today?"
- "List all completed appointments this month"
- "Show appointments for patient John Smith"
- "What are my appointments at facility X?"

#### **2. Prescriptions Module**
The assistant can query and retrieve:
- **Prescription Records**: All prescriptions created by the logged-in doctor
- **Prescription Details**:
  - Patient information (patient_id, name, email)
  - Family member information (if prescription is for family member)
  - Prescription title
  - Prescription description/notes
  - Visit date
  - Creation date
  - Prescription file URL (if uploaded)
  - File type (PDF, image)
- **Prescription History**: Complete history of all prescriptions issued by the doctor

**Example Queries:**
- "Show me all prescriptions I've created"
- "List prescriptions for patient PAT-12345"
- "What prescriptions did I create this month?"
- "Show prescription details for prescription ID 123"

#### **3. Medicine Lookup Module**
The assistant can access:
- **Medicine Knowledge Base**: Complete database of medical conditions and treatments
- **Disease Information**:
  - Disease name and description
  - Symptoms list
  - Causes list
  - Common treatments
- **Search Capabilities**: Search by disease name, symptoms, or treatments

**Example Queries:**
- "What are the symptoms of diabetes?"
- "What treatments are available for hypertension?"
- "Show me information about common cold"
- "What causes migraines?"

**Note**: The medicine lookup data comes from `medicine_kbase.json` file, which contains structured medical information.

#### **4. Reports & Analytics Module**
The assistant can query and retrieve:
- **Appointment Statistics**:
  - Total appointments count
  - Upcoming appointments count
  - Completed appointments count
  - Appointments by status (scheduled, confirmed, completed, cancelled, no_show, pending)
  - Appointment trends over time
  - Appointments by date range (week, month, year)
- **Prescription Statistics**:
  - Total prescriptions count
  - Prescription trends over time
  - Prescriptions by date range
- **Analytics Data**:
  - Appointment distribution charts
  - Status breakdown (pie charts)
  - Trend analysis (line/bar charts)
  - Date range filtering
- **Report Generation**: Can assist with generating AI-powered reports based on analytics data

**Example Queries:**
- "What are my appointment statistics for this month?"
- "How many prescriptions did I create this year?"
- "Show me appointment trends for the last week"
- "What's the breakdown of appointments by status?"
- "Generate a report of my practice analytics"

#### **Query Capabilities**
The assistant uses a `DatabaseAgent` that:
- Generates SQL SELECT queries from natural language questions
- Automatically detects patient identifiers in queries (patient ID, name, phone)
- Fetches comprehensive patient data when a patient is mentioned
- Supports complex queries with JOINs across multiple tables
- Limits results to 100 records for safety
- Validates SQL queries for safety (blocks dangerous operations)

**Example Queries the Assistant Can Handle:**
- "Show me patient PAT-12345's appointments"
- "What conditions does John Smith have?"
- "List all appointments for today"
- "Find patients with diabetes"
- "Show me appointments for Dr. Smith"
- "What are the upcoming appointments this week?"

### 4. **Patient Data Fetching**

When a patient is mentioned in a query, the assistant can automatically:
- Extract patient identifiers (ID, name, phone number)
- Fetch comprehensive patient data including:
  - Basic demographics
  - Recent appointments
  - Medical history
  - Physical attributes
- Include this patient context in medical guidance

---

## Write Operations

### **Limited Write Capabilities**

The assistant has **VERY LIMITED** write capabilities:

#### ✅ **Allowed Write Operations:**
1. **Appointment Booking (INSERT only)**
   - Can create new appointments via `generate_insert_sql_for_appointment()`
   - Requires explicit permission (`allow_insert=True`)
   - Only works for appointment creation
   - Automatically handles patient creation if patient doesn't exist

**Note**: While the dashboard modules support creating/updating prescriptions and appointments through the UI, the assistant itself is primarily read-only and cannot directly create or modify these records through chat queries. The assistant can only read and query this data.

#### ❌ **Blocked Write Operations:**
The assistant **CANNOT** perform:
- **UPDATE** operations (updating existing records)
- **DELETE** operations (deleting records)
- **DROP** operations (dropping tables/databases)
- **CREATE** operations (creating tables/databases)
- **ALTER** operations (modifying table structures)
- **TRUNCATE** operations (clearing tables)

**SQL Validation:**
- All SQL queries are validated before execution
- Dangerous keywords are blocked (UPDATE, DELETE, DROP, CREATE, ALTER, TRUNCATE)
- SQL injection patterns are detected and blocked
- Only SELECT queries are allowed by default
- INSERT queries require explicit permission

---

## What Information Can Be Fetched from Doctor Dashboard?

### **Available Data Sources:**

1. **Patient Database**
   - All patient records
   - Patient demographics and contact information
   - Medical history and conditions
   - Physical attributes and vitals

2. **Appointment System**
   - All appointment records
   - Appointment schedules
   - Appointment history
   - Appointment status and reasons

3. **Doctor & Department Data**
   - Doctor profiles and information
   - Department structures
   - Doctor-patient relationships

4. **Admission Records**
   - Hospital admissions
   - Diagnosis information
   - Admission/discharge dates
   - Room assignments

### **Query Examples for Doctor Dashboard:**

**Patient Queries:**
- "Show me all patients with diabetes"
- "Find patient John Smith's medical history"
- "What are the conditions for patient PAT-12345?"
- "List patients seen by Dr. Johnson"

**Appointment Module Queries:**
- "Show me my upcoming appointments"
- "What appointments do I have today?"
- "List all completed appointments this month"
- "Show appointments for patient John Smith"
- "What are my appointments at facility X?"
- "Show me appointments with status 'pending'"

**Prescription Module Queries:**
- "Show me all prescriptions I've created"
- "List prescriptions for patient PAT-12345"
- "What prescriptions did I create this month?"
- "Show prescription details for prescription ID 123"
- "How many prescriptions have I issued?"

**Medicine Lookup Queries:**
- "What are the symptoms of diabetes?"
- "What treatments are available for hypertension?"
- "Show me information about common cold"
- "What causes migraines?"
- "What are common treatments for fever?"

**Reports & Analytics Queries:**
- "What are my appointment statistics for this month?"
- "How many prescriptions did I create this year?"
- "Show me appointment trends for the last week"
- "What's the breakdown of appointments by status?"
- "Generate a report of my practice analytics"
- "Show me completed vs pending appointments"
- "What are my prescription trends?"

**Analytics Queries:**
- "How many patients were seen this month?"
- "What are the most common conditions?"
- "Show appointment statistics by department"

---

## Limitations & Restrictions

### **Safety Restrictions:**
1. **No Data Modification**: Cannot update or delete existing records
2. **Read-Only by Default**: Only SELECT queries allowed
3. **Query Limits**: Results limited to 100 records maximum
4. **SQL Validation**: All queries validated for safety
5. **No File System Access**: Cannot access files outside the database
6. **No External API Calls**: Cannot make external API requests

### **Capability Restrictions:**
1. **No Lab Interpretation**: Cannot interpret lab values (use Lab mode)
2. **No Radiology Interpretation**: Cannot interpret imaging (use Radiology mode)
3. **No Direct Patient Communication**: Cannot send messages to patients
4. **No Prescription Writing**: Cannot directly create prescriptions
5. **No Billing Operations**: Cannot access or modify billing data

### **Context Limitations:**
1. **Session-Based**: Context is session-specific
2. **No Cross-User Access**: Cannot access other users' data
3. **Limited Patient Context**: Patient info must be explicitly provided or detected from query

---

## Technical Implementation

### **Backend Components:**
- **Route**: `/api/chat/stream` (POST)
- **Capability**: `'general'`
- **Model**: GPT-4.1 (OpenAI)
- **Database Agent**: `DatabaseAgent` class
- **Context Manager**: Manages conversation history and patient context

### **Frontend Components:**
- **Component**: `ChatInterface.tsx`
- **Storage**: Messages saved to `localStorage` as `general_practitioner_chat_messages`
- **Quick Actions**: Pre-defined quick action buttons for common queries

### **Database Access:**
- **Connection**: MySQL database via PyMySQL
- **Schema**: Dynamically retrieved and cached
- **Query Generation**: AI-generated SQL from natural language
- **Validation**: Multi-layer SQL validation for safety

---

## Quick Action Buttons

The assistant provides quick action buttons for:
1. **Treatment Protocols** - Latest treatment protocols for common conditions
2. **Diagnostic Help** - Understanding diagnostic criteria
3. **Care Management** - Best practices for patient care management
4. **General Help** - General medical questions

---

## Future Enhancement Opportunities

Potential areas for expansion:
1. **Enhanced Write Operations**: Controlled UPDATE operations for specific use cases
2. **Prescription Management**: Integration with prescription system
3. **Lab Result Integration**: Direct access to lab results
4. **Radiology Integration**: Direct access to imaging studies
5. **Patient Communication**: Secure messaging to patients
6. **Analytics Dashboard**: Advanced analytics and reporting
7. **Multi-Patient Context**: Handle multiple patients in one session
8. **Document Generation**: Generate medical reports and summaries

---

## Security & Privacy

1. **SQL Injection Protection**: All queries validated and sanitized
2. **Read-Only by Default**: Prevents accidental data modification
3. **User Authentication**: Requires user email for session management
4. **Session Isolation**: Each session is isolated
5. **Query Logging**: All queries logged for audit purposes
6. **Error Handling**: Comprehensive error handling and logging

---

## Summary

The General Health Assistant is a **read-focused** medical AI assistant that:
- ✅ Provides medical information and guidance
- ✅ Queries patient and appointment data
- ✅ Fetches comprehensive patient information
- ✅ Generates safe SQL queries from natural language
- ❌ Cannot modify existing data (UPDATE/DELETE)
- ❌ Cannot create new records except appointments (with permission)
- ❌ Cannot access external systems or APIs

It's designed to be a **clinical decision support tool** that assists healthcare professionals with information retrieval and medical guidance while maintaining strict data safety protocols.

