'use client';

import React from 'react';
import { useTextToSpeech } from '@/contexts/TextToSpeechContext';

export default function TTSToggle() {
  const { isEnabled, isSpeaking, rate, setEnabled, setRate, setAutoReadEnabled, autoReadEnabled } = useTextToSpeech();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setEnabled(!isEnabled);
    }
  };

  const rateOptions = [0.7, 1.0, 1.3, 1.6];

  return (
    <div className="mb-6">
      <label
        id="tts-settings-label"
        className="block text-sm font-medium mb-3 text-theme"
        style={{ color: 'var(--foreground)' }}
      >
        Text-to-Speech
      </label>
      <button
        type="button"
        role="switch"
        aria-checked={isEnabled}
        aria-pressed={isEnabled}
        aria-label="Toggle text-to-speech"
        onClick={() => setEnabled(!isEnabled)}
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
            Enable Text-to-Speech
          </span>
          {isSpeaking && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: 'var(--primary, #3b82f6)', backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
              ● Speaking
            </span>
          )}
        </div>
        <div
          className="w-12 h-6 rounded-full p-1 transition-colors relative"
          style={{
            backgroundColor: isEnabled ? 'var(--status-success)' : 'var(--foreground-secondary)',
          }}
        >
          <div
            className="w-4 h-4 rounded-full bg-white transition-transform shadow-sm"
            style={{
              transform: isEnabled ? 'translateX(24px)' : 'translateX(0)',
            }}
          />
        </div>
      </button>

      {isEnabled && (
        <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--background-secondary)' }}>
          {/* Reading Speed */}
          <div className="mb-3">
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--foreground)' }}>
              Reading Speed: {rate}x
            </label>
            <div className="flex gap-2">
              {rateOptions.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRate(r)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    rate === r ? 'active' : ''
                  }`}
                  style={{
                    backgroundColor: rate === r ? 'var(--primary, #3b82f6)' : 'var(--card-background)',
                    color: rate === r ? 'white' : 'var(--foreground)',
                    border: `1px solid ${rate === r ? 'var(--primary, #3b82f6)' : 'var(--card-border)'}`,
                  }}
                >
                  {r}x
                </button>
              ))}
            </div>
          </div>

          {/* Auto-read toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoReadEnabled}
              onChange={(e) => setAutoReadEnabled(e.target.checked)}
              className="w-4 h-4 cursor-pointer"
              style={{ accentColor: 'var(--primary, #3b82f6)' }}
            />
            <span className="text-xs" style={{ color: 'var(--foreground)' }}>
              Auto-read page content on load
            </span>
          </label>
        </div>
      )}
    </div>
  );
}

