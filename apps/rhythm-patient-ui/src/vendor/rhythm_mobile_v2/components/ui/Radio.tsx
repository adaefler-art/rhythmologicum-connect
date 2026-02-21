import React from 'react';

interface RadioProps {
  id: string;
  name: string;
  value: string;
  checked?: boolean;
  onChange?: (value: string) => void;
  label?: string;
  description?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  disabled?: boolean;
}

export function Radio({
  id,
  name,
  value,
  checked = false,
  onChange,
  label,
  description,
  icon,
  iconBg = 'bg-[#dbeafe]',
  disabled = false,
}: RadioProps) {
  const handleChange = () => {
    if (!disabled && onChange) {
      onChange(value);
    }
  };
  
  return (
    <div
      onClick={handleChange}
      className={`flex items-center gap-4 p-6 bg-white rounded-xl shadow-sm border-2 transition-all ${
        checked ? 'border-[#4a90e2]' : 'border-transparent'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}`}
    >
      {icon && (
        <div className={`flex items-center justify-center w-12 h-12 rounded-full ${iconBg}`}>
          {icon}
        </div>
      )}
      
      <div className="flex-1">
        {label && (
          <div className="text-base font-semibold text-[#1f2937] mb-1">
            {label}
          </div>
        )}
        {description && (
          <div className="text-sm text-[#6b7280]">
            {description}
          </div>
        )}
      </div>
      
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
        checked ? 'border-[#4a90e2]' : 'border-[#d1d5db]'
      }`}>
        {checked && (
          <div className="w-3 h-3 rounded-full bg-[#4a90e2]" />
        )}
      </div>
    </div>
  );
}
