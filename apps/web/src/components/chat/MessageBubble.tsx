'use client';

import { useEffect, useRef, useState } from 'react';

interface MessageBubbleProps {
  message: string;
  isUser: boolean;
  timestamp: string;
}

export default function MessageBubble({ message, isUser, timestamp }: MessageBubbleProps) {
  const [isVisible, setIsVisible] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Trigger animation on mount with reduced motion support
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      setIsVisible(true);
    } else {
      setIsVisible(true); // Still show, just without animation
    }
  }, []);

  const formattedTime = new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div 
      ref={bubbleRef}
      className={`
        flex ${isUser ? 'justify-end' : 'justify-start'} mb-6
        transition-all duration-500 ease-out
        motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      role="article"
      aria-label={isUser ? 'Your message' : 'ClimaWise response'}
    >
      <div className={`flex items-start gap-3 max-w-[85%] sm:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {!isUser && (
          <div 
            className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-500 to-emerald-500 flex items-center justify-center text-white text-lg font-semibold flex-shrink-0 shadow-xl border-2 border-white dark:border-gray-800 transform transition-transform duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2"
            role="img"
            aria-label="ClimaWise avatar"
            tabIndex={0}
          >
            🌡️
          </div>
        )}
        
        {/* Message Bubble */}
        <div
          className={`
            relative rounded-2xl px-5 py-4 shadow-xl transition-all duration-200
            hover:shadow-2xl transform hover:scale-[1.02] focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2
            ${isUser
              ? 'bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 text-white rounded-tr-md focus-within:ring-cyan-400'
              : 'bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900 text-gray-900 dark:text-gray-100 rounded-tl-md border-2 border-blue-200 dark:border-blue-800/50 shadow-blue-100 dark:shadow-blue-900/20 focus-within:ring-blue-400'
            }
          `}
          role="group"
          aria-label={isUser ? 'Your message bubble' : 'ClimaWise message bubble'}
        >
          {/* Message Content */}
          <div 
            className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words font-normal"
            style={{ 
              color: isUser ? 'inherit' : undefined,
              minHeight: '1.5rem'
            }}
          >
            {message.split('**').map((part, i) => 
              i % 2 === 1 ? (
                <strong 
                  key={i} 
                  className={isUser ? 'text-white font-bold drop-shadow-sm' : 'text-blue-700 dark:text-cyan-400 font-bold'}
                >
                  {part}
                </strong>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </div>
          
          {/* Timestamp */}
          <div
            className={`
              text-xs mt-3 flex items-center gap-2 font-medium
              ${isUser ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'}
            `}
            aria-label={`Sent at ${formattedTime}`}
          >
            <time dateTime={timestamp} className="font-medium">
              {formattedTime}
            </time>
            {isUser && (
              <svg 
                className="w-3.5 h-3.5" 
                fill="currentColor" 
                viewBox="0 0 20 20"
                aria-label="Message sent"
                aria-hidden="false"
              >
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>

        {/* User Avatar */}
        {isUser && (
          <div 
            className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700 flex items-center justify-center text-white text-lg font-semibold flex-shrink-0 shadow-xl border-2 border-white dark:border-gray-800 transform transition-transform duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            role="img"
            aria-label="Your avatar"
            tabIndex={0}
          >
            👤
          </div>
        )}
      </div>
    </div>
  );
}
