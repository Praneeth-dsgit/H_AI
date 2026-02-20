# MedChat AI Assistant Setup Guide

## Overview
MedChat is an AI-powered medical assistant with three specialized capabilities:
- **General Medical Assistance**: Comprehensive medical guidance and treatment recommendations
- **Radiology Assistance**: Medical imaging interpretation and radiological analysis
- **Lab Report Interpretation**: Laboratory result analysis and clinical correlation

## Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- OpenAI API key

## Backend Setup

1. **Navigate to the API directory:**
   ```bash
   cd api
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   Create a `.env` file in the `api` directory:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   CORS_ORIGINS=http://localhost:3000,http://localhost:5173
   FLASK_DEBUG=False
   PORT=5000
   
   # Email configuration for OTP (optional)
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_email_password
   ```

5. **Run the backend:**
   ```bash
   python app.py
   ```

## Frontend Setup

1. **Navigate to the project root and install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

## Features

### Capability Selection
After accepting the disclaimer, users choose from three AI assistant modes:

1. **General Medical Assistant**
   - Differential diagnosis support
   - Treatment recommendations
   - Drug interactions and contraindications
   - Patient counseling guidance
   - Clinical decision support

2. **Radiology Assistant**
   - Medical image interpretation
   - Radiological findings analysis
   - Imaging technique recommendations
   - Differential diagnosis from imaging
   - Follow-up imaging suggestions

3. **Lab Report Interpretation**
   - Lab result interpretation
   - Critical value alerts
   - Clinical correlation guidance
   - Follow-up testing recommendations
   - Reference range analysis

### File Upload
- **Images**: Upload medical images for radiology analysis
- **PDFs**: Upload lab reports for interpretation
- Both file types are analyzed according to the selected capability

### User Authentication
- Email-based signup with OTP verification
- Secure login system
- Session management

## Usage

1. **Initial Setup**: Accept disclaimer and select your preferred AI capability
2. **Patient Information**: Fill in relevant patient details (optional but recommended)
3. **Interaction**: Ask questions or upload files according to your selected capability
4. **Mode Switching**: Use the "Change Assistant Mode" button to switch between capabilities
5. **Session Management**: Create new sessions or switch between existing ones

## Important Notes

- This tool is designed for healthcare professionals only
- It provides decision support but should not replace clinical judgment
- All conversations are stored locally in the browser
- The AI responses are capability-specific and optimized for the selected mode
- OpenAI API usage costs apply based on your usage

## Troubleshooting

- **API Connection Issues**: Verify your OpenAI API key is valid and has sufficient credits
- **CORS Errors**: Ensure the frontend URL is included in CORS_ORIGINS
- **File Upload Issues**: Check that files are supported formats (PDF, JPG, PNG, etc.)
- **Capability Not Working**: Try refreshing the page and reselecting your capability

## Development

The application uses:
- **Backend**: Flask with OpenAI API integration
- **Frontend**: React with TypeScript, Vite, and Tailwind CSS
- **Database**: SQLite for user management
- **File Processing**: PyMuPDF for PDFs, PIL for images 