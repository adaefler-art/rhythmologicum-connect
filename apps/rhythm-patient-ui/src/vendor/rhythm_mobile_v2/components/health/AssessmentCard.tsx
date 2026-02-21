import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Assessment } from '../../lib/types';

interface AssessmentCardProps {
  assessment: Assessment;
  onClick?: () => void;
}

export function AssessmentCard({ assessment, onClick }: AssessmentCardProps) {
  return (
    <Card padding="lg" shadow="sm" onClick={onClick} hover>
      <div className="flex items-start gap-4">
        <div className={`flex items-center justify-center w-12 h-12 rounded-full ${assessment.iconBgColor}`}>
          <span className="text-2xl">{assessment.icon}</span>
        </div>
        
        <div className="flex-1">
          <Badge variant={assessment.categoryColor as any} size="sm" className="mb-2">
            {assessment.category}
          </Badge>
          
          <h3 className="text-lg font-semibold text-[#1f2937] mb-2 leading-snug">
            {assessment.title}
          </h3>
          
          <p className="text-sm text-[#6b7280] leading-relaxed">
            {assessment.description}
          </p>
        </div>
      </div>
    </Card>
  );
}
