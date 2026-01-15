'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, Button } from '@/lib/ui'
import { AlertTriangle, ArrowLeft, Phone, Mail, Video } from 'lucide-react'

/**
 * E6.4.6: Escalation Placeholder Page
 *
 * Shown when patient clicks on escalation CTA.
 * NO SCHEDULING - placeholder information only.
 */
export default function EscalationPage() {
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
    <div className="max-w-3xl mx-auto p-6">
      {/* Back Navigation */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => window.history.back()}
        className="mb-6 flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Zurück zu den Ergebnissen
      </Button>

      {/* Main Card */}
      <Card padding="lg" radius="xl" shadow="lg" border>
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0 w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <Video className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
              {getTitle()}
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Vielen Dank für Ihre Anfrage. Wir kümmern uns um Sie.
            </p>
          </div>
        </div>

        {/* Placeholder Notice */}
        <div className="mb-8 p-6 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                Funktion in Entwicklung
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Die automatische Terminvergabe ist derzeit noch nicht verfügbar. Bitte kontaktieren
                Sie uns direkt über die unten stehenden Kontaktmöglichkeiten.
              </p>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="mb-8 p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <Phone className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                Bei akuter Gefahr
              </h3>
              <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                Wenden Sie sich bitte umgehend an:
              </p>
              <ul className="space-y-2 text-sm text-red-800 dark:text-red-200">
                <li className="flex items-center gap-2">
                  <span className="font-mono font-bold">112</span>
                  <span>— Notarzt / Rettungsdienst</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-mono font-bold">116 117</span>
                  <span>— Ärztlicher Bereitschaftsdienst</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-mono font-bold">0800 111 0 111</span>
                  <span>— Telefonseelsorge (kostenfrei, 24/7)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Regular Contact Options */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-50">
            Kontaktmöglichkeiten
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <Card padding="md" border>
              <div className="flex items-center gap-3 mb-2">
                <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h4 className="font-semibold text-slate-900 dark:text-slate-50">Telefon</h4>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Montag bis Freitag, 9:00 - 17:00 Uhr
              </p>
              <p className="text-sm font-mono text-blue-600 dark:text-blue-400 mt-1">
                +49 (0) 123 456789
              </p>
            </Card>

            <Card padding="md" border>
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h4 className="font-semibold text-slate-900 dark:text-slate-50">E-Mail</h4>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Antwort innerhalb von 24 Stunden
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                support@rhythmologicum.de
              </p>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ihre Anfrage wurde protokolliert (Correlation ID: {correlationId.substring(0, 16)}...).
            Ein Mitglied unseres Teams wird sich in Kürze bei Ihnen melden.
          </p>
        </div>
      </Card>
    </div>
  )
}
