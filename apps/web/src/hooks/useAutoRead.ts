'use client';

import { useEffect, useRef } from 'react';
import { useTextToSpeech } from '@/contexts/TextToSpeechContext';

interface AutoReadOptions {
  /**
   * Text to read automatically
   */
  text: string;
  /**
   * Delay before reading (ms)
   */
  delay?: number;
  /**
   * Read only once per mount
   */
  readOnce?: boolean;
  /**
   * Condition to read (e.g., when data is loaded)
   */
  condition?: boolean;
}

/**
 * Hook to automatically read text when component mounts or condition changes
 * 
 * @example
 * ```tsx
 * useAutoRead({
 *   text: "Page loaded successfully",
 *   delay: 500,
 *   readOnce: true
 * });
 * ```
 */
export function useAutoRead({ text, delay = 1000, readOnce = true, condition = true }: AutoReadOptions) {
  const { isEnabled, autoReadEnabled, speak } = useTextToSpeech();
  const hasReadRef = useRef(false);

  useEffect(() => {
    if (!isEnabled || !autoReadEnabled || !text.trim() || !condition) {
      return;
    }

    if (readOnce && hasReadRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      speak(text);
      hasReadRef.current = true;
    }, delay);

    return () => clearTimeout(timer);
  }, [isEnabled, autoReadEnabled, text, delay, readOnce, condition, speak]);
}

