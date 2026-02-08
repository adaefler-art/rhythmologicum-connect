'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, Button, Badge } from '@/lib/ui/mobile-v2'
import { Bot, MessageCircle, Sparkles } from '@/lib/ui/mobile-v2/icons'
import { CANONICAL_ROUTES } from '../utils/navigation'
import { env } from '@/lib/env'
import { flagEnabled } from '@/lib/env/flags'

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
        text: 'Hallo! Welche Beschwerden stehen bei Ihnen aktuell im Vordergrund und seit wann bestehen sie?',
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
        text: 'Hallo! Was fuehrt Sie heute her und seit wann bestehen die Beschwerden?',
        timestamp: timestamp(2),
      },
    ]
  }

  return [
    {
      id: '1',
      sender: 'amy',
      text: 'Hallo! Was fuehrt Sie heute her und seit wann bestehen die Beschwerden?',
      timestamp: timestamp(2),
    },
  ]
}

export function DialogScreenV2() {
  const searchParams = useSearchParams()
  const context = searchParams.get('context')
  const assessmentId = searchParams.get('assessmentId')

  const [chatMessages, setChatMessages] = useState<StubbedMessage[]>([])
  const [input, setInput] = useState('')
  const [sendError, setSendError] = useState<string | null>(null)
  const [dictationError, setDictationError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [isDictating, setIsDictating] = useState(false)
  const [isDictationSupported, setIsDictationSupported] = useState(true)
  const isChatEnabled = flagEnabled(env.NEXT_PUBLIC_FEATURE_AMY_CHAT_ENABLED)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setChatMessages(getStubbedConversation(context, assessmentId))
  }, [context, assessmentId])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const SpeechRecognitionCtor =
      (window as typeof window & { SpeechRecognition?: typeof SpeechRecognition }).
        SpeechRecognition ||
      (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition }).
        webkitSpeechRecognition

    if (!SpeechRecognitionCtor) {
      setIsDictationSupported(false)
      return
    }

    const recognition = new SpeechRecognitionCtor()
    recognition.lang = 'de-DE'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      const result = event.results?.[0]?.[0]?.transcript
      if (result) {
        setInput((prev) => (prev ? `${prev} ${result}` : result))
      }
    }

    recognition.onerror = () => {
      setDictationError('Spracherkennung fehlgeschlagen. Bitte erneut versuchen.')
      setIsDictating(false)
    }

    recognition.onend = () => {
      setIsDictating(false)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.stop()
      recognitionRef.current = null
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages.length])

  const hasContext = isValidContext(context, assessmentId)

  const buildTimestamp = () =>
    new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })

  const handleSend = async () => {
    if (!isChatEnabled || isSending) return

    const trimmed = input.trim()
    if (!trimmed) return

    setIsSending(true)
    setSendError(null)
    setDictationError(null)

    const userMessage: StubbedMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: buildTimestamp(),
    }

    setChatMessages((prev) => [...prev, userMessage])
    setInput('')

    try {
      const response = await fetch('/api/amy/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      })

      const data = await response.json()

      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || 'Chat request failed')
      }

      const replyText = data?.data?.reply

      if (!replyText || typeof replyText !== 'string') {
        throw new Error('Invalid chat response')
      }

      const assistantMessage: StubbedMessage = {
        id: `amy-${Date.now()}`,
        sender: 'amy',
        text: replyText,
        timestamp: buildTimestamp(),
      }

      setChatMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      console.error('[DialogScreenV2] Chat send failed', err)
      setSendError(
        err instanceof Error
          ? err.message
          : 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
      )
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="w-full px-4 pt-5 sm:px-6">
      <div className="w-full flex min-h-[calc(100dvh-96px)] flex-col">
        <div className="flex-1 space-y-6 overflow-y-auto pb-36">
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
          {chatMessages.length > 0 && (
            <Card padding="none" shadow="sm">
              <div className="divide-y divide-slate-100">
                {chatMessages.map((message) => (
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
                <div ref={messagesEndRef} />
              </div>
            </Card>
          )}

          {/* Feature Status */}
          <Card padding="md" shadow="sm">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-amber-600" />
                  <h2 className="text-base font-semibold text-slate-900">
                    {isChatEnabled ? 'Dialog-Funktion aktiv' : 'Dialog-Funktion deaktiviert'}
                  </h2>
                </div>
                <p className="text-sm text-slate-600">
                  {isChatEnabled
                    ? 'Sie können AMY direkt schreiben. Ihre Nachricht wird verarbeitet.'
                    : 'Die interaktive Dialog-Funktion ist in dieser Umgebung nicht aktiviert.'}
                </p>
              </div>
              <Badge variant={isChatEnabled ? 'success' : 'warning'} size="sm">
                {isChatEnabled ? 'Live' : 'MVP'}
              </Badge>
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

        {/* Chat Input */}
        <div className="sticky bottom-0 -mx-4 border-t border-slate-200 bg-white/95 px-4 pb-6 pt-4 backdrop-blur sm:-mx-6 sm:px-6">
          <Card padding="md" shadow="sm" className="border-2 border-dashed border-slate-200">
            <div className="space-y-3">
              <textarea
                placeholder={
                  isChatEnabled
                    ? 'Ihre Nachricht an AMY...'
                    : 'Ihre Nachricht an AMY (in Kürze verfügbar)...'
                }
                rows={3}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={!isChatEnabled || isSending || isDictating}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 resize-none"
              />
              {dictationError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                  <p className="text-sm text-rose-800">{dictationError}</p>
                </div>
              )}
              {sendError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                  <p className="text-sm text-rose-800">{sendError}</p>
                </div>
              )}
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={handleSend}
                disabled={!isChatEnabled || isSending || input.trim().length === 0}
              >
                {isSending ? 'Wird gesendet...' : 'Nachricht senden'}
              </Button>
              {isDictationSupported ? (
                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  onClick={() => {
                    if (!recognitionRef.current) {
                      setDictationError('Spracherkennung wird von diesem Browser nicht unterstuetzt.')
                      return
                    }
                    setDictationError(null)
                    if (isDictating) {
                      recognitionRef.current.stop()
                    } else {
                      recognitionRef.current.start()
                      setIsDictating(true)
                    }
                  }}
                  disabled={!isChatEnabled || isSending}
                >
                  {isDictating ? 'Diktat stoppen' : 'Diktat starten'}
                </Button>
              ) : (
                <p className="text-xs text-slate-500">
                  Diktat ist in diesem Browser nicht verfuegbar.
                </p>
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  )
}
