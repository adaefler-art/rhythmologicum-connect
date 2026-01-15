'use client'

import { useState } from 'react'
import { Card, Button } from '@/lib/ui'
import { AlertTriangle, Video, Stethoscope, Phone } from 'lucide-react'
import { typography } from '@/lib/design-tokens'

type EscalationOfferCardProps = {
  reasons: string[]
  correlationId: string
  onCtaClick?: (offerType: 'video_consultation' | 'doctor_appointment' | 'emergency_contact') => void
}

/**
 * EscalationOfferCard Component
 *
 * E6.4.6: Displays emergency/high-risk warning with escalation CTAs.
 * Shown when red flags are detected in assessment results.
 * NO SCHEDULING - placeholder links only.
 */
export function EscalationOfferCard({ reasons, correlationId, onCtaClick }: EscalationOfferCardProps) {
  const [clicked, setClicked] = useState<string | null>(null)

  const handleClick = (offerType: 'video_consultation' | 'doctor_appointment' | 'emergency_contact') => {
    setClicked(offerType)
    onCtaClick?.(offerType)
  }

  return (
    <Card
      padding="lg"
      radius="xl"
      shadow="lg"
      border
      className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-300 dark:border-red-800"
    >
      {/* Alert Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <div className="flex-1">
          <h3
            className="text-xl font-bold text-red-900 dark:text-red-100 mb-2"
            style={{ lineHeight: typography.lineHeight.tight }}
          >
            Wichtiger Hinweis zu Ihrem Ergebnis
          </h3>
          <p className="text-sm text-red-800 dark:text-red-200">
            Basierend auf Ihren Antworten empfehlen wir eine persönliche Rücksprache.
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-lg border border-red-200 dark:border-red-800">
        <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
          <strong>Bitte beachten Sie:</strong>
        </p>
        <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
          {reasons.map((reason, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-red-600 dark:text-red-400 flex-shrink-0">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Emergency Notice */}
      <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 rounded-lg">
        <div className="flex items-start gap-2">
          <Phone className="w-5 h-5 text-red-700 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-red-900 dark:text-red-100 mb-1">
              Bei akuter Gefahr:
            </p>
            <p className="text-red-800 dark:text-red-200">
              Wählen Sie bitte umgehend den Notruf <strong>112</strong> oder wenden Sie sich an
              die nächste Notaufnahme.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="space-y-3">
        <Button
          variant="danger"
          size="lg"
          fullWidth
          onClick={() => handleClick('video_consultation')}
          disabled={clicked !== null}
          className="flex items-center justify-center gap-2"
        >
          <Video className="w-5 h-5" />
          {clicked === 'video_consultation' ? 'Wird vorbereitet...' : 'Video-Sprechstunde anfordern'}
        </Button>

        <Button
          variant="outline"
          size="lg"
          fullWidth
          onClick={() => handleClick('doctor_appointment')}
          disabled={clicked !== null}
          className="flex items-center justify-center gap-2"
        >
          <Stethoscope className="w-5 h-5" />
          {clicked === 'doctor_appointment' ? 'Wird vorbereitet...' : 'Arzttermin vereinbaren'}
        </Button>
      </div>

      {/* Footer Note */}
      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 text-center">
        Correlation ID: {correlationId.substring(0, 16)}...
      </p>
    </Card>
  )
}
