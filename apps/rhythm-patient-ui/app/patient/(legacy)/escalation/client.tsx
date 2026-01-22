'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, Button, EmergencyContactInfo } from '@/lib/ui'
import { AlertTriangle, ArrowLeft, Phone, Mail, Video } from 'lucide-react'
import { RED_FLAG_EMERGENCY_WARNING } from '@/lib/safety/disclaimers'

/**
 * E6.4.6 + E6.5.8 + E6.6.8: Escalation Placeholder Page
 *
 * Shown when patient clicks on escalation CTA.
 * NO SCHEDULING - placeholder information only.
 * 
 * E6.5.8: Updated to use router.push for dashboard navigation
 * E6.6.8: Uses centralized emergency contact info
 */
export default function EscalationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const offerType = searchParams.get('type') || 'unknown'
  const correlationId = searchParams.get('correlation') || 'unknown'

  useEffect(() => {
    // Log page view (client-side logging)
    console.log('[Escalation] Page viewed', {
      offerType,
      correlationId: correlationId.substring(0, 16),
      timestamp: new Date().toISOString(),
    })
  }, [offerType, correlationId])

  const getTitle = () => {
    switch (offerType) {
      case 'video_consultation':
        return 'Video-Sprechstunde'
      case 'doctor_appointment':
        return 'Arzttermin'
      case 'emergency_contact':
        return 'Notfallkontakt'
      default:
        return 'Betreuungsanfrage'
    }
  }

  return (
    <div className="w-full p-6">
      {/* Back Navigation - E6.5.8: Navigate to dashboard instead of browser history */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/patient/dashboard')}
        className="mb-6 flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Zurück zum Dashboard
      </Button>

      {/* Main Card */}
      <Card padding="lg" radius="xl" shadow="lg" border>
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Video className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {getTitle()}
            </h1>
            <p className="text-slate-600">
              Vielen Dank für Ihre Anfrage. Wir kümmern uns um Sie.
            </p>
          </div>
        </div>

        {/* Placeholder Notice */}
        <div className="mb-8 p-6 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">
                Funktion in Entwicklung
              </h3>
              <p className="text-sm text-amber-800">
                Die automatische Terminvergabe ist derzeit noch nicht verfügbar. Bitte kontaktieren
                Sie uns direkt über die unten stehenden Kontaktmöglichkeiten.
              </p>
            </div>
          </div>
        </div>

        {/* Emergency Contact - E6.6.8: Use EmergencyContactInfo component */}
        <div className="mb-8 p-6 bg-red-50 rounded-lg border border-red-200">
          <EmergencyContactInfo
            title={RED_FLAG_EMERGENCY_WARNING.title}
            description={RED_FLAG_EMERGENCY_WARNING.text}
            showAll={true}
          />
        </div>

        {/* Regular Contact Options */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900">
            Kontaktmöglichkeiten
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <Card padding="md" border>
              <div className="flex items-center gap-3 mb-2">
                <Phone className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-slate-900">Telefon</h4>
              </div>
              <p className="text-sm text-slate-600">
                Montag bis Freitag, 9:00 - 17:00 Uhr
              </p>
              <p className="text-sm font-mono text-blue-600 mt-1">
                +49 (0) 123 456789
              </p>
            </Card>

            <Card padding="md" border>
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-slate-900">E-Mail</h4>
              </div>
              <p className="text-sm text-slate-600">
                Antwort innerhalb von 24 Stunden
              </p>
              <p className="text-sm text-blue-600 mt-1">
                support@rhythmologicum.de
              </p>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            Ihre Anfrage wurde protokolliert (Correlation ID: {correlationId.substring(0, 16)}...).
            Ein Mitglied unseres Teams wird sich in Kürze bei Ihnen melden.
          </p>
        </div>
      </Card>
    </div>
  )
}
