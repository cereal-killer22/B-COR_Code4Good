'use client';

import { useState, KeyboardEvent, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
      role="region"
      aria-label="Chat input area"
    >
      <div className="flex gap-3 items-end">
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
            className="
              w-full resize-none rounded-lg border border-gray-300 dark:border-gray-700 
              px-4 py-3 pr-16
              focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
              bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
              placeholder:text-gray-400 dark:placeholder:text-gray-500
              text-sm
            "
            style={{ minHeight: '48px', maxHeight: '120px' }}
            aria-label="Type your message"
          />
          {message.length > 0 && (
            <div 
              className="absolute right-3 bottom-3 text-xs text-gray-400 dark:text-gray-500"
              aria-live="polite"
            >
              {message.length}/{maxLength}
            </div>
          )}
        </div>
        <button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className="
            px-5 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900
            hover:bg-gray-800 dark:hover:bg-gray-200
            rounded-lg transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:ring-offset-2
            flex items-center justify-center min-w-[80px]
          "
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
    </div>
  );
}
