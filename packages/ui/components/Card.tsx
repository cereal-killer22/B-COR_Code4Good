import React from 'react';

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, style }) => {
  const cardStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '16px',
    margin: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    ...style,
  };

  return (
    <div style={cardStyle}>
      {children}
    </div>
  );
};