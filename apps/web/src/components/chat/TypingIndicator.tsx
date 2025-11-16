'use client';

interface TypingIndicatorProps {
  name?: string;
}

export default function TypingIndicator({ name = 'ClimaWise' }: TypingIndicatorProps) {
  return (
    <div className="flex justify-start mb-4">
      <div className="flex items-start gap-3">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
          style={{
            backgroundColor: 'var(--background-secondary)',
          }}
          aria-hidden="true"
        >
          💬
        </div>
        <div 
          className="px-4 py-3 rounded-xl"
          style={{
            backgroundColor: 'var(--card-background)',
            border: '1px solid var(--card-border)',
          }}
          role="status"
          aria-live="polite"
          aria-label={`${name} is typing`}
        >
          <div className="flex items-center gap-2">
            <div className="flex gap-1" aria-hidden="true">
              <div 
                className="w-1.5 h-1.5 rounded-full motion-safe:animate-bounce" 
                style={{ 
                  animationDelay: '0s',
                  backgroundColor: 'var(--foreground-secondary)',
                }}
              />
              <div 
                className="w-1.5 h-1.5 rounded-full motion-safe:animate-bounce" 
                style={{ 
                  animationDelay: '0.2s',
                  backgroundColor: 'var(--foreground-secondary)',
                }}
              />
              <div 
                className="w-1.5 h-1.5 rounded-full motion-safe:animate-bounce" 
                style={{ 
                  animationDelay: '0.4s',
                  backgroundColor: 'var(--foreground-secondary)',
                }}
              />
            </div>
            <span 
              className="text-xs ml-1"
              style={{ color: 'var(--foreground-secondary)' }}
            >
              {name} is thinking...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
