'use client';

import React, { useState } from 'react';
import { buttonVariants } from '@/lib/design-system';
import MicIcon from '@/components/MicIcon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const buttonText = typeof children === 'string' ? children : '';
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const baseClasses = buttonVariants[variant];
  const sizeClass = sizeClasses[size];
  const disabledClasses = (disabled || loading) ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      className={`
        ${baseClasses} 
        ${sizeClass} 
        ${disabledClasses}
        ${className}
        inline-flex items-center justify-center gap-2
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:pointer-events-none
        relative
      `}
      disabled={disabled || loading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : icon ? (
        <span>{icon}</span>
      ) : null}
      <span>{children}</span>
      {buttonText && isHovered && (
        <MicIcon text={buttonText} size="small" className="ml-1" />
      )}
    </button>
  );
};