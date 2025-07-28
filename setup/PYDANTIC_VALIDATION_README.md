# Pydantic Data Validation Guide

This guide explains how to use Pydantic for data validation in the Healthcare Chatbot API.

## What is Pydantic?

Pydantic is a Python library for data validation using Python type annotations. It provides:

- **Automatic data validation** based on type hints
- **Data serialization/deserialization** (JSON, dict, etc.)
- **Self-documenting APIs** with automatic schema generation
- **IDE support** with autocomplete and type checking
- **Error handling** with detailed validation error messages

## Installation

Pydantic is already added to `requirements.txt`:

```bash
pip install pydantic==2.5.0
```

## Key Features

### 1. Type Validation
```python
from pydantic import BaseModel, Field
from typing import Optional

class PatientInfo(BaseModel):
    age: int = Field(..., ge=0, le=150)  # Must be between 0-150
    weight: float = Field(..., ge=0, le=500)  # Must be between 0-500 kg
    height: float = Field(..., ge=0, le=300)  # Must be between 0-300 cm
    gender: str = Field(..., pattern='^(male|female|other)$')
    blood_pressure: Optional[str] = Field(None, max_length=50)
```

### 2. Custom Validators
```python
from pydantic import field_validator, model_validator

class PatientInfo(BaseModel):
    age: int
    weight: float
    height: float
    
    @field_validator('blood_pressure')
    @classmethod
    def validate_blood_pressure(cls, v):
        if v is not None:
            if not v.replace('/', '').replace(' ', '').isdigit():
                raise ValueError('Blood pressure should be in format "systolic/diastolic"')
        return v
    
    @model_validator(mode='after')
    def validate_bmi(self):
        weight = self.weight
        height = self.height
        if weight and height and height > 0:
            bmi = weight / ((height / 100) ** 2)
            if bmi > 100:  # Unrealistic BMI
                raise ValueError('Invalid weight/height combination')
        return self
```

### 3. Enums for Type Safety
```python
from enum import Enum

class CapabilityType(str, Enum):
    GENERAL = "general"
    RADIOLOGY = "radiology"
    LAB = "lab"
    ENGAGEMENT = "engagement"

class ChatRequest(BaseModel):
    message: str
    capability: CapabilityType = Field(default=CapabilityType.GENERAL)
```

## Usage in Flask Routes

### 1. Using Decorators (Recommended)

```python
from validation_utils import validate_request, handle_validation_errors
from models import ChatRequest, PatientInfo

@app.route('/api/chat/stream', methods=['POST'])
@validate_request(ChatRequest)
def chat_stream():
    # Access validated data
    chat_request = request.validated_data
    
    # Use validated data
    message = chat_request.message
    patient_info = chat_request.patient_info
    capability = chat_request.capability
    
    # Process the request...
    return Response(generate_stream(), mimetype='text/plain')

@app.route('/api/patient-info', methods=['POST'])
@handle_validation_errors
def update_patient_info():
    data = request.get_json()
    
    # Validate patient data
    patient_info = PatientInfo(**data)
    
    # Process validated data...
    return jsonify({
        'success': True,
        'data': patient_info.dict()
    })
```

### 2. Manual Validation

```python
from pydantic import ValidationError

@app.route('/api/upload', methods=['POST'])
def upload_file():
    try:
        # Validate form data
        upload_data = {
            'session_id': request.form.get('sessionId'),
            'capability': request.form.get('capability', 'general')
        }
        
        validated_upload = FileUploadRequest(**upload_data)
        
        # Process file upload...
        return jsonify({'success': True})
        
    except ValidationError as e:
        return jsonify({
            'success': False,
            'error': 'Validation error',
            'details': e.errors()
        }), 400
```

## Available Models

### Patient Information
- `PatientInfo`: Validates patient demographic and medical data
- Includes BMI calculation and blood pressure format validation

### Chat & Messaging
- `ChatRequest`: Validates chat message requests
- `ChatMessage`: Validates individual chat messages
- `ChatResponse`: Validates AI response data

### User Authentication
- `UserSignup`: Validates user registration with password strength
- `UserLogin`: Validates login credentials
- `OTPVerification`: Validates OTP codes

