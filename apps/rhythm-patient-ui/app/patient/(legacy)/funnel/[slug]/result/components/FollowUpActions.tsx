'use client'

import { Card } from '@/lib/ui'
import { typography } from '@/lib/design-tokens'

type ActionItem = {
  icon?: string
  title: string
  description: string
  actionLabel?: string
  actionUrl?: string
  onClick?: () => void
}

type FollowUpActionsProps = {
  actions: ActionItem[]
  title?: string
  description?: string
}

/**
 * FollowUpActions Component
 * 
 * Displays recommended next steps and actions for the patient.
 * Provides clear guidance on what to do after completing the assessment.
 */
export function FollowUpActions({
  actions,
  title = 'Nächste Schritte',
  description = 'Was können Sie jetzt tun?',
}: FollowUpActionsProps) {
  if (actions.length === 0) return null

  return (
    <Card padding="lg" radius="xl" shadow="md" border className="bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🎯</span>
          <h3
            className="text-lg sm:text-xl font-bold text-slate-900"
            style={{ lineHeight: typography.lineHeight.tight }}
          >
            {title}
          </h3>
        </div>
        <p className="text-sm sm:text-base text-slate-700">{description}</p>
      </div>

      {/* Action Items */}
      <div className="space-y-3">
        {actions.map((action, index) => (
          <div
            key={index}
            className="bg-white border border-sky-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              {/* Icon/Number */}
              <div className="flex-shrink-0 w-8 h-8 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center font-bold text-sm">
                {action.icon || `${index + 1}`}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4
                  className="text-base sm:text-lg font-semibold text-slate-900 mb-1"
                  style={{ lineHeight: typography.lineHeight.tight }}
                >
                  {action.title}
                </h4>
                <p
                  className="text-sm sm:text-base text-slate-700 mb-2"
                  style={{ lineHeight: typography.lineHeight.relaxed }}
                >
                  {action.description}
                </p>

                {/* Action Button/Link */}
                {(action.actionLabel || action.actionUrl || action.onClick) && (
                  <div>
                    {action.actionUrl ? (
                      <a
                        href={action.actionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-sm sm:text-base font-medium text-sky-700 hover:text-sky-900 hover:underline"
                      >
                        {action.actionLabel || 'Mehr erfahren'} →
                      </a>
                    ) : action.onClick ? (
                      <button
                        onClick={action.onClick}
                        className="text-sm sm:text-base font-medium text-sky-700 hover:text-sky-900 hover:underline"
                      >
                        {action.actionLabel || 'Mehr erfahren'} →
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
