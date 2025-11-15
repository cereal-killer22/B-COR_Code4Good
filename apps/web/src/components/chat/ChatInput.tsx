'use client';

import { useState, KeyboardEvent, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
  const remainingChars = maxLength - message.length;
  const isNearLimit = remainingChars < 50;

  return (
    <div 
      className="border-t-2 border-cyan-100 dark:border-cyan-900/50 p-5 sm:p-6 bg-gradient-to-b from-white via-cyan-50/20 to-blue-50/30 dark:from-gray-900 dark:to-gray-950"
      role="region"
      aria-label="Chat input area"
    >
      <div className="flex gap-3 sm:gap-4 items-end">
        <div className="flex-1 relative">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => {
                if (e.target.value.length <= maxLength) {
                  setMessage(e.target.value);
                }
              }}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ask ClimaWise about cyclones, floods, ocean health, or disaster preparedness..."
              disabled={disabled}
              rows={1}
              maxLength={maxLength}
              className={`
                w-full resize-none rounded-2xl border-2 px-5 py-4 pr-20
                focus:outline-none focus:ring-4 transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                bg-white dark:bg-gray-800 dark:text-white
                placeholder:text-gray-400 dark:placeholder:text-gray-500
                text-sm sm:text-base
                ${isFocused 
                  ? 'border-cyan-500 dark:border-cyan-500 focus:ring-cyan-500/30 shadow-lg' 
                  : 'border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md'
                }
                ${isNearLimit ? 'border-orange-400 dark:border-orange-600 focus:ring-orange-400/30' : ''}
              `}
              style={{ minHeight: '56px', maxHeight: '120px' }}
              aria-label="Type your message"
              aria-describedby="char-count keyboard-hints"
              aria-invalid={isNearLimit}
            />
            {message.length > 0 && (
              <div 
                className={`absolute right-4 bottom-4 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                  isNearLimit 
                    ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                }`}
                id="char-count"
                aria-live="polite"
                aria-atomic="true"
              >
                {message.length}/{maxLength}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className={`
            px-6 sm:px-8 py-4 bg-gradient-to-r from-cyan-600 via-blue-600 to-emerald-600
            hover:from-cyan-700 hover:via-blue-700 hover:to-emerald-700
            text-white font-bold rounded-2xl transition-all duration-200
            shadow-lg hover:shadow-xl
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg
            flex items-center gap-2 sm:gap-3 min-w-[100px] sm:min-w-[140px] justify-center
            motion-safe:transform motion-safe:hover:scale-105 motion-safe:active:scale-95
            focus:outline-none focus:ring-4 focus:ring-cyan-500/50 focus:ring-offset-2
          `}
          aria-label="Send message"
          aria-disabled={disabled || !message.trim()}
        >
          {disabled ? (
            <>
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
              <span className="font-semibold hidden sm:inline">Sending...</span>
            </>
          ) : (
            <>
              <span className="font-bold">Send</span>
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>
      </div>
      <div 
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-4 px-2"
        id="keyboard-hints"
      >
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          Press <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-bold border border-gray-200 dark:border-gray-700 shadow-sm">Enter</kbd> to send
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-bold border border-gray-200 dark:border-gray-700 shadow-sm">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}
