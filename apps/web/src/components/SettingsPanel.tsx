'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import FontSizeControl from './FontSizeControl';
import HighContrastToggle from './HighContrastToggle';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement>;
}

export default function SettingsPanel({ isOpen, onClose, triggerRef }: SettingsPanelProps) {
  const { theme, toggleTheme } = useTheme();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;

    const panel = panelRef.current;
    const focusableElements = panel.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus the close button or first element when panel opens
    if (closeButtonRef.current) {
      closeButtonRef.current.focus();
    } else if (firstElement) {
      firstElement.focus();
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        // Return focus to trigger button
        if (triggerRef?.current) {
          triggerRef.current.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscape);

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, triggerRef]);

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        // Don't close if clicking the trigger button
        if (triggerRef?.current && triggerRef.current.contains(e.target as Node)) {
          return;
        }
        onClose();
      }
    };

    // Use setTimeout to avoid immediate closing when opening
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen || !mounted) return null;

  const handleClose = () => {
    onClose();
    // Return focus to trigger button
    if (triggerRef?.current) {
      triggerRef.current.focus();
    }
  };

  const handleThemeToggle = () => {
    toggleTheme();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        aria-hidden="true"
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-panel-title"
        className="settings-panel fixed z-50 border shadow-lg"
        style={{
          maxHeight: 'calc(100vh - 4rem)',
          backgroundColor: 'var(--card-background)',
          borderColor: 'var(--card-border)',
          boxShadow: 'var(--shadow-lg)',
          borderRadius: '12px',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-theme" style={{ borderColor: 'var(--card-border)' }}>
          <h2
            ref={titleRef}
            id="settings-panel-title"
            className="text-lg font-semibold text-theme"
            style={{ color: 'var(--foreground)' }}
          >
            Accessibility Settings
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg transition-colors hover:bg-theme-secondary focus:outline-none"
            style={{
              color: 'var(--foreground)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--background-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label="Close settings panel"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
          {/* Light/Dark Mode Toggle */}
          <div className="mb-6">
            <label
              htmlFor="theme-toggle"
              className="block text-sm font-medium mb-3 text-theme"
              style={{ color: 'var(--foreground)' }}
            >
              Theme
            </label>
            <button
              id="theme-toggle"
              type="button"
              onClick={handleThemeToggle}
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
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                )}
                <span className="text-theme" style={{ color: 'var(--foreground)' }}>
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </span>
              </div>
              <div
                className="w-12 h-6 rounded-full p-1 transition-colors"
                style={{
                  backgroundColor: theme === 'dark' ? 'var(--status-success)' : 'var(--foreground-secondary)',
                }}
              >
                <div
                  className="w-4 h-4 rounded-full bg-white transition-transform"
                  style={{
                    transform: theme === 'dark' ? 'translateX(24px)' : 'translateX(0)',
                  }}
                />
              </div>
            </button>
          </div>

          {/* Font Size Control */}
          <FontSizeControl />

          {/* High Contrast Toggle */}
          <HighContrastToggle />

          {/* Placeholder for future accessibility controls */}
          <div className="text-sm text-theme-secondary" style={{ color: 'var(--foreground-secondary)' }}>
            More accessibility options coming soon...
          </div>
        </div>
      </div>
    </>
  );
}

