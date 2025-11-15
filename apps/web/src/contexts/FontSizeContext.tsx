'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type FontSize = 'small' | 'medium' | 'large';

interface FontSizeContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

const fontSizeValues = {
  small: '90%',
  medium: '100%',
  large: '130%',
};

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSize>('medium');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savedFontSize = localStorage.getItem('fontSize') as FontSize | null;
    if (savedFontSize && ['small', 'medium', 'large'].includes(savedFontSize)) {
      setFontSizeState(savedFontSize);
    }
    setMounted(true);
  }, []);

  const setFontSize = (newSize: FontSize) => {
    setFontSizeState(newSize);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fontSize', newSize);
      applyFontSize(newSize);
    }
  };

  const applyFontSize = (size: FontSize) => {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    root.style.setProperty('--font-size-multiplier', fontSizeValues[size]);
  };

  useEffect(() => {
    if (mounted) {
      applyFontSize(fontSize);
    }
  }, [fontSize, mounted]);

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  const context = useContext(FontSizeContext);
  if (context === undefined) {
    throw new Error('useFontSize must be used within a FontSizeProvider');
  }
  return context;
}

