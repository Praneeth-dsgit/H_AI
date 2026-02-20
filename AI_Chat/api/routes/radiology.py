"""
Radiology Booking Routes
Handles radiology booking management.
Uses JWT for auth; identity from Authorization: Bearer <accessToken>.
"""
from flask import Blueprint, request, jsonify, g
import logging
import traceback
from config import db
from utils.jwt_utils import require_jwt

logger = logging.getLogger(__name__)

# Create blueprint
radiology_bp = Blueprint('radiology', __name__, url_prefix='/api/radiology')

@radiology_bp.route('/bookings', methods=['GET', 'POST', 'OPTIONS'])
@require_jwt
def radiology_bookings():
    """Get all radiology bookings or create a new one"""
    if request.method == 'GET':
        return get_radiology_bookings()
    elif request.method == 'OPTIONS':
        return jsonify({}), 200
    else:
        return create_radiology_booking()

def get_radiology_bookings():
    """Get all radiology bookings for the patient"""
    try:
        patient_id = g.patient_id
        if not patient_id:
            return jsonify({
                'success': False,
                'error': 'No patient record for this user'
            }), 400
        
        # Get all radiology bookings for the patient
        bookings_result = db.session.execute(
            db.text("""
                SELECT 
                    rb.booking_id,
                    rb.patient_id,
                    rb.family_member_id,
                    rb.facility_id,
                    rb.scan_type,
                    rb.body_part,
                    rb.appointment_date,
                    rb.appointment_time,
                    rb.referring_doctor_id,
                    rb.reason,
                    rb.status,
                    rb.report_available,
                    rb.report_url,
                    rb.created_at,
                    f.name as facility_name,
                    fm.first_name as family_member_first_name,
                    fm.last_name as family_member_last_name,
                    d.first_name as doctor_first_name,
                    d.last_name as doctor_last_name
                FROM radiology_bookings rb
                LEFT JOIN facilities f ON rb.facility_id = f.facility_id
                LEFT JOIN family_members fm ON rb.family_member_id = fm.family_member_id
                LEFT JOIN doctors d ON rb.referring_doctor_id = d.doctor_id
                WHERE rb.patient_id = :patient_id
                ORDER BY rb.appointment_date DESC, rb.appointment_time DESC
            """),
            {'patient_id': patient_id}
        ).fetchall()
        
        bookings = []
        for row in bookings_result:
            booking = dict(row._mapping) if hasattr(row, '_mapping') else dict(zip(row.keys(), row))
            
            # Convert date and time to strings
            if booking.get('appointment_date'):
                booking['appointment_date'] = booking['appointment_date'].isoformat() if hasattr(booking['appointment_date'], 'isoformat') else str(booking['appointment_date'])
            if booking.get('appointment_time'):
                if hasattr(booking['appointment_time'], 'isoformat'):
                    booking['appointment_time'] = booking['appointment_time'].isoformat()
                elif isinstance(booking['appointment_time'], str):
                    booking['appointment_time'] = booking['appointment_time']
                else:
                    booking['appointment_time'] = str(booking['appointment_time'])
            if booking.get('created_at'):
                booking['created_at'] = booking['created_at'].isoformat() if hasattr(booking['created_at'], 'isoformat') else str(booking['created_at'])
            
            bookings.append(booking)
        
        return jsonify({
            'success': True,
            'bookings': bookings
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching radiology bookings: {e}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': f'Failed to fetch radiology bookings: {str(e)}'
        }), 500

