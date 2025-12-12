'use client'

import { Card } from '@/lib/ui'
import { typography } from '@/lib/design-tokens'

type InsightCardProps = {
  icon?: string
  title: string
  description: string
  variant?: 'default' | 'success' | 'warning' | 'info'
}

/**
 * InsightCard Component
 * 
 * Displays a single insight or finding from the assessment.
 * Used to present key takeaways in a scannable format.
 */
export function InsightCard({
  icon = '💡',
  title,
  description,
  variant = 'default',
}: InsightCardProps) {
  // Determine styling based on variant
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          iconBg: 'bg-green-100',
          titleColor: 'text-green-900',
          textColor: 'text-green-800',
        }
      case 'warning':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          iconBg: 'bg-amber-100',
          titleColor: 'text-amber-900',
          textColor: 'text-amber-800',
        }
      case 'info':
        return {
          bg: 'bg-primary-50',
          border: 'border-primary-200',
          iconBg: 'bg-primary-100',
          titleColor: 'text-primary-900',
          textColor: 'text-primary-800',
        }
      default:
        return {
          bg: 'bg-slate-50',
          border: 'border-slate-200',
          iconBg: 'bg-slate-100',
          titleColor: 'text-slate-900',
          textColor: 'text-slate-700',
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <Card
      padding="md"
      radius="xl"
      shadow="sm"
      border
      className={`${styles.bg} ${styles.border} hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`flex-shrink-0 w-10 h-10 ${styles.iconBg} rounded-full flex items-center justify-center`}
        >
          <span className="text-lg">{icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4
            className={`text-base sm:text-lg font-semibold ${styles.titleColor} mb-1`}
            style={{ lineHeight: typography.lineHeight.tight }}
          >
            {title}
          </h4>
          <p
            className={`text-sm sm:text-base ${styles.textColor}`}
            style={{ lineHeight: typography.lineHeight.relaxed }}
          >
            {description}
          </p>
        </div>
      </div>
    </Card>
  )
}

type InsightCardsGroupProps = {
  insights: Array<Omit<InsightCardProps, 'children'>>
}

/**
 * InsightCardsGroup Component
 * 
 * Groups multiple insight cards with consistent spacing.
 */
export function InsightCardsGroup({ insights }: InsightCardsGroupProps) {
  if (insights.length === 0) return null

  return (
    <div className="space-y-3">
      {insights.map((insight, index) => (
        <InsightCard key={index} {...insight} />
      ))}
    </div>
  )
}
