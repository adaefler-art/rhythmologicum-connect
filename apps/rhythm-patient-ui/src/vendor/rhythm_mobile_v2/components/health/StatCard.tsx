import React from 'react';
import { Card } from '../ui/Card';
import { HealthMetric } from '../../lib/types';

interface StatCardProps {
  metric: HealthMetric;
  onClick?: () => void;
}

export function StatCard({ metric, onClick }: StatCardProps) {
  const bgColorMap: Record<string, string> = {
    green: 'bg-[#dcfce7]',
    blue: 'bg-[#dbeafe]',
    yellow: 'bg-[#fef9c3]',
    purple: 'bg-[#ede9fe]',
  };
  
  const textColorMap: Record<string, string> = {
    green: 'text-[#22c55e]',
    blue: 'text-[#4a90e2]',
    yellow: 'text-[#eab308]',
    purple: 'text-[#a855f7]',
  };
  
  return (
    <Card padding="md" shadow="sm" hover onClick={onClick}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${bgColorMap[metric.color] || 'bg-[#f3f4f6]'}`}>
          <span className="text-lg">{metric.icon}</span>
        </div>
        <span className="text-sm font-medium text-[#6b7280]">{metric.label}</span>
      </div>
      
      <div className="flex items-baseline gap-1">
        <span className={`text-3xl font-bold ${textColorMap[metric.color] || 'text-[#1f2937]'}`}>
          {metric.value}
        </span>
        {metric.unit && (
          <span className="text-sm font-medium text-[#9ca3af]">{metric.unit}</span>
        )}
      </div>
    </Card>
  );
}
