'use client';

import React from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<HeaderProps> = ({ title, subtitle, children }) => {
  return (
    <div 
      className="border-b shadow-sm"
      style={{
        backgroundColor: 'var(--card-background)',
        borderColor: 'var(--card-border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 
              className="text-3xl font-bold"
              style={{ color: 'var(--foreground)' }}
            >
              {title}
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
          className="text-xl font-semibold"
          style={{ color: 'var(--foreground)' }}
        >
          {title}
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