"""
Chat Routes
Handles AI chat streaming, context management, and patient portal chat.
Uses JWT for auth; identity from Authorization: Bearer <accessToken>.
"""
from flask import Blueprint, request, jsonify, Response, g
import logging
import traceback
import re
import openai
from config import db
from validation_utils import validate_request
from models import ChatRequest
from context_manager import context_manager
from services.ai_service import generate_capability_prompt
from utils.jwt_utils import require_jwt

logger = logging.getLogger(__name__)

# Create blueprint
chat_bp = Blueprint('chat', __name__, url_prefix='/api')

@chat_bp.route('/chat/stream', methods=['POST'])
@require_jwt
@validate_request(ChatRequest)
def chat_stream():
    try:
        logger.info("\n=== Starting new chat stream ===")
        
        # Get validated data from decorator; user identity from JWT only
        chat_request = request.validated_data
        user_email = g.user_email
        
        user_message = chat_request.message
        patient_info = chat_request.patient_info
        file_context = chat_request.file_context
        file_findings = chat_request.file_findings
        previous_ai_message = chat_request.previous_ai_message
        reset_message = chat_request.reset_message
        capability = chat_request.capability
        session_id = chat_request.session_id or "default_session"
        
        logger.info(f"Processing message: '{user_message}' with capability: {capability}, session: {session_id}, user: {user_email}")

        # Check if query mentions a specific patient and fetch patient data from database
        fetched_patient_data = None
        if not patient_info:  # Only fetch if patient_info not already provided
            from db_read_agent import DatabaseAgent
            db_agent = DatabaseAgent()
            
            # Extract patient identifier from query
            patient_identifier = db_agent.extract_patient_identifier_from_query(user_message)
            
            if patient_identifier:
                logger.info(f"Detected patient identifier in query: '{patient_identifier}'")
                # Fetch comprehensive patient data
                fetched_patient_data = db_agent.get_patient_by_identifier(patient_identifier)
                
                if fetched_patient_data:
                    logger.info(f"Successfully fetched patient data for: {patient_identifier}")
                    logger.info(f"Fetched patient data keys: {list(fetched_patient_data.keys())}")
                    # Convert database patient data to patient_info format
                    patient_info = {
                        'age': fetched_patient_data.get('age', 0),
                        'gender': fetched_patient_data.get('gender', ''),
                        'weight': float(fetched_patient_data.get('weight_kg', 0)) if fetched_patient_data.get('weight_kg') else 0,
                        'height': float(fetched_patient_data.get('height_cm', 0)) if fetched_patient_data.get('height_cm') else 0,
                        'bloodPressure': '',  # Not in basic patient table
                        'allergies': '',  # Would need separate query
                        'medications': '',  # Would need separate query
                        'medicalHistory': '',  # Would need separate query
                        'patientName': f"{fetched_patient_data.get('first_name', '')} {fetched_patient_data.get('last_name', '')}".strip(),
                        'patientId': fetched_patient_data.get('patient_id') or fetched_patient_data.get('id'),
                        'phone': fetched_patient_data.get('phone', ''),
                        'email': fetched_patient_data.get('email', ''),
                        'dob': str(fetched_patient_data.get('dob', '')) if fetched_patient_data.get('dob') else '',
                        'bloodType': fetched_patient_data.get('blood_type', ''),
                        'bmi': float(fetched_patient_data.get('bmi', 0)) if fetched_patient_data.get('bmi') else None,
                        'recentAppointments': fetched_patient_data.get('recent_appointments', [])
                    }
                    logger.info(f"Converted patient data for prompt inclusion. Patient info keys: {list(patient_info.keys())}")
                    logger.info(f"Patient info summary: Name={patient_info.get('patientName')}, Age={patient_info.get('age')}, Gender={patient_info.get('gender')}")
                else:
                    logger.warning(f"Could not find patient with identifier: '{patient_identifier}'")

        # Update context manager with current state and user association
        if patient_info:
            context_manager.update_patient_context(session_id, patient_info)
        context_manager.update_capability_context(session_id, capability)
        
        # Associate session with user if email is provided
        if user_email:
            context_manager.get_or_create_context(session_id, user_email)
        
        # Handle context reset
        if reset_message:
            context_manager.clear_context(session_id)
            logger.info(f"Context reset for session {session_id}")
            return jsonify({"message": "Context cleared. Starting fresh conversation."})

        def generate():
            try:
                # Generate capability-specific prompt with structured formatting
                prompt = generate_capability_prompt(
                    user_message, capability, patient_info, file_context, file_findings, previous_ai_message, reset_message
                )
                
                logger.info(f"Generated capability-specific prompt for {capability} capability")
                
                # Use OpenAI streaming with structured formatting enforcement
                response = openai.ChatCompletion.create(
                    model="gpt-4.1",
                    messages=[
                        {"role": "system", "content": f"""
You are a specialized medical AI assistant for {capability} queries.  
Your audience is licensed healthcare professionals.  
Your role is to provide **concise, structured, safe, and clinically useful guidance**.  

⚠️ SAFETY RULES:
- Stay within the scope of {capability}.
- Do NOT interpret labs or imaging unless explicitly in that mode; redirect instead.
- If the query is unclear or unsafe, ask for clarification first.
- Never provide layperson advice; assume responses are for clinicians.

📐 CRITICAL FORMATTING REQUIREMENTS:
- Always use **indented hierarchical structure**:
  - 2 spaces for subsections
  - 4 spaces for nested details
- Use **•** for main bullets
- Use **-** for sub-bullets
- Use emojis for subsection headers
- Do NOT bold condition/topic titles
- Bold ONLY:
  - Medication names
  - Dosages
  - The label "Clinical Notes" and "Disclaimer"
- If a section is not applicable, include the heading with "None"

📦 MANDATORY OUTPUT TEMPLATE:
[Condition/Topic Name]
  [Emoji] [Subsection Title]:
    • [Main bullet point]
    • [Main bullet point]
      - [Nested detail if needed]
  [Emoji] [Next Subsection]:
    • [Bullet points...]
  🩺 Surgical/Procedural Options:
    • [List if any, else "None"]
  Clinical Notes:
    • [Patient-specific considerations]
    • [Monitoring/follow-up needs]
    • [Referral recommendations]

⚠️ Disclaimer:
  • This information is for healthcare professionals only.
  • It does not replace independent clinical judgment or specialist consultation.

📝 LENGTH CONTROL:
- Keep responses ≤150 tokens.
- If the content would be longer, summarize key actions and safety notes first.
"""},
                        {"role": "user", "content": prompt}
                    ],
                    stream=True,
                    max_tokens=1024,
                    temperature=0.7
                )
                
                ai_response_parts = []
                
                for chunk in response:
                    if 'choices' in chunk and len(chunk['choices']) > 0:
                        delta = chunk['choices'][0].get('delta', {})
                        if 'content' in delta:
                            content = delta['content']
                            ai_response_parts.append(content)
                            
                            # Normalize excessive newlines in the chunk: replace 3+ consecutive newlines with max 2
                            content = re.sub(r'\n{3,}', '\n\n', content)
                            
                            # Process the chunk to ensure proper line breaks for JSON
                            content = content.replace('\n', '\\n')
                            yield f"data: {content}\n\n"
                
                # Store conversation turn in context manager
                ai_response = ''.join(ai_response_parts)
                # Normalize excessive newlines in the final accumulated response
                ai_response = re.sub(r'\n{3,}', '\n\n', ai_response)
                context_manager.add_conversation_turn(
                    session_id, user_message, ai_response, capability, {"context_type": "capability_specific"}
                )
                            
                logger.info("\n=== Stream completed ===")
                        
            except Exception as e:
                error_msg = f"Streaming error: {str(e)}\n{traceback.format_exc()}"
                logger.error(error_msg)
                yield f"data: [ERROR] {str(e)}\n\n"
        
        response = Response(generate(), mimetype='text/event-stream')
        response.headers['Cache-Control'] = 'no-cache'
        response.headers['X-Accel-Buffering'] = 'no'
        return response
        
    except Exception as e:
        error_msg = f"Stream endpoint error: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_msg)
        return jsonify({"error": "Internal server error"}), 500

