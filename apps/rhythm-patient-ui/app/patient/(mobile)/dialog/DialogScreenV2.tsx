'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Badge } from '@/lib/ui/mobile-v2'
import { Bot, Mic, ChevronRight } from '@/lib/ui/mobile-v2/icons'
import { env } from '@/lib/env'
import { flagEnabled } from '@/lib/env/flags'
import { ASSISTANT_CONFIG } from '@/lib/config/assistant'
import type { SafetyEvaluation } from '@/lib/types/clinicalIntake'
import { getSafetyUiState } from '@/lib/cre/safety/policy'

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
  review_state?: {
    status?: 'draft' | 'in_review' | 'approved' | 'needs_more_info' | 'rejected'
  } | null
  created_at: string
  updated_at?: string | null
  version_number?: number | null
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
  autosaveFailed: boolean
  createOk: boolean
  patchOk: boolean
  entryId: string | null
  latestIntakeEntryId: string | null
  recentIntakeCount: number | null
  latestVersionCount: number | null
}

type FollowupQuestion = {
  id: string
  question: string
  why: string
  priority: 1 | 2 | 3
  source: 'reasoning' | 'gap_rule' | 'clinician_request'
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
const OUTPUT_JSON_MARKER = 'OUTPUT_JSON'
const ANAMNESIS_INTAKE_WRITES_DISABLED = true

const trimText = (value: string, max: number) =>
  value.length > max ? value.slice(0, max).trim() : value.trim()

const getIntakeNarrative = (content: Record<string, unknown>): string | null => {
  const interpreted = content?.interpreted_clinical_summary
  if (interpreted && typeof interpreted === 'object') {
    const record = interpreted as Record<string, unknown>
    const narrative = record.narrative_history
    if (typeof narrative === 'string' && narrative.trim()) return narrative.trim()
    const shortSummary = record.short_summary
    if (Array.isArray(shortSummary)) {
      const first = shortSummary.find((item) => typeof item === 'string' && item.trim())
      if (first && typeof first === 'string') return first.trim()
    }
  }

  const clinicalSummary = content?.clinical_summary
  if (typeof clinicalSummary === 'string' && clinicalSummary.trim()) return clinicalSummary.trim()

  const structuredData = content?.structured_data ?? content?.structured_intake_data
  if (structuredData && typeof structuredData === 'object') {
    const record = structuredData as Record<string, unknown>
    const summary = record.narrative_summary
    if (typeof summary === 'string' && summary.trim()) return summary.trim()
    const complaint = record.chief_complaint
    if (typeof complaint === 'string' && complaint.trim()) return complaint.trim()
  }

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

const buildFollowupPrompt = (params: {
  question: FollowupQuestion
  latestIntake: IntakeEntry | null
}) => {
  const { question, latestIntake } = params
  const structured = latestIntake ? getStructuredDataFromContent(latestIntake.content) : null
  const chiefComplaint =
    structured && typeof structured.chief_complaint === 'string' && structured.chief_complaint.trim()
      ? structured.chief_complaint.trim()
      : null

  const reason = question.why?.trim()
  const contextPrefix = chiefComplaint ? `Bezug: ${chiefComplaint}. ` : ''

  if (reason) {
    return `${contextPrefix}${question.question}\n\nWarum ich das frage: ${reason}.`
  }

  return `${contextPrefix}${question.question}`
}

const getStructuredDataFromContent = (content: Record<string, unknown>) => {
  const structuredData = content?.structured_data
  if (structuredData && typeof structuredData === 'object' && !Array.isArray(structuredData)) {
    return structuredData as Record<string, unknown>
  }
  const legacyStructured = content?.structured_intake_data
  if (legacyStructured && typeof legacyStructured === 'object' && !Array.isArray(legacyStructured)) {
    return legacyStructured as Record<string, unknown>
  }
  return null
}

const getSafetyFromContent = (content: Record<string, unknown>): SafetyEvaluation | null => {
  const structured = getStructuredDataFromContent(content)
  if (!structured) return null
  const safety = (structured as { safety?: unknown }).safety
  if (safety && typeof safety === 'object' && !Array.isArray(safety)) {
    return safety as SafetyEvaluation
  }
  return null
}

const getFollowupFromContent = (content: Record<string, unknown>) => {
  const structured = getStructuredDataFromContent(content)
  if (!structured) return null

  const followup = (structured as { followup?: unknown }).followup
  if (!followup || typeof followup !== 'object' || Array.isArray(followup)) return null

  const record = followup as Record<string, unknown>
  const nextQuestionsRaw = Array.isArray(record.next_questions) ? record.next_questions : []
  const nextQuestions: FollowupQuestion[] = nextQuestionsRaw
    .filter((entry) => typeof entry === 'object' && entry !== null && !Array.isArray(entry))
    .map((entry) => {
      const item = entry as Record<string, unknown>
      const priority: 1 | 2 | 3 =
        item.priority === 1 || item.priority === 2 || item.priority === 3 ? item.priority : 3
      const source: 'reasoning' | 'gap_rule' | 'clinician_request' =
        item.source === 'reasoning'
          ? 'reasoning'
          : item.source === 'clinician_request'
            ? 'clinician_request'
            : 'gap_rule'

      return {
        id: typeof item.id === 'string' ? item.id : '',
        question: typeof item.question === 'string' ? item.question : '',
        why: typeof item.why === 'string' ? item.why : '',
        priority,
        source,
      }
    })
    .filter((entry) => entry.id && entry.question)

  return {
    next_questions: nextQuestions,
  }
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
  const devtoolsEnabled = searchParams.has('devtools')
  const isDevPreviewHost =
    env.NODE_ENV !== 'production' ||
    env.VERCEL_ENV === 'preview' ||
    (typeof window !== 'undefined' &&
      ['localhost', '127.0.0.1'].includes(window.location.hostname))
  const showManualTrigger = devtoolsEnabled || isDevPreviewHost

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
  const [lastSummary, setLastSummary] = useState<string | null>(null)
  const [safetyStatus, setSafetyStatus] = useState<SafetyEvaluation | null>(null)
  const [isManualIntakeRunning, setIsManualIntakeRunning] = useState(false)
  const [manualIntakeStatus, setManualIntakeStatus] = useState<'ok' | 'error' | null>(null)
  const [manualIntakeError, setManualIntakeError] = useState<string | null>(null)
  const [latestClinicalIntakeId, setLatestClinicalIntakeId] = useState<string | null>(null)
  const [activeFollowupQuestion, setActiveFollowupQuestion] = useState<FollowupQuestion | null>(null)
  const [followupAnsweredCount, setFollowupAnsweredCount] = useState(0)
  const [hasOpenReviewRequest, setHasOpenReviewRequest] = useState(false)
  const [intakePersistence, setIntakePersistence] = useState<IntakePersistenceStatus>({
    runId: null,
    createAttempted: false,
    createFailed: false,
    patchAttempted: false,
    patchFailed: false,
    autosaveFailed: false,
    createOk: false,
    patchOk: false,
    entryId: null,
    latestIntakeEntryId: null,
    recentIntakeCount: null,
    latestVersionCount: null,
  })
  const isChatEnabled = flagEnabled(env.NEXT_PUBLIC_FEATURE_AMY_CHAT_ENABLED)
  const safetyUiState = getSafetyUiState(safetyStatus)
  const isSafetyBlocked = safetyUiState.blockChat
  const safetyBannerText = safetyStatus?.policy_result?.patient_banner_text
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const dictationRestartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intakeRunIdRef = useRef<string | null>(null)
  const createInFlightRef = useRef(false)
  const createDoneRef = useRef(false)
  const createAbortRef = useRef<AbortController | null>(null)
  const autosaveDirtyRef = useRef(false)
  const autosaveTurnsRef = useRef(0)
  const autosaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autosaveInFlightRef = useRef(false)
  const autosaveAbortRef = useRef<AbortController | null>(null)
  const isDictatingRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const appendAssistantMessage = (text: string) => {
    const assistantMessage: StubbedMessage = {
      id: `assistant-${Date.now()}`,
      sender: 'assistant',
      text,
      timestamp: buildTimestamp(),
    }

    setChatMessages((prev) => [...prev, assistantMessage])
  }

  const persistUserAnswerToChat = async (answer: string) => {
    await fetch('/api/amy/chat', {
      method: 'POST',
      headers: getRequestHeaders(),
      body: JSON.stringify({
        mode: 'log_only',
        message: answer,
        structuredIntakeData: buildSnapshotContent().structured_intake_data,
      }),
    })
  }

  const generateFollowup = async (params: {
    intakeId: string
    askedQuestionId?: string
    askedAnswerText?: string
  }) => {
    const response = await fetch('/api/patient/followup/generate', {
      method: 'POST',
      headers: getRequestHeaders(),
      body: JSON.stringify({
        intakeId: params.intakeId,
        asked_question_id: params.askedQuestionId,
        asked_answer_text: params.askedAnswerText,
      }),
    })

    const payload = await response.json()

    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error?.message || 'Failed to generate followup questions')
    }

    const nextQuestionsRaw = payload?.data?.next_questions
    const nextQuestions = Array.isArray(nextQuestionsRaw)
      ? (nextQuestionsRaw as FollowupQuestion[])
      : []

    const intakeId =
      typeof payload?.data?.intake_id === 'string' && payload.data.intake_id
        ? payload.data.intake_id
        : params.intakeId

    return {
      nextQuestions,
      intakeId,
      blocked: Boolean(payload?.data?.blocked),
    }
  }

  async function syncIntakeDebugMeta(latestIntake?: IntakeEntry | null) {
    try {
      const [latest, checkResponse] = await Promise.all([
        latestIntake !== undefined ? Promise.resolve(latestIntake) : fetchLatestIntake(),
        fetch('/api/patient/_meta/intake-write-check', {
          headers: intakeRunIdRef.current ? { 'x-intake-run-id': intakeRunIdRef.current } : undefined,
        }),
      ])

      const checkPayload = await checkResponse.json().catch(() => null)
      const latestIntakeId = latest?.id ?? (typeof checkPayload?.latestIntakeId === 'string' ? checkPayload.latestIntakeId : null)
      const latestVersionNumber =
        typeof latest?.version_number === 'number'
          ? latest.version_number
          : typeof checkPayload?.latestVersionNumber === 'number'
            ? checkPayload.latestVersionNumber
            : null

      setIntakePersistence((prev) => ({
        ...prev,
        latestIntakeEntryId:
          typeof checkPayload?.latestIntakeEntryId === 'string'
            ? checkPayload.latestIntakeEntryId
            : latestIntakeId,
        recentIntakeCount:
          typeof checkPayload?.recentIntakeCount === 'number'
            ? checkPayload.recentIntakeCount
            : prev.recentIntakeCount,
        latestVersionCount:
          typeof checkPayload?.latestVersionCount === 'number'
            ? checkPayload.latestVersionCount
            : latestVersionNumber,
      }))

      if (latestIntakeId) {
        setLatestClinicalIntakeId(latestIntakeId)
      }

      const narrative = latest ? getIntakeNarrative(latest.content) : null
      if (narrative) {
        setLastSummary(trimText(narrative, 200))
      }
    } catch (err) {
      console.error('[DialogScreenV2] Failed to sync intake debug metadata', err)
    }
  }

  /* eslint-disable react-hooks/exhaustive-deps */
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

      setLatestClinicalIntakeId(latestIntake?.id ?? null)
      setHasOpenReviewRequest(latestIntake?.review_state?.status === 'needs_more_info')
      void syncIntakeDebugMeta(latestIntake)

      const safety = latestIntake ? getSafetyFromContent(latestIntake.content) : null
      setSafetyStatus(safety)
      const localSafetyUiState = getSafetyUiState(safety)

      const intakeFollowup = latestIntake ? getFollowupFromContent(latestIntake.content) : null
      if (
        !localSafetyUiState.blockChat &&
        intakeFollowup?.next_questions &&
        intakeFollowup.next_questions.length > 0
      ) {
        setActiveFollowupQuestion(intakeFollowup.next_questions[0])
        setChatMessages([
          {
            id: `assistant-${Date.now()}`,
            sender: 'assistant',
            text: buildFollowupPrompt({
              question: intakeFollowup.next_questions[0],
              latestIntake,
            }),
            timestamp: buildTimestamp(),
          },
        ])
        return
      }

      if (!localSafetyUiState.blockChat && latestIntake?.id) {
        try {
          const generatedFollowup = await generateFollowup({ intakeId: latestIntake.id })
          if (!generatedFollowup.blocked && generatedFollowup.nextQuestions.length > 0) {
            setActiveFollowupQuestion(generatedFollowup.nextQuestions[0])
            setChatMessages([
              {
                id: `assistant-${Date.now()}`,
                sender: 'assistant',
                text: buildFollowupPrompt({
                  question: generatedFollowup.nextQuestions[0],
                  latestIntake,
                }),
                timestamp: buildTimestamp(),
              },
            ])
            return
          }
        } catch (followupError) {
          console.warn('[DialogScreenV2] Initial followup generation failed', followupError)
        }
      }

      const resumeContext = buildResumeContext(latestIntake)
      const openingQuestion = resumeContext
        ? await fetchResumeStart(resumeContext)
        : buildOpeningQuestion(latestIntake)
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

  /* eslint-disable react-hooks/exhaustive-deps */
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

  useEffect(() => {
    if (!isChatEnabled) return

    if (autosaveTimerRef.current) {
      clearInterval(autosaveTimerRef.current)
    }

    autosaveTimerRef.current = setInterval(() => {
      void maybeAutosave('timer')
    }, 120_000)

    return () => {
      if (autosaveTimerRef.current) {
        clearInterval(autosaveTimerRef.current)
        autosaveTimerRef.current = null
      }
    }
  }, [isChatEnabled])
  /* eslint-enable react-hooks/exhaustive-deps */

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleExit = () => {
      void maybeAutosave('exit', { keepalive: true, skipVerify: true })
    }

    window.addEventListener('beforeunload', handleExit)
    window.addEventListener('pagehide', handleExit)

    return () => {
      window.removeEventListener('beforeunload', handleExit)
      window.removeEventListener('pagehide', handleExit)
    }
  }, [intakeEntryId])
  /* eslint-enable react-hooks/exhaustive-deps */

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
      const response = await fetch('/api/patient/intake/latest', {
        headers: intakeRunIdRef.current ? { 'x-intake-run-id': intakeRunIdRef.current } : undefined,
      })
      const data = await response.json()
      if (!response.ok || !data?.success) return null

      const intake = data?.intake as
        | {
            id?: string
            uuid?: string
            structured_data?: Record<string, unknown>
            clinical_summary?: string | null
            review_state?: {
              status?: 'draft' | 'in_review' | 'approved' | 'needs_more_info' | 'rejected'
            } | null
            updated_at?: string | null
            version_number?: number | null
            created_at?: string
          }
        | null
        | undefined

      if (!intake) return null

      const content: Record<string, unknown> = {
        structured_data: intake.structured_data ?? {},
        clinical_summary: intake.clinical_summary ?? null,
      }

      return {
        id: intake.id || intake.uuid || 'unknown',
        content,
        review_state: intake.review_state ?? null,
        created_at: intake.created_at || intake.updated_at || new Date().toISOString(),
        updated_at: intake.updated_at ?? null,
        version_number: intake.version_number ?? null,
      }
    } catch (err) {
      console.error('[DialogScreenV2] Failed to load intake entries', err)
      return null
    }
  }

  const buildResumeContext = (latestIntake: IntakeEntry | null) => {
    if (!latestIntake) return null

    const structuredData = getStructuredDataFromContent(latestIntake.content)

    const chiefComplaint = structuredData
      ? typeof structuredData.chief_complaint === 'string'
        ? structuredData.chief_complaint.trim()
        : null
      : typeof latestIntake.content?.chiefComplaint === 'string'
        ? latestIntake.content.chiefComplaint.trim()
        : null

    const narrativeSummaryRaw = getIntakeNarrative(latestIntake.content)
    const narrativeSummary = narrativeSummaryRaw
      ? trimText(narrativeSummaryRaw, 400)
      : null

    const interpreted =
      latestIntake.content?.interpreted_clinical_summary &&
      typeof latestIntake.content.interpreted_clinical_summary === 'object'
        ? (latestIntake.content.interpreted_clinical_summary as Record<string, unknown>)
        : null

    const openQuestionsRaw =
      interpreted?.open_questions ?? structuredData?.open_questions ?? latestIntake.content?.openQuestions
    const openQuestions = Array.isArray(openQuestionsRaw)
      ? openQuestionsRaw
          .filter((item) => typeof item === 'string' && item.trim())
          .slice(0, 3)
      : []

    return {
      chiefComplaint: chiefComplaint || undefined,
      narrativeSummary: narrativeSummary || undefined,
      openQuestions,
      lastUpdatedAt: latestIntake.updated_at ?? null,
    }
  }

  const fetchResumeStart = async (resumeContext: Record<string, unknown>) => {
    try {
      const response = await fetch('/api/amy/chat', {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify({ mode: 'resume', resumeContext }),
      })

      const data = await response.json()
      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || 'Resume request failed')
      }

      const replyText = typeof data?.data?.reply === 'string' ? data.data.reply : null
      if (!replyText) {
        throw new Error('Invalid resume response')
      }

      return replyText
    } catch (err) {
      console.error('[DialogScreenV2] Resume start failed', err)
      return DEFAULT_OPENING_QUESTION
    }
  }

  const createNewIntakeEntry = async (): Promise<string | null> => {
    if (ANAMNESIS_INTAKE_WRITES_DISABLED) {
      console.warn('[DialogScreenV2] Anamnesis intake writes are disabled')
      return null
    }
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
      interpreted_clinical_summary: undefined,
      structured_intake_data: {
        chief_complaint: trimText(chiefComplaint, MAX_CHIEF_COMPLAINT_LENGTH),
        narrative_summary: narrativeSummary || 'Kontakt gestartet.',
        structured: {
          timeline: [],
          key_symptoms: [],
        },
        red_flags: [],
        open_questions: intakeQuestions.slice(0, MAX_INTAKE_OPEN_QUESTIONS),
        evidence_refs: evidenceRefs,
      },
    }
  }

  const mergeSnapshotContent = (snapshot: Record<string, unknown>) => {
    const base = buildSnapshotContent()
    const baseStructured = base.structured_intake_data as Record<string, unknown>

    const incomingStructured =
      snapshot.structured_intake_data && typeof snapshot.structured_intake_data === 'object'
        ? (snapshot.structured_intake_data as Record<string, unknown>)
        : null

    const legacyStructured =
      snapshot.structured && typeof snapshot.structured === 'object'
        ? (snapshot.structured as Record<string, unknown>)
        : null

    const mergedStructuredBlock = {
      ...(baseStructured.structured as Record<string, unknown>),
      ...(incomingStructured?.structured && typeof incomingStructured.structured === 'object'
        ? (incomingStructured.structured as Record<string, unknown>)
        : {}),
      ...(legacyStructured ? { key_symptoms: legacyStructured.keySymptoms } : {}),
    }

    const mergedStructuredIntake = {
      ...baseStructured,
      ...(incomingStructured || {}),
      chief_complaint:
        typeof snapshot.chiefComplaint === 'string' && snapshot.chiefComplaint.trim()
          ? snapshot.chiefComplaint
          : baseStructured.chief_complaint,
      narrative_summary:
        typeof snapshot.narrativeSummary === 'string' && snapshot.narrativeSummary.trim()
          ? snapshot.narrativeSummary
          : baseStructured.narrative_summary,
      red_flags: Array.isArray(snapshot.redFlags) ? snapshot.redFlags : baseStructured.red_flags,
      open_questions: Array.isArray(snapshot.openQuestions)
        ? snapshot.openQuestions
        : baseStructured.open_questions,
      evidence_refs: Array.isArray(snapshot.evidenceRefs)
        ? snapshot.evidenceRefs
        : baseStructured.evidence_refs,
      structured: mergedStructuredBlock,
    }

    return {
      ...base,
      ...snapshot,
      structured_intake_data: mergedStructuredIntake,
      interpreted_clinical_summary:
        snapshot.interpreted_clinical_summary &&
        typeof snapshot.interpreted_clinical_summary === 'object'
          ? snapshot.interpreted_clinical_summary
          : snapshot.interpretedClinicalSummary &&
              typeof snapshot.interpretedClinicalSummary === 'object'
            ? snapshot.interpretedClinicalSummary
            : base.interpreted_clinical_summary,
    }
  }

  const stripOutputJson = (value: string) => {
    const markerIndex = value.indexOf(OUTPUT_JSON_MARKER)
    if (markerIndex === -1) return value
    const cleaned = value.slice(0, markerIndex).trim()
    const isLocalHost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    if (isLocalHost) {
      console.info('[DialogScreenV2] OUTPUT_JSON stripped from assistant text')
    }
    return cleaned
  }

  const generateIntakeSummary = (snapshot: Record<string, unknown>) => {
    const interpreted = snapshot.interpreted_clinical_summary
    if (interpreted && typeof interpreted === 'object') {
      const record = interpreted as Record<string, unknown>
      const narrative = record.narrative_history
      const shortSummary = record.short_summary
      if (typeof narrative === 'string' && narrative.trim()) {
        setLastSummary(narrative.trim())
      } else if (Array.isArray(shortSummary)) {
        const first = shortSummary.find((item) => typeof item === 'string' && item.trim())
        if (first && typeof first === 'string') setLastSummary(first.trim())
      }
    }

    void persistIntakeSnapshot(snapshot, 'summary')
  }

  const markAutosaveDirty = () => {
    autosaveDirtyRef.current = true
    autosaveTurnsRef.current += 1
  }

  const maybeAutosave = async (
    reason: string,
    options?: { keepalive?: boolean; skipVerify?: boolean },
  ) => {
    if (!autosaveDirtyRef.current) return
    if (!intakeEntryId) return
    if (autosaveInFlightRef.current) return

    const shouldSaveByTurns = autosaveTurnsRef.current >= 3
    const shouldSaveByTimer = reason === 'timer' || reason === 'exit'

    if (!shouldSaveByTurns && !shouldSaveByTimer && reason !== 'summary') {
      return
    }

    await persistIntakeSnapshot(buildSnapshotContent(), reason, options)
  }

  const saveIntakeSnapshot = async () => {
    if (ANAMNESIS_INTAKE_WRITES_DISABLED) {
      console.warn('[DialogScreenV2] Anamnesis intake writes are disabled')
      return
    }
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

  const persistIntakeSnapshot = async (
    snapshot: Record<string, unknown>,
    reason: string,
    options?: { keepalive?: boolean; skipVerify?: boolean },
  ) => {
    if (ANAMNESIS_INTAKE_WRITES_DISABLED) {
      console.warn('[DialogScreenV2] Anamnesis intake writes are disabled')
      return
    }
    if (!intakeEntryId) return
    if (autosaveInFlightRef.current) return

    autosaveInFlightRef.current = true
    autosaveAbortRef.current?.abort()
    autosaveAbortRef.current = new AbortController()

    try {
      setIntakePersistence((prev) => ({
        ...prev,
        patchAttempted: true,
        patchFailed: false,
        autosaveFailed: false,
      }))

      const response = await fetch(`/api/patient/anamnesis/${intakeEntryId}` , {
        method: 'PATCH',
        headers: getRequestHeaders(),
        signal: autosaveAbortRef.current.signal,
        keepalive: options?.keepalive,
        body: JSON.stringify({
          title: 'Intake',
          entry_type: 'intake',
          content: mergeSnapshotContent(snapshot),
          change_reason: reason,
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
        autosaveFailed: false,
        entryId: data?.data?.entryId || data?.data?.entry?.id || intakeEntryId,
      }))
      autosaveDirtyRef.current = false
      autosaveTurnsRef.current = 0
      if (!options?.skipVerify) {
        void verifyIntakeWrite()
      }
    } catch (err) {
      console.error('[DialogScreenV2] Failed to persist intake snapshot', err)
      setIntakePersistence((prev) => ({
        ...prev,
        patchFailed: true,
        autosaveFailed: true,
      }))
      autosaveDirtyRef.current = true
    }
    autosaveInFlightRef.current = false
  }

  const verifyIntakeWrite = async () => {
    try {
      setIntakePersistence((prev) => ({
        ...prev,
        entryId: intakeEntryId ? prev.entryId ?? intakeEntryId : prev.entryId,
      }))

      await syncIntakeDebugMeta()
    } catch (err) {
      console.error('[DialogScreenV2] Intake write check failed', err)
    }
  }

  const triggerManualIntake = async () => {
    if (isManualIntakeRunning) return

    setIsManualIntakeRunning(true)
    setManualIntakeStatus(null)
    setManualIntakeError(null)

    try {
      const response = await fetch('/api/clinical-intake/generate', {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify({ force: true, triggerReason: 'manual' }),
      })
      const data = await response.json()

      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || 'Failed to generate intake')
      }

      setManualIntakeStatus('ok')
      await syncIntakeDebugMeta()
      void verifyIntakeWrite()
    } catch (err) {
      console.error('[DialogScreenV2] Manual intake generation failed', err)
      setManualIntakeStatus('error')
      setManualIntakeError(err instanceof Error ? err.message : 'Intake generation failed')
    } finally {
      setIsManualIntakeRunning(false)
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
    if (isSafetyBlocked) {
      setSendError(
        safetyBannerText ||
          'Bitte nutzen Sie einen direkten Kontaktweg, um Ihre Situation zu klaeren.',
      )
      return
    }

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
    collectEvidence(trimmed)
    collectNote(trimmed)
    if (!chiefComplaint) {
      setChiefComplaint(trimText(trimmed, MAX_CHIEF_COMPLAINT_LENGTH))
    }
    markAutosaveDirty()
    void maybeAutosave('turn')

    const currentFollowupQuestion = activeFollowupQuestion

    try {
      if (currentFollowupQuestion && latestClinicalIntakeId && !isSafetyBlocked) {
        try {
          await persistUserAnswerToChat(trimmed)

          const followupResult = await generateFollowup({
            intakeId: latestClinicalIntakeId,
            askedQuestionId: currentFollowupQuestion.id,
            askedAnswerText: trimmed,
          })

          setLatestClinicalIntakeId(followupResult.intakeId)

          if (followupResult.blocked) {
            setActiveFollowupQuestion(null)
            setFollowupAnsweredCount(0)
            return
          }

          const answeredCount = followupAnsweredCount + 1
          setFollowupAnsweredCount(answeredCount)

          if (followupResult.nextQuestions.length > 0 && answeredCount < 3) {
            const nextQuestion = followupResult.nextQuestions[0]
            setActiveFollowupQuestion(nextQuestion)
            appendAssistantMessage(
              buildFollowupPrompt({ question: nextQuestion, latestIntake: null }),
            )
            return
          }

          setActiveFollowupQuestion(null)

          const regenerateResponse = await fetch('/api/clinical-intake/generate', {
            method: 'POST',
            headers: getRequestHeaders(),
            body: JSON.stringify({ force: true, triggerReason: 'clarification' }),
          })

          const regeneratePayload = await regenerateResponse.json()
          if (regenerateResponse.ok && regeneratePayload?.success) {
            const refreshedIntake = await fetchLatestIntake()
            setLatestClinicalIntakeId(refreshedIntake?.id ?? null)
            setHasOpenReviewRequest(refreshedIntake?.review_state?.status === 'needs_more_info')
            setSafetyStatus(refreshedIntake ? getSafetyFromContent(refreshedIntake.content) : null)

            if (refreshedIntake?.id) {
              try {
                const refreshedFollowup = await generateFollowup({ intakeId: refreshedIntake.id })
                setLatestClinicalIntakeId(refreshedFollowup.intakeId)
                if (!refreshedFollowup.blocked && refreshedFollowup.nextQuestions.length > 0) {
                  const nextQuestion = refreshedFollowup.nextQuestions[0]
                  setActiveFollowupQuestion(nextQuestion)
                  appendAssistantMessage(
                    buildFollowupPrompt({
                      question: nextQuestion,
                      latestIntake: refreshedIntake,
                    }),
                  )
                }
              } catch (followupError) {
                console.warn('[DialogScreenV2] Followup refresh after regeneration failed', followupError)
              }
            }
          }

          setFollowupAnsweredCount(0)
          return
        } catch (followupLoopError) {
          console.warn('[DialogScreenV2] Followup loop failed, fallback to normal chat', followupLoopError)
        }
      }

      const response = await fetch('/api/amy/chat', {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify({
          message: trimmed,
          structuredIntakeData: buildSnapshotContent().structured_intake_data,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || 'Chat request failed')
      }

      const rawReplyText = data?.data?.reply
      const replyText = rawReplyText ? stripOutputJson(rawReplyText) : rawReplyText

      if (!replyText || typeof replyText !== 'string') {
        throw new Error('Invalid chat response')
      }

      appendAssistantMessage(replyText)
      if (replyText.includes('?')) {
        collectOpenQuestion(replyText)
      }

      const intakeSnapshot = data?.data?.intakeSnapshot
      if (intakeSnapshot && typeof intakeSnapshot === 'object') {
        generateIntakeSummary(intakeSnapshot as Record<string, unknown>)
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
            <div className="flex items-center gap-2">
              {showManualTrigger && (
                <button
                  type="button"
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm"
                  onClick={() => void triggerManualIntake()}
                  disabled={isManualIntakeRunning}
                >
                  {isManualIntakeRunning ? 'Generating…' : 'Generate Intake (Dev)'}
                </button>
              )}
              <Badge variant="success" size="sm">
                Live
              </Badge>
            </div>
          </header>

          {isSafetyBlocked && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
              <p className="font-semibold">Sicherheits-Hinweis (Level A)</p>
              <p className="mt-1">
                {safetyBannerText ||
                  'Ihre Angaben deuten auf eine Situation hin, die besser direkt mit einer medizinischen Fachperson besprochen wird. Bitte nutzen Sie jetzt einen direkten Kontaktweg (z.B. telefonische Beratung oder Notfallnummer). Der Chat ist vorerst pausiert.'}
              </p>
            </div>
          )}

          {hasOpenReviewRequest && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
              <p className="font-semibold">Aerztliche Rueckfrage offen</p>
              <p className="mt-1">
                Zu Ihrem letzten Intake wurden zusaetzliche Informationen angefragt.
              </p>
            </div>
          )}

          {devtoolsEnabled && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
              <p className="font-semibold">Intake Debug</p>
              <p>runId: {intakePersistence.runId || 'pending'}</p>
              <p>latestIntakeId: {intakePersistence.latestIntakeEntryId || 'none'}</p>
              <p>
                recentIntakeCount:{' '}
                {intakePersistence.recentIntakeCount === null
                  ? 'unknown'
                  : intakePersistence.recentIntakeCount}
              </p>
              <p>
                latestVersionNumber:{' '}
                {intakePersistence.latestVersionCount === null
                  ? 'unknown'
                  : intakePersistence.latestVersionCount}
              </p>
              <p>lastSummary: {lastSummary || 'none'}</p>
              {manualIntakeStatus === 'ok' && (
                <p className="mt-2 font-semibold text-emerald-700">
                  Manual intake generation succeeded
                </p>
              )}
              {manualIntakeStatus === 'error' && (
                <p className="mt-2 font-semibold text-amber-800">
                  Manual intake generation failed
                </p>
              )}
              {manualIntakeError && (
                <p className="mt-1 text-amber-800">{manualIntakeError}</p>
              )}
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
                disabled={!isChatEnabled || isSending || isSafetyBlocked}
                className="flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!isChatEnabled || isSending || isSafetyBlocked || input.trim().length === 0}
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
                  disabled={!isChatEnabled || isSending || isSafetyBlocked}
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
