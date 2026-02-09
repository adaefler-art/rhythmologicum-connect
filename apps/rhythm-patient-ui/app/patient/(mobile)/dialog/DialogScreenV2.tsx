'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Badge } from '@/lib/ui/mobile-v2'
import { Bot, Mic, ChevronRight } from '@/lib/ui/mobile-v2/icons'
import { env } from '@/lib/env'
import { flagEnabled } from '@/lib/env/flags'
import { ASSISTANT_CONFIG } from '@/lib/config/assistant'

/**
 * DialogScreenV2 Component (Issue 2 - Chat-First Dashboard)
 * 
 * Primary entry point for patient interaction (PAT Chat).
 * This is now the default landing page after login (Issue 2).
 * 
 * Entry Points:
 * - Default landing: /patient/dialog
 * - Dashboard Hero → /patient/dialog?context=dashboard
 * - Results CTA → /patient/dialog?context=results&assessmentId=<id>
 * 
 * Navigation (I2.5):
 * - Back: Always to dashboard (canonical)
 * - Close: Always to dashboard
 * 
 * Features:
 * - Live chat with AI assistant (when enabled)
 * - Voice input (dictation) with start/stop control (Issue 2)
 * - Clean, flow-ready UI for patient dialog
 * 
 * Issue 2 Changes:
 * - Enhanced voice input with microphone button
 * - Removed TTS/voice output (non-goal)
 * - Improved dictation UX (push-to-talk style)
 */

interface StubbedMessage {
  id: string
  sender: 'assistant' | 'user'
  text: string
  timestamp: string
}

type SpeechRecognitionInstance = {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: { results?: ArrayLike<ArrayLike<{ transcript?: string }>> }) => void) | null
  onerror: ((event: unknown) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

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
        sender: 'assistant',
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
        sender: 'assistant',
        text: 'Basierend auf Ihren Ergebnissen empfehle ich, mit kleinen Schritten zur Stressreduktion zu beginnen. Haben Sie bereits über die empfohlenen Ressourcen nachgedacht?',
        timestamp: timestamp(1),
      },
    ]
  }

  if (context === 'dashboard') {
    return [
      {
        id: '1',
        sender: 'assistant',
        text: 'Hallo, was führt Sie zu mir?',
        timestamp: timestamp(2),
      },
    ]
  }

  return [
    {
      id: '1',
      sender: 'assistant',
      text: 'Hallo, was fuehrt Sie zu mir?',
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
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const dictationRestartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isDictatingRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setChatMessages(getStubbedConversation(context, assessmentId))
  }, [context, assessmentId])

  useEffect(() => {
    isDictatingRef.current = isDictating
  }, [isDictating])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const SpeechRecognitionCtor =
      (window as typeof window & { SpeechRecognition?: SpeechRecognitionConstructor }).
        SpeechRecognition ||
      (window as typeof window & { webkitSpeechRecognition?: SpeechRecognitionConstructor }).
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
      if (dictationRestartTimeoutRef.current) {
        clearTimeout(dictationRestartTimeoutRef.current)
        dictationRestartTimeoutRef.current = null
      }
      setDictationError('Spracherkennung fehlgeschlagen. Bitte erneut versuchen.')
      setIsDictating(false)
    }

    recognition.onend = () => {
      if (isDictatingRef.current) {
        if (dictationRestartTimeoutRef.current) {
          clearTimeout(dictationRestartTimeoutRef.current)
        }
        dictationRestartTimeoutRef.current = setTimeout(() => {
          recognition.start()
        }, 250)
        return
      }
      setIsDictating(false)
    }

    recognitionRef.current = recognition

    return () => {
      if (dictationRestartTimeoutRef.current) {
        clearTimeout(dictationRestartTimeoutRef.current)
      }
      recognition.stop()
      recognitionRef.current = null
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages.length])

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
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
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
    <div className="w-full overflow-x-hidden">
      <div className="flex min-h-[calc(100dvh-56px)] flex-col overflow-hidden">
        <div className="flex-1 min-h-0 space-y-5 overflow-y-auto px-4 pb-[calc(120px+env(safe-area-inset-bottom,0px))] pt-5 sm:px-6">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900">
              <Bot className="h-5 w-5 text-slate-700" />
              <p className="text-base font-semibold">Dialog mit PAT</p>
            </div>
            <Badge variant="success" size="sm">
              Live
            </Badge>
          </header>

          {chatMessages.length > 0 && (
            <div className="space-y-3">
              {chatMessages.map((message) => {
                const isAssistant = message.sender === 'assistant'
                return (
                  <div
                    key={message.id}
                    className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        isAssistant
                          ? 'bg-sky-50 text-slate-800 border border-sky-100'
                          : 'bg-slate-900 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        {isAssistant ? (
                          <span className="text-slate-700">{ASSISTANT_CONFIG.name}</span>
                        ) : (
                          <span className="text-white/80">Sie</span>
                        )}
                      </div>
                      <p className="mt-1">{message.text}</p>
                      <span
                        className={`mt-2 block text-[11px] ${
                          isAssistant ? 'text-slate-400' : 'text-white/70'
                        }`}
                      >
                        {message.timestamp}
                      </span>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="sticky bottom-0 shrink-0 border-t border-slate-200 bg-white/95 px-4 pb-[calc(12px+env(safe-area-inset-bottom,0px))] pt-3 backdrop-blur sm:px-6">
          <div className="rounded-3xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="flex items-end gap-2">
              <textarea
                placeholder={
                  isChatEnabled
                    ? `Ihre Nachricht an ${ASSISTANT_CONFIG.name}...`
                    : `Ihre Nachricht an ${ASSISTANT_CONFIG.name} (in Kuerze verfuegbar)...`
                }
                rows={2}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={!isChatEnabled || isSending}
                className="flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!isChatEnabled || isSending || input.trim().length === 0}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white transition-colors disabled:bg-slate-200 disabled:text-slate-400"
                aria-label="Senden"
              >
                {isSending ? (
                  <span className="text-xs">...</span>
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </button>
            </div>
            <div className="flex items-center justify-between gap-3 pt-2">
              {isDictationSupported ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!recognitionRef.current) {
                      setDictationError('Spracherkennung wird von diesem Browser nicht unterstuetzt.')
                      return
                    }
                    setDictationError(null)
                    if (isDictating) {
                      if (dictationRestartTimeoutRef.current) {
                        clearTimeout(dictationRestartTimeoutRef.current)
                        dictationRestartTimeoutRef.current = null
                      }
                      recognitionRef.current.stop()
                      setIsDictating(false)
                    } else {
                      recognitionRef.current.start()
                      setIsDictating(true)
                    }
                  }}
                  disabled={!isChatEnabled || isSending}
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                    isDictating
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400'
                  }`}
                  aria-label={isDictating ? 'Diktat stoppen' : 'Diktat starten'}
                >
                  <Mic className="w-4 h-4" />
                  {isDictating && (
                    <span className="sr-only">Aufnahme laeuft</span>
                  )}
                </button>
              ) : (
                <span className="text-xs text-slate-500">
                  Diktat ist in diesem Browser nicht verfuegbar.
                </span>
              )}
              {dictationError && (
                <span className="text-xs text-rose-700">{dictationError}</span>
              )}
              {sendError && <span className="text-xs text-rose-700">{sendError}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
