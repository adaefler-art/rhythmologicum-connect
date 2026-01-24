import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'lg' | 'none';
  onClick?: () => void;
  hover?: boolean;
}

export function Card({
  children,
  className = '',
  padding = 'md',
  shadow = 'sm',
  onClick,
  hover = false,
}: CardProps) {
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };
  
  const shadowStyles = {
    none: '',
    sm: 'shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]',
    md: 'shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-1px_rgba(0,0,0,0.06)]',
    lg: 'shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]',
  };
  
  const hoverStyles = hover ? 'hover:shadow-md transition-shadow duration-200 cursor-pointer' : '';
  const clickableStyles = onClick ? 'cursor-pointer' : '';
  
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl ${paddingStyles[padding]} ${shadowStyles[shadow]} ${hoverStyles} ${clickableStyles} ${className}`}
    >
      {children}
    </div>
  );
}
