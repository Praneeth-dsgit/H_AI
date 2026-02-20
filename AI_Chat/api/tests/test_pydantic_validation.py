#!/usr/bin/env python3
"""
Test file demonstrating Pydantic validation usage
Run this file to see validation examples in action
"""

import json
from models import (
    PatientInfo, ChatRequest, UserSignup, OTPVerification,
    AppointmentReminder, HealthcareValidator, CapabilityType, GenderType
)
from pydantic import ValidationError

def test_patient_info_validation():
    """Test patient information validation"""
    print("=== Testing Patient Info Validation ===")
    
    # Valid patient data
    valid_patient_data = {
        "age": 35,
        "weight": 70.5,
        "height": 175.0,
        "gender": "male",
        "blood_pressure": "120/80",
        "allergies": "Penicillin",
        "medications": "Aspirin 100mg daily",
        "medical_history": "Hypertension, diabetes"
    }
    
    try:
        patient = PatientInfo(**valid_patient_data)
        print(f"✅ Valid patient data: {patient.dict()}")
        print(f"   BMI: {patient.weight / ((patient.height / 100) ** 2):.1f}")
    except ValidationError as e:
        print(f"❌ Validation error: {e.errors()}")
    
    # Invalid patient data examples
    invalid_examples = [
        {
            "name": "Invalid age",
            "data": {**valid_patient_data, "age": -5}
        },
        {
            "name": "Invalid weight",
            "data": {**valid_patient_data, "weight": 600}
        },
        {
            "name": "Invalid blood pressure format",
            "data": {**valid_patient_data, "blood_pressure": "invalid"}
        },
        {
            "name": "Invalid gender",
            "data": {**valid_patient_data, "gender": "unknown"}
        }
    ]
    
    for example in invalid_examples:
        try:
            patient = PatientInfo(**example["data"])
            print(f"❌ Should have failed: {example['name']}")
        except ValidationError as e:
            print(f"✅ Correctly caught error for {example['name']}: {e.errors()[0]['msg']}")

def test_chat_request_validation():
    """Test chat request validation"""
    print("\n=== Testing Chat Request Validation ===")
    
    # Valid chat request
    valid_chat_data = {
        "message": "What are the symptoms of diabetes?",
        "capability": "general",
        "session_id": "session_123"
    }
    
    try:
        chat_request = ChatRequest(**valid_chat_data)
        print(f"✅ Valid chat request: {chat_request.message}")
        print(f"   Capability: {chat_request.capability}")
    except ValidationError as e:
        print(f"❌ Validation error: {e.errors()}")
    
    # Invalid chat request
    try:
        invalid_chat = ChatRequest(message="", capability="invalid_capability")
        print("❌ Should have failed: empty message and invalid capability")
    except ValidationError as e:
        print(f"✅ Correctly caught chat request errors: {e.errors()}")

def test_user_authentication_validation():
    """Test user authentication validation"""
    print("\n=== Testing User Authentication Validation ===")
    
    # Valid signup data
    valid_signup = {
        "email": "doctor@hospital.com",
        "password": "SecurePass123!"
    }
    
    try:
        user = UserSignup(**valid_signup)
        print(f"✅ Valid signup: {user.email}")
    except ValidationError as e:
        print(f"❌ Validation error: {e.errors()}")
    
    # Invalid signup examples
    invalid_signups = [
        {
            "name": "Weak password",
            "data": {"email": "test@test.com", "password": "123"}
        },
        {
            "name": "Invalid email",
            "data": {"email": "invalid-email", "password": "SecurePass123!"}
        }
    ]
    
    for signup in invalid_signups:
        try:
            user = UserSignup(**signup["data"])
            print(f"❌ Should have failed: {signup['name']}")
        except ValidationError as e:
            print(f"✅ Correctly caught signup error for {signup['name']}: {e.errors()[0]['msg']}")

