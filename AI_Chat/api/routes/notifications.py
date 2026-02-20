"""
Notification Routes
Handles WhatsApp and email notifications, and in-app notifications.
"""
from flask import Blueprint, request, jsonify
from config import db
import os
import logging
import traceback

logger = logging.getLogger(__name__)

# Create blueprint
notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

@notifications_bp.route('/send', methods=['POST'])
def send_notification():
    """Send a custom notification to a patient"""
    try:
        data = request.get_json()
        patient_identifier = data.get('patient_identifier')  # ID or name
        message = data.get('message')
        
        if not patient_identifier or not message:
            return jsonify({'error': 'Patient identifier and message are required'}), 400
        
        from whatsapp_integration import whatsapp_notifier
        result = whatsapp_notifier.send_custom_notification(patient_identifier, message)
        
        if result['success']:
            return jsonify({'message': 'Notification sent successfully', 'result': result}), 200
        else:
            return jsonify({'error': result['error']}), 400
        
    except Exception as e:
        logger.error(f"Send notification error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@notifications_bp.route('/appointment-reminder', methods=['POST'])
def send_appointment_reminder():
    """Send appointment reminder to a patient"""
    try:
        data = request.get_json()
        appointment_id = data.get('appointment_id')
        
        if not appointment_id:
            return jsonify({'error': 'Appointment ID is required'}), 400
        
        from whatsapp_integration import whatsapp_notifier
        result = whatsapp_notifier.send_appointment_reminder(appointment_id)
        
        if result['success']:
            return jsonify({'message': 'Appointment reminder sent successfully', 'result': result}), 200
        else:
            return jsonify({'error': result['error']}), 400
        
    except Exception as e:
        logger.error(f"Appointment reminder error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@notifications_bp.route('/medication-reminder', methods=['POST'])
def send_medication_reminder():
    """Send medication reminder to a patient"""
    try:
        data = request.get_json()
        patient_id = data.get('patient_id')
        medication_name = data.get('medication_name')
        dosage = data.get('dosage')
        time = data.get('time')
        
        if not all([patient_id, medication_name, dosage, time]):
            return jsonify({'error': 'Patient ID, medication name, dosage, and time are required'}), 400
        
        from whatsapp_integration import whatsapp_notifier
        result = whatsapp_notifier.send_medication_reminder(patient_id, medication_name, dosage, time)
        
        if result['success']:
            return jsonify({'message': 'Medication reminder sent successfully', 'result': result}), 200
        else:
            return jsonify({'error': result['error']}), 400
        
    except Exception as e:
        logger.error(f"Medication reminder error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@notifications_bp.route('/bulk-appointments', methods=['POST'])
def send_bulk_appointment_reminders():
    """Send reminders for all upcoming appointments"""
    try:
        from whatsapp_integration import whatsapp_notifier
        result = whatsapp_notifier.send_bulk_appointment_reminders()
        
        if result['success']:
            return jsonify({
                'message': 'Bulk appointment reminders sent successfully',
                'result': result
            }), 200
        else:
            return jsonify({'error': result['error']}), 400
        
    except Exception as e:
        logger.error(f"Bulk appointment reminders error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Internal server error'}), 500

@notifications_bp.route('/patient', methods=['GET', 'OPTIONS'])
def get_patient_notifications():
    """Get in-app notifications for a patient"""
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'success': True})
        origin = request.headers.get('Origin')
        allowed_origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5173,http://192.168.5.111:5173').split(',')
        if origin in allowed_origins:
            response.headers.add('Access-Control-Allow-Origin', origin)
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, X-Patient-ID, X-User-Email')
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        return response, 200
    
    try:
        patient_id = request.headers.get('X-Patient-ID')
        user_email = request.headers.get('X-User-Email')
        
        # Get patient_id if only user_email provided
        if not patient_id and user_email:
            result = db.session.execute(
                db.text("""
                    SELECT p.patient_id FROM patients p
                    JOIN users u ON p.user_id = u.id
                    WHERE u.email = :email
                """),
                {"email": user_email}
            ).fetchone()
            if result:
                patient_id = result[0]
            else:
                return jsonify({
                    'success': False,
                    'error': 'Patient not found'
                }), 404
        
        if not patient_id:
            return jsonify({
                'success': False,
                'error': 'X-Patient-ID header or X-User-Email header required'
            }), 400
        
        # Get query parameters
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        
        # Build query - include appointment_id if column exists
        query = """
            SELECT 
                notification_id,
                patient_id,
                notification_type,
                title,
                message,
                is_read,
                created_at,
                appointment_id
            FROM notifications
            WHERE patient_id = :patient_id
        """
        
        if unread_only:
            query += " AND is_read = FALSE"
        
        query += " ORDER BY created_at DESC LIMIT 50"
        
        result = db.session.execute(
            db.text(query),
            {"patient_id": patient_id}
        ).fetchall()
        
        notifications = []
        for row in result:
            notification = dict(row._mapping) if hasattr(row, '_mapping') else dict(zip(row.keys(), row))
            # Convert datetime to ISO format
            if notification.get('created_at'):
                notification['created_at'] = notification['created_at'].isoformat() if hasattr(notification['created_at'], 'isoformat') else str(notification['created_at'])
            notifications.append(notification)
        
        return jsonify({
            'success': True,
            'notifications': notifications
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching patient notifications: {e}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': f'Failed to fetch notifications: {str(e)}'
        }), 500

@notifications_bp.route('/patient/<int:notification_id>/read', methods=['PUT', 'OPTIONS'])
def mark_notification_read(notification_id):
    """Mark a notification as read"""
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'success': True})
        origin = request.headers.get('Origin')
        allowed_origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5173,http://192.168.5.111:5173').split(',')
        if origin in allowed_origins:
            response.headers.add('Access-Control-Allow-Origin', origin)
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, X-Patient-ID, X-User-Email')
        response.headers.add('Access-Control-Allow-Methods', 'PUT, OPTIONS')
        return response, 200
    
    try:
        patient_id = request.headers.get('X-Patient-ID')
        user_email = request.headers.get('X-User-Email')
        
        # Get patient_id if only user_email provided
        if not patient_id and user_email:
            result = db.session.execute(
                db.text("""
                    SELECT p.patient_id FROM patients p
                    JOIN users u ON p.user_id = u.id
                    WHERE u.email = :email
                """),
                {"email": user_email}
            ).fetchone()
            if result:
                patient_id = result[0]
            else:
                return jsonify({
                    'success': False,
                    'error': 'Patient not found'
                }), 404
        
        if not patient_id:
            return jsonify({
                'success': False,
                'error': 'X-Patient-ID header or X-User-Email header required'
            }), 400
        
        # Verify notification belongs to patient
        check_result = db.session.execute(
            db.text("SELECT patient_id FROM notifications WHERE notification_id = :notification_id"),
            {"notification_id": notification_id}
        ).fetchone()
        
        if not check_result:
            return jsonify({
                'success': False,
                'error': 'Notification not found'
            }), 404
        
        if check_result[0] != patient_id:
            return jsonify({
                'success': False,
                'error': 'Unauthorized'
            }), 403
        
        # Mark as read
        db.session.execute(
            db.text("""
                UPDATE notifications 
                SET is_read = TRUE 
                WHERE notification_id = :notification_id
            """),
            {"notification_id": notification_id}
        )
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Notification marked as read'
        }), 200
        
    except Exception as e:
        logger.error(f"Error marking notification as read: {e}")
        logger.error(traceback.format_exc())
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Failed to mark notification as read: {str(e)}'
        }), 500

