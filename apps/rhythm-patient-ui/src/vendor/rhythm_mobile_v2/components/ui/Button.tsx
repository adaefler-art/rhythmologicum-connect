import React from 'react';
import { ButtonVariant, ButtonSize } from '../../lib/types';

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onClick,
  className = '',
  icon,
  iconPosition = 'left',
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-gradient-to-r from-[#4a90e2] to-[#6c63ff] text-white shadow-lg hover:shadow-xl disabled:opacity-50',
    secondary: 'bg-[#f3f4f6] text-[#374151] hover:bg-[#e5e7eb] disabled:opacity-50',
    outline: 'bg-white border-2 border-[#d1d5db] text-[#374151] hover:border-[#4a90e2] hover:text-[#4a90e2] disabled:opacity-50',
    ghost: 'bg-transparent text-[#374151] hover:bg-[#f3f4f6] disabled:opacity-50',
    success: 'bg-[#5cb85c] text-white hover:bg-[#4aa74a] shadow-md disabled:opacity-50',
    warning: 'bg-[#f0ad4e] text-white hover:bg-[#e09a3d] shadow-md disabled:opacity-50',
    danger: 'bg-[#d9534f] text-white hover:bg-[#c9433f] shadow-md disabled:opacity-50',
  };
  
  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-2 text-sm gap-1.5',
    md: 'px-6 py-3 text-base gap-2',
    lg: 'px-8 py-4 text-lg gap-3',
  };
  
  const widthStyle = fullWidth ? 'w-full' : '';
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
    >
      {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
    </button>
  );
}
