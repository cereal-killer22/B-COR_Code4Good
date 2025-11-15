'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface HighContrastContextType {
  isHighContrast: boolean;
  toggleHighContrast: () => void;
}

const HighContrastContext = createContext<HighContrastContextType | undefined>(undefined);

export function HighContrastProvider({ children }: { children: React.ReactNode }) {
  const [isHighContrast, setIsHighContrastState] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savedHighContrast = localStorage.getItem('highContrast');
    if (savedHighContrast === 'true') {
      setIsHighContrastState(true);
      applyHighContrast(true);
    }
    setMounted(true);
  }, []);

  const applyHighContrast = (enabled: boolean) => {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    if (enabled) {
      root.setAttribute('data-high-contrast', 'true');
    } else {
      root.removeAttribute('data-high-contrast');
    }
  };

  const toggleHighContrast = () => {
    setIsHighContrastState((prev) => {
      const newValue = !prev;
      localStorage.setItem('highContrast', String(newValue));
      applyHighContrast(newValue);
      return newValue;
    });
  };

  useEffect(() => {
    if (mounted) {
      applyHighContrast(isHighContrast);
    }
  }, [isHighContrast, mounted]);

  return (
    <HighContrastContext.Provider value={{ isHighContrast, toggleHighContrast }}>
      {children}
    </HighContrastContext.Provider>
  );
}

export function useHighContrast() {
  const context = useContext(HighContrastContext);
  if (context === undefined) {
    throw new Error('useHighContrast must be used within a HighContrastProvider');
  }
  return context;
}

