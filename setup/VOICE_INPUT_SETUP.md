# Voice Input Feature Setup Guide

## Overview

The voice input feature allows users to speak their medical queries instead of typing them. The system uses the Web Speech API for real-time speech recognition with accept/reject functionality and auto-processing after 2 seconds.

## Features

### 🎤 Voice Recording
- Click the microphone button to start recording
- Real-time speech-to-text conversion
- Visual feedback with recording timer
- Editable transcript before sending

### ✅ Accept/Reject Functionality
- **Accept Button (Green)**: Confirms the transcript and sends it
- **Reject Button (Red)**: Discards the transcript and starts over
- **Auto-processing**: If no action is taken within 2 seconds, the transcript is automatically accepted

### 🎯 User Experience
- Recording interface appears above the input box
- Live transcript updates as you speak
- Ability to edit transcript before sending
- Visual indicators for recording status and auto-processing countdown

## Technical Implementation

### Frontend Components

#### VoiceInput.tsx
```typescript
interface VoiceInputProps {
  onTextGenerated: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}
```

**Key Features:**
- Web Speech API integration
- Real-time transcript updates
- Accept/reject buttons with 2-second auto-processing
- Recording timer and visual feedback
- Editable transcript textarea

#### Integration in App.tsx
```typescript
// Voice input state
const [isVoiceRecording, setIsVoiceRecording] = useState(false);

// Voice input handler
const handleVoiceTextGenerated = (text: string) => {
  setInput(text);
  setIsVoiceRecording(false);
  if (inputRef.current) inputRef.current.focus();
};
```

### Backend Support

#### Speech-to-Text Endpoint
```python
@app.route('/api/speech-to-text', methods=['POST'])
def speech_to_text():
    # Process audio files using OpenAI Whisper API
    # Returns transcribed text with confidence score
```

**Features:**
- Audio file validation
- OpenAI Whisper API integration
- Temporary file cleanup
- Error handling and logging

## Browser Compatibility

### Supported Browsers
- ✅ Chrome/Chromium (recommended)
- ✅ Edge
- ✅ Safari (limited support)
- ❌ Firefox (no Web Speech API support)

### Requirements
- HTTPS connection (required for microphone access)
- Microphone permissions granted
- Modern browser with Web Speech API support

## Setup Instructions

### 1. Frontend Setup

The voice input component is already integrated into the main application. No additional setup required.

### 2. Backend Setup

#### Dependencies
The backend uses OpenAI's Whisper API for enhanced speech recognition. Ensure your `.env` file includes:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

#### API Endpoints
The following endpoint is automatically available:
- `POST /api/speech-to-text` - Process audio files for transcription

### 3. Environment Configuration

#### Development
```bash
# Start the development server
npm run dev

# The voice input feature will be available at:
# http://localhost:5173
```

#### Production
```bash
# Build the application
npm run build

# Deploy with HTTPS (required for microphone access)
```

## Usage Guide

### Basic Usage

1. **Start Recording**
   - Click the microphone button (🎤) next to the chat input
   - Grant microphone permissions when prompted
   - Speak your medical query clearly

2. **Review Transcript**
   - Watch the real-time transcript appear
   - Edit the text if needed before sending
   - Use the textarea to make corrections

3. **Accept or Reject**
   - **Accept (✓)**: Send the transcript as your message
   - **Reject (✗)**: Start over with a new recording
   - **Auto-process**: Wait 2 seconds for automatic acceptance

### Advanced Features

#### Editing Transcript
- Click in the transcript textarea to edit
- Make corrections for medical terminology
- Add punctuation or clarify meaning

#### Recording Controls
- **Stop Recording**: Click the microphone button again or the X button
- **Recording Timer**: Shows how long you've been recording
- **Visual Feedback**: Red pulsing dot indicates active recording

#### Error Handling
- **Permission Denied**: Browser will prompt for microphone access
- **Network Issues**: Fallback to manual typing
- **Unsupported Browser**: Graceful degradation with message

## Troubleshooting

### Common Issues

#### 1. Microphone Not Working
**Symptoms**: No recording starts, no visual feedback
**Solutions**:
- Check browser permissions for microphone access
- Ensure HTTPS connection (required for microphone)
- Try refreshing the page
- Check if microphone is being used by another application

#### 2. Poor Recognition Accuracy
**Symptoms**: Incorrect transcriptions
**Solutions**:
- Speak clearly and at a normal pace
- Reduce background noise
- Use medical terminology clearly
- Check microphone quality and positioning

#### 3. Browser Compatibility
**Symptoms**: Voice input not available
**Solutions**:
- Use Chrome or Edge browser
- Update to latest browser version
- Check if Web Speech API is supported

#### 4. Auto-processing Issues
**Symptoms**: Transcript not sent automatically
**Solutions**:
- Wait for the full 2-second countdown
- Check for JavaScript errors in console
- Ensure no network connectivity issues

### Debug Information

#### Browser Console
Check for these messages:
```javascript
// Successful initialization
"Speech recognition initialized"

// Permission granted
"Microphone permission granted"

// Recognition errors
"Speech recognition error: [error_type]"
```

#### Network Tab
Monitor API calls:
- `POST /api/speech-to-text` - Audio processing requests
- Response should include `transcript` and `confidence` fields

## Security Considerations

### Privacy
- Audio is processed locally using Web Speech API
- No audio files are permanently stored
- Temporary files are cleaned up immediately
- Transcripts are treated as regular chat messages

### Permissions
- Microphone access requires explicit user consent
- Permissions are browser-specific and can be revoked
- No persistent audio recording without user action

### Data Handling
- Audio files are not logged or stored
- Transcripts follow the same security as text input
- No audio data is transmitted to third parties

## Performance Optimization

### Best Practices
- Keep recording sessions under 30 seconds
- Use clear, concise speech
- Minimize background noise
- Close other applications using microphone

### Resource Usage
- Web Speech API uses minimal CPU
- Memory usage scales with recording length
- Network usage only for final transcript submission

## Future Enhancements

### Planned Features
- [ ] Multiple language support
- [ ] Custom medical vocabulary training
- [ ] Voice command shortcuts
- [ ] Offline speech recognition
- [ ] Enhanced error correction

### Integration Opportunities
- [ ] Integration with medical dictation software
- [ ] Voice-based navigation
- [ ] Accessibility improvements
- [ ] Mobile app voice input

## Support

For technical support or feature requests:
1. Check browser compatibility
2. Review troubleshooting section
3. Check browser console for errors
4. Contact development team with specific error messages

---

**Note**: Voice input is designed to enhance accessibility and user experience. It should not replace professional medical consultation or emergency services. 