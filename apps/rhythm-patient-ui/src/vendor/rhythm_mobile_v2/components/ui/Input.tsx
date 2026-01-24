import React from 'react';

interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function Input({
  type = 'text',
  placeholder,
  value,
  onChange,
  label,
  error,
  icon,
  disabled = false,
  className = '',
}: InputProps) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[#374151] mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9ca3af]">
            {icon}
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          className={`w-full px-4 py-3 ${icon ? 'pl-10' : ''} bg-white border rounded-xl text-[#1f2937] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent transition-all ${
            error ? 'border-[#ef4444]' : 'border-[#e5e7eb]'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-[#ef4444]">{error}</p>
      )}
    </div>
  );
}
