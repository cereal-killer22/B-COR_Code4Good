'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { useEffect, useState, useRef } from 'react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Determine the new theme before toggling
    const newTheme = theme === 'light' ? 'dark' : 'light';
    toggleTheme();
    
    // Announce theme change to screen readers
    const announcement = `Switched to ${newTheme} mode`;
    
    // Create a live region announcement
    const announcementEl = document.createElement('div');
    announcementEl.setAttribute('role', 'status');
    announcementEl.setAttribute('aria-live', 'polite');
    announcementEl.setAttribute('aria-atomic', 'true');
    announcementEl.className = 'sr-only';
    announcementEl.textContent = announcement;
    document.body.appendChild(announcementEl);
    
    // Remove after announcement
    setTimeout(() => {
      if (document.body.contains(announcementEl)) {
        document.body.removeChild(announcementEl);
      }
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    // Support Enter and Space keys
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle(e);
    }
  };

  if (!mounted) {
    return null;
  }

  const isDark = theme === 'dark';
  const nextTheme = isDark ? 'light' : 'dark';

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className="fixed bottom-4 right-4 z-50 p-3 rounded-full shadow-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
      style={{
        backgroundColor: 'var(--card-background)',
        borderColor: 'var(--card-border)',
        color: 'var(--foreground)',
        boxShadow: 'var(--shadow-md)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      aria-label={`Toggle light or dark mode. Currently ${theme} mode, switch to ${nextTheme} mode`}
      aria-pressed={isDark}
      title={`Switch to ${nextTheme} mode (currently ${theme})`}
    >
      <span className="sr-only">
        {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      </span>
      {isDark ? (
        // Moon icon for dark mode (click to switch to light)
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      ) : (
        // Sun icon for light mode (click to switch to dark)
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      )}
    </button>
  );
}

