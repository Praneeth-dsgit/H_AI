/**
 * Voice Agent Component
 * Real-time voice conversation with AI assistant
 */

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface VoiceAgentProps {
  onTranscript: (text: string) => void;
  onResponseReady?: (text: string) => void;
  isEnabled?: boolean;
}

const VoiceAgent: React.FC<VoiceAgentProps> = ({ 
  onTranscript, 
  onResponseReady,
  isEnabled = true 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    const speechSynthesis = window.speechSynthesis;
    
    if (SpeechRecognition && speechSynthesis) {
      setIsSupported(true);
      initializeRecognition();
    } else {
      setIsSupported(false);
      setError('Voice features are not supported in your browser. Please use Chrome, Edge, or Safari.');
    }

    return () => {
      stopListening();
      stopSpeaking();
    };
  }, []);

  const initializeRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition() as any;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        onTranscript(finalTranscript.trim());
        stopListening();
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  };

  const startListening = () => {
    if (!isSupported || !recognitionRef.current) {
      setError('Speech recognition not available');
      return;
    }

    try {
      stopSpeaking(); // Stop any ongoing speech
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
      setError('Failed to start voice recognition');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
    setIsListening(false);
  };

  const speak = (text: string) => {
    if (!window.speechSynthesis) {
      setError('Text-to-speech not supported');
      return;
    }

    // Stop any ongoing speech
    stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';

    utterance.onstart = () => {
      setIsSpeaking(true);
      setError(null);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event: any) => {
      console.error('Speech synthesis error:', event);
      setError('Error speaking text');
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);

    if (onResponseReady) {
      onResponseReady(text);
    }
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isEnabled) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-xs text-red-600">{error}</span>
      )}
      
      {/* Voice Input Button */}
      <button
        onClick={toggleListening}
        disabled={!isSupported || isSpeaking}
        className={`p-2 rounded-full transition-colors ${
          isListening
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
        } ${!isSupported || isSpeaking ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isListening ? 'Stop listening' : 'Start voice input'}
      >
        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
      </button>

      {/* Voice Output Indicator */}
      {isSpeaking && (
        <div className="flex items-center gap-1 text-blue-600">
          <Volume2 size={16} className="animate-pulse" />
          <span className="text-xs">Speaking...</span>
        </div>
      )}

      {/* Expose speak function for parent component */}
      {(window as any).voiceAgentSpeak = speak}
    </div>
  );
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
    voiceAgentSpeak?: (text: string) => void;
  }
}

export default VoiceAgent;
export const speakText = (text: string) => {
  if (window.voiceAgentSpeak) {
    window.voiceAgentSpeak(text);
  }
};