def create_radiology_booking():
    """Create a new radiology booking"""
    try:
        patient_id = g.patient_id
        if not patient_id:
            return jsonify({
                'success': False,
                'error': 'No patient record for this user'
            }), 400
        
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request body is required'
            }), 400
        
        logger.info(f"Radiology booking request received: {data}")
        
        # Validate required fields
        required_fields = ['facility_id', 'scan_type', 'appointment_date', 'appointment_time']
        for field in required_fields:
            if not data.get(field):
                logger.error(f"Missing required field: {field}")
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Use patient_id from header if not provided in body
        booking_patient_id = data.get('patient_id') or patient_id
        if not booking_patient_id:
            return jsonify({
                'success': False,
                'error': 'Patient ID is required. Please ensure you are logged in.'
            }), 400
        
        family_member_id = data.get('family_member_id')
        facility_id = data.get('facility_id')
        scan_type = data.get('scan_type')
        body_part = data.get('body_part')
        appointment_date = data.get('appointment_date')
        appointment_time = data.get('appointment_time')
        referring_doctor_id = data.get('referring_doctor_id')
        reason = data.get('reason')
        
        # Ensure time is in HH:MM:SS format
        if appointment_time and len(appointment_time) == 5:  # HH:MM format
            appointment_time = f"{appointment_time}:00"
        
        logger.info(f"Creating radiology booking for patient {booking_patient_id}, facility {facility_id}, date {appointment_date}, time {appointment_time}")
        
        # Insert radiology booking
        result = db.session.execute(
            db.text("""
                INSERT INTO radiology_bookings (
                    patient_id, family_member_id, facility_id, scan_type, body_part,
                    appointment_date, appointment_time, referring_doctor_id, reason, status
                )
                VALUES (
                    :patient_id, :family_member_id, :facility_id, :scan_type, :body_part,
                    :appointment_date, :appointment_time, :referring_doctor_id, :reason, 'scheduled'
                )
            """),
            {
                'patient_id': booking_patient_id,
                'family_member_id': family_member_id,
                'facility_id': facility_id,
                'scan_type': scan_type,
                'body_part': body_part,
                'appointment_date': appointment_date,
                'appointment_time': appointment_time,
                'referring_doctor_id': referring_doctor_id,
                'reason': reason
            }
        )
        db.session.commit()
        
        # Get the created booking
        booking_id = result.lastrowid
        booking_result = db.session.execute(
            db.text("""
                SELECT 
                    rb.booking_id,
                    rb.patient_id,
                    rb.family_member_id,
                    rb.facility_id,
                    rb.scan_type,
                    rb.body_part,
                    rb.appointment_date,
                    rb.appointment_time,
                    rb.referring_doctor_id,
                    rb.reason,
                    rb.status,
                    rb.report_available,
                    rb.report_url,
                    rb.created_at
                FROM radiology_bookings rb
                WHERE rb.booking_id = :booking_id
            """),
            {'booking_id': booking_id}
        ).fetchone()
        
        booking = dict(booking_result._mapping) if hasattr(booking_result, '_mapping') else dict(zip(booking_result.keys(), booking_result))
        
        # Convert date and time to strings
        if booking.get('appointment_date'):
            booking['appointment_date'] = booking['appointment_date'].isoformat() if hasattr(booking['appointment_date'], 'isoformat') else str(booking['appointment_date'])
        if booking.get('appointment_time'):
            if hasattr(booking['appointment_time'], 'isoformat'):
                booking['appointment_time'] = booking['appointment_time'].isoformat()
            elif isinstance(booking['appointment_time'], str):
                booking['appointment_time'] = booking['appointment_time']
            else:
                booking['appointment_time'] = str(booking['appointment_time'])
        if booking.get('created_at'):
            booking['created_at'] = booking['created_at'].isoformat() if hasattr(booking['created_at'], 'isoformat') else str(booking['created_at'])
        
        logger.info(f"Radiology booking created: {booking_id} for patient {booking_patient_id}")
        
        return jsonify({
            'success': True,
            'booking': booking,
            'message': 'Radiology booking created successfully'
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating radiology booking: {e}")
        logger.error(traceback.format_exc())
        db.session.rollback()
        error_message = str(e)
        # Provide more specific error messages
        if 'foreign key constraint' in error_message.lower():
            error_message = 'Invalid facility or patient. Please refresh and try again.'
        elif 'duplicate' in error_message.lower():
            error_message = 'This booking already exists.'
        return jsonify({
            'success': False,
            'error': f'Failed to create radiology booking: {error_message}'
        }), 500

