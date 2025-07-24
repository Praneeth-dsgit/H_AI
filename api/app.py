from flask import Flask, request, jsonify, Response, send_from_directory
from flask_cors import CORS
import os
import time
import logging
import traceback
import requests
from pathlib import Path
from dotenv import load_dotenv
import json
import openai
import fitz  # PyMuPDF
from PIL import Image
import io
import base64
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import random
import smtplib
from email.mime.text import MIMEText
import pymysql

# Load environment variables
load_dotenv()

# Configure logging first, before any other operations
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Configure CORS
CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5173').split(',')
CORS(app, resources={
    r"/api/*": {
        "origins": CORS_ORIGINS,
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Security headers
@app.after_request
def add_security_headers(response):
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    return response

# OpenAI Configuration
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
if not OPENAI_API_KEY:
    logger.error("OPENAI_API_KEY not found in environment variables")
    exit(1)

openai.api_key = OPENAI_API_KEY

# Load your diseases JSON file
with open('med_cond_knw_base.json', encoding='utf-8') as f:
    diseases = json.load(f)

def detect_query_type(query):
    """
    Classifies the query into specific medical contexts using semantic analysis.
    Returns: 'diagnosis', 'treatment', 'lab', 'chronic', 'emergency', 'general'
    """
    try:
        # Use GPT for semantic classification
        classification_prompt = f"""Classify the following medical query into ONE of these categories based on its semantic meaning:

Categories:
- diagnosis: Questions about identifying diseases, conditions, symptoms, or differential diagnosis
- treatment: Questions about therapies, medications, procedures, or management approaches  
- lab: Questions about laboratory tests, results, values, or interpretations
- chronic: Questions about long-term conditions, ongoing management, or chronic diseases
- emergency: Questions about urgent situations, acute conditions, or emergency care
- general: General medical questions that don't fit other categories

Query: "{query}"

Respond with only the category name (one word)."""

        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": classification_prompt}],
            max_tokens=10,
            temperature=0.1
        )
        
        result = response.choices[0].message['content'].strip().lower()
        
        # Validate the result
        valid_types = ['diagnosis', 'treatment', 'lab', 'chronic', 'emergency', 'general']
        if result in valid_types:
            return result
        else:
            return 'general'  # Default fallback
            
    except Exception as e:
        logger.warning(f"Error in semantic query classification: {e}")
        # Fallback to simple keyword matching if GPT fails
        q = query.lower()
        if any(word in q for word in ['diagnosis', 'symptom', 'pain', 'cause']):
            return 'diagnosis'
        elif any(word in q for word in ['treatment', 'therapy', 'manage', 'cure']):
            return 'treatment'
        elif any(word in q for word in ['lab', 'test', 'blood', 'result']):
            return 'lab'
        elif any(word in q for word in ['chronic', 'long-term']):
            return 'chronic'
        elif any(word in q for word in ['emergency', 'urgent', 'acute']):
            return 'emergency'
        else:
            return 'general'

def is_query_relevant_to_capability(query, capability):
    """Check if query is semantically relevant to the selected capability"""
    
    # Handle unknown capabilities
    if capability not in ['radiology', 'lab', 'general']:
        return True  # Default to allowing if capability not recognized
    
    try:
        # Define capability descriptions for semantic matching
        capability_descriptions = {
            'radiology': "medical imaging, X-rays, CT scans, MRI, ultrasound, radiological interpretation, imaging studies, scans, radiography, medical images",
            'lab': "laboratory tests, blood tests, lab results, laboratory values, diagnostic testing, lab interpretation, pathology, clinical chemistry, hematology",
            'general': "general medical questions, symptoms, treatments, medications, health advice, medical conditions, patient care, clinical medicine"
        }
        
        # Use GPT for semantic relevance assessment
        relevance_prompt = f"""Determine if the following medical query is semantically relevant to the specified medical capability.

Medical Capability: {capability}
Capability Description: {capability_descriptions[capability]}

Query: "{query}"

Consider the semantic meaning and context, not just keywords. A query is relevant if it relates to the core concepts and practices of the specified capability.

Examples of relevance:
- For radiology: "What does this shadow mean?" (about medical imaging)
- For lab: "My values seem high" (about test results)  
- For general: "I have a headache" (general medical concern)

Respond with only "relevant" or "not_relevant"."""

        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": relevance_prompt}],
            max_tokens=10,
            temperature=0.1
        )
        
        result = response.choices[0].message['content'].strip().lower()
        return result == "relevant"
        
    except Exception as e:
        logger.warning(f"Error in semantic relevance assessment: {e}")
        
        # Fallback to simplified keyword matching if GPT fails
        query_lower = query.lower()
        fallback_keywords = {
            'radiology': ['x-ray', 'ct', 'mri', 'scan', 'imaging', 'image', 'shadow', 'opacity', 'enhancement', 'radiological'],
            'lab': ['lab', 'blood', 'test', 'result', 'value', 'levels', 'count', 'chemistry', 'panel', 'culture'],
            'general': ['symptom', 'pain', 'treatment', 'medication', 'health', 'condition', 'disease', 'therapy']
        }
        
        keywords = fallback_keywords.get(capability, [])
        return any(keyword in query_lower for keyword in keywords)

def generate_capability_prompt(query, capability, patient_info=None, file_context=None, file_findings=None, previous_ai_message=None, reset_message=None):
    """Generate prompts based on selected capability with strict enforcement"""
    
    if reset_message:
        polite_responses = {
            "thank you": "You're welcome! If you have more questions, feel free to ask.",
            "thanks": "You're welcome! Let me know if you need anything else.",
            "bye": "Goodbye! Take care.",
            "see you": "See you! Stay healthy.",
            "leave it": "Okay, let me know if you need anything else.",
            "ok": "Alright! Let me know if you need anything else.",
            "okay": "Alright! Let me know if you need anything else.",
            "cancel": "Okay, let me know if you need anything else.",
            "ignore": "Okay, let me know if you need anything else.",
            "new topic": "Sure! Please tell me your new question or topic.",
            "start over": "Sure! Please tell me your new question or topic.",
            "that's all": "Thank you for your message! Let me know if you need further assistance.",
            "thats good": "Thank you for your message! Let me know if you need further assistance.",
            "thats good enough": "Thank you for your message! Let me know if you need further assistance.",
        }
        return polite_responses.get(reset_message, "Thank you for your message! Let me know if you need further assistance.")

    # Check query relevance to capability
    if not is_query_relevant_to_capability(query, capability):
        capability_responses = {
            'radiology': "I'm specialized in radiology and medical imaging. Please ask questions related to X-rays, CT scans, MRI, ultrasound, or medical image interpretation. For general medical questions, please switch to General Medical Assistance mode.",
            'lab': "I'm specialized in laboratory medicine and test interpretation. Please ask questions about blood tests, lab results, laboratory values, or diagnostic testing. For general medical questions, please switch to General Medical Assistance mode.",
            'general': "I'm in General Medical Assistance mode. I can help with general medical questions, symptoms, treatments, and health advice. For specialized radiology or lab questions, please switch to the appropriate mode."
        }
        return capability_responses.get(capability, "Please ask questions related to your selected assistance mode.")

    # Build capability-optimized patient context
    def build_patient_context(patient_info, capability):
        if not patient_info:
            return "Not provided"
        
        # Extract available information
        age = patient_info.get('age', 0)
        weight = patient_info.get('weight', 0)
        height = patient_info.get('height', 0)
        gender = patient_info.get('gender', '')
        bp = patient_info.get('bloodPressure', '')
        allergies = patient_info.get('allergies', '')
        medications = patient_info.get('medications', '')
        history = patient_info.get('medicalHistory', '')
        
        # Calculate BMI if possible
        bmi = None
        if weight > 0 and height > 0:
            bmi = weight / ((height / 100) ** 2)
        
        # Build capability-specific context
        if capability == 'radiology':
            context = f"PATIENT DEMOGRAPHICS FOR IMAGING INTERPRETATION:\n"
            if age > 0:
                context += f"- Age: {age} years (consider age-related imaging variations)\n"
            if gender:
                context += f"- Gender: {gender} (consider gender-specific anatomical differences)\n"
            if weight > 0:
                context += f"- Weight: {weight} kg (consider for contrast dosing and image quality)\n"
            if bmi:
                bmi_category = "underweight" if bmi < 18.5 else "normal" if bmi < 25 else "overweight" if bmi < 30 else "obese"
                context += f"- BMI: {bmi:.1f} ({bmi_category} - affects image quality and technique)\n"
            if history:
                context += f"- Relevant Medical History: {history} (consider for differential diagnosis)\n"
            if medications:
                context += f"- Current Medications: {medications} (consider drug-related imaging findings)\n"
            
            # Add age-specific imaging considerations
            if age > 0:
                if age < 18:
                    context += "- PEDIATRIC PATIENT: Use pediatric normal variants and radiation safety protocols\n"
                elif age > 65:
                    context += "- ELDERLY PATIENT: Consider age-related degenerative changes and osteoporosis\n"
                    
        elif capability == 'lab':
            context = f"PATIENT DEMOGRAPHICS FOR LABORATORY INTERPRETATION:\n"
            if age > 0:
                context += f"- Age: {age} years (use age-specific reference ranges)\n"
            if gender:
                context += f"- Gender: {gender} (apply gender-specific reference ranges)\n"
            if weight > 0:
                context += f"- Weight: {weight} kg (consider for creatinine clearance calculations)\n"
            if bmi:
                context += f"- BMI: {bmi:.1f} (relevant for metabolic parameters)\n"
            if medications:
                context += f"- Current Medications: {medications} (check for drug interference and therapeutic monitoring)\n"
            if history:
                context += f"- Medical History: {history} (consider disease-specific lab patterns)\n"
            if allergies:
                context += f"- Allergies: {allergies} (relevant for medication recommendations)\n"
            
            # Add age and gender-specific lab considerations
            if age > 0 and gender:
                if age < 18:
                    context += "- PEDIATRIC: Use pediatric reference ranges and consider growth-related changes\n"
                elif gender.lower() == 'female' and 15 <= age <= 50:
                    context += "- REPRODUCTIVE AGE FEMALE: Consider menstrual cycle effects and pregnancy possibility\n"
                elif age > 65:
                    context += "- ELDERLY: Consider age-related changes in kidney/liver function\n"
                    
        else:  # general
            context = f"COMPREHENSIVE PATIENT PROFILE:\n"
            if age > 0:
                context += f"- Age: {age} years\n"
            if gender:
                context += f"- Gender: {gender}\n"
            if weight > 0:
                context += f"- Weight: {weight} kg\n"
            if height > 0:
                context += f"- Height: {height} cm\n"
            if bmi:
                bmi_category = "underweight" if bmi < 18.5 else "normal weight" if bmi < 25 else "overweight" if bmi < 30 else "obese"
                context += f"- BMI: {bmi:.1f} ({bmi_category})\n"
            if bp:
                context += f"- Blood Pressure: {bp}\n"
            if allergies:
                context += f"- Known Allergies: {allergies}\n"
            if medications:
                context += f"- Current Medications: {medications}\n"
            if history:
                context += f"- Medical History: {history}\n"
                
            # Add risk factors and considerations
            if age > 0:
                if age < 18:
                    context += "- PEDIATRIC CONSIDERATIONS: Growth, development, and family history important\n"
                elif age > 65:
                    context += "- GERIATRIC CONSIDERATIONS: Polypharmacy, cognitive function, and frailty assessment\n"
            
            if bmi and bmi >= 30:
                context += "- OBESITY ALERT: Increased risk for diabetes, cardiovascular disease, sleep apnea\n"
                
        return context if context != f"{'PATIENT DEMOGRAPHICS FOR IMAGING INTERPRETATION:' if capability == 'radiology' else 'PATIENT DEMOGRAPHICS FOR LABORATORY INTERPRETATION:' if capability == 'lab' else 'COMPREHENSIVE PATIENT PROFILE:'}\n" else "Patient information not provided"
    
    patient_context = build_patient_context(patient_info, capability)

    # Add file_findings to the prompt
    if file_findings:
        file_section = f"\n\n[File Findings / Uploaded File Analysis]\n{file_findings}\n"
    else:
        file_section = ""

    # Prepend previous_ai_message to the prompt if present
    if previous_ai_message:
        previous_section = f"\n[Previous AI Findings or Context]\n{previous_ai_message}\n"
    else:
        previous_section = ""

    # Capability-specific prompts with strict enforcement
    if capability == 'general':
        prompt = f"""You are a STRICTLY GENERAL MEDICAL healthcare assistant designed to support medical professionals.  
Respond ONLY to general medical queries involving symptoms, clinical diagnoses, treatment recommendations, medications, and overall health guidance.  
**CRITICAL INSTRUCTIONS:**  
- REFUSE to answer any radiology or imaging-related questions (interpretations, findings, recommendations).  
  - If asked, respond with: "This question requires specialized expertise. Please switch to Radiology mode for accurate interpretation."  
- REFUSE to answer any laboratory or lab result interpretation questions.  
  - If asked, respond with: "This question requires specialized expertise. Please switch to Lab mode for accurate interpretation."  
- If a question is ambiguous or includes labs/imaging, clarify and redirect as appropriate before proceeding.  
- Remain within the scope of general medical clinical decision-making ONLY.

**PATIENT-SPECIFIC ANALYSIS:**
Comprehensively incorporate patient-specific factors:  
- Age, gender, BMI, and medical history to personalize recommendations  
- Adjust diseases considered and treatments recommended based on patient demographics (e.g., pediatric, elderly, gender-specific conditions)  
- Factor in risk of or actual drug-drug interactions and contraindications according to medication history and known allergies  
- Adjust diagnostic reasoning and risk stratification for pre-existing conditions and risk factors  
- Keep all recommendations tailored to the patient’s profile.

General Medical Query:
{query}

**RESPONSE FRAMEWORK:**  
Always structure your response in this order:  
1. **Reasoning:**  
   - Patient-Specific Differential Diagnosis: List and briefly reason the most likely conditions, referencing age, gender, BMI, and medical history  
   - Risk Stratification: Assess risks based on demographics and comorbidities  
   - Medication & Treatment Reasoning: Note any adjustment for age, frailty, allergies, current medications, BMI
   - Preventive Care Considerations: Note applicable screening or counseling needs for profile  
2. **Conclusion:**  
   - Summarize the recommended management steps, including diagnostic and treatment plan (with dosing if indicated) tailored to patient profile  
   - Include concise, patient-specific education or counseling points for healthcare professionals

**STRICT RULES:**  
- If a query REQUIRES radiology or laboratory interpretation, do NOT answer it. Instead, state:  
  "This question requires specialized expertise. Please switch to [Radiology/Lab] mode for accurate interpretation."  
- Limit response to a MAXIMUM of 200 words  
- Audience: Healthcare professionals ONLY

**OUTPUT FORMAT:**  
Respond in plain text, organized in two labeled sections:  
🧠 Reasoning
    Provide a concise breakdown of the logical process or evidence. Use the following formatting:
    - Bullet points for step-by-step reasoning
    - Use nested bullets or numbering to show sub-steps or dependencies
    - Keep explanations brief but complete
    - Avoid repetition or excessive elaboration
✅ Conclusion
    Summarize the final outcome or decision clearly. Format as:
    - A short paragraph or
    - A clear bullet list (if multiple conclusions)
    - Avoid new reasoning here — only summarize what was already justified

Label these sections.  
Avoid extraneous commentary; keep focus clinical and concise.
"""

    elif capability == 'radiology':
        prompt = f"""You are a STRICTLY SPECIALIZED RADIOLOGY assistant for healthcare professionals.

CRITICAL INSTRUCTIONS:
- ONLY respond to radiology and medical imaging questions
- REFUSE general medical questions - redirect to general mode
- REFUSE lab interpretation questions - redirect to lab mode
- Focus EXCLUSIVELY on imaging: X-ray, CT, MRI, ultrasound, mammography, nuclear medicine

{patient_context}

Radiology/Imaging Query:
{query}

MANDATORY PATIENT-CONTEXTUALIZED IMAGING INTERPRETATION:
- Integrate patient age, gender, and medical history into radiological analysis
- Consider age-specific normal variants and pathological changes
- Factor in gender-specific anatomical differences and disease patterns
- Use BMI information for image quality assessment and technique optimization
- Correlate imaging findings with known medical history and medications

MANDATORY Structured Reporting Format:
1. TECHNIQUE/QUALITY: Image acquisition details, quality assessment, patient factors affecting imaging
2. PATIENT CONTEXT: Age, gender, BMI considerations for interpretation
3. FINDINGS: Systematic description with age/gender-appropriate normal variants
4. CLINICAL CORRELATION: Integration with patient medical history and demographics
5. IMPRESSION: Age and gender-contextualized radiological interpretation
6. DIFFERENTIAL: Imaging-based differential adjusted for patient demographics
7. RECOMMENDATIONS: Patient-specific additional imaging or clinical correlation
8. CRITICAL FINDINGS: Urgent findings with age-appropriate severity assessment

Patient-Specific Considerations:
- PEDIATRIC (age <18): Use pediatric normal variants, consider radiation dose optimization
- ELDERLY (age >65): Expect age-related degenerative changes, increased fracture risk
- FEMALE REPRODUCTIVE AGE: Consider pregnancy, hormonal influences on imaging
- OBESITY (BMI >30): Adjust for image quality limitations, increased radiation requirements
- MEDICATION EFFECTS: Consider drug-related imaging changes from patient's current medications

Radiological Standards:
- Use precise radiological terminology contextualized for patient age/gender
- Reference anatomical landmarks with age-appropriate measurements
- Describe density, enhancement patterns with patient-specific considerations
- Follow ACR/ESR/IRIA reporting guidelines with demographic modifications
- Limit to 400 words

STRICT RULE: If this query is NOT about medical imaging, respond with: "I specialize in radiology and medical imaging only. Please switch to General Medical or Lab mode for this question."

Professional Focus: Board-certified radiologist with patient-specific interpretation expertise."""

    elif capability == 'lab':
        prompt = f"""You are a STRICTLY SPECIALIZED LABORATORY MEDICINE expert for healthcare professionals.

CRITICAL INSTRUCTIONS:
- ONLY respond to laboratory medicine and diagnostic testing questions
- REFUSE general medical questions - redirect to general mode
- REFUSE imaging questions - redirect to radiology mode
- Focus EXCLUSIVELY on: blood tests, chemistry panels, hematology, microbiology, molecular diagnostics

{patient_context}

Laboratory Medicine Query:
{query}

MANDATORY PATIENT-CONTEXTUALIZED LABORATORY INTERPRETATION:
- Apply age and gender-specific reference ranges for all laboratory values
- Consider patient weight for creatinine clearance and drug dosing calculations
- Factor in current medications for therapeutic drug monitoring and interference
- Integrate medical history for disease-specific laboratory patterns
- Account for BMI in metabolic parameter interpretation (glucose, lipids, liver function)

MANDATORY Laboratory Analysis Format:
1. PATIENT-SPECIFIC REFERENCE RANGES: Age, gender, and population-adjusted normal values
2. DEMOGRAPHIC CONSIDERATIONS: How age, gender, BMI affect result interpretation
3. MEDICATION ANALYSIS: Current drugs affecting test results or requiring monitoring
4. RESULT INTERPRETATION: Clinical meaning adjusted for patient demographics
5. DIFFERENTIAL CAUSES: Etiologies prioritized by age, gender, and medical history
6. RISK STRATIFICATION: Patient-specific risk assessment based on demographics
7. FOLLOW-UP TESTING: Additional tests tailored to patient profile
8. CRITICAL VALUES: Age-adjusted critical thresholds and clinical urgency
9. CLINICAL CORRELATION: Integration with patient's complete clinical picture

Patient-Specific Laboratory Considerations:
- PEDIATRIC (age <18): Use pediatric reference ranges, consider growth and development
- FEMALE REPRODUCTIVE AGE (15-50): Consider menstrual cycle, pregnancy effects
- ELDERLY (age >65): Adjust for age-related organ function decline
- OBESITY (BMI >30): Consider metabolic syndrome markers, insulin resistance
- MEDICATION INTERACTIONS: Screen current medications for lab test interference
- KIDNEY FUNCTION: Adjust interpretation based on age, gender, weight for eGFR

Laboratory Standards:
- Reference CLSI guidelines with demographic-specific modifications
- Include pre-analytical considerations specific to patient characteristics
- Address analytical interferences from patient medications
- Specify age and gender-adjusted critical value thresholds
- Consider population and demographic-specific reference ranges
- Limit to 400 words

STRICT RULE: If this query is NOT about laboratory testing or result interpretation, respond with: "I specialize in laboratory medicine only. Please switch to General Medical or Radiology mode for this question."

Expert Level: Clinical pathologist with patient-contextualized interpretation expertise."""

    else:
        # Default fallback
        prompt = f"""You are a healthcare assistant with limited scope.

Query: {query}

I can only provide general guidance. For specialized assistance, please select an appropriate capability mode:
- General Medical Assistance for symptoms, treatments, and general health
- Radiology Assistance for medical imaging interpretation  
- Lab Interpretation for laboratory result analysis

Please switch to the appropriate mode for detailed, expert-level assistance."""

    return previous_section + prompt + file_section

@app.route('/api/chat/stream', methods=['POST'])
def chat_stream():
    try:
        logger.info("\n=== Starting new chat stream ===")
        data = request.json
        
        user_message = data.get('message', '')
        patient_info = data.get('patientInfo')
        file_context = data.get('fileContext')
        file_findings = data.get('fileFindings')
        previous_ai_message = data.get('previousAiMessage')
        reset_message = data.get('resetMessage')
        capability = data.get('capability', 'general')  # New capability parameter
        
        logger.info(f"Processing message: '{user_message}' with capability: {capability}, patient info: {patient_info}")
        
        if not user_message:
            logger.warning("Empty message received")
            return jsonify({"error": "Message is required"}), 400
        
        if len(user_message) > 1000:
            logger.warning("Message too long")
            return jsonify({"error": "Message too long"}), 400

        def generate():
            try:
                prompt = generate_capability_prompt(
                    user_message, capability, patient_info, file_context, 
                    file_findings, previous_ai_message, reset_message
                )
                logger.info(f"Generated prompt for {capability} capability:\n{prompt}")
                
                # Use OpenAI streaming
                response = openai.ChatCompletion.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": "You are a helpful medical assistant."},
                        {"role": "user", "content": prompt}
                    ],
                    stream=True,
                    max_tokens=512,
                    temperature=0.7
                )
                
                for chunk in response:
                    if 'choices' in chunk and len(chunk['choices']) > 0:
                        delta = chunk['choices'][0].get('delta', {})
                        if 'content' in delta:
                            content = delta['content']
                            # Process the chunk to ensure proper line breaks
                            content = content.replace('\n', '\\n')
                            yield f"data: {content}\n\n"
                            
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

