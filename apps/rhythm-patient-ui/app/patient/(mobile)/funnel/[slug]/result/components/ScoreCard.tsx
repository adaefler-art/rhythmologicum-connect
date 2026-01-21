'use client'

import { Card } from '@/lib/ui'
import { typography, spacing, colors } from '@/lib/design-tokens'

type ScoreCardProps = {
  score?: number
  maxScore?: number
  level?: 'low' | 'medium' | 'high'
  label?: string
  description?: string
}

/**
 * ScoreCard Component
 * 
 * Displays assessment score prominently with visual styling based on level.
 * Designed for mobile-first display with clear visual hierarchy.
 */
export function ScoreCard({
  score,
  maxScore = 100,
  level = 'medium',
  label = 'Stresslevel',
  description = 'Ihre aktuelle Bewertung',
}: ScoreCardProps) {
  // Determine color scheme based on level
  const getLevelColors = () => {
    switch (level) {
      case 'low':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-900',
          icon: '✓',
          iconBg: 'bg-green-100',
          badge: 'bg-green-100 text-green-800',
        }
      case 'high':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-900',
          icon: '⚠',
          iconBg: 'bg-red-100',
          badge: 'bg-red-100 text-red-800',
        }
      default:
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-900',
          icon: '◆',
          iconBg: 'bg-amber-100',
          badge: 'bg-amber-100 text-amber-800',
        }
    }
  }

  const colorScheme = getLevelColors()
  const percentage = score !== undefined ? Math.round((score / maxScore) * 100) : 0

  return (
    <Card
      padding="lg"
      radius="2xl"
      shadow="lg"
      border
      className={`${colorScheme.bg} ${colorScheme.border} border-2`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 ${colorScheme.iconBg} rounded-full flex items-center justify-center`}
        >
          <span className="text-2xl sm:text-3xl">{colorScheme.icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base text-slate-600 mb-1">{description}</p>
          <h3
            className={`text-2xl sm:text-3xl md:text-4xl font-bold ${colorScheme.text} mb-2`}
            style={{ lineHeight: typography.lineHeight.tight }}
          >
            {score !== undefined ? `${score}/${maxScore}` : '—'}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${colorScheme.badge}`}>
              {label}
            </span>
            {percentage > 0 && (
              <span className="text-xs sm:text-sm text-slate-600">
                {percentage}%
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
