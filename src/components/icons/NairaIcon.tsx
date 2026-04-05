import React from 'react';

interface NairaIconProps {
  className?: string;
  size?: number | string;
}

/**
 * CUSTOM NAIRA ICON
 * 
 * Since Lucide-React does not have a native Naira (₦) icon,
 * this component provides a consistent visual replacement
 * for financial metrics and currency-related UI elements.
 */
const NairaIcon: React.FC<NairaIconProps> = ({ className = '', size = '24' }) => {
  return (
    <div 
      className={`inline-flex items-center justify-center font-bold select-none ${className}`}
      style={{ 
        width: typeof size === 'number' ? `${size}px` : size, 
        height: typeof size === 'number' ? `${size}px` : size,
        fontSize: typeof size === 'number' ? `${size * 0.75}px` : `calc(${size} * 0.75)`,
        lineHeight: 1
      }}
      aria-hidden="true"
    >
      ₦
    </div>
  );
};

export default NairaIcon;