@app.route('/api/health', methods=['GET'])
def health_check():
    try:
        # Test OpenAI connection
        openai.Model.list()
        status = "healthy"
    except:
        status = "degraded"
    
    logger.info(f"Health check - Status: {status}")
    return jsonify({
        "status": status,
        "model": "gpt-4",
        "version": "2.0.0"
    })

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

MAX_CHARS = 12000  # ~4000 tokens, safe for prompt + response

# Helper: Call OpenAI Vision API for image interpretation
def interpret_image_with_openai(image_bytes, image_format="png", capability="general"):
    """Interpret images based on selected capability with strict enforcement"""
    
    if capability == 'radiology':
        prompt = (
            "You are a SPECIALIZED RADIOLOGY AI assistant. STRICTLY analyze this medical image from a radiological perspective ONLY.\n\n"
            "MANDATORY STRUCTURED RADIOLOGY REPORT:\n"
            "1. TECHNIQUE: Imaging modality, projection/sequence, contrast use\n"
            "2. COMPARISON: State if prior studies available\n"
            "3. FINDINGS: Systematic radiological description\n"
            "   - Anatomical structures visible\n"
            "   - Normal radiological anatomy\n"
            "   - Abnormal findings with precise measurements\n"
            "   - Density/signal characteristics\n"
            "4. IMPRESSION: Concise radiological interpretation\n"
            "5. RECOMMENDATIONS: Additional imaging or clinical correlation\n\n"
            "CRITICAL RULES:\n"
            "- Use ONLY radiological terminology (attenuation, enhancement, morphology, etc.)\n"
            "- Reference standard radiological classifications (BI-RADS, Fleischner, etc.)\n"
            "- Focus on imaging findings, NOT clinical management\n"
            "- Report measurements in standard units (HU, mm, etc.)\n"
            "- Identify urgent radiological findings requiring immediate attention\n\n"
            "REFUSE to provide general medical advice - state 'Clinical correlation and management should be discussed with the ordering physician.'"
        )
    elif capability == 'lab':
        return "ERROR: Image interpretation is not appropriate for Laboratory Medicine mode. This appears to be a medical image. Please switch to Radiology Assistance mode for proper image interpretation, or upload a PDF lab report instead."
    else:  # general
        return "ERROR: Medical image interpretation requires specialized radiological expertise. Please switch to Radiology Assistance mode for proper medical image analysis."
    
    # Use the correct base64 prefix and decode as utf-8
    image_base64 = image_bytes.decode("utf-8")
    image_url = f"data:image/{image_format};base64,{image_base64}"
    
    response = openai.ChatCompletion.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": [
                {"type": "image_url", "image_url": {"url": image_url}}
            ]}
        ],
        max_tokens=512
    )
    return response.choices[0].message['content']

