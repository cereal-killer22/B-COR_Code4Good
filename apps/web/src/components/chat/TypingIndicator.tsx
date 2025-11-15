'use client';

interface TypingIndicatorProps {
  name?: string;
}

export default function TypingIndicator({ name = 'ClimaWise' }: TypingIndicatorProps) {
  return (
    <div className="flex justify-start mb-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300">
      <div className="flex items-start gap-3">
        <div 
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-500 to-emerald-500 flex items-center justify-center text-white text-lg flex-shrink-0 shadow-lg border-2 border-white dark:border-gray-800"
          aria-hidden="true"
        >
          🌡️
        </div>
        <div 
          className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl rounded-tl-md px-5 py-4 border-2 border-cyan-200 dark:border-cyan-800/50 shadow-md"
          role="status"
          aria-live="polite"
          aria-label={`${name} is typing`}
        >
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5" aria-hidden="true">
              <div 
                className="w-2.5 h-2.5 bg-cyan-500 rounded-full motion-safe:animate-bounce shadow-sm" 
                style={{ animationDelay: '0s' }}
              />
              <div 
                className="w-2.5 h-2.5 bg-blue-500 rounded-full motion-safe:animate-bounce shadow-sm" 
                style={{ animationDelay: '0.2s' }}
              />
              <div 
                className="w-2.5 h-2.5 bg-emerald-500 rounded-full motion-safe:animate-bounce shadow-sm" 
                style={{ animationDelay: '0.4s' }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {name} is thinking...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
