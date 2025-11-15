'use client';

import React from 'react';
import MicIcon from '@/components/MicIcon';

interface HeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<HeaderProps> = ({ title, subtitle, children }) => {
  return (
    <div 
      className="sticky top-0 z-50 border-b shadow-md backdrop-blur-md transition-shadow duration-200"
      style={{
        backgroundColor: 'var(--card-background)',
        borderColor: 'var(--card-border)',
        opacity: 0.98,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 
              className="text-3xl font-bold flex items-center gap-2"
              style={{ color: 'var(--foreground)' }}
            >
              {title}
              <MicIcon text={`${title}${subtitle ? `. ${subtitle}` : ''}`} size="small" />
            </h1>
            {subtitle && (
              <p 
                className="mt-2"
                style={{ color: 'var(--foreground-secondary)' }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {children && (
            <div className="flex items-center gap-4">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  title, 
  subtitle, 
  action, 
  className = '' 
}) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div>
        <h2 
          className="text-xl font-semibold flex items-center gap-2"
          style={{ color: 'var(--foreground)' }}
        >
          {title}
          <MicIcon text={`${title}${subtitle ? `. ${subtitle}` : ''}`} size="small" />
        </h2>
        {subtitle && (
          <p 
            className="mt-1 text-sm"
            style={{ color: 'var(--foreground-secondary)' }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div>{action}</div>
      )}
    </div>
  );
};