@chat_bp.route('/context/analyze', methods=['POST'])
def analyze_context():
    """Analyze context relevance for a query"""
    try:
        data = request.get_json()
        session_id = data.get('session_id', 'default_session')
        query = data.get('query', '')
        
        if not query:
            return jsonify({"error": "Query is required"}), 400
        
        # Analyze context relevance
        analysis = context_manager.analyze_context_relevance(session_id, query)
        
        # Get context summary
        context_summary = context_manager.get_context_summary(session_id)
        
        return jsonify({
            "analysis": analysis,
            "context_summary": context_summary,
            "session_id": session_id
        })
        
    except Exception as e:
        logger.error(f"Context analysis error: {e}")
        return jsonify({"error": "Context analysis failed"}), 500

@chat_bp.route('/context/summary/<session_id>', methods=['GET'])
def get_context_summary(session_id):
    """Get context summary for a session"""
    try:
        summary = context_manager.get_context_summary(session_id)
        return jsonify(summary)
    except Exception as e:
        logger.error(f"Context summary error: {e}")
        return jsonify({"error": "Failed to get context summary"}), 500

@chat_bp.route('/context/clear/<session_id>', methods=['POST'])
def clear_context(session_id):
    """Clear context for a session"""
    try:
        context_manager.clear_context(session_id)
        return jsonify({"message": f"Context cleared for session {session_id}"})
    except Exception as e:
        logger.error(f"Context clear error: {e}")
        return jsonify({"error": "Failed to clear context"}), 500

@chat_bp.route('/context/tokens/<session_id>', methods=['GET'])
def get_token_usage(session_id):
    """Get token usage summary for a session"""
    try:
        token_summary = context_manager.get_token_usage_summary(session_id)
        return jsonify(token_summary)
    except Exception as e:
        logger.error(f"Token usage error: {e}")
        return jsonify({"error": "Failed to get token usage"}), 500

