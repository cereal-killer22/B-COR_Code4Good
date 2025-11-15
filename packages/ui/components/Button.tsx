import React from 'react';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
}) => {
  const baseStyle = {
    paddingLeft: '20px',
    paddingRight: '20px',
    paddingTop: '12px',
    paddingBottom: '12px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '100px',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    opacity: disabled ? 0.5 : 1,
  };

  const primaryStyle = {
    backgroundColor: '#007AFF',
    color: '#FFFFFF',
  };

  const secondaryStyle = {
    backgroundColor: 'transparent',
    border: '1px solid #007AFF',
    color: '#007AFF',
  };

  return (
    <button
      style={{
        ...baseStyle,
        ...(variant === 'primary' ? primaryStyle : secondaryStyle),
      }}
      onClick={onPress}
      disabled={disabled}
    >
      {title}
    </button>
  );
};