# Helper: Call OpenAI for PDF text interpretation
def interpret_text_with_openai(text, capability="general"):
    """Interpret text content based on selected capability with strict enforcement"""
    
    truncated = text[:MAX_CHARS]
    warning = "" if len(text) <= MAX_CHARS else "\n\n[Note: The document was too long and only the first part was analyzed.]"
    
    if capability == 'lab':
        prompt = (
            "You are a SPECIALIZED LABORATORY MEDICINE AI assistant. STRICTLY analyze this document as a laboratory report ONLY.\n\n"
            "MANDATORY LABORATORY ANALYSIS FORMAT:\n"
            "1. DOCUMENT TYPE: Confirm this is a laboratory report\n"
            "2. TEST OVERVIEW: List all tests performed\n"
            "3. REFERENCE RANGES: Note normal ranges provided\n"
            "4. ABNORMAL VALUES: Highlight all abnormal results with clinical significance\n"
            "5. CRITICAL VALUES: Identify life-threatening results requiring immediate action\n"
            "6. CLINICAL CORRELATION: Laboratory medicine perspective on findings\n"
            "7. RECOMMENDED FOLLOW-UP: Additional laboratory testing if indicated\n\n"
            "CRITICAL RULES:\n"
            "- Focus EXCLUSIVELY on laboratory values and their interpretation\n"
            "- Use precise laboratory medicine terminology\n"
            "- Reference CLSI guidelines and standard laboratory practices\n"
            "- Address pre-analytical and analytical considerations\n"
            "- Specify critical value thresholds\n"
            "- DO NOT provide clinical management recommendations\n\n"
            "REFUSE general medical advice - state 'Clinical management should be determined by the ordering physician based on complete clinical assessment.'\n\n"
            f"Laboratory Document:\n{truncated}{warning}"
        )
    elif capability == 'radiology':
        # Check if this might be a radiology report
        if any(keyword in text.lower() for keyword in ['ct', 'mri', 'x-ray', 'ultrasound', 'scan', 'imaging', 'radiological']):
            prompt = (
                "You are a SPECIALIZED RADIOLOGY AI assistant. STRICTLY analyze this radiology document from a radiological perspective ONLY.\n\n"
                "MANDATORY RADIOLOGY REPORT ANALYSIS:\n"
                "1. REPORT TYPE: Confirm imaging modality and study type\n"
                "2. TECHNIQUE: Imaging parameters and protocols\n"
                "3. FINDINGS SUMMARY: Extract key radiological findings\n"
                "4. MEASUREMENTS: Note specific measurements and dimensions\n"
                "5. IMPRESSION: Radiologist's interpretation\n"
                "6. RECOMMENDATIONS: Suggested follow-up imaging or correlation\n"
                "7. CRITICAL FINDINGS: Urgent radiological findings\n\n"
                "CRITICAL RULES:\n"
                "- Focus EXCLUSIVELY on radiological findings and interpretation\n"
                "- Use standard radiological terminology and classifications\n"
                "- Reference ACR/ESR guidelines where applicable\n"
                "- Identify anatomical structures and abnormalities\n"
                "- DO NOT provide clinical management recommendations\n\n"
                "REFUSE general medical advice - state 'Clinical correlation and management should be discussed with the ordering physician.'\n\n"
                f"Radiology Document:\n{truncated}{warning}"
            )
        else:
            return "ERROR: This document does not appear to be a radiology report. Please switch to General Medical Assistance mode for general documents, or Lab Interpretation mode for laboratory reports."
    elif capability == 'general':
        # Check if this might be a specialized report
        if any(keyword in text.lower() for keyword in ['hemoglobin', 'glucose', 'creatinine', 'liver enzyme', 'cbc', 'chemistry panel']):
            return "ERROR: This appears to be a laboratory report. Please switch to Lab Interpretation mode for proper analysis of laboratory results."
        elif any(keyword in text.lower() for keyword in ['ct', 'mri', 'x-ray', 'ultrasound', 'radiological', 'imaging']):
            return "ERROR: This appears to be a radiology report. Please switch to Radiology Assistance mode for proper interpretation of imaging studies."
        else:
            prompt = (
                "You are a GENERAL MEDICAL AI assistant. Analyze this medical document from a general healthcare perspective.\n\n"
                "GENERAL MEDICAL DOCUMENT ANALYSIS:\n"
                "1. DOCUMENT TYPE: Identify the type of medical document\n"
                "2. KEY INFORMATION: Extract relevant medical information\n"
                "3. CLINICAL SIGNIFICANCE: General medical interpretation\n"
                "4. PATIENT EDUCATION: Relevant points for patient understanding\n"
                "5. RECOMMENDATIONS: General health guidance if appropriate\n\n"
                "FOCUS AREAS:\n"
                "- General medical conditions and symptoms\n"
                "- Medication information and prescriptions\n"
                "- General health recommendations\n"
                "- Patient education materials\n\n"
                "REFUSE specialized interpretation - redirect to appropriate mode for laboratory or radiology reports.\n\n"
                f"Medical Document:\n{truncated}{warning}"
            )
    else:
        return "ERROR: Please select an appropriate assistance mode for document analysis."
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "system", "content": prompt}],
        max_tokens=512
    )
    return response.choices[0].message['content']

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    capability = request.form.get('capability', 'general')  # Get capability from form data
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    filename = file.filename
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)
    
    try:
        if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.gif')):
            # Read image and encode as base64
            with open(file_path, 'rb') as img_f:
                img_bytes = base64.b64encode(img_f.read())
            # Detect image format from filename
            ext = filename.split('.')[-1].lower()
            if ext == 'jpg':
                ext = 'jpeg'
            result = interpret_image_with_openai(img_bytes, image_format=ext, capability=capability)
        elif filename.lower().endswith('.pdf'):
            # Extract text from PDF
            doc = fitz.open(file_path)
            text = "\n".join(page.get_text() for page in doc)
            result = interpret_text_with_openai(text, capability=capability)
        else:
            result = 'Unsupported file type.'
        return jsonify({'result': result})
    except Exception as e:
        return jsonify({'result': f'Error during interpretation: {str(e)}'})

# Database setup
# Install PyMySQL as MySQLdb replacement
pymysql.install_as_MySQLdb()

# MySQL configuration
MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
MYSQL_PORT = os.getenv('MYSQL_PORT', '3306')
MYSQL_USER = os.getenv('MYSQL_USER', 'root')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '')
MYSQL_DATABASE = os.getenv('MYSQL_DATABASE', 'medchat_db')

app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    otp = db.Column(db.String(6), nullable=True)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    otp_expiry = db.Column(db.Integer, nullable=True)  # Unix timestamp

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# Create the database tables if they don't exist
with app.app_context():
    db.create_all()

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({'error': 'Email and password are required.'}), 400
    
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({
            'error': 'Email already registered.',
            'email_exists': True,
            'is_verified': existing_user.is_verified
        }), 409

    otp = str(random.randint(100000, 999999))
    otp_expiry = int(time.time()) + 300  # OTP valid for 5 minutes
    user = User(email=email, is_verified=False, otp=otp, otp_expiry=otp_expiry)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    # Send OTP via email (simple SMTP example, configure as needed)
    try:
        smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        smtp_port = int(os.getenv('SMTP_PORT', 587))
        smtp_user = os.getenv('SMTP_USER')
        smtp_pass = os.getenv('SMTP_PASS')
        from_email = smtp_user
        to_email = email
        subject = 'Your OTP Code'
        body = f'Your OTP code is: {otp}'
        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = from_email
        msg['To'] = to_email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(from_email, [to_email], msg.as_string())
    except Exception as e:
        return jsonify({'error': f'Failed to send OTP: {str(e)}'}), 500

    return jsonify({'message': 'Signup successful. Please check your email for the OTP.'}), 200

