import React from 'react';
import { Card } from '../ui/Card';
import { ChevronRight } from 'lucide-react';

interface QuickActionProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  iconBg?: string;
  iconColor?: string;
  onClick?: () => void;
  badge?: React.ReactNode;
}

export function QuickAction({
  icon,
  title,
  subtitle,
  iconBg = 'bg-[#dbeafe]',
  iconColor = 'text-[#4a90e2]',
  onClick,
  badge,
}: QuickActionProps) {
  return (
    <Card
      padding="md"
      shadow="sm"
      hover
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-[#1f2937] truncate">{title}</h4>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs text-[#6b7280] truncate mt-0.5">{subtitle}</p>
          )}
        </div>
        
        <ChevronRight className="w-5 h-5 text-[#9ca3af] flex-shrink-0" />
      </div>
    </Card>
  );
}
