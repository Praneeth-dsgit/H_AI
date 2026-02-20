# Frontend Components Location Guide

## 📍 Where to Find Frontend Components for New Features

### ✅ **Created Components** (Ready to Use)

#### 1. **Patient Dashboard**
- **Location**: `AI_Chat/frontend/src/components/patient/PatientDashboard.tsx`
- **Purpose**: Main dashboard showing patient overview, stats, upcoming appointments
- **Features**:
  - Patient profile summary
  - Quick stats (appointments, records, bills)
  - Upcoming appointments list
  - Family members summary
  - Quick action buttons
- **Status**: ✅ Created, needs routing integration

#### 2. **Family Members Management**
- **Location**: `AI_Chat/frontend/src/components/patient/FamilyMembers.tsx`
- **Purpose**: Manage family members linked to primary patient
- **Features**:
  - List all family members
  - Add new family member
  - Edit family member details
  - Delete family member
  - Book appointments for family members
- **Status**: ✅ Created, needs routing integration

---

### 📦 **Service Files** (API Integration)

#### 1. **Patient Service**
- **Location**: `AI_Chat/frontend/src/services/patientService.ts`
- **Purpose**: API calls for patient-related operations
- **Methods**:
  - `getProfile()` - Get patient profile
  - `updateProfile()` - Update patient profile
  - `getFamilyMembers()` - Get all family members
  - `addFamilyMember()` - Add new family member
  - `updateFamilyMember()` - Update family member
  - `deleteFamilyMember()` - Delete family member
- **Status**: ✅ Created

#### 2. **Appointment Service**
- **Location**: `AI_Chat/frontend/src/services/appointmentService.ts`
- **Purpose**: API calls for appointment booking
- **Methods**:
  - `bookAppointment()` - Book new appointment
  - `getAppointments()` - Get all appointments
  - `getAppointment()` - Get single appointment
  - `cancelAppointment()` - Cancel appointment
  - `rescheduleAppointment()` - Reschedule appointment
- **Status**: ✅ Created

---

### ❌ **Components Still Needed** (To Be Created)

#### 1. **Appointment Booking Component**
- **Should be at**: `AI_Chat/frontend/src/components/appointments/AppointmentBooking.tsx`
- **Needs**: Service file `appointmentService.ts` ✅ (already created)
- **Status**: ❌ Not created yet

#### 2. **Radiology Booking Component**
- **Should be at**: `AI_Chat/frontend/src/components/radiology/RadiologyBooking.tsx`
- **Needs**: Service file `radiologyService.ts`
- **Status**: ❌ Not created yet

#### 3. **Doctor Search Component**
- **Should be at**: `AI_Chat/frontend/src/components/doctors/DoctorSearch.tsx`
- **Needs**: Service file `doctorService.ts`
- **Status**: ❌ Not created yet

#### 4. **Facility Search Component**
- **Should be at**: `AI_Chat/frontend/src/components/facilities/FacilitySearch.tsx`
- **Needs**: Service file `facilityService.ts`
- **Status**: ❌ Not created yet

#### 5. **Medical Records Viewer**
- **Should be at**: `AI_Chat/frontend/src/components/records/MedicalRecords.tsx`
- **Needs**: Service file `recordService.ts`
- **Status**: ❌ Not created yet

#### 6. **Billing Dashboard**
- **Should be at**: `AI_Chat/frontend/src/components/billing/BillingDashboard.tsx`
- **Needs**: Service file `billingService.ts`
- **Status**: ❌ Not created yet

#### 7. **Patient Profile Editor**
- **Should be at**: `AI_Chat/frontend/src/components/patient/PatientProfile.tsx`
- **Needs**: Service file `patientService.ts` ✅ (already created)
- **Status**: ❌ Not created yet

---

## 🗂️ Current File Structure

