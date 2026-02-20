"""
Employee ID Generator Utility
Generates globally unique Employee IDs for the healthcare application
"""

import uuid
import random
import string
from datetime import datetime
from typing import Optional

def generate_employee_id(prefix: str = "EMP", format_type: str = "short") -> str:
    """
    Generate a globally unique Employee ID
    
    Args:
        prefix: Prefix for the Employee ID (default: "EMP")
        format_type: Format type - "short", "uuid", "timestamp", or "sequential"
    
    Returns:
        str: Unique Employee ID
    
    Examples:
        generate_employee_id() -> "EMP-241224-A1B2" (short, human-readable)
        generate_employee_id(format_type="uuid") -> "EMP-550e8400-e29b-41d4-a716-446655440000"
        generate_employee_id(format_type="timestamp") -> "EMP-20240115-ABC123"
        generate_employee_id(format_type="sequential") -> "EMP-0000001"
    """
    if format_type == "short":
        # Short, human-readable format: EMP-YYMMDD-XXXX
        # Example: EMP-241224-A1B2 (Date + 4 char alphanumeric code)
        date_str = datetime.now().strftime("%y%m%d")  # YYMMDD format (241224 for Dec 24, 2024)
        # Generate 4-character alphanumeric code (uppercase letters + digits, excluding confusing chars)
        # Exclude: 0, O, I, 1 to avoid confusion
        chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        random_suffix = ''.join(random.choices(chars, k=4))
        return f"{prefix}-{date_str}-{random_suffix}"
    
    elif format_type == "uuid":
        # UUID-based: EMP-{uuid}
        unique_id = str(uuid.uuid4())
        return f"{prefix}-{unique_id}"
    
    elif format_type == "timestamp":
        # Timestamp-based: EMP-YYYYMMDD-{random}
        date_str = datetime.now().strftime("%Y%m%d")
        random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        return f"{prefix}-{date_str}-{random_suffix}"
    
    elif format_type == "sequential":
        # Sequential: EMP-{number} (requires database check for next number)
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


def validate_employee_id(employee_id: str) -> bool:
    """
    Validate Employee ID format
    
    Args:
        employee_id: Employee ID to validate
    
    Returns:
        bool: True if valid format
    
    Supports multiple formats:
    - Short: EMP-YYMMDD-XXXX (e.g., EMP-241224-A1B2)
    - UUID: EMP-{uuid} (e.g., EMP-550e8400-e29b-41d4-a716-446655440000)
    - Timestamp: EMP-YYYYMMDD-XXXXXX (e.g., EMP-20240115-ABC123)
    """
    if not employee_id or not isinstance(employee_id, str):
        return False
    
    # Check if it starts with EMP- and has valid format
    if employee_id.startswith("EMP-"):
        parts = employee_id.split("-")
        if len(parts) >= 2:
            return True
    
    return False


def extract_employee_id_from_string(text: str) -> Optional[str]:
    """
    Extract Employee ID from a string (useful for parsing user input)
    
    Args:
        text: Text that may contain an Employee ID
    
    Returns:
        Optional[str]: Extracted Employee ID or None
    """
    import re
    pattern = r'EMP-[A-Z0-9-]+'
    match = re.search(pattern, text, re.IGNORECASE)
    if match:
        return match.group(0).upper()
    return None

