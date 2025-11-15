'use client';

import React, { useState, useEffect } from 'react';

type ColorBlindType = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';

export default function ColorBlindFilter() {
  const [filter, setFilter] = useState<ColorBlindType>('none');

  // Load saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem('colorBlindFilter') as ColorBlindType;
    if (saved && ['none', 'protanopia', 'deuteranopia', 'tritanopia'].includes(saved)) {
      setFilter(saved);
      applyFilter(saved);
    }
  }, []);

  // Apply filter to document
  const applyFilter = (filterType: ColorBlindType) => {
    const root = document.documentElement;
    
    if (filterType === 'none') {
      root.removeAttribute('data-color-blind');
    } else {
      root.setAttribute('data-color-blind', filterType);
    }
  };

  // Handle filter change
  const handleFilterChange = (filterType: ColorBlindType) => {
    setFilter(filterType);
    applyFilter(filterType);
    localStorage.setItem('colorBlindFilter', filterType);
  };

  return (
    <div>
      <label
        className="block text-sm font-medium mb-2 text-theme"
        style={{ color: 'var(--foreground)' }}
      >
        Color-Blind Filter
      </label>
      <div className="space-y-1.5">
        <button
          type="button"
          onClick={() => handleFilterChange('none')}
          className={`w-full text-left p-2 rounded-lg border transition-all focus:outline-none text-sm ${
            filter === 'none'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-theme hover:bg-theme-secondary'
          }`}
          style={{
            backgroundColor: filter === 'none' ? 'var(--status-info-bg)' : 'var(--card-background)',
            borderColor: filter === 'none' ? 'var(--status-info)' : 'var(--card-border)',
          }}
          aria-pressed={filter === 'none'}
        >
          <div className="flex items-center justify-between">
            <span className="text-theme" style={{ color: 'var(--foreground)' }}>
              Normal (No Filter)
            </span>
            {filter === 'none' && (
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleFilterChange('protanopia')}
          className={`w-full text-left p-2 rounded-lg border transition-all focus:outline-none text-sm ${
            filter === 'protanopia'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-theme hover:bg-theme-secondary'
          }`}
          style={{
            backgroundColor: filter === 'protanopia' ? 'var(--status-info-bg)' : 'var(--card-background)',
            borderColor: filter === 'protanopia' ? 'var(--status-info)' : 'var(--card-border)',
          }}
          aria-pressed={filter === 'protanopia'}
        >
          <div className="flex items-center justify-between">
            <span className="text-theme" style={{ color: 'var(--foreground)' }}>
              Protanopia (Red-Blind)
            </span>
            {filter === 'protanopia' && (
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleFilterChange('deuteranopia')}
          className={`w-full text-left p-2 rounded-lg border transition-all focus:outline-none text-sm ${
            filter === 'deuteranopia'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-theme hover:bg-theme-secondary'
          }`}
          style={{
            backgroundColor: filter === 'deuteranopia' ? 'var(--status-info-bg)' : 'var(--card-background)',
            borderColor: filter === 'deuteranopia' ? 'var(--status-info)' : 'var(--card-border)',
          }}
          aria-pressed={filter === 'deuteranopia'}
        >
          <div className="flex items-center justify-between">
            <span className="text-theme" style={{ color: 'var(--foreground)' }}>
              Deuteranopia (Green-Blind)
            </span>
            {filter === 'deuteranopia' && (
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleFilterChange('tritanopia')}
          className={`w-full text-left p-2 rounded-lg border transition-all focus:outline-none text-sm ${
            filter === 'tritanopia'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-theme hover:bg-theme-secondary'
          }`}
          style={{
            backgroundColor: filter === 'tritanopia' ? 'var(--status-info-bg)' : 'var(--card-background)',
            borderColor: filter === 'tritanopia' ? 'var(--status-info)' : 'var(--card-border)',
          }}
          aria-pressed={filter === 'tritanopia'}
        >
          <div className="flex items-center justify-between">
            <span className="text-theme" style={{ color: 'var(--foreground)' }}>
              Tritanopia (Blue-Blind)
            </span>
            {filter === 'tritanopia' && (
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </button>
      </div>
      <p className="text-xs text-theme-secondary mt-2" style={{ color: 'var(--foreground-secondary)' }}>
        Preview how the website appears to users with different types of color vision deficiencies.
      </p>
    </div>
  );
}

