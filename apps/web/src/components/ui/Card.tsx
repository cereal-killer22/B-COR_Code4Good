'use client';

import React from 'react';
import { cardVariants } from '@/lib/design-system';
import MicIcon from '@/components/MicIcon';

interface CardProps {
  children: React.ReactNode;
  variant?: keyof typeof cardVariants;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  variant = 'elevated', 
  className = '',
  padding = 'lg'
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  return (
    <div 
      className={`${cardVariants[variant]} ${paddingClasses[padding]} ${className}`}
      style={{
        backgroundColor: 'var(--card-background)',
        borderColor: 'var(--card-border)',
      }}
    >
      {children}
    </div>
  );
};

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'danger' | 'info';
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  children, 
  size = 'md' 
}) => {
  const getStatusStyles = (status: 'success' | 'warning' | 'danger' | 'info') => {
    const styleMap = {
      success: {
        backgroundColor: 'var(--status-success-bg)',
        color: 'var(--status-success)',
        borderColor: 'var(--status-success-border)',
      },
      warning: {
        backgroundColor: 'var(--status-warning-bg)',
        color: 'var(--status-warning)',
        borderColor: 'var(--status-warning-border)',
      },
      danger: {
        backgroundColor: 'var(--status-error-bg)',
        color: 'var(--status-error)',
        borderColor: 'var(--status-error-border)',
      },
      info: {
        backgroundColor: 'var(--status-info-bg)',
        color: 'var(--status-info)',
        borderColor: 'var(--status-info-border)',
      },
    };
    return styleMap[status];
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span 
      className={`${sizeClasses[size]} border rounded-full font-semibold inline-flex items-center gap-2`}
      style={getStatusStyles(status)}
    >
      {children}
    </span>
  );
};

interface MetricCardProps {
  icon: string;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    value: string;
  };
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
  icon, 
  title, 
  value, 
  subtitle, 
  trend,
  className = ''
}) => {
  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      default: return '➡️';
    }
  };

  return (
    <Card variant="flat" padding="md" className={`hover:shadow-md transition-shadow relative ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{icon}</span>
            <h3 className="text-sm font-medium text-theme-secondary">
              {title}
            </h3>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-theme">{value}</div>
            {subtitle && (
              <div className="text-sm text-theme-secondary">{subtitle}</div>
            )}
          </div>
        </div>
        {trend && (
          <div className={`text-sm font-medium ${getTrendColor(trend.direction)} flex items-center gap-1`}>
            <span>{getTrendIcon(trend.direction)}</span>
            <span>{trend.value}</span>
          </div>
        )}
      </div>
      {/* MicIcon positioned at bottom right */}
      <div className="absolute bottom-3 right-3">
        <MicIcon 
          text={`${title}. ${value}${subtitle ? `. ${subtitle}` : ''}${trend ? `. ${trend.value}` : ''}`} 
          size="small" 
        />
      </div>
    </Card>
  );
};