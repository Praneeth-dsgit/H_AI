"""
Health Routes
Handles health checks and static file serving.
"""
from flask import Blueprint, send_from_directory, jsonify
import logging
import os

logger = logging.getLogger(__name__)

# Create blueprint
health_bp = Blueprint('health', __name__, url_prefix='/api')

@health_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'API is running'
    }), 200

@health_bp.route('/medicine_kbase.json', methods=['GET'])
def get_medicine_knowledge_base():
    """Serve the medicine and condition knowledge base JSON file"""
    try:
        # Get the directory where the API files are located
        api_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        file_path = os.path.join(api_dir, 'medicine_kbase.json')
        
        if os.path.exists(file_path):
            return send_from_directory(api_dir, 'medicine_kbase.json', mimetype='application/json')
        else:
            return jsonify({
                'success': False,
                'error': 'Medicine knowledge base file not found'
            }), 404
    except Exception as e:
        logger.error(f"Error serving medicine knowledge base: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
