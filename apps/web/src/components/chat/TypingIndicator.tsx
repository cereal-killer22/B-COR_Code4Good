'use client';

interface TypingIndicatorProps {
  name?: string;
}

export default function TypingIndicator({ name = 'ClimaWise' }: TypingIndicatorProps) {
  return (
    <div className="flex justify-start mb-4">
      <div className="flex items-start gap-3">
        <div 
          className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-base flex-shrink-0"
          aria-hidden="true"
        >
          💬
        </div>
        <div 
          className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
          role="status"
          aria-live="polite"
          aria-label={`${name} is typing`}
        >
          <div className="flex items-center gap-2">
            <div className="flex gap-1" aria-hidden="true">
              <div 
                className="w-1.5 h-1.5 bg-gray-400 rounded-full motion-safe:animate-bounce" 
                style={{ animationDelay: '0s' }}
              />
              <div 
                className="w-1.5 h-1.5 bg-gray-400 rounded-full motion-safe:animate-bounce" 
                style={{ animationDelay: '0.2s' }}
              />
              <div 
                className="w-1.5 h-1.5 bg-gray-400 rounded-full motion-safe:animate-bounce" 
                style={{ animationDelay: '0.4s' }}
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
              {name} is thinking...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
