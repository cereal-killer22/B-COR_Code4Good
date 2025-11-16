'use client';

import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Voice recording hook
  const { isRecording, isSupported, startRecording, stopRecording } = useVoiceRecorder({
    onResult: (text) => {
      console.log('Voice result received:', text);
      if (text && text.trim()) {
        // Update message state
        setMessage((prev) => {
          const newText = prev ? `${prev} ${text}` : text;
          // Focus and set cursor position after state update
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.focus();
              // Use the new text for cursor position
              textareaRef.current.setSelectionRange(newText.trim().length, newText.trim().length);
            }
          }, 50);
          return newText.trim();
        });
        setVoiceError(null);
      }
    },
    onError: (error) => {
      console.error('Voice recognition error:', error);
      setVoiceError(error);
      setTimeout(() => setVoiceError(null), 5000); // Clear error after 5 seconds
    },
  });

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.focus();
      }
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const maxLength = 500;

  return (
    <div 
      className="px-6 py-4 border-t"
      style={{
        borderColor: 'var(--card-border)',
        backgroundColor: 'var(--card-background)',
      }}
      role="region"
      aria-label="Chat input area"
    >
      <div className="flex gap-3 items-center">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              if (e.target.value.length <= maxLength) {
                setMessage(e.target.value);
              }
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={disabled}
            rows={1}
            maxLength={maxLength}
            className="w-full resize-none rounded-lg px-4 pr-16 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              border: '1px solid var(--card-border)',
              backgroundColor: 'var(--card-background)',
              color: 'var(--foreground)',
              minHeight: '48px',
              maxHeight: '120px',
              paddingTop: '12px',
              paddingBottom: '12px',
              lineHeight: '1.5',
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = '2px solid var(--focus-ring, var(--primary, #3b82f6))';
              e.currentTarget.style.outlineOffset = '2px';
              e.currentTarget.style.borderColor = 'var(--focus-ring, var(--primary, #3b82f6))';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
              e.currentTarget.style.borderColor = 'var(--card-border)';
            }}
            aria-label="Type your message"
          />
          {message.length > 0 && (
            <div 
              className="absolute right-3 text-xs"
              style={{ 
                color: 'var(--foreground-secondary)',
                bottom: '12px',
              }}
              aria-live="polite"
            >
              {message.length}/{maxLength}
            </div>
          )}
        </div>
        
        {/* Voice Input Button */}
        {isSupported && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              
              // Prevent rapid clicking
              if (disabled) return;
              
              if (isRecording) {
                console.log('Button clicked: Stop recording');
                stopRecording();
              } else {
                console.log('Button clicked: Start recording');
                startRecording();
              }
            }}
            disabled={disabled}
            className="px-4 py-4 rounded-2xl transition-all duration-200 flex items-center justify-center min-w-[48px] h-[48px] focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            style={{
              backgroundColor: isRecording 
                ? '#ef4444' 
                : 'var(--background-secondary)',
              color: isRecording 
                ? '#ffffff' 
                : 'var(--foreground)',
            }}
            onMouseEnter={(e) => {
              if (!isRecording) {
                e.currentTarget.style.backgroundColor = 'var(--card-hover, var(--background-secondary))';
              }
            }}
            onMouseLeave={(e) => {
              if (!isRecording) {
                e.currentTarget.style.backgroundColor = 'var(--background-secondary)';
              }
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = '2px solid var(--focus-ring, var(--primary, #3b82f6))';
              e.currentTarget.style.outlineOffset = '2px';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
            }}
            aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
            title={isRecording ? 'Stop recording' : 'Click to speak'}
          >
            <svg
              className={`w-6 h-6 ${isRecording ? 'voice-icon-pulse' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {isRecording ? (
                // Stop icon (square) when recording
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 6h12v12H6z"
                />
              ) : (
                // Microphone icon when not recording
                <>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </>
              )}
            </svg>
          </button>
        )}

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className="px-5 py-3 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px] h-[48px] focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{
            backgroundColor: 'var(--primary, #3b82f6)',
            color: '#ffffff',
          }}
          onMouseEnter={(e) => {
            if (!disabled && message.trim()) {
              e.currentTarget.style.backgroundColor = 'var(--hover-color, var(--primary, #2563eb))';
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled && message.trim()) {
              e.currentTarget.style.backgroundColor = 'var(--primary, #3b82f6)';
            }
          }}
          onFocus={(e) => {
            e.currentTarget.style.outline = '2px solid var(--focus-ring, var(--primary, #3b82f6))';
            e.currentTarget.style.outlineOffset = '2px';
          }}
          onBlur={(e) => {
            e.currentTarget.style.outline = 'none';
          }}
          aria-label="Send message"
        >
          {disabled ? (
            <svg 
              className="animate-spin h-5 w-5" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg 
              className="w-5 h-5 transform rotate-90" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
      
      {/* Error Message */}
      {voiceError && (
        <div 
          className="mt-3 px-4 py-3 rounded-lg text-sm"
          style={{
            backgroundColor: 'var(--status-error-bg, rgba(239, 68, 68, 0.1))',
            border: '1px solid var(--status-error, #ef4444)',
            color: 'var(--status-error, #dc2626)',
          }}
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start gap-2">
            <svg 
              className="w-5 h-5 flex-shrink-0 mt-0.5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{voiceError}</p>
          </div>
        </div>
      )}
      <div 
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-4 px-2"
        id="keyboard-hints"
      >
        <p 
          className="text-xs font-medium"
          style={{ color: 'var(--foreground-secondary)' }}
        >
          Press <kbd 
            className="px-2 py-1 rounded-lg text-xs font-bold shadow-sm"
            style={{
              backgroundColor: 'var(--background-secondary)',
              border: '1px solid var(--card-border)',
              color: 'var(--foreground)',
            }}
          >Enter</kbd> to send
        </p>
        <p 
          className="text-xs font-medium"
          style={{ color: 'var(--foreground-secondary)' }}
        >
          <kbd 
            className="px-2 py-1 rounded-lg text-xs font-bold shadow-sm"
            style={{
              backgroundColor: 'var(--background-secondary)',
              border: '1px solid var(--card-border)',
              color: 'var(--foreground)',
            }}
          >Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}
