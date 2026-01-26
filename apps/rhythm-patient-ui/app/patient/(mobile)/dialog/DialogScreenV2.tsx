'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, Button, Badge } from '@/lib/ui/mobile-v2'
import { Bot, MessageCircle, Sparkles } from '@/lib/ui/mobile-v2/icons'
import { CANONICAL_ROUTES } from '../../utils/navigation'

/**
 * I2.2 — AMY Dialog MVP (I2.5 Navigation Consistency)
 * 
 * Entry Points:
 * - Dashboard Hero → /patient/dialog?context=dashboard
 * - Results CTA → /patient/dialog?context=results&assessmentId=<id>
 * 
 * Navigation (I2.5):
 * - Back: Always to dashboard (canonical, last non-dialog screen fallback)
 * - Close: Always to dashboard
 * 
 * Features:
 * - Context-aware stubbed conversation responses
 * - Clean, flow-ready UI for patient dialog
 * - Placeholder for future real-time dialog implementation
 */

interface StubbedMessage {
  id: string
  sender: 'amy' | 'user'
  text: string
  timestamp: string
}

// Helper to check if context is valid
function isValidContext(context: string | null, assessmentId: string | null): boolean {
  return context === 'dashboard' || (context === 'results' && !!assessmentId)
}

function getStubbedConversation(context: string | null, assessmentId: string | null): StubbedMessage[] {
  const now = new Date()
  const timestamp = (minutesAgo: number) => {
    const time = new Date(now.getTime() - minutesAgo * 60000)
    return time.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  }

  if (context === 'results' && assessmentId) {
    return [
      {
        id: '1',
        sender: 'amy',
        text: 'Hallo! Ich habe Ihre Assessment-Ergebnisse analysiert. Wie geht es Ihnen damit?',
        timestamp: timestamp(5),
      },
      {
        id: '2',
        sender: 'user',
        text: 'Danke. Die Ergebnisse waren interessant. Was empfehlen Sie als nächste Schritte?',
        timestamp: timestamp(3),
      },
      {
        id: '3',
        sender: 'amy',
        text: 'Basierend auf Ihren Ergebnissen empfehle ich, mit kleinen Schritten zur Stressreduktion zu beginnen. Haben Sie bereits über die empfohlenen Ressourcen nachgedacht?',
        timestamp: timestamp(1),
      },
    ]
  }

  if (context === 'dashboard') {
    return [
      {
        id: '1',
        sender: 'amy',
        text: 'Willkommen! Ich bin AMY, Ihre persönliche Assistentin für Stress und Resilienz. Wie kann ich Ihnen heute helfen?',
        timestamp: timestamp(2),
      },
    ]
  }

  return []
}

export function DialogScreenV2() {
  const searchParams = useSearchParams()
  const context = searchParams.get('context')
  const assessmentId = searchParams.get('assessmentId')
  
  const messages = getStubbedConversation(context, assessmentId)
  const hasContext = isValidContext(context, assessmentId)

  return (
    <div className="w-full px-4 pb-8 pt-5 sm:px-6">
      <div className="w-full flex flex-col gap-6">
        {/* Header */}
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-sky-600" />
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
              Dialog mit AMY
            </p>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Ihr persönlicher Dialog
          </h1>
          <p className="text-sm text-slate-600">
            Sichere Kommunikation und Beratung zu Ihrem Assessment
          </p>
        </header>

        {/* Context Badge (if entry point is known) */}
        {hasContext && (
          <Card padding="sm" shadow="none" className="bg-sky-50 border border-sky-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span className="text-sm text-sky-900">
                {context === 'dashboard' && 'Dialog vom Dashboard gestartet'}
                {context === 'results' && 'Dialog zu Ihren Assessment-Ergebnissen'}
              </span>
            </div>
          </Card>
        )}

        {/* Stubbed Conversation */}
        {messages.length > 0 && (
          <Card padding="none" shadow="sm">
            <div className="divide-y divide-slate-100">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 ${message.sender === 'amy' ? 'bg-gradient-to-r from-purple-50 to-pink-50' : 'bg-white'}`}
                >
                  <div className="flex items-start gap-3">
                    {message.sender === 'amy' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {message.sender === 'amy' ? 'AMY' : 'Sie'}
                        </span>
                        <span className="text-xs text-slate-500">{message.timestamp}</span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{message.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* MVP Notice */}
        <Card padding="md" shadow="sm">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-amber-600" />
                <h2 className="text-base font-semibold text-slate-900">
                  Dialog-Funktion in Entwicklung
                </h2>
              </div>
              <p className="text-sm text-slate-600">
                Die interaktive Dialog-Funktion wird aktuell vorbereitet. Die angezeigten
                Nachrichten sind Beispiele für kommende Funktionen.
              </p>
            </div>
            <Badge variant="warning" size="sm">MVP</Badge>
          </div>
        </Card>

        {/* Placeholder Input */}
        <Card padding="md" shadow="sm" className="border-2 border-dashed border-slate-200">
          <div className="space-y-3">
            <textarea
              placeholder="Ihre Nachricht an AMY (in Kürze verfügbar)..."
              rows={3}
              disabled
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 resize-none opacity-60 cursor-not-allowed"
            />
            <Button variant="primary" size="md" fullWidth disabled>
              Nachricht senden (demnächst)
            </Button>
          </div>
        </Card>

        {/* Quick Actions - I2.5: Use canonical routes */}
        <Card padding="md" shadow="sm">
          <h2 className="text-base font-semibold text-slate-900 mb-3">
            Schnelle Hilfe
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={CANONICAL_ROUTES.DASHBOARD} className="flex-1">
              <Button variant="secondary" size="md" fullWidth>
                Zurück zum Dashboard
              </Button>
            </Link>
            {context === 'results' && (
              <Link href={CANONICAL_ROUTES.RESULTS} className="flex-1">
                <Button variant="secondary" size="md" fullWidth>
                  Zu den Ergebnissen
                </Button>
              </Link>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
