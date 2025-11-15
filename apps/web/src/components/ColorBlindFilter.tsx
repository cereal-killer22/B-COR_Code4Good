'use client';

import React, { useState, useEffect, useCallback } from 'react';

type ColorBlindFilter = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';

const STORAGE_KEY = 'color-blind-filter';
const DEFAULT_FILTER: ColorBlindFilter = 'none';

export default function ColorBlindFilter() {
  const [filter, setFilter] = useState<ColorBlindFilter>(DEFAULT_FILTER);

  // Apply color-blind filter
  const applyFilter = useCallback((filterType: ColorBlindFilter) => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    root.setAttribute('data-color-blind', filterType);

    // Remove existing filter
    root.style.filter = '';

    if (filterType !== 'none') {
      const filterValue = getColorBlindFilterCSS(filterType);
      root.style.filter = filterValue;
    }
  }, []);

  // Get color-blind filter CSS
  const getColorBlindFilterCSS = (type: ColorBlindFilter): string => {
    const filters: Record<string, string> = {
      protanopia: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'protanopia\'%3E%3CfeColorMatrix type=\'matrix\' values=\'0.567 0.433 0 0 0 0.558 0.442 0 0 0 0 0.242 0.758 0 0 0 0 0 1 0\'/%3E%3C/filter%3E%3C/svg%3E#protanopia")',
      deuteranopia: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'deuteranopia\'%3E%3CfeColorMatrix type=\'matrix\' values=\'0.625 0.375 0 0 0 0.7 0.3 0 0 0 0 0.3 0.7 0 0 0 0 0 1 0\'/%3E%3C/filter%3E%3C/svg%3E#deuteranopia")',
      tritanopia: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'tritanopia\'%3E%3CfeColorMatrix type=\'matrix\' values=\'0.95 0.05 0 0 0 0 0.433 0.567 0 0 0 0.475 0.525 0 0 0 0 0 1 0\'/%3E%3C/filter%3E%3C/svg%3E#tritanopia")',
    };
    return filters[type] || 'none';
  };

  // Load saved filter
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = saved as ColorBlindFilter;
        if (['none', 'protanopia', 'deuteranopia', 'tritanopia'].includes(parsed)) {
          setFilter(parsed);
          applyFilter(parsed);
        }
      } catch (e) {
        console.error('Failed to load color-blind filter:', e);
      }
    }
  }, [applyFilter]);

  // Handle filter change
  const handleFilterChange = (newFilter: ColorBlindFilter) => {
    setFilter(newFilter);
    applyFilter(newFilter);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newFilter);
    }
  };

  const filters: { value: ColorBlindFilter; label: string; description: string }[] = [
    { value: 'none', label: 'Normal', description: 'No color vision deficiency' },
    { value: 'protanopia', label: 'Protanopia', description: 'Red-green color blindness (red cone missing)' },
    { value: 'deuteranopia', label: 'Deuteranopia', description: 'Red-green color blindness (green cone missing)' },
    { value: 'tritanopia', label: 'Tritanopia', description: 'Blue-yellow color blindness' },
  ];

  return (
    <div>
      <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
        Color-Blind Simulation
      </h3>
      <p className="text-sm mb-4" style={{ color: 'var(--foreground-secondary)' }}>
        Preview how the website appears to users with different types of color vision. This helps ensure your content is accessible to everyone.
      </p>
      <div className="flex flex-col gap-3">
        {filters.map((filterOption) => (
          <button
            key={filterOption.value}
            type="button"
            onClick={() => handleFilterChange(filterOption.value)}
            className={`filter-option px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all text-left ${
              filter === filterOption.value ? 'active' : ''
            }`}
            style={{
              backgroundColor:
                filter === filterOption.value
                  ? 'var(--primary, #3b82f6)'
                  : 'var(--card-background)',
              color:
                filter === filterOption.value
                  ? 'white'
                  : 'var(--foreground)',
              borderColor:
                filter === filterOption.value
                  ? 'var(--primary, #3b82f6)'
                  : 'var(--card-border)',
            }}
            onMouseEnter={(e) => {
              if (filter !== filterOption.value) {
                e.currentTarget.style.backgroundColor = 'var(--background-secondary)';
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== filterOption.value) {
                e.currentTarget.style.backgroundColor = 'var(--card-background)';
              }
            }}
          >
            <div className="font-semibold">{filterOption.label}</div>
            <div
              className="text-xs mt-1"
              style={{
                opacity: filter === filterOption.value ? 0.9 : 0.7,
              }}
            >
              {filterOption.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

