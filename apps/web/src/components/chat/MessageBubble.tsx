'use client';

import { useEffect, useState } from 'react';

interface MessageBubbleProps {
  message: string;
  isUser: boolean;
  timestamp: string;
}

export default function MessageBubble({ message, isUser, timestamp }: MessageBubbleProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      setTimeout(() => setIsVisible(true), 50);
    } else {
      setIsVisible(true);
    }
  }, []);

  const formattedTime = new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div 
      className={`
        flex ${isUser ? 'justify-end' : 'justify-start'} mb-4
        transition-opacity duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
      role="article"
      aria-label={isUser ? 'Your message' : 'ClimaWise response'}
    >
      <div className={`flex items-start gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {!isUser && (
          <div 
            className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-base flex-shrink-0"
            role="img"
            aria-label="ClimaWise avatar"
          >
            💬
          </div>
        )}
        
        {/* Message Bubble */}
        <div
          className={`
            px-4 py-3 rounded-xl
            ${isUser
              ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
            }
          `}
          role="group"
        >
          {/* Message Content */}
          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.split('**').map((part, i) => 
              i % 2 === 1 ? (
                <strong 
                  key={i} 
                  className={isUser ? 'font-semibold' : 'font-semibold text-gray-900 dark:text-gray-100'}
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
              text-xs mt-2
              ${isUser ? 'text-gray-400 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400'}
            `}
            aria-label={`Sent at ${formattedTime}`}
          >
            <time dateTime={timestamp}>{formattedTime}</time>
          </div>
        </div>

        {/* User Avatar */}
        {isUser && (
          <div 
            className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-base flex-shrink-0"
            role="img"
            aria-label="Your avatar"
          >
            👤
          </div>
        )}
      </div>
    </div>
  );
}
