import React from 'react';

interface TextProps {
  children: React.ReactNode;
  variant?: 'heading' | 'subheading' | 'body' | 'caption';
  color?: string;
  style?: React.CSSProperties;
}

export const Text: React.FC<TextProps> = ({
  children,
  variant = 'body',
  color = '#000000',
  style,
}) => {
  const getTextStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = { color };
    
    switch (variant) {
      case 'heading':
        return {
          ...baseStyle,
          fontSize: '24px',
          fontWeight: 'bold',
          lineHeight: '32px',
        };
      case 'subheading':
        return {
          ...baseStyle,
          fontSize: '20px',
          fontWeight: '600',
          lineHeight: '28px',
        };
      case 'caption':
        return {
          ...baseStyle,
          fontSize: '14px',
          lineHeight: '20px',
          opacity: 0.7,
        };
      default: // body
        return {
          ...baseStyle,
          fontSize: '16px',
          lineHeight: '24px',
        };
    }
  };

  const Tag = variant === 'heading' ? 'h1' : variant === 'subheading' ? 'h2' : 'p';

  return (
    <Tag style={{ ...getTextStyle(), ...style, margin: 0 }}>
      {children}
    </Tag>
  );
};