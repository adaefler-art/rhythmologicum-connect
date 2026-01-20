import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  color = 'primary',
  showLabel = false,
  size = 'md',
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const colorStyles: Record<string, string> = {
    primary: 'bg-gradient-to-r from-[#4a90e2] to-[#6c63ff]',
    success: 'bg-[#5cb85c]',
    warning: 'bg-[#f0ad4e]',
    danger: 'bg-[#d9534f]',
  };
  
  const sizeStyles = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };
  
  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[#6b7280]">
            Step {Math.round((value / max) * 10)} of 10
          </span>
          <span className="text-sm font-medium text-[#4a90e2]">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div className={`bg-[#e5e7eb] rounded-full overflow-hidden ${sizeStyles[size]}`}>
        <div
          className={`${colorStyles[color]} h-full rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
