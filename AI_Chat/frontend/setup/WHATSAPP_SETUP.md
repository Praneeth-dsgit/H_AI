# WhatsApp Integration Setup Guide

This guide will help you set up WhatsApp Business API integration for sending automated reminders and notifications to patients.

## Features

✅ **Automated Reminders**
- Appointment reminders with patient context
- Medication reminders with actual prescription data
- Follow-up reminders
- Custom notifications

✅ **Enhanced Data Integration**
- Fetches medication data from database
- Includes prescription history
- Uses LLM for personalized message formatting
- Supports multiple database table structures

✅ **Chat Commands**
- Send notifications via simple chat messages
- Support for patient ID or name
- Natural language processing
- Smart medication and appointment detection

✅ **Bulk Operations**
- Send reminders to all upcoming appointments
- Automated scheduling
- Personalized bulk messaging

## Prerequisites

1. **WhatsApp Business Account**
   - Create a WhatsApp Business account
   - Verify your business phone number

2. **Meta Developer Account**
   - Sign up at [Meta for Developers](https://developers.facebook.com/)
   - Create a WhatsApp Business app

## Setup Instructions

### 1. Create WhatsApp Business App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click "Create App" → "Business" → "WhatsApp"
3. Fill in your app details
4. Add WhatsApp to your app

### 2. Configure WhatsApp Business API

1. In your app dashboard, go to "WhatsApp" → "Getting Started"
2. Add your phone number
3. Verify the phone number via SMS/call
4. Note down your **Phone Number ID** and **Access Token**

### 3. Environment Variables

Add these variables to your `.env` file:

```env
# WhatsApp Business API Configuration
WHATSAPP_API_URL=https://graph.facebook.com/v17.0
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_ACCESS_TOKEN=your_access_token_here

# Database Configuration (if not already set)
MYSQL_HOST=localhost
MYSQL_DATABASE=hospital_db
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_PORT=3306
```

### 4. Test the Integration

Run the test script to verify everything is working:

```bash
cd api
python test_whatsapp.py
```

## Usage Examples

### Chat Commands

You can now use these commands in the Patient Engagement chat:

#### Send General Notifications
```
send reminder notification to patient John Doe
notify patient ID 1 about "Please bring your medical reports"
send message to Carol Lee saying "Your test results are ready"
```

#### Send Appointment Reminders
```
send appointment reminder to patient John Doe
remind patient ID 2 about their appointment
notify Carol Lee about appointment
send appointment reminders to these patients
send reminders to all patients
```

#### Send Medication Reminders
```
send medication reminder to patient John Doe for Aspirin 100mg at 9:00 AM
remind patient ID 1 to take medicine
notify Carol Lee about medication
send medication reminder to patient John Doe
```

### API Endpoints

#### Send Custom Notification
```bash
POST /api/notifications/send
{
  "patient_identifier": "John Doe",
  "message": "Your test results are ready for pickup."
}
```

#### Send Appointment Reminder
```bash
POST /api/notifications/appointment-reminder
{
  "appointment_id": 123
}
```

#### Send Medication Reminder
```bash
POST /api/notifications/medication-reminder
{
  "patient_id": 1,
  "medication_name": "Aspirin",
  "dosage": "100mg",
  "time": "9:00 AM"
}
```

#### Send Bulk Appointment Reminders
```bash
POST /api/notifications/bulk-appointments
{
  "hours_ahead": 24
}
```

## Message Templates

The system automatically formats messages with:

### Enhanced Appointment Reminder
```
🏥 Personalized Appointment Reminder

Dear [Patient Name],

This is a reminder for your upcoming appointment:

👨‍⚕️ Doctor: Dr. [Doctor Name]
🏥 Department: [Department]
📅 Date: [Date]
⏰ Time: [Time]
📍 Location: Main Hospital

📋 Preparation Instructions:
• Bring your current medications list
• Arrive 15 minutes early
• Bring any recent test results
• Fasting required: [Yes/No based on appointment type]

💊 Current Medications Note:
Based on your records, you're currently taking [medication list]. Please bring these with you or a list of your current medications.

If you need to reschedule, please contact us at least 24 hours in advance.

Best regards,
Your Healthcare Team
```

### Enhanced Medication Reminder
```
🏥 Personalized Medication Reminder

Dear [Patient Name],

Based on your current prescriptions, here's your medication reminder for today:

💊 [Medication 1]: [Dosage] - [Instructions]
⏰ Take at: [Time/Frequency]

💊 [Medication 2]: [Dosage] - [Instructions]  
⏰ Take at: [Time/Frequency]

📋 Important Notes:
• Take with food if specified
• Don't skip doses - contact us if you miss one
• Store medications properly
• Report any side effects immediately

If you have questions about your medications or experience any side effects, please contact your healthcare provider.

Best regards,
Your Healthcare Team
```

## Troubleshooting

### Common Issues

1. **"WhatsApp not configured" error**
   - Check your environment variables
   - Verify Phone Number ID and Access Token

2. **"Patient not found" error**
   - Ensure patient exists in database
   - Check patient name spelling
   - Try using patient ID instead of name

3. **"Failed to send notification" error**
   - Check WhatsApp API credentials
   - Verify phone number format
   - Check API rate limits

### Testing Without WhatsApp

If you don't have WhatsApp Business API set up, the system will:
- Log all messages instead of sending them
- Show "WhatsApp not configured" warnings
- Still process all commands and return success responses

### Debug Mode

Enable debug logging by setting:
```env
FLASK_DEBUG=true
```

Check logs in `api/app.log` for detailed information.

## Security Considerations

1. **Access Token Security**
   - Never commit access tokens to version control
   - Use environment variables
   - Rotate tokens regularly

2. **Phone Number Privacy**
   - Ensure patient consent for WhatsApp notifications
   - Follow local privacy regulations
   - Implement opt-out mechanisms

3. **Rate Limiting**
   - WhatsApp has rate limits (typically 1000 messages/day)
   - Implement proper queuing for bulk operations

## Support

For issues with:
- **WhatsApp Business API**: Check [Meta Developer Documentation](https://developers.facebook.com/docs/whatsapp)
- **System Integration**: Check the application logs
- **Database Issues**: Verify patient data exists

## Next Steps

1. **Automated Scheduling**: Set up cron jobs for daily reminders
2. **Message Templates**: Customize message formats
3. **Analytics**: Track message delivery and engagement
4. **Two-way Communication**: Enable patient responses 