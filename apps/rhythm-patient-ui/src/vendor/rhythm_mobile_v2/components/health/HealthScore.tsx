import React from 'react';
import { Card } from '../ui/Card';
import { TrendingUp } from 'lucide-react';

interface HealthScoreProps {
  score: number;
  maxScore?: number;
  label?: string;
  trend?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
}

export function HealthScore({
  score,
  maxScore = 100,
  label = 'Health Score',
  trend = 'up',
  onClick,
}: HealthScoreProps) {
  const percentage = (score / maxScore) * 100;
  const strokeWidth = 8;
  const size = 120;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  const getScoreColor = () => {
    if (percentage >= 80) return '#5cb85c';
    if (percentage >= 60) return '#4a90e2';
    if (percentage >= 40) return '#f0ad4e';
    return '#d9534f';
  };
  
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-[#5cb85c]" />;
    return null;
  };
  
  return (
    <Card padding="md" shadow="md" hover onClick={onClick} className="bg-gradient-to-br from-[#4a90e2] to-[#6c63ff]">
      <div className="flex items-center gap-6">
        <div className="relative">
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth={strokeWidth}
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="white"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{score}</div>
              <div className="text-xs text-white/80">of {maxScore}</div>
            </div>
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">{label}</h3>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <span className="text-sm text-white/90">Excellent progress</span>
          </div>
          <p className="text-xs text-white/70 mt-2">
            Keep up the good work! Your health metrics are improving.
          </p>
        </div>
      </div>
    </Card>
  );
}
