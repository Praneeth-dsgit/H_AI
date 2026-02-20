"""
FAQ Routes
Handles dynamic FAQ generation based on query history.
"""
from flask import Blueprint, request, jsonify
import logging
import openai
from context_manager import context_manager

logger = logging.getLogger(__name__)

# Create blueprint
faqs_bp = Blueprint('faqs', __name__, url_prefix='/api/faqs')

@faqs_bp.route('/generate', methods=['POST'])
def generate_dynamic_faqs():
    """
    Generate dynamic FAQs based on query history for a specific capability
    """
    try:
        data = request.get_json()
        capability = data.get('capability')
        session_id = data.get('session_id')
        
        if not capability or not session_id:
            return jsonify({
                'success': False,
                'error': 'Missing capability or session_id'
            }), 400
        
        # Get query history from context manager
        context_data = context_manager.get_or_create_context(session_id)
        if not context_data or not context_data.conversation_history:
            # Return default FAQs if no history
            default_faqs = get_default_faqs(capability)
            return jsonify({
                'success': True,
                'faqs': default_faqs
            })
        
        # Extract user queries from history
        user_queries = []
        for turn in context_data.conversation_history:
            if turn.user_message:
                user_queries.append(turn.user_message)
        
        if not user_queries:
            # Return default FAQs if no user queries
            default_faqs = get_default_faqs(capability)
            return jsonify({
                'success': True,
                'faqs': default_faqs
            })
        
        # Generate dynamic FAQs using LLM
        dynamic_faqs = generate_faqs_from_history(user_queries, capability)
        
        return jsonify({
            'success': True,
            'faqs': dynamic_faqs
        })
        
    except Exception as e:
        logger.error(f"Error generating dynamic FAQs: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to generate FAQs'
        }), 500

def get_default_faqs(capability):
    """Return default FAQs for each capability"""
    default_faqs = {
        'radiology': [
            "How to interpret a chest X-ray?",
            "What are the signs of pneumonia on imaging?",
            "How to identify fractures on X-ray?",
            "What does a normal CT scan of the brain look like?",
            "How to read an MRI of the spine?",
            "What are the radiological signs of stroke?",
            "How to interpret abdominal ultrasound?",
            "What imaging is best for joint problems?",
            "How to identify kidney stones on CT?",
            "What are the signs of appendicitis on imaging?"
        ],
        'lab': [
            "How to interpret CBC results?",
            "What do elevated liver enzymes mean?",
            "How to read lipid panel results?",
            "What are normal kidney function values?",
            "How to interpret thyroid function tests?",
            "What does high CRP indicate?",
            "How to read blood glucose levels?",
            "What are normal electrolyte ranges?",
            "How to interpret cardiac enzyme results?",
            "What does elevated troponin mean?"
        ],
        'general': [
            "What are the symptoms of diabetes?",
            "How can I lower my blood pressure?",
            "What causes frequent headaches?",
            "What should I do if I have a fever?",
            "What are the side effects of paracetamol?",
            "How do I know if I have COVID-19?",
            "What is a normal heart rate?",
            "How much sleep do adults need?",
            "What are the signs of a heart attack?",
            "How can I treat a cold at home?"
        ]
    }
    return default_faqs.get(capability, default_faqs['general'])

def generate_faqs_from_history(user_queries, capability):
    """
    Generate dynamic FAQs based on user query history using LLM
    """
    try:
        # Create a summary of user queries
        query_summary = "\n".join([f"- {query}" for query in user_queries[-20:]])  # Last 20 queries
        
        # Create prompt for FAQ generation
        prompt = f"""Based on the following user query history for {capability} capability, generate 10 relevant and helpful FAQ questions that would be useful for similar future queries.

User Query History:
{query_summary}

Capability: {capability}

Generate 10 FAQ questions that:
1. Are relevant to the types of questions users are asking
2. Cover common patterns in the query history
3. Are specific to {capability} medical domain
4. Are phrased as natural questions
5. Would help users get quick answers to common concerns

Return only the questions, one per line, without numbering or additional text."""

        response = openai.ChatCompletion.create(
            model="gpt-4.1",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.7
        )
        
        # Parse the response and extract questions
        faq_text = response.choices[0].message.content.strip()
        faqs = [line.strip() for line in faq_text.split('\n') if line.strip()]
        
        # Clean up the FAQs (remove numbering, etc.)
        cleaned_faqs = []
        for faq in faqs:
            # Remove common prefixes like "1.", "Q:", etc.
            faq = faq.lstrip('0123456789.- ').lstrip('Q:').lstrip('q:').strip()
            if faq and len(faq) > 10:  # Ensure it's a meaningful question
                cleaned_faqs.append(faq)
        
        # Return top 10 FAQs
        return cleaned_faqs[:10]
        
    except Exception as e:
        logger.error(f"Error generating FAQs from history: {str(e)}")
        # Return default FAQs as fallback
        return get_default_faqs(capability)

