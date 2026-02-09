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

type IntakeEntry = {
  id: string
  content: Record<string, unknown>
  entry_type: string | null
  created_at: string
}

type IntakeEvidenceItem = {
  label?: string
  ref: string
}

type IntakePersistenceStatus = {
  runId: string | null
  createAttempted: boolean
  createFailed: boolean
  patchAttempted: boolean
  patchFailed: boolean
  createOk: boolean
  patchOk: boolean
  entryId: string | null
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

const DEFAULT_OPENING_QUESTION = 'Was kann ich heute fuer Sie tun?'
const INTAKE_SESSION_KEY = 'intakeEntryId'
const MAX_INTAKE_EVIDENCE = 10
const MAX_INTAKE_OPEN_QUESTIONS = 5
const MAX_INTAKE_NARRATIVE_LENGTH = 1000
const MAX_INTAKE_ITEM_LENGTH = 200
const MAX_CHIEF_COMPLAINT_LENGTH = 200

const trimText = (value: string, max: number) =>
  value.length > max ? value.slice(0, max).trim() : value.trim()

const getIntakeNarrative = (content: Record<string, unknown>): string | null => {
  const summary = content?.narrativeSummary
  if (typeof summary === 'string' && summary.trim()) return summary.trim()
  const narrative = content?.narrative
  if (typeof narrative === 'string' && narrative.trim()) return narrative.trim()
  const complaint = content?.chiefComplaint
  if (typeof complaint === 'string' && complaint.trim()) return complaint.trim()
  const text = content?.text
  if (typeof text === 'string' && text.trim()) return text.trim()
  return null
}

const extractTopic = (narrative: string): string | null => {
  const firstLine = narrative.split(/\n|\./)[0]?.trim()
  if (!firstLine) return null
  return trimText(firstLine, 80)
}

const buildOpeningQuestion = (latestIntake: IntakeEntry | null) => {
  if (!latestIntake) return DEFAULT_OPENING_QUESTION
  const narrative = getIntakeNarrative(latestIntake.content)
  if (!narrative) return DEFAULT_OPENING_QUESTION
  const topic = extractTopic(narrative)
  if (!topic) return DEFAULT_OPENING_QUESTION
  return `Wie geht es Ihnen heute mit ${topic}?`
}

const isDevPreview = (): boolean => {
  if (typeof window === 'undefined') return false
  const hostname = window.location.hostname
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.includes('preview') ||
    hostname.includes('dev-')
  )
}