@notifications_bp.route('/patient/read-all', methods=['PUT', 'OPTIONS'])
def mark_all_notifications_read():
    """Mark all notifications as read for a patient"""
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'success': True})
        origin = request.headers.get('Origin')
        allowed_origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5173,http://192.168.5.111:5173').split(',')
        if origin in allowed_origins:
            response.headers.add('Access-Control-Allow-Origin', origin)
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, X-Patient-ID, X-User-Email')
        response.headers.add('Access-Control-Allow-Methods', 'PUT, OPTIONS')
        return response, 200
    
    try:
        patient_id = request.headers.get('X-Patient-ID')
        user_email = request.headers.get('X-User-Email')
        
        # Get patient_id if only user_email provided
        if not patient_id and user_email:
            result = db.session.execute(
                db.text("""
                    SELECT p.patient_id FROM patients p
                    JOIN users u ON p.user_id = u.id
                    WHERE u.email = :email
                """),
                {"email": user_email}
            ).fetchone()
            if result:
                patient_id = result[0]
            else:
                return jsonify({
                    'success': False,
                    'error': 'Patient not found'
                }), 404
        
        if not patient_id:
            return jsonify({
                'success': False,
                'error': 'X-Patient-ID header or X-User-Email header required'
            }), 400
        
        # Mark all as read
        result = db.session.execute(
            db.text("""
                UPDATE notifications 
                SET is_read = TRUE 
                WHERE patient_id = :patient_id AND is_read = FALSE
            """),
            {"patient_id": patient_id}
        )
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'All notifications marked as read',
            'updated_count': result.rowcount
        }), 200
        
    except Exception as e:
        logger.error(f"Error marking all notifications as read: {e}")
        logger.error(traceback.format_exc())
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Failed to mark notifications as read: {str(e)}'
        }), 500

@notifications_bp.route('/patient/clear-all', methods=['DELETE', 'OPTIONS'])
def clear_all_notifications():
    """Delete all notifications for a patient"""
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'success': True})
        origin = request.headers.get('Origin')
        allowed_origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5173,http://192.168.5.111:5173').split(',')
        if origin in allowed_origins:
            response.headers.add('Access-Control-Allow-Origin', origin)
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, X-Patient-ID, X-User-Email')
        response.headers.add('Access-Control-Allow-Methods', 'DELETE, OPTIONS')
        return response, 200
    
    try:
        patient_id = request.headers.get('X-Patient-ID')
        user_email = request.headers.get('X-User-Email')
        
        # Get patient_id if only user_email provided
        if not patient_id and user_email:
            result = db.session.execute(
                db.text("""
                    SELECT p.patient_id FROM patients p
                    JOIN users u ON p.user_id = u.id
                    WHERE u.email = :email
                """),
                {"email": user_email}
            ).fetchone()
            if result:
                patient_id = result[0]
            else:
                return jsonify({
                    'success': False,
                    'error': 'Patient not found'
                }), 404
        
        if not patient_id:
            return jsonify({
                'success': False,
                'error': 'X-Patient-ID header or X-User-Email header required'
            }), 400
        
        # Delete all notifications for the patient
        result = db.session.execute(
            db.text("""
                DELETE FROM notifications 
                WHERE patient_id = :patient_id
            """),
            {"patient_id": patient_id}
        )
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'All notifications cleared',
            'deleted_count': result.rowcount
        }), 200
        
    except Exception as e:
        logger.error(f"Error clearing notifications: {e}")
        logger.error(traceback.format_exc())
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Failed to clear notifications: {str(e)}'
        }), 500

