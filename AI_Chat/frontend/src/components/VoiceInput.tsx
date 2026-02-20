import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Check, X, Loader2 } from 'lucide-react';
import { SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionErrorEvent } from '../types';

interface VoiceInputProps {
  onTextGenerated: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ 
  onTextGenerated, 
  disabled = false, 
  placeholder = "Click mic to start recording..." 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAcceptReject, setShowAcceptReject] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const currentTranscriptRef = useRef<string>('');

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onstart = () => {
          setIsRecording(true);
          setShowAcceptReject(false);
          setTranscript('');
          setFinalTranscript('');
          currentTranscriptRef.current = '';
          setRecordingTime(0);
          startTimer();
        };

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscriptResult = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscriptResult += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          const fullTranscript = finalTranscriptResult + interimTranscript;
          setTranscript(fullTranscript);
          
          // Store final transcript separately
          if (finalTranscriptResult) {
            setFinalTranscript(prev => {
              const newFinalTranscript = prev + finalTranscriptResult;
              currentTranscriptRef.current = newFinalTranscript;
              return newFinalTranscript;
            });
          }
        };

        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          stopRecording();
        };

        recognitionRef.current.onend = () => {
          console.log('Speech recognition ended. Final transcript:', currentTranscriptRef.current);
          setIsRecording(false);
          stopTimer();
          
          // Show accept/reject buttons when speech recognition ends
          if (currentTranscriptRef.current.trim()) {
            console.log('Setting showAcceptReject to true');
            setShowAcceptReject(true);
          }
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startTimer = () => {
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = useCallback(() => {
    if (disabled || !recognitionRef.current) return;
    
    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
    }
  }, [disabled]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    stopTimer();
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleAccept = useCallback(() => {
    if (finalTranscript.trim()) {
      onTextGenerated(finalTranscript.trim());
    }
    setTranscript('');
    setFinalTranscript('');
    setShowAcceptReject(false);
  }, [finalTranscript, onTextGenerated]);

  const handleReject = useCallback(() => {
    setTranscript('');
    setFinalTranscript('');
    setShowAcceptReject(false);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    return (
      <div className="flex items-center justify-center p-4 text-gray-500">
        <MicOff size={20} className="mr-2" />
        <span className="text-sm">Speech recognition not supported in this browser</span>
      </div>
    );
  }

  // Debug logging (commented out to prevent console spam)
  // console.log('VoiceInput render - showAcceptReject:', showAcceptReject, 'isRecording:', isRecording, 'finalTranscript:', finalTranscript);

  return (
    <div className="flex items-center overflow-hidden">
      {/* Mic Button */}
      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled}
        className={`p-2 rounded-full transition-all duration-300 shadow-sm hover:shadow-md flex-shrink-0 ${
          isRecording
            ? 'bg-red-500 text-white animate-pulse shadow-lg'
            : disabled
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-primary-100 text-primary-600 hover:bg-primary-200 hover:scale-100'
        }`}
        title={isRecording ? 'Stop recording' : 'Start voice input'}
      >
        {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
      </button>

      {/* Dynamic Expansion Container */}
      <div className={`transition-all duration-300 ease-out overflow-hidden ${
        isRecording || showAcceptReject ? 'ml-3 w-auto opacity-100' : 'ml-0 w-0 opacity-0'
      }`}>
        {/* Recording Interface */}
        {isRecording && (
          <div className="flex items-center space-x-3 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-md">
            {/* Recording Indicator */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 bg-red-400 rounded-full animate-ping"></div>
              </div>
              <span className="text-sm font-medium text-gray-700">Recording</span>
            </div>

            {/* Timer */}
            <div className="text-sm font-mono text-gray-600">
              {formatTime(recordingTime)}
            </div>
          </div>
        )}

        {/* Accept/Reject Buttons */}
        {showAcceptReject && !isRecording && (
          <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-md">
            <button
              type="button"
              onClick={handleAccept}
              disabled={isProcessing}
              className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:opacity-50 transition-colors"
              title="Accept and send"
            >
              {isProcessing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Check size={16} />
              )}
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={isProcessing}
              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50 transition-colors"
              title="Reject and start over"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceInput; 