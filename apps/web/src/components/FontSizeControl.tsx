'use client';

import React, { useRef, useEffect } from 'react';
import { useFontSize } from '@/contexts/FontSizeContext';

interface FontSizeOption {
  value: 'small' | 'medium' | 'large';
  label: string;
  size: string;
}

const fontSizeOptions: FontSizeOption[] = [
  { value: 'small', label: 'Small', size: '90%' },
  { value: 'medium', label: 'Medium', size: '100%' },
  { value: 'large', label: 'Large', size: '130%' },
];

export default function FontSizeControl() {
  const { fontSize, setFontSize } = useFontSize();
  const radioGroupRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, option: FontSizeOption) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setFontSize(option.value);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      const currentIndex = fontSizeOptions.findIndex(opt => opt.value === fontSize);
      const nextIndex = (currentIndex + 1) % fontSizeOptions.length;
      setFontSize(fontSizeOptions[nextIndex].value);
      // Focus the next option
      const nextOption = radioGroupRef.current?.querySelector(
        `[data-font-size="${fontSizeOptions[nextIndex].value}"]`
      ) as HTMLElement;
      nextOption?.focus();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const currentIndex = fontSizeOptions.findIndex(opt => opt.value === fontSize);
      const prevIndex = (currentIndex - 1 + fontSizeOptions.length) % fontSizeOptions.length;
      setFontSize(fontSizeOptions[prevIndex].value);
      // Focus the previous option
      const prevOption = radioGroupRef.current?.querySelector(
        `[data-font-size="${fontSizeOptions[prevIndex].value}"]`
      ) as HTMLElement;
      prevOption?.focus();
    }
  };

  return (
    <div className="mb-6">
      <label
        id="font-size-label"
        className="block text-sm font-medium mb-3 text-theme"
        style={{ color: 'var(--foreground)' }}
      >
        Font Size
      </label>
      <div
        ref={radioGroupRef}
        role="radiogroup"
        aria-labelledby="font-size-label"
        className="space-y-2"
      >
        {fontSizeOptions.map((option) => {
          const isSelected = fontSize === option.value;
          return (
            <div
              key={option.value}
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              data-font-size={option.value}
              onClick={() => setFontSize(option.value)}
              onKeyDown={(e) => handleKeyDown(e, option)}
              className="flex items-center justify-between p-3 rounded-lg border border-theme transition-all cursor-pointer focus:outline-none"
              style={{
                backgroundColor: isSelected ? 'var(--background-secondary)' : 'var(--card-background)',
                borderColor: isSelected ? 'var(--focus-ring)' : 'var(--card-border)',
                borderWidth: isSelected ? '2px' : '1px',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = 'var(--background-secondary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = 'var(--card-background)';
                }
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all"
                  style={{
                    borderColor: isSelected ? 'var(--focus-ring)' : 'var(--foreground-secondary)',
                    backgroundColor: isSelected ? 'var(--focus-ring)' : 'transparent',
                  }}
                >
                  {isSelected && (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: 'white' }}
                    />
                  )}
                </div>
                <span className="text-theme font-medium" style={{ color: 'var(--foreground)' }}>
                  {option.label}
                </span>
              </div>
              <span
                className="text-sm text-theme-secondary"
                style={{ color: 'var(--foreground-secondary)' }}
              >
                {option.size}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