### Patient Engagement
- `AppointmentReminder`: Validates appointment reminder data
- `MedicationReminder`: Validates medication reminder data
- `NotificationRequest`: Validates notification requests

### File Upload
- `FileUploadRequest`: Validates file upload metadata
- `FileUploadResponse`: Validates upload response data

## Healthcare-Specific Validation

### Custom Validators
```python
from models import HealthcareValidator

# BMI validation
bmi = HealthcareValidator.validate_bmi(weight=70, height=175)

# Blood pressure validation
HealthcareValidator.validate_blood_pressure(systolic=120, diastolic=80)

# Age validation for specific capabilities
HealthcareValidator.validate_age_for_capability(age=35, capability=CapabilityType.RADIOLOGY)
```

### File Type Validation
```python
from validation_utils import validate_file_upload_data

# Validate file based on capability
validated_file = validate_file_upload_data(
    file=request.files['file'],
    capability='radiology'  # Only allows images
)
```

## Error Handling

### Validation Error Response Format
```json
{
    "success": false,
    "error": "Validation error",
    "details": [
        {
            "loc": ["age"],
            "msg": "ensure this value is greater than 0",
            "type": "value_error.number.not_gt"
        }
    ]
}
```

### Custom Error Messages
```python
from pydantic import Field

class PatientInfo(BaseModel):
    age: int = Field(
        ..., 
        ge=0, 
        le=150,
        description="Patient age in years",
        error_messages={
            "ge": "Age must be 0 or greater",
            "le": "Age cannot exceed 150 years"
        }
    )
```

## Testing Validation

Run the test suite to see validation examples:

```bash
cd api
python test_pydantic_validation.py
```

This will demonstrate:
- Valid and invalid data examples
- Custom validation rules
- Error message formats
- Serialization/deserialization

## Best Practices

### 1. Use Type Hints
```python
# Good
def process_patient(patient: PatientInfo) -> Dict[str, Any]:
    return patient.dict()

# Avoid
def process_patient(patient):
    return patient
```

### 2. Leverage Field Constraints
```python
class UserSignup(BaseModel):
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(
        ..., 
        min_length=8, 
        max_length=128,
        description="User password"
    )
```

### 3. Use Enums for Constants
```python
class GenderType(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class PatientInfo(BaseModel):
    gender: GenderType  # Type-safe gender field
```

### 4. Implement Custom Validators
```python
@field_validator('email')
@classmethod
def validate_email_domain(cls, v):
    if not v.endswith('@hospital.com'):
        raise ValueError('Only hospital email addresses allowed')
    return v
```

### 5. Handle Validation Errors Gracefully
```python
try:
    patient = PatientInfo(**data)
except ValidationError as e:
    logger.warning(f"Invalid patient data: {e.errors()}")
    return create_error_response("validation_error", "Invalid patient data", e.errors())
```

## Integration with Existing Code

To integrate Pydantic validation with your existing Flask routes:

1. **Import the models**:
   ```python
   from models import PatientInfo, ChatRequest
   ```

2. **Add validation decorators**:
   ```python
   from validation_utils import validate_request, handle_validation_errors
   ```

3. **Update route handlers** to use validated data:
   ```python
   @app.route('/api/chat/stream', methods=['POST'])
   @validate_request(ChatRequest)
   def chat_stream():
       chat_request = request.validated_data
       # Use validated data instead of raw request data
   ```

4. **Test thoroughly** with the provided test suite

## Benefits

- **Data Integrity**: Ensures all data meets expected formats and constraints
- **Security**: Prevents invalid data from reaching business logic
- **Documentation**: Self-documenting API schemas
- **Developer Experience**: Better IDE support and error messages
- **Maintainability**: Centralized validation logic
- **Healthcare Compliance**: Enforces medical data standards

## Next Steps

1. Install Pydantic: `pip install pydantic==2.5.0`
2. Run the test suite: `python test_pydantic_validation.py`
3. Integrate validation into your existing routes
4. Add custom validators for healthcare-specific requirements
5. Update API documentation to reflect validated schemas 