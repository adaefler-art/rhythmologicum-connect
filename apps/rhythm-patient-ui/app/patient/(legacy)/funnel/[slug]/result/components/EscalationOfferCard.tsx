'use client'

import { useState } from 'react'
import { Card, Button, EmergencyContactInfo } from '@/lib/ui'
import { AlertTriangle, Video, Stethoscope } from 'lucide-react'
import { typography } from '@/lib/design-tokens'
import {
  ESCALATION_DISCLAIMER,
  RED_FLAG_EMERGENCY_WARNING,
} from '@/lib/safety/disclaimers'

type EscalationOfferCardProps = {
  reasons: string[]
  correlationId: string
  onCtaClick?: (offerType: 'video_consultation' | 'doctor_appointment' | 'emergency_contact') => void
}

/**
 * EscalationOfferCard Component
 *
 * E6.4.6: Displays emergency/high-risk warning with escalation CTAs.
 * E6.6.8: Uses centralized disclaimers with stronger emergency guidance.
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
      className="bg-gradient-to-br from-red-50 to-orange-50 border-red-300"
    >
      {/* Alert Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <div className="flex-1">
          <h3
            className="text-xl font-bold text-red-900 mb-2"
            style={{ lineHeight: typography.lineHeight.tight }}
          >
            Wichtiger Hinweis zu Ihrem Ergebnis
          </h3>
          <p className="text-sm text-red-800">
            {ESCALATION_DISCLAIMER.intro}
          </p>
        </div>
      </div>

      {/* Disclaimer - E6.6.8: Stronger language */}
      <div className="mb-6 p-4 bg-white rounded-lg border border-red-200">
        <p className="text-sm text-slate-700 mb-2">
          <strong>{ESCALATION_DISCLAIMER.title}:</strong>
        </p>
        <ul className="space-y-1 text-sm text-slate-700">
          {reasons.map((reason, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-red-600 flex-shrink-0">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Emergency Notice - E6.6.8: Use EmergencyContactInfo component with stronger warning */}
      <div className="mb-6 p-4 bg-red-100 rounded-lg">
        <EmergencyContactInfo
          variant="compact"
          title={RED_FLAG_EMERGENCY_WARNING.title}
          showAll={false}
        />
        <p className="text-sm text-red-800 mt-2 ml-6">
          {RED_FLAG_EMERGENCY_WARNING.urgentAction}
        </p>
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
      <p className="mt-4 text-xs text-slate-500 text-center">
        Correlation ID: {correlationId.substring(0, 16)}...
      </p>
    </Card>
  )
}