def test_appointment_reminder_validation():
    """Test appointment reminder validation"""
    print("\n=== Testing Appointment Reminder Validation ===")
    
    from datetime import date
    
    valid_appointment = {
        "patient_email": "patient@example.com",
        "appointment_date": "2024-02-15",
        "appointment_time": "14:30",
        "doctor_name": "Dr. Smith",
        "appointment_type": "General Checkup"
    }
    
    try:
        appointment = AppointmentReminder(**valid_appointment)
        print(f"✅ Valid appointment: {appointment.doctor_name} at {appointment.appointment_time}")
    except ValidationError as e:
        print(f"❌ Validation error: {e.errors()}")
    
    # Invalid appointment
    try:
        invalid_appointment = AppointmentReminder(
            patient_email="invalid-email",
            appointment_date="2024-02-15",
            appointment_time="25:00",  # Invalid time
            doctor_name="",
            appointment_type="Checkup"
        )
        print("❌ Should have failed: invalid email, time, and empty doctor name")
    except ValidationError as e:
        print(f"✅ Correctly caught appointment errors: {e.errors()}")

def test_healthcare_validator():
    """Test custom healthcare validation functions"""
    print("\n=== Testing Healthcare Validator ===")
    
    # Test BMI validation
    try:
        bmi = HealthcareValidator.validate_bmi(70, 175)
        print(f"✅ Valid BMI calculation: {bmi:.1f}")
    except ValueError as e:
        print(f"❌ BMI validation error: {e}")
    
    # Test invalid BMI
    try:
        HealthcareValidator.validate_bmi(200, 150)  # Unrealistic BMI
        print("❌ Should have failed: unrealistic BMI")
    except ValueError as e:
        print(f"✅ Correctly caught BMI error: {e}")
    
    # Test blood pressure validation
    try:
        HealthcareValidator.validate_blood_pressure(120, 80)
        print("✅ Valid blood pressure: 120/80")
    except ValueError as e:
        print(f"❌ Blood pressure validation error: {e}")
    
    # Test invalid blood pressure
    try:
        HealthcareValidator.validate_blood_pressure(80, 120)  # Diastolic > Systolic
        print("❌ Should have failed: diastolic > systolic")
    except ValueError as e:
        print(f"✅ Correctly caught blood pressure error: {e}")

def test_enum_validation():
    """Test enum validation"""
    print("\n=== Testing Enum Validation ===")
    
    # Test valid enum values
    valid_enums = [
        ("general", CapabilityType.GENERAL),
        ("radiology", CapabilityType.RADIOLOGY),
        ("lab", CapabilityType.LAB),
        ("engagement", CapabilityType.ENGAGEMENT)
    ]
    
    for value, enum in valid_enums:
        print(f"✅ Valid capability: {value} -> {enum}")
    
    # Test gender enums
    valid_genders = [
        ("male", GenderType.MALE),
        ("female", GenderType.FEMALE),
        ("other", GenderType.OTHER)
    ]
    
    for value, enum in valid_genders:
        print(f"✅ Valid gender: {value} -> {enum}")

def test_serialization():
    """Test JSON serialization and deserialization"""
    print("\n=== Testing Serialization ===")
    
    # Create a patient info object
    patient = PatientInfo(
        age=30,
        weight=65.0,
        height=170.0,
        gender=GenderType.FEMALE,
        blood_pressure="110/70"
    )
    
    # Serialize to JSON
    json_data = patient.json()
    print(f"✅ Serialized to JSON: {json_data}")
    
    # Deserialize from JSON
    try:
        deserialized_patient = PatientInfo.parse_raw(json_data)
        print(f"✅ Deserialized successfully: {deserialized_patient.dict()}")
    except ValidationError as e:
        print(f"❌ Deserialization error: {e.errors()}")

def main():
    """Run all validation tests"""
    print("🧪 Pydantic Validation Test Suite")
    print("=" * 50)
    
    test_patient_info_validation()
    test_chat_request_validation()
    test_user_authentication_validation()
    test_appointment_reminder_validation()
    test_healthcare_validator()
    test_enum_validation()
    test_serialization()
    
    print("\n" + "=" * 50)
    print("✅ All tests completed!")

if __name__ == "__main__":
    main() 