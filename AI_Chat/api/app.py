"""
Main Flask Application
This is the entry point for the Flask application.
All routes are now modularized into blueprints in the routes/ directory.
All configuration is centralized in config.py.
"""
import os
import logging

# Import the Flask app instance from config (which has all configuration)
from config import app, logger, OPENAI_API_KEY

# Import and register blueprints (modularized routes)
try:
    from routes.auth import auth_bp
    from routes.health import health_bp
    from routes.chat import chat_bp
    from routes.uploads import uploads_bp
    from routes.patients import patients_bp
    from routes.appointments import appointments_bp
    from routes.doctors import doctors_bp
    from routes.radiology import radiology_bp
    from routes.notifications import notifications_bp
    from routes.faqs import faqs_bp
    from routes.analytics import analytics_bp
    from routes.patient_engagement import patient_engagement_bp, patient_portal_bp
    from routes.admin import admin_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(health_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(uploads_bp)
    app.register_blueprint(patients_bp)
    app.register_blueprint(appointments_bp)
    app.register_blueprint(doctors_bp)
    app.register_blueprint(radiology_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(faqs_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(patient_engagement_bp)
    app.register_blueprint(patient_portal_bp)
    app.register_blueprint(admin_bp)
    
    logger.info("✅ Registered blueprints: auth, health, chat, uploads, patients, appointments, doctors, radiology, notifications, faqs, analytics, patient_engagement, patient_portal, admin")
except ImportError as e:
    logger.error(f"❌ Could not import blueprints: {e}")
    logger.error("Please ensure all route modules exist in the routes/ directory")
    raise
except Exception as e:
    logger.error(f"❌ Error registering blueprints: {e}")
    raise

if __name__ == '__main__':
    print(f"🚀 Starting Flask API server...")
    print(f"📡 API will be available at http://localhost:{os.getenv('PORT', '5000')}")
    
    # Check if OpenAI API key is configured
    if not OPENAI_API_KEY:
        logger.warning("⚠️  OPENAI_API_KEY not configured. Some features may not work.")
    
    # Start the Flask server
    app.run(
        debug=os.getenv('FLASK_DEBUG', 'False').lower() == 'true',
        host='0.0.0.0',
        port=int(os.getenv('PORT', '5000'))
    )
