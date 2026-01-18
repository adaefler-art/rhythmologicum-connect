'use client'

import { Card } from '@/lib/ui'
import { typography } from '@/lib/design-tokens'

type DistributionSegment = {
  label: string
  value: number
  color: string
}

type StressDistributionBarProps = {
  segments?: DistributionSegment[]
  title?: string
  description?: string
}

/**
 * StressDistributionBar Component
 * 
 * Visualizes stress distribution across different categories.
 * Currently a placeholder for future implementation.
 */
export function StressDistributionBar({
  segments = [],
  title = 'Stressverteilung',
  description = 'Übersicht Ihrer Stressbereiche',
}: StressDistributionBarProps) {
  // Calculate total for percentage computation
  const total = segments.reduce((sum, seg) => sum + seg.value, 0)

  // Default placeholder segments if none provided
  const displaySegments =
    segments.length > 0
      ? segments
      : [
          { label: 'Körperlich', value: 30, color: 'bg-red-500' },
          { label: 'Emotional', value: 45, color: 'bg-amber-500' },
          { label: 'Kognitiv', value: 25, color: 'bg-primary-500' },
        ]

  return (
    <Card padding="lg" radius="xl" shadow="md" border className="bg-white">
      {/* Header */}
      <div className="mb-4">
        <h3
          className="text-lg sm:text-xl font-bold text-slate-900 mb-1"
          style={{ lineHeight: typography.lineHeight.tight }}
        >
          {title}
        </h3>
        <p className="text-sm sm:text-base text-slate-600">{description}</p>
      </div>

      {/* Distribution Bar */}
      <div className="mb-4">
        <div className="h-3 sm:h-4 bg-slate-200 rounded-full overflow-hidden flex">
          {displaySegments.map((segment, index) => {
            const percentage = total > 0 ? (segment.value / total) * 100 : 0
            return (
              <div
                key={index}
                className={`${segment.color} transition-all duration-300`}
                style={{ width: `${percentage}%` }}
                title={`${segment.label}: ${Math.round(percentage)}%`}
              />
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {displaySegments.map((segment, index) => {
          const percentage = total > 0 ? Math.round((segment.value / total) * 100) : 0
          return (
            <div key={index} className="flex items-center gap-2">
              <div className={`w-3 h-3 sm:w-4 sm:h-4 ${segment.color} rounded-sm`} />
              <span className="text-xs sm:text-sm text-slate-700">
                {segment.label}
                <span className="text-slate-500 ml-1">({percentage}%)</span>
              </span>
            </div>
          )
        })}
      </div>

      {/* Placeholder Notice */}
      {segments.length === 0 && (
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-xs sm:text-sm text-slate-600 italic">
            💡 Diese Visualisierung wird basierend auf Ihren konkreten Antworten erstellt,
            sobald die detaillierte Auswertung verfügbar ist.
          </p>
        </div>
      )}
    </Card>
  )
}
