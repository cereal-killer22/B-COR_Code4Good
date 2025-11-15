'use client';

import React from 'react';
import { useTextToSpeech } from '@/contexts/TextToSpeechContext';
import { Button } from './ui';

/**
 * Button that reads all page content when clicked
 * Only shows when TTS is enabled
 */
export default function ReadAllButton() {
  const { isEnabled, speak, stop, isSpeaking } = useTextToSpeech();

  if (!isEnabled) {
    return null;
  }

  const handleReadAll = () => {
    if (isSpeaking) {
      stop();
      return;
    }

    // Collect all readable content from the page
    const content: string[] = [];

    // Page title
    const title = document.querySelector('h1')?.textContent || document.title;
    if (title) {
      content.push(title);
    }

    // All headings
    const headings = document.querySelectorAll('h2, h3');
    headings.forEach((h) => {
      const text = h.textContent?.trim();
      if (text && text.length < 200) {
        content.push(text);
      }
    });

    // Key metrics from cards
    const metricCards = document.querySelectorAll('[class*="MetricCard"], [class*="metric"]');
    metricCards.forEach((card) => {
      const text = card.textContent?.trim();
      if (text && text.length < 300) {
        content.push(text);
      }
    });

    // Alerts
    const alerts = document.querySelectorAll('[role="alert"], .alert, [class*="alert"]');
    alerts.forEach((alert) => {
      const text = alert.textContent?.trim();
      if (text && text.length < 200) {
        content.push(text);
      }
    });

    // Combine and read
    const fullText = content.filter(Boolean).join('. ');
    if (fullText) {
      speak(fullText);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleReadAll}
      className="fixed bottom-4 right-4 z-40"
      style={{
        backgroundColor: 'var(--primary, #3b82f6)',
        color: 'white',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      }}
    >
      {isSpeaking ? '⏸ Stop' : '🔊 Read All'}
    </Button>
  );
}