```
AI_Chat/frontend/src/
├── components/
│   ├── patient/
│   │   ├── PatientDashboard.tsx ✅ CREATED
│   │   ├── FamilyMembers.tsx ✅ CREATED
│   │   └── PatientProfile.tsx ❌ NEEDS CREATION
│   ├── appointments/
│   │   └── AppointmentBooking.tsx ❌ NEEDS CREATION
│   ├── radiology/
│   │   └── RadiologyBooking.tsx ❌ NEEDS CREATION
│   ├── doctors/
│   │   └── DoctorSearch.tsx ❌ NEEDS CREATION
│   ├── facilities/
│   │   └── FacilitySearch.tsx ❌ NEEDS CREATION
│   ├── records/
│   │   └── MedicalRecords.tsx ❌ NEEDS CREATION
│   ├── billing/
│   │   └── BillingDashboard.tsx ❌ NEEDS CREATION
│   └── [existing components like Login.tsx, Signup.tsx, etc.]
├── services/
│   ├── patientService.ts ✅ CREATED
│   ├── appointmentService.ts ✅ CREATED
│   ├── radiologyService.ts ❌ NEEDS CREATION
│   ├── doctorService.ts ❌ NEEDS CREATION
│   ├── facilityService.ts ❌ NEEDS CREATION
│   ├── recordService.ts ❌ NEEDS CREATION
│   └── billingService.ts ❌ NEEDS CREATION
└── App.tsx (needs routing updates)
```

---

## 🔗 How to Access These Components

### Current Status:
- **Components Created**: 2 (PatientDashboard, FamilyMembers)
- **Service Files Created**: 2 (patientService, appointmentService)
- **Routing**: ❌ Not yet integrated into App.tsx

### To Use the Created Components:

1. **Add Routes in App.tsx**:
   ```typescript
   import PatientDashboard from './components/patient/PatientDashboard';
   import FamilyMembers from './components/patient/FamilyMembers';
   
   // Inside Routes:
   <Route path="/dashboard" element={<PatientDashboard />} />
   <Route path="/family" element={<FamilyMembers />} />
   ```

2. **Add Navigation Links in Header.tsx**:
   - Add menu items to navigate to `/dashboard` and `/family`

3. **Ensure Patient ID is Stored**:
   - After login/OTP verification, store `patient_id` in localStorage
   - Components use `localStorage.getItem('patient_id')` to get Patient ID

---

## 📝 Next Steps to Complete Frontend

1. **Create Remaining Service Files** (6 files)
   - `radiologyService.ts`
   - `doctorService.ts`
   - `facilityService.ts`
   - `recordService.ts`
   - `billingService.ts`

2. **Create Remaining Components** (7 components)
   - Appointment Booking
   - Radiology Booking
   - Doctor Search
   - Facility Search
   - Medical Records
   - Billing Dashboard
   - Patient Profile Editor

3. **Update Routing** (in `App.tsx`)
   - Add routes for all new components
   - Create nested routes if needed

4. **Update Header Navigation** (in `Header.tsx`)
   - Add menu items for new pages
   - Add icons and navigation links

5. **Update Types** (in `types.ts`)
   - Add TypeScript interfaces for new data structures

---

## 🎯 Quick Reference

**Where are the NEW frontend components?**
- ✅ **Patient Dashboard**: `frontend/src/components/patient/PatientDashboard.tsx`
- ✅ **Family Members**: `frontend/src/components/patient/FamilyMembers.tsx`
- ✅ **Patient Service**: `frontend/src/services/patientService.ts`
- ✅ **Appointment Service**: `frontend/src/services/appointmentService.ts`

**What's missing?**
- ❌ Routing integration in `App.tsx`
- ❌ Navigation links in `Header.tsx`
- ❌ Remaining 7 components (see list above)
- ❌ Remaining 5 service files (see list above)

---

## 📚 Related Documentation

- **Backend API Guide**: `AI_Chat/api/IMPLEMENTATION_GUIDE.md`
- **Database Schema**: `AI_Chat/api/DATABASE_SCHEMA.md`
- **Quick Start**: `AI_Chat/api/QUICK_START.md`
- **Frontend Status**: `AI_Chat/FRONTEND_IMPLEMENTATION_STATUS.md`