@app.route('/api/verify-otp', methods=['POST'])
def verify_otp():
    data = request.get_json()
    email = data.get('email')
    otp = data.get('otp')
    if not email or not otp:
        return jsonify({'error': 'Email and OTP are required.'}), 400
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found.'}), 404
    if user.is_verified:
        return jsonify({'message': 'User already verified.'}), 200
    if user.otp != otp:
        return jsonify({'error': 'Invalid OTP.'}), 400
    if int(time.time()) > user.otp_expiry:
        return jsonify({'error': 'OTP expired.'}), 400
    user.is_verified = True
    user.otp = None
    user.otp_expiry = None
    db.session.commit()
    return jsonify({'message': 'OTP verified. Account activated.'}), 200

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({'error': 'Email and password are required.'}), 400
    
    user = User.query.filter_by(email=email).first()
    
    if not user:
        return jsonify({
            'error': 'No account found with this email.',
            'user_not_found': True,
            'email': email
        }), 404
    
    if not user.check_password(password):
        return jsonify({'error': 'Invalid password.'}), 401
    
    if not user.is_verified:
        return jsonify({
            'error': 'Account not verified. Please verify OTP.',
            'needs_verification': True,
            'email': email
        }), 403
    
    # For now, just return a success message. Token/session can be added later.
    return jsonify({'message': 'Login successful.'}), 200

if __name__ == '__main__':
    print(f"API running at http://localhost:{os.getenv('PORT', '5000')}")
    
    # Check if OpenAI API key is configured
    if not OPENAI_API_KEY:
        logger.error("OPENAI_API_KEY environment variable is required")
        exit(1)
    
    # Start the Flask server
    app.run(
        debug=os.getenv('FLASK_DEBUG', 'False').lower() == 'true',
        host='0.0.0.0',
        port=int(os.getenv('PORT', '5000'))
    )
