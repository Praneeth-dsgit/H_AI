import os
import requests
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from dotenv import load_dotenv
import pymysql
import os
import openai

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# WhatsApp Business API Configuration
WHATSAPP_API_URL = os.getenv('WHATSAPP_API_URL', 'https://graph.facebook.com/v17.0')
WHATSAPP_PHONE_NUMBER_ID = os.getenv('WHATSAPP_PHONE_NUMBER_ID')
WHATSAPP_ACCESS_TOKEN = os.getenv('WHATSAPP_ACCESS_TOKEN')

# Database configuration
DB_CONFIG = {
    "host": os.getenv('MYSQL_HOST', 'localhost'),
    "database": os.getenv('MYSQL_DATABASE', 'hospital_db'),
    "user": os.getenv('MYSQL_USER', 'root'),
    "password": os.getenv('MYSQL_PASSWORD', ''),
    "port": int(os.getenv('MYSQL_PORT', '3306')),
    "charset": "utf8mb4"
}

class WhatsAppNotifier:
    def __init__(self):
        self.api_url = WHATSAPP_API_URL
        self.phone_number_id = WHATSAPP_PHONE_NUMBER_ID
        self.access_token = WHATSAPP_ACCESS_TOKEN
        
        if not all([self.phone_number_id, self.access_token]):
            logger.warning("WhatsApp credentials not configured. Notifications will be logged only.")
    
    def send_message(self, phone_number: str, message: str) -> Dict:
        """Send a WhatsApp message to a specific phone number"""
        if not all([self.phone_number_id, self.access_token]):
            logger.info(f"WhatsApp message (not sent): {phone_number} - {message}")
            return {"success": False, "error": "WhatsApp not configured"}
        
        try:
            # Format phone number (remove + and add country code if needed)
            formatted_phone = self.format_phone_number(phone_number)
            
            url = f"{self.api_url}/{self.phone_number_id}/messages"
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "messaging_product": "whatsapp",
                "to": formatted_phone,
                "type": "text",
                "text": {"body": message}
            }
            
            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"WhatsApp message sent successfully to {phone_number}")
            return {"success": True, "message_id": result.get('messages', [{}])[0].get('id')}
            
        except Exception as e:
            logger.error(f"Error sending WhatsApp message: {e}")
            return {"success": False, "error": str(e)}
    
    def format_phone_number(self, phone: str) -> str:
        """Format phone number for WhatsApp API"""
        # Remove all non-digit characters
        digits_only = ''.join(filter(str.isdigit, phone))
        
        # If it starts with 0, replace with country code (assuming +91 for India)
        if digits_only.startswith('0'):
            digits_only = '91' + digits_only[1:]
        
        # If no country code, add +91 (you can modify this based on your region)
        if len(digits_only) == 10:
            digits_only = '91' + digits_only
        
        return digits_only
    
    def send_medication_reminder(self, patient_id: int, medication_name: str = None, dosage: str = None, time: str = None) -> Dict:
        """Send medication reminder to a patient with data from database"""
        try:
            patient_info = self.get_patient_info(patient_id)
            if not patient_info:
                return {"success": False, "error": "Patient not found"}
            
            # Get patient's current medications from database
            medications = self.get_patient_medications(patient_id)
            
            if not medications:
                # Fallback to provided parameters or generic message
                if medication_name and dosage and time:
                    message = self.format_medication_reminder_with_llm(
                        patient_info, 
                        [{'name': medication_name, 'dosage': dosage, 'time': time, 'instructions': 'As prescribed'}]
                    )
                else:
                    return {"success": False, "error": "No medications found for this patient"}
            else:
                # Use LLM to format the medication reminder with actual data
                message = self.format_medication_reminder_with_llm(patient_info, medications)
            
            return self.send_message(patient_info['phone'], message)
            
        except Exception as e:
            logger.error(f"Error sending medication reminder: {e}")
            return {"success": False, "error": str(e)}
    
    def send_appointment_reminder(self, appointment_id: int) -> Dict:
        """Send appointment reminder to a patient with enhanced LLM formatting"""
        try:
            appointment_info = self.get_appointment_info(appointment_id)
            if not appointment_info:
                return {"success": False, "error": "Appointment not found"}
            
            # Use LLM to format the appointment reminder with patient context
            message = self.format_appointment_reminder_with_llm(appointment_info)
            
            return self.send_message(appointment_info['patient_phone'], message)
            
        except Exception as e:
            logger.error(f"Error sending appointment reminder: {e}")
            return {"success": False, "error": str(e)}
    
    def send_followup_reminder(self, patient_id: int, followup_type: str, due_date: str) -> Dict:
        """Send follow-up reminder to a patient"""
        try:
            patient_info = self.get_patient_info(patient_id)
            if not patient_info:
                return {"success": False, "error": "Patient not found"}
            
            message = f"""🏥 Follow-up Reminder

Dear {patient_info['name']},

This is a reminder for your upcoming follow-up:

📋 Type: {followup_type}
📅 Due Date: {due_date}

Please schedule your follow-up appointment as soon as possible.

If you have any questions, please contact your healthcare provider.

Best regards,
Your Healthcare Team"""

            return self.send_message(patient_info['phone'], message)
            
        except Exception as e:
            logger.error(f"Error sending follow-up reminder: {e}")
            return {"success": False, "error": str(e)}
    
    def send_custom_notification(self, patient_identifier: str, message: str) -> Dict:
        """Send custom notification to a patient by ID or name"""
        try:
            patient_info = self.get_patient_by_identifier(patient_identifier)
            if not patient_info:
                return {"success": False, "error": "Patient not found"}
            
            return self.send_message(patient_info['phone'], message)
            
        except Exception as e:
            logger.error(f"Error sending custom notification: {e}")
            return {"success": False, "error": str(e)}
    
    def get_patient_info(self, patient_id: int) -> Optional[Dict]:
        """Get patient information from database"""
        try:
            conn = pymysql.connect(**DB_CONFIG)
            cursor = conn.cursor(pymysql.cursors.DictCursor)
            
            query = """
            SELECT id, name, phone, email 
            FROM patients 
            WHERE id = %s
            """
            
            cursor.execute(query, (patient_id,))
            result = cursor.fetchone()
            
            cursor.close()
            conn.close()
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting patient info: {e}")
            return None
    
    def get_patient_by_identifier(self, identifier: str) -> Optional[Dict]:
        """Get patient by ID or name"""
        try:
            conn = pymysql.connect(**DB_CONFIG)
            cursor = conn.cursor(pymysql.cursors.DictCursor)
            
            # Try as ID first, then as name
            if identifier.isdigit():
                query = "SELECT id, name, phone, email FROM patients WHERE id = %s"
                cursor.execute(query, (int(identifier),))
            else:
                query = "SELECT id, name, phone, email FROM patients WHERE name LIKE %s"
                cursor.execute(query, (f"%{identifier}%",))
            
            result = cursor.fetchone()
            
            cursor.close()
            conn.close()
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting patient by identifier: {e}")
            return None
    
    def get_appointment_info(self, appointment_id: int) -> Optional[Dict]:
        """Get appointment information from database"""
        try:
            conn = pymysql.connect(**DB_CONFIG)
            cursor = conn.cursor(pymysql.cursors.DictCursor)
            
            query = """
            SELECT 
                a.id,
                a.appointment_time,
                a.status,
                p.name as patient_name,
                p.phone as patient_phone,
                d.name as doctor_name,
                d.department
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN doctors d ON a.doctor_id = d.id
            WHERE a.id = %s
            """
            
            cursor.execute(query, (appointment_id,))
            result = cursor.fetchone()
            
            if result:
                # Format the appointment time
                appointment_time = result['appointment_time']
                if isinstance(appointment_time, datetime):
                    result['appointment_date'] = appointment_time.strftime('%B %d, %Y')
                    result['appointment_time'] = appointment_time.strftime('%I:%M %p')
            
            cursor.close()
            conn.close()
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting appointment info: {e}")
            return None
    
    def get_upcoming_appointments(self, hours_ahead: int = 24) -> List[Dict]:
        """Get appointments scheduled in the next X hours"""
        try:
            conn = pymysql.connect(**DB_CONFIG)
            cursor = conn.cursor(pymysql.cursors.DictCursor)
            
            query = """
            SELECT 
                a.id,
                a.appointment_time,
                p.name as patient_name,
                p.phone as patient_phone,
                d.name as doctor_name,
                d.department
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN doctors d ON a.doctor_id = d.id
            WHERE a.appointment_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL %s HOUR)
            AND a.status = 'confirmed'
            ORDER BY a.appointment_time
            """
            
            cursor.execute(query, (hours_ahead,))
            results = cursor.fetchall()
            
            cursor.close()
            conn.close()
            
            return results
            
        except Exception as e:
            logger.error(f"Error getting upcoming appointments: {e}")
            return []
    
    def send_bulk_appointment_reminders(self, hours_ahead: int = 24) -> Dict:
        """Send reminders for all upcoming appointments"""
        try:
            appointments = self.get_upcoming_appointments(hours_ahead)
            
            results = {
                "total_appointments": len(appointments),
                "successful_sends": 0,
                "failed_sends": 0,
                "errors": []
            }
            
            for appointment in appointments:
                result = self.send_appointment_reminder(appointment['id'])
                if result['success']:
                    results["successful_sends"] += 1
                else:
                    results["failed_sends"] += 1
                    results["errors"].append({
                        "appointment_id": appointment['id'],
                        "patient": appointment['patient_name'],
                        "error": result.get('error', 'Unknown error')
                    })
            
            logger.info(f"Bulk appointment reminders sent: {results}")
            return results
            
        except Exception as e:
            logger.error(f"Error sending bulk appointment reminders: {e}")
            return {"success": False, "error": str(e)}

    def get_patient_medications(self, patient_id: int) -> List[Dict]:
        """Get patient's current medications from database"""
        try:
            conn = pymysql.connect(**DB_CONFIG)
            cursor = conn.cursor(pymysql.cursors.DictCursor)
            
            # Try different possible table structures for medications
            medication_queries = [
                # Query 1: Standard prescriptions table
                """
                SELECT 
                    m.name as medication_name,
                    p.dosage,
                    p.frequency,
                    p.duration,
                    p.instructions,
                    p.prescribed_date,
                    d.name as doctor_name
                FROM prescriptions p
                JOIN medications m ON p.medication_id = m.id
                JOIN doctors d ON p.doctor_id = d.id
                WHERE p.patient_id = %s 
                AND p.status = 'active'
                ORDER BY p.prescribed_date DESC
                """,
                
                # Query 2: Simple medications table
                """
                SELECT 
                    medication_name,
                    dosage,
                    frequency,
                    instructions,
                    prescribed_date,
                    doctor_name
                FROM patient_medications
                WHERE patient_id = %s 
                AND status = 'active'
                ORDER BY prescribed_date DESC
                """,
                
                # Query 3: Basic prescriptions
                """
                SELECT 
                    medication,
                    dosage,
                    frequency,
                    instructions,
                    prescribed_date
                FROM prescriptions
                WHERE patient_id = %s 
                AND active = 1
                ORDER BY prescribed_date DESC
                """
            ]
            
            medications = []
            for query in medication_queries:
                try:
                    cursor.execute(query, (patient_id,))
                    results = cursor.fetchall()
                    if results:
                        medications = results
                        logger.info(f"Found {len(medications)} medications using query")
                        break
                except Exception as e:
                    logger.debug(f"Query failed: {e}")
                    continue
            
            cursor.close()
            conn.close()
            
            return medications
            
        except Exception as e:
            logger.error(f"Error getting patient medications: {e}")
            return []
    
    def get_patient_prescriptions(self, patient_id: int) -> List[Dict]:
        """Get patient's prescription history"""
        try:
            conn = pymysql.connect(**DB_CONFIG)
            cursor = conn.cursor(pymysql.cursors.DictCursor)
            
            query = """
            SELECT 
                p.id,
                p.prescription_date,
                p.diagnosis,
                p.notes,
                d.name as doctor_name,
                d.department
            FROM prescriptions p
            JOIN doctors d ON p.doctor_id = d.id
            WHERE p.patient_id = %s
            ORDER BY p.prescription_date DESC
            LIMIT 5
            """
            
            cursor.execute(query, (patient_id,))
            prescriptions = cursor.fetchall()
            
            cursor.close()
            conn.close()
            
            return prescriptions
            
        except Exception as e:
            logger.error(f"Error getting patient prescriptions: {e}")
            return []
    
    def format_medication_reminder_with_llm(self, patient_info: Dict, medications: List[Dict]) -> str:
        """Use LLM to format medication reminder with actual patient data"""
        try:
            # Prepare context for LLM
            context = {
                'patient_name': patient_info['name'],
                'medications': medications,
                'current_time': datetime.now().strftime('%I:%M %p'),
                'current_date': datetime.now().strftime('%B %d, %Y')
            }
            
            prompt = f"""
You are a healthcare assistant creating a personalized medication reminder message for a patient.

Patient Information:
- Name: {context['patient_name']}
- Current Date: {context['current_date']}
- Current Time: {context['current_time']}

Patient's Current Medications:
{json.dumps(medications, indent=2, default=str)}

Create a warm, professional, and personalized medication reminder message that:

1. Addresses the patient by name
2. Lists their specific medications with dosages and instructions
3. Includes timing information (morning, afternoon, evening, etc.)
4. Provides clear, easy-to-understand instructions
5. Uses appropriate medical terminology but keeps it patient-friendly
6. Includes safety reminders and what to do if they miss a dose
7. Encourages them to contact their healthcare provider if they have questions
8. Uses emojis appropriately for better readability
9. Maintains a caring, professional tone

Format the message as a WhatsApp message that's easy to read on mobile devices.
Include line breaks and spacing for better readability.

Return only the formatted message, no additional text or explanations.
"""

            # Call OpenAI API
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a healthcare assistant that creates personalized medication reminder messages."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=800,
                temperature=0.3
            )
            
            formatted_message = response.choices[0].message['content'].strip()
            logger.info(f"LLM formatted medication reminder for {patient_info['name']}")
            
            return formatted_message
            
        except Exception as e:
            logger.error(f"Error formatting medication reminder with LLM: {e}")
            # Fallback to basic formatting
            return self.format_basic_medication_reminder(patient_info, medications)
    
    def format_basic_medication_reminder(self, patient_info: Dict, medications: List[Dict]) -> str:
        """Fallback basic formatting for medication reminders"""
        message = f"""🏥 Medication Reminder

Dear {patient_info['name']},

This is a reminder to take your medications:

"""
        
        for i, med in enumerate(medications, 1):
            message += f"{i}. 💊 {med.get('medication_name', med.get('medication', 'Medication'))}\n"
            message += f"   📏 Dosage: {med.get('dosage', 'As prescribed')}\n"
            message += f"   ⏰ Frequency: {med.get('frequency', 'As directed')}\n"
            if med.get('instructions'):
                message += f"   📋 Instructions: {med['instructions']}\n"
            message += "\n"
        
        message += """Please take your medications as prescribed by your doctor.

If you have any questions or concerns, please contact your healthcare provider.

Best regards,
Your Healthcare Team"""
        
        return message
    
    def format_appointment_reminder_with_llm(self, appointment_info: Dict) -> str:
        """Use LLM to format appointment reminder with enhanced details"""
        try:
            # Get additional patient context
            patient_medications = self.get_patient_medications(appointment_info.get('patient_id'))
            recent_prescriptions = self.get_patient_prescriptions(appointment_info.get('patient_id'))
            
            context = {
                'appointment': appointment_info,
                'medications': patient_medications,
                'recent_prescriptions': recent_prescriptions,
                'current_time': datetime.now().strftime('%I:%M %p'),
                'current_date': datetime.now().strftime('%B %d, %Y')
            }
            
            prompt = f"""
You are a healthcare assistant creating a personalized appointment reminder message.

Appointment Information:
{json.dumps(appointment_info, indent=2, default=str)}

Patient's Current Medications:
{json.dumps(patient_medications, indent=2, default=str)}

Recent Prescriptions:
{json.dumps(recent_prescriptions, indent=2, default=str)}

Current Date/Time: {context['current_date']} at {context['current_time']}

Create a comprehensive, personalized appointment reminder that:

1. Addresses the patient by name warmly
2. Provides clear appointment details (doctor, department, date, time)
3. Includes preparation instructions based on their medical history
4. Reminds them to bring relevant documents or medications
5. Mentions any special instructions based on their current medications
6. Provides contact information for rescheduling
7. Uses appropriate emojis for better readability
8. Maintains a caring, professional tone
9. Includes arrival time recommendation (15 minutes early)

Format as a WhatsApp message that's easy to read on mobile devices.
Include line breaks and spacing for better readability.

Return only the formatted message, no additional text or explanations.
"""

            # Call OpenAI API
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a healthcare assistant that creates personalized appointment reminder messages."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=800,
                temperature=0.3
            )
            
            formatted_message = response.choices[0].message['content'].strip()
            logger.info(f"LLM formatted appointment reminder for {appointment_info.get('patient_name', 'patient')}")
            
            return formatted_message
            
        except Exception as e:
            logger.error(f"Error formatting appointment reminder with LLM: {e}")
            # Fallback to basic formatting
            return self.format_basic_appointment_reminder(appointment_info)
    
    def format_basic_appointment_reminder(self, appointment_info: Dict) -> str:
        """Fallback basic formatting for appointment reminders"""
        return f"""🏥 Appointment Reminder

Dear {appointment_info['patient_name']},

This is a reminder for your upcoming appointment:

👨‍⚕️ Doctor: Dr. {appointment_info['doctor_name']}
🏥 Department: {appointment_info['department']}
📅 Date: {appointment_info['appointment_date']}
⏰ Time: {appointment_info['appointment_time']}
📍 Location: Main Hospital

Please arrive 15 minutes before your scheduled time.

If you need to reschedule, please contact us at least 24 hours in advance.

Best regards,
Your Healthcare Team"""

# Global instance
whatsapp_notifier = WhatsAppNotifier() 