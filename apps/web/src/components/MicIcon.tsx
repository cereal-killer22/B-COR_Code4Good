'use client';

import React from 'react';
import { useTextToSpeech } from '@/contexts/TextToSpeechContext';
import './MicIcon.css';

interface MicIconProps {
  /**
   * Text to read when icon is clicked
   */
  text: string;
  /**
   * Size of the icon
   */
  size?: 'small' | 'medium';
  /**
   * Custom className
   */
  className?: string;
  /**
   * Position relative to parent
   */
  position?: 'inline' | 'absolute';
}

export default function MicIcon({ 
  text, 
  size = 'small',
  className = '',
  position = 'inline'
}: MicIconProps) {
  const { isEnabled, isSpeaking, speak, stop } = useTextToSpeech();

  if (!isEnabled || !text.trim()) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSpeaking) {
      stop();
    } else {
      speak(text);
    }
  };

  const iconSize = size === 'small' ? 20 : 24;
  const containerClass = position === 'absolute' 
    ? 'tts-mic-icon-absolute' 
    : 'tts-mic-icon-inline';

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`tts-mic-icon ${containerClass} ${className}`}
      aria-label={isSpeaking ? 'Stop reading' : 'Read text aloud'}
      title={isSpeaking ? 'Stop reading' : 'Read text aloud'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isSpeaking ? 'tts-mic-pulsing' : ''}
      >
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    </button>
  );
}

