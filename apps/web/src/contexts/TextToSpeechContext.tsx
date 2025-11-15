'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface TTSState {
  isEnabled: boolean;
  isSpeaking: boolean;
  rate: number;
  voice: SpeechSynthesisVoice | null;
  voices: SpeechSynthesisVoice[];
  autoReadEnabled: boolean;
}

interface TTSContextType extends TTSState {
  speak: (text: string, options?: { rate?: number; voice?: SpeechSynthesisVoice | null }) => void;
  stop: () => void;
  setRate: (rate: number) => void;
  setVoice: (voice: SpeechSynthesisVoice | null) => void;
  setEnabled: (enabled: boolean) => void;
  setAutoReadEnabled: (enabled: boolean) => void;
}

const TTSContext = createContext<TTSContextType | undefined>(undefined);

const STORAGE_KEY = 'tts-settings';

export function TextToSpeechProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TTSState>({
    isEnabled: false,
    isSpeaking: false,
    rate: 1.0,
    voice: null,
    voices: [],
    autoReadEnabled: true,
  });

  const utteranceRef = React.useRef<SpeechSynthesisUtterance | null>(null);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      
      const voices = speechSynthesis.getVoices();
      setState(prev => {
        const defaultVoice = voices.find(v => v.default) || voices[0] || null;
        return {
          ...prev,
          voices,
          voice: prev.voice || defaultVoice,
        };
      });
    };

    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Load saved settings
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(prev => ({
          ...prev,
          isEnabled: parsed.isEnabled ?? false,
          rate: parsed.rate ?? 1.0,
          autoReadEnabled: parsed.autoReadEnabled ?? true,
        }));
      } catch (e) {
        console.error('Failed to load TTS settings:', e);
      }
    }
  }, []);

  // Save settings
  const saveSettings = useCallback((updates: Partial<TTSState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          isEnabled: newState.isEnabled,
          rate: newState.rate,
          autoReadEnabled: newState.autoReadEnabled,
          voiceName: newState.voice?.name,
          voiceLang: newState.voice?.lang,
        }));
      }
      
      return newState;
    });
  }, []);

  // Speak function
  const speak = useCallback((text: string, options?: { rate?: number; voice?: SpeechSynthesisVoice | null }) => {
    if (!text.trim() || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    // Stop any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options?.rate ?? state.rate;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.voice = options?.voice ?? state.voice;

    utterance.onstart = () => {
      setState(prev => ({ ...prev, isSpeaking: true }));
    };

    utterance.onend = () => {
      setState(prev => ({ ...prev, isSpeaking: false }));
      utteranceRef.current = null;
    };

    utterance.onerror = () => {
      setState(prev => ({ ...prev, isSpeaking: false }));
      utteranceRef.current = null;
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [state.rate, state.voice]);

  // Stop function
  const stop = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    setState(prev => ({ ...prev, isSpeaking: false }));
    utteranceRef.current = null;
  }, []);

  // Set rate
  const setRate = useCallback((rate: number) => {
    saveSettings({ rate });
  }, [saveSettings]);

  // Set voice
  const setVoice = useCallback((voice: SpeechSynthesisVoice | null) => {
    setState(prev => ({ ...prev, voice }));
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          parsed.voiceName = voice?.name;
          parsed.voiceLang = voice?.lang;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        } catch (e) {
          console.error('Failed to save voice:', e);
        }
      }
    }
  }, []);

  // Set enabled
  const setEnabled = useCallback((enabled: boolean) => {
    if (!enabled) {
      stop();
    }
    saveSettings({ isEnabled: enabled });
  }, [stop, saveSettings]);

  // Set auto-read enabled
  const setAutoReadEnabled = useCallback((enabled: boolean) => {
    saveSettings({ autoReadEnabled: enabled });
  }, [saveSettings]);

  // Update document attribute for CSS
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (state.isEnabled) {
      document.documentElement.setAttribute('data-tts-enabled', 'true');
    } else {
      document.documentElement.removeAttribute('data-tts-enabled');
    }
  }, [state.isEnabled]);

  const value: TTSContextType = {
    ...state,
    speak,
    stop,
    setRate,
    setVoice,
    setEnabled,
    setAutoReadEnabled,
  };

  return <TTSContext.Provider value={value}>{children}</TTSContext.Provider>;
}

export function useTextToSpeech() {
  const context = useContext(TTSContext);
  if (context === undefined) {
    throw new Error('useTextToSpeech must be used within a TextToSpeechProvider');
  }
  return context;
}