const hashText = (value: string): string => {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return `msg_${Math.abs(hash)}`
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
  const [intakeEntryId, setIntakeEntryId] = useState<string | null>(null)
  const [intakeEvidence, setIntakeEvidence] = useState<IntakeEvidenceItem[]>([])
  const [intakeQuestions, setIntakeQuestions] = useState<string[]>([])
  const [intakeNotes, setIntakeNotes] = useState<string[]>([])
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [intakePersistence, setIntakePersistence] = useState<IntakePersistenceStatus>({
    runId: null,
    createAttempted: false,
    createFailed: false,
    patchAttempted: false,
    patchFailed: false,
    createOk: false,
    patchOk: false,
    entryId: null,
  })
  const isChatEnabled = flagEnabled(env.NEXT_PUBLIC_FEATURE_AMY_CHAT_ENABLED)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const dictationRestartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intakeRunIdRef = useRef<string | null>(null)
  const createInFlightRef = useRef(false)
  const createDoneRef = useRef(false)
  const createAbortRef = useRef<AbortController | null>(null)
  const isDictatingRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isChatEnabled) return

    let isMounted = true

    const initChat = async () => {
      if (!intakeRunIdRef.current) {
        intakeRunIdRef.current = crypto.randomUUID()
        setIntakePersistence((prev) => ({
          ...prev,
          runId: intakeRunIdRef.current,
        }))
      }

      const latestIntake = await fetchLatestIntake()
      if (!isMounted) return
      const openingQuestion = buildOpeningQuestion(latestIntake)
      setChatMessages([
        {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: openingQuestion,
          timestamp: buildTimestamp(),
        },
      ])

      if (typeof window !== 'undefined') {
        const storedEntryId = window.sessionStorage.getItem(INTAKE_SESSION_KEY)
        if (storedEntryId) {
          setIntakeEntryId(storedEntryId)
          setIntakePersistence((prev) => ({
            ...prev,
            entryId: storedEntryId,
          }))
          createDoneRef.current = true
        }
      }
    }

    void initChat()

    return () => {
      isMounted = false
    }
  }, [assessmentId, context, isChatEnabled])

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

  const getRequestHeaders = (contentType = 'application/json') => {
    const headers: Record<string, string> = { 'content-type': contentType }
    if (intakeRunIdRef.current) {
      headers['x-intake-run-id'] = intakeRunIdRef.current
    }
    return headers
  }

  const fetchLatestIntake = async (): Promise<IntakeEntry | null> => {
    try {
      const response = await fetch('/api/patient/anamnesis', {
        headers: intakeRunIdRef.current ? { 'x-intake-run-id': intakeRunIdRef.current } : undefined,
      })
      const data = await response.json()
      if (!response.ok || !data?.success) return null

      const entries = (data?.data?.entries as IntakeEntry[] | undefined) || []
      const intakeEntries = entries.filter((entry) => entry.entry_type === 'intake')
      if (intakeEntries.length === 0) return null
      return intakeEntries[0]
    } catch (err) {
      console.error('[DialogScreenV2] Failed to load intake entries', err)
      return null
    }
  }

  const createNewIntakeEntry = async (): Promise<string | null> => {
    if (typeof window !== 'undefined') {
      const storedEntryId = window.sessionStorage.getItem(INTAKE_SESSION_KEY)
      if (storedEntryId) {
        createDoneRef.current = true
        setIntakeEntryId(storedEntryId)
        setIntakePersistence((prev) => ({
          ...prev,
          entryId: storedEntryId,
        }))
        return storedEntryId
      }
    }

    if (createInFlightRef.current || createDoneRef.current) {
      return intakeEntryId
    }

    createInFlightRef.current = true
    createAbortRef.current?.abort()
    createAbortRef.current = new AbortController()

    try {
      setIntakePersistence((prev) => ({
        ...prev,
        createAttempted: true,
        createFailed: false,
      }))

      const response = await fetch('/api/patient/anamnesis', {
        method: 'POST',
        headers: getRequestHeaders(),
        signal: createAbortRef.current.signal,
        body: JSON.stringify({
          title: 'Intake',
          entry_type: 'intake',
          content: {
            status: 'draft',
          },
        }),
      })

      const data = await response.json()
      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || 'Failed to create intake')
      }

      const entryId = data?.data?.entryId || data?.data?.entry?.id || null
      createDoneRef.current = Boolean(entryId)
      setIntakePersistence((prev) => ({
        ...prev,
        createOk: Boolean(entryId),
        createFailed: !entryId,
        entryId,
      }))

      if (entryId && typeof window !== 'undefined') {
        window.sessionStorage.setItem(INTAKE_SESSION_KEY, entryId)
      }

      if (entryId) {
        setIntakeEntryId(entryId)
      }

      void verifyIntakeWrite()
      return entryId
    } catch (err) {
      console.error('[DialogScreenV2] Failed to create intake entry', err)
      setIntakePersistence((prev) => ({
        ...prev,
        createOk: false,
        createFailed: true,
      }))
      return null
    } finally {
      createInFlightRef.current = false
    }
  }

  const buildSnapshotContent = () => {
    const narrativeSummary = trimText(intakeNotes.join(' '), MAX_INTAKE_NARRATIVE_LENGTH)
    const evidenceRefs = intakeEvidence
      .map((item) => item.ref)
      .filter(Boolean)
      .slice(0, MAX_INTAKE_EVIDENCE)

    return {
      status: 'draft',
      chiefComplaint: trimText(chiefComplaint, MAX_CHIEF_COMPLAINT_LENGTH),
      narrativeSummary: narrativeSummary || 'Kontakt gestartet.',
      structured: {
        timeline: [],
        keySymptoms: [],
      },
      redFlags: [],
      openQuestions: intakeQuestions.slice(0, MAX_INTAKE_OPEN_QUESTIONS),
      evidenceRefs,
    }
  }

  const saveIntakeSnapshot = async () => {
    if (!intakeEntryId) return

    try {
      setIntakePersistence((prev) => ({
        ...prev,
        patchAttempted: true,
        patchFailed: false,
      }))

      const response = await fetch(`/api/patient/anamnesis/${intakeEntryId}` , {
        method: 'PATCH',
        headers: getRequestHeaders(),
        body: JSON.stringify({
          title: 'Intake',
          entry_type: 'intake',
          content: buildSnapshotContent(),
          change_reason: 'snapshot',
        }),
      })

      const data = await response.json()
      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || 'Failed to update intake')
      }

      setIntakePersistence((prev) => ({
        ...prev,
        patchOk: true,
        patchFailed: false,
        entryId: data?.data?.entryId || data?.data?.entry?.id || intakeEntryId,
      }))
      void verifyIntakeWrite()
    } catch (err) {
      console.error('[DialogScreenV2] Failed to update intake snapshot', err)
      setIntakePersistence((prev) => ({
        ...prev,
        patchFailed: true,
      }))
    }
  }

  const verifyIntakeWrite = async () => {
    try {
      const response = await fetch('/api/patient/_meta/intake-write-check', {
        headers: getRequestHeaders(),
      })
      const data = await response.json()
      if (!response.ok || !data?.success) return
      if (data?.data?.lastAnamnesisEntryId) {
        setIntakePersistence((prev) => ({
          ...prev,
          entryId: data.data.lastAnamnesisEntryId,
        }))
      }
    } catch (err) {
      console.error('[DialogScreenV2] Intake write check failed', err)
    }
  }

  const collectEvidence = (text: string) => {
    const trimmed = trimText(text, 400)
    if (!trimmed) return
    const ref = hashText(trimmed)
    setIntakeEvidence((prev) => [{ label: 'User', ref }, ...prev].slice(0, MAX_INTAKE_EVIDENCE))
  }

  const collectNote = (text: string) => {
    const trimmed = trimText(text, 200)
    if (!trimmed) return
    setIntakeNotes((prev) => [trimmed, ...prev].slice(0, 5))
  }

  const collectOpenQuestion = (text: string) => {
    const candidate = text.split('?')[0]
    if (!candidate) return
    const question = trimText(candidate, MAX_INTAKE_ITEM_LENGTH)
    setIntakeQuestions((prev) => {
      if (prev.includes(question)) return prev
      return [question, ...prev].slice(0, MAX_INTAKE_OPEN_QUESTIONS)
    })
  }

  const handleSend = async () => {
    if (!isChatEnabled || isSending) return

    const trimmed = input.trim()
    if (!trimmed) return

    if (!intakeEntryId) {
      const entryId = await createNewIntakeEntry()
      if (!entryId) {
        setSendError('Intake konnte nicht gespeichert werden. Bitte erneut versuchen.')
        setIsSending(false)
        return
      }
    }

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
    collectEvidence(trimmed)
    collectNote(trimmed)
    if (!chiefComplaint) {
      setChiefComplaint(trimText(trimmed, MAX_CHIEF_COMPLAINT_LENGTH))
    }

    try {
      const response = await fetch('/api/amy/chat', {
        method: 'POST',
        headers: getRequestHeaders(),
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
      if (replyText.includes('?')) {
        collectOpenQuestion(replyText)
      }
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
        <div className="flex-1 min-h-0 space-y-5 overflow-y-auto px-4 pb-[calc(160px+env(safe-area-inset-bottom,0px))] pt-5 sm:px-6">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900">
              <Bot className="h-5 w-5 text-slate-700" />
              <p className="text-base font-semibold">Dialog mit PAT</p>
            </div>
            <Badge variant="success" size="sm">
              Live
            </Badge>
          </header>

          {isDevPreview() && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
              <p className="font-semibold">Intake Persistence</p>
              <p>runId: {intakePersistence.runId || 'pending'}</p>
              <p>entryId: {intakePersistence.entryId || 'none'}</p>
              <p>
                create: {intakePersistence.createOk ? 'ok' : intakePersistence.createFailed ? 'failed' : 'pending'}
                {' · '}patch: {intakePersistence.patchOk ? 'ok' : intakePersistence.patchFailed ? 'failed' : 'pending'}
              </p>
              {intakePersistence.createFailed && (
                <p className="mt-2 font-semibold text-amber-800">
                  Intake not persisted (no anamnesis write)
                </p>
              )}
              {intakePersistence.patchFailed && (
                <p className="mt-2 font-semibold text-amber-800">
                  Intake patch failed (no version write)
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="rounded-md border border-amber-300 px-2 py-1 text-xs font-semibold text-amber-900"
                  onClick={() => void createNewIntakeEntry()}
                >
                  Retry Create
                </button>
                <button
                  type="button"
                  className="rounded-md border border-amber-300 px-2 py-1 text-xs font-semibold text-amber-900"
                  onClick={() => void saveIntakeSnapshot()}
                >
                  Save Snapshot
                </button>
              </div>
            </div>
          )}

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
                          : 'bg-emerald-50 text-slate-800 border border-emerald-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        {isAssistant ? (
                          <span className="text-slate-700">{ASSISTANT_CONFIG.name}</span>
                        ) : (
                          <span className="text-emerald-700">Sie</span>
                        )}
                      </div>
                      <p className="mt-1">{message.text}</p>
                      <span
                        className={`mt-2 block text-[11px] ${
                          isAssistant ? 'text-slate-400' : 'text-emerald-600'
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

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 pb-[calc(12px+env(safe-area-inset-bottom,0px))] pt-3 backdrop-blur sm:px-6">
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
