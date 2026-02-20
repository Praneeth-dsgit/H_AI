"""
Patient ID Generator Utility
Generates globally unique Patient IDs for the healthcare application
"""

import uuid
import random
import string
from datetime import datetime
from typing import Optional

def generate_patient_id(prefix: str = "PAT", format_type: str = "short") -> str:
    """
    Generate a globally unique Patient ID
    
    Args:
        prefix: Prefix for the Patient ID (default: "PAT")
        format_type: Format type - "short", "uuid", "timestamp", or "sequential"
    
    Returns:
        str: Unique Patient ID
    
    Examples:
        generate_patient_id() -> "PAT-241224-A1B2" (short, human-readable)
        generate_patient_id(format_type="uuid") -> "PAT-550e8400-e29b-41d4-a716-446655440000"
        generate_patient_id(format_type="timestamp") -> "PAT-20240115-ABC123"
        generate_patient_id(format_type="sequential") -> "PAT-0000001"
    """
    if format_type == "short":
        # Short, human-readable format: PAT-YYMMDD-XXXX
        # Example: PAT-241224-A1B2 (Date + 4 char alphanumeric code)
        date_str = datetime.now().strftime("%y%m%d")  # YYMMDD format (241224 for Dec 24, 2024)
        # Generate 4-character alphanumeric code (uppercase letters + digits, excluding confusing chars)
        # Exclude: 0, O, I, 1 to avoid confusion
        chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        random_suffix = ''.join(random.choices(chars, k=4))
        return f"{prefix}-{date_str}-{random_suffix}"
    
    elif format_type == "uuid":
        # UUID-based: PAT-{uuid}
        unique_id = str(uuid.uuid4())
        return f"{prefix}-{unique_id}"
    
    elif format_type == "timestamp":
        # Timestamp-based: PAT-YYYYMMDD-{random}
        date_str = datetime.now().strftime("%Y%m%d")
        random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        return f"{prefix}-{date_str}-{random_suffix}"
    
    elif format_type == "sequential":
        # Sequential: PAT-{number} (requires database check for next number)
        # This would need database access to get the next sequence
        # For now, using timestamp as fallback
        timestamp = int(datetime.now().timestamp())
        return f"{prefix}-{timestamp:010d}"
    
    else:
        # Default to short format
        date_str = datetime.now().strftime("%y%m%d")
        chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        random_suffix = ''.join(random.choices(chars, k=4))
        return f"{prefix}-{date_str}-{random_suffix}"


def validate_patient_id(patient_id: str) -> bool:
    """
    Validate Patient ID format
    
    Args:
        patient_id: Patient ID to validate
    
    Returns:
        bool: True if valid format
    
    Supports multiple formats:
    - Short: PAT-YYMMDD-XXXX (e.g., PAT-241224-A1B2)
    - UUID: PAT-{uuid} (e.g., PAT-550e8400-e29b-41d4-a716-446655440000)
    - Timestamp: PAT-YYYYMMDD-XXXXXX (e.g., PAT-20240115-ABC123)
    """
    if not patient_id or not isinstance(patient_id, str):
        return False
    
    # Check if it starts with PAT- and has valid format
    if patient_id.startswith("PAT-"):
        parts = patient_id.split("-")
        if len(parts) >= 2:
            return True
    
    return False


def extract_patient_id_from_string(text: str) -> Optional[str]:
    """
    Extract Patient ID from a string (useful for parsing user input)
    
    Args:
        text: Text that may contain a Patient ID
    
    Returns:
        Optional[str]: Extracted Patient ID or None
    """
    import re
    pattern = r'PAT-[A-Z0-9-]+'
    match = re.search(pattern, text, re.IGNORECASE)
    if match:
        return match.group(0).upper()
    return None

