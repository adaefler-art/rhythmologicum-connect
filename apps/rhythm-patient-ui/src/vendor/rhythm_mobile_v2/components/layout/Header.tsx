import React from 'react';
import { ArrowLeft, MoreVertical } from 'lucide-react';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  onMore?: () => void;
  showBackButton?: boolean;
  showMoreButton?: boolean;
  className?: string;
}

export function Header({
  title,
  onBack,
  onMore,
  showBackButton = true,
  showMoreButton = true,
  className = '',
}: HeaderProps) {
  return (
    <header className={`flex items-center justify-between p-4 bg-white shadow-sm ${className}`}>
      <div className="w-10 h-10 flex items-center justify-center">
        {showBackButton && (
          <button
            onClick={onBack}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-[#f3f4f6] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#374151]" />
          </button>
        )}
      </div>
      
      <h1 className="text-base font-semibold text-[#1f2937]">{title}</h1>
      
      <div className="w-10 h-10 flex items-center justify-center">
        {showMoreButton && (
          <button
            onClick={onMore}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-[#f3f4f6] transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-[#374151]" />
          </button>
        )}
      </div>
    </header>
  );
}
