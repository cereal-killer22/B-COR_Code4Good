'use client';

import React from 'react';
import { useHighContrast } from '@/contexts/HighContrastContext';

export default function HighContrastToggle() {
  const { isHighContrast, toggleHighContrast } = useHighContrast();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleHighContrast();
    }
  };

  return (
    <div className="mb-6">
      <label
        id="contrast-settings-label"
        className="block text-sm font-medium mb-3 text-theme"
        style={{ color: 'var(--foreground)' }}
      >
        Contrast Settings
      </label>
      <button
        type="button"
        role="switch"
        aria-checked={isHighContrast}
        aria-pressed={isHighContrast}
        aria-label="Toggle high contrast mode"
        onClick={toggleHighContrast}
        onKeyDown={handleKeyDown}
        className="w-full flex items-center justify-between p-3 rounded-lg border border-theme transition-all hover:bg-theme-secondary focus:outline-none"
        style={{
          backgroundColor: 'var(--card-background)',
          borderColor: 'var(--card-border)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--background-secondary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--card-background)';
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-theme font-medium" style={{ color: 'var(--foreground)' }}>
            High Contrast Mode
          </span>
        </div>
        <div
          className="w-12 h-6 rounded-full p-1 transition-colors relative"
          style={{
            backgroundColor: isHighContrast ? 'var(--status-success)' : 'var(--foreground-secondary)',
          }}
        >
          <div
            className="w-4 h-4 rounded-full bg-white transition-transform shadow-sm"
            style={{
              transform: isHighContrast ? 'translateX(24px)' : 'translateX(0)',
            }}
          />
        </div>
      </button>
    </div>
  );
}

