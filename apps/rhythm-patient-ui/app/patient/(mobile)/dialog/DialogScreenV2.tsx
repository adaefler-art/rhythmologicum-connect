'use client'

import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import { Badge } from '@/lib/ui/mobile-v2'
import { Bot, Mic, ChevronRight } from '@/lib/ui/mobile-v2/icons'
import { env } from '@/lib/env'
import { flagEnabled } from '@/lib/env/flags'
import { ASSISTANT_CONFIG } from '@/lib/config/assistant'
import type { SafetyEvaluation } from '@/lib/types/clinicalIntake'
import { getSafetyUiState } from '@/lib/cre/safety/policy'
import { shouldSkipDuplicateAssistantMessage } from '@/lib/patients/assistantMessageDedup'

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
  status?: 'draft' | 'active' | 'superseded' | 'archived' | null
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

type PersistedChatMessage = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

type PatientAssessmentSummary = {
  id: string
  status: string
  startedAt?: string | null
  completedAt?: string | null
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
  objective_id?: string
}

type FollowupObjectiveSnapshot = {
  id: string
  status: string
}

type CorrectionType =
  | 'medication_missing'
  | 'medication_incorrect'
  | 'history_missing'
  | 'symptom_timeline'
  | 'free_text'

type CorrectionSourceContext = 'status_page' | 'chat' | 'followup'

type ProgramReadinessSnapshot = {
  active_block_id: string | null
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

const DEFAULT_OPENING_QUESTION =
  'Kurz zum Ziel: Ich erfasse Ihre Beschwerden strukturiert fuer die aerztliche Einschaetzung. Was ist heute Ihr wichtigstes Anliegen?'
const FOLLOWUP_NO_NEXT_QUESTION_MESSAGE =
  'Danke, ich habe das notiert. Aktuell habe ich keine weitere konkrete Rueckfrage. Gibt es seitdem neue oder veraenderte Beschwerden?'
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

const sanitizeFollowupQuestionText = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return ''

  return trimmed
    .replace(/^(danke[.!]?\s*)+/i, '')
    .replace(/^eine\s+kurze\s+rueckfrage\s+zur\s+anamnese:\s*/i, '')
    .replace(/^eine\s+kurze\s+frage\s+zur\s+anamnese:\s*/i, '')
    .trim()
}

const FORBIDDEN_PATIENT_LANGUAGE_PATTERNS: RegExp[] = [
  /\bdiagnose\b/i,
  /\bdifferenzial\w*\b/i,
  /\btriage\b/i,
  /\bwahrscheinlichkeit\b/i,
  /\brisik\w*\b/i,
  /\bverdacht\s+auf\b/i,
  /\bhinweis\s+auf\b/i,
  /\bklinisch\s+(spricht|passend|typisch)\b/i,
]

const containsForbiddenPatientLanguage = (value: string) =>
  FORBIDDEN_PATIENT_LANGUAGE_PATTERNS.some((pattern) => pattern.test(value))

const toNeutralProcessQuestion = () =>
  'Damit ich Ihre Angaben strukturiert vervollstaendigen kann: Welche Beschwerden stehen aktuell im Vordergrund und seit wann?'

const deriveCardiacHint = (technicalText: string) => {
  const normalized = technicalText
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')

  const hasPalpitations = /herzstolper|unregelma(ß|ss)ig|rhythm/.test(normalized)
  const hasPulse = /ruhepuls|puls/.test(normalized)

  if (hasPalpitations && hasPulse) {
    return 'Herzstolpern und einem erhoehten Ruhepuls'
  }
  if (hasPalpitations) {
    return 'Herzstolpern'
  }
  if (hasPulse) {
    return 'einem erhoehten Ruhepuls'
  }

  return 'koerperlichen Beschwerden im Herz-Kreislauf-Bereich'
}

const toPatientFriendlyFollowupQuestion = (value: string) => {
  const sanitized = sanitizeFollowupQuestionText(value)
  if (!sanitized) return ''

  if (containsForbiddenPatientLanguage(sanitized)) {
    return toNeutralProcessQuestion()
  }

  const normalized = sanitized
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')

  const looksTechnicalThirdPerson =
    /\bder patient\b|\bstellt sich\b|\banamnese\b|\bklinisch\b|\babgeklart\b|\berwahnt\b/.test(
      normalized,
    )

  if (!looksTechnicalThirdPerson) {
    return sanitized
  }

  const hasPsychContext = /psych|nervos|angst|stress|belast|job|beruf/.test(normalized)
  const hasCardiacContext = /kard|herz|puls|rhythm|herzstolper/.test(normalized)

  if (hasPsychContext && hasCardiacContext) {
    const cardiacHint = deriveCardiacHint(sanitized)
    return [
      'Sie haben gerade viel Belastung geschildert, das klingt sehr anstrengend.',
      `Zusaetzlich hatten Sie von ${cardiacHint} berichtet. Sind diese Beschwerden aktuell noch da?`,
    ].join('\n\n')
  }

  const sentences = sanitized
    .split(/(?<=[?.!])\s+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
  const lastQuestionSentence = [...sentences].reverse().find((entry) => entry.includes('?'))

  if (lastQuestionSentence) {
    const rewritten = lastQuestionSentence
      .replace(/\bDer Patient\b/g, 'Sie')
      .replace(/\bder Patient\b/g, 'Sie')
      .replace(/\bsollen die\b/gi, 'moechten Sie die')
      .replace(/\bwerden\?$/i, '?')
      .trim()

    if (rewritten.length > 0) {
      return rewritten
    }
  }

  if (hasPsychContext) {
    return [
      'Sie haben gerade viel Belastung geschildert, das klingt sehr anstrengend.',
      'Wie stark sind diese Beschwerden aktuell?',
    ].join('\n\n')
  }

  if (hasCardiacContext) {
    return 'Bestehen Ihre Herzbeschwerden aktuell noch, und moechten Sie diese aerztlich abklaeren lassen?'
  }

  return 'Koennen Sie Ihre aktuellen Beschwerden bitte kurz in Ihren eigenen Worten beschreiben?'
}

const normalizeAssistantTextForPatient = (value: string) => {
  const sanitized = sanitizeFollowupQuestionText(value)
  if (!sanitized) return value

  if (containsForbiddenPatientLanguage(sanitized)) {
    return toNeutralProcessQuestion()
  }

  const normalized = sanitized
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')

  const looksTechnicalThirdPerson =
    /\bder patient\b|\bstellt sich\b|\banamnese\b|\bklinisch\b|\bpriorisiert\b|\berwahnt\b/.test(
      normalized,
    )

  if (!looksTechnicalThirdPerson) {
    return value
  }

  return toPatientFriendlyFollowupQuestion(sanitized)
}

const normalizeFollowupQuestionForCompare = (value?: string) =>
  sanitizeFollowupQuestionText(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

const isSameFollowupQuestion = (left?: FollowupQuestion | null, right?: FollowupQuestion | null) => {
  if (!left || !right) return false

  const sameId =
    typeof left.id === 'string' &&
    typeof right.id === 'string' &&
    left.id.trim().length > 0 &&
    left.id.trim() === right.id.trim()

  if (sameId) return true

  const leftNormalized = normalizeFollowupQuestionForCompare(left.question)
  const rightNormalized = normalizeFollowupQuestionForCompare(right.question)
  return Boolean(leftNormalized && rightNormalized && leftNormalized === rightNormalized)
}

const pickDistinctNextFollowupQuestion = (params: {
  currentQuestion: FollowupQuestion
  candidates: FollowupQuestion[]
}) => params.candidates.find((entry) => !isSameFollowupQuestion(entry, params.currentQuestion)) ?? null

const questionAlreadyContainsContext = (value: string) =>
  /^(zum\s+thema|eine\s+kurze\s+rueckfrage\s+zur\s+anamnese|eine\s+kurze\s+frage\s+zur\s+anamnese)/i.test(
    value.trim(),
  )

const buildOpeningQuestion = (latestIntake: IntakeEntry | null) => {
  if (!latestIntake) return DEFAULT_OPENING_QUESTION
  const narrative = getIntakeNarrative(latestIntake.content)
  if (!narrative) {
    return 'Kurz zum Stand: Wir haben bereits Vorinformationen. Damit wir abschliessen koennen, brauche ich noch die wichtigsten Aenderungen seit dem letzten Mal. Was ist seitdem neu?'
  }
  const topic = extractTopic(narrative)
  if (!topic) {
    return 'Kurz zum Stand: Wir haben bereits Vorinformationen. Damit wir abschliessen koennen, brauche ich noch die wichtigsten Aenderungen seit dem letzten Mal. Was ist seitdem neu?'
  }
  return `Kurz zum Stand: Letztes Mal ging es um ${topic}. Damit wir vollstaendig sind, brauche ich noch die wichtigsten Aenderungen seitdem. Wie ist es aktuell?`
}

const buildFollowupPrompt = (params: {
  question: FollowupQuestion
  latestIntake: IntakeEntry | null
  includeIntro?: boolean
  activeObjectiveCount?: number | null
  activeBlockId?: string | null
}) => {
  const {
    question,
    latestIntake,
    includeIntro = false,
    activeObjectiveCount = null,
    activeBlockId = null,
  } = params
  const structured = latestIntake ? getStructuredDataFromContent(latestIntake.content) : null
  const chiefComplaint =
    structured && typeof structured.chief_complaint === 'string' && structured.chief_complaint.trim()
      ? structured.chief_complaint.trim()
      : null

  const reason = question.why?.trim()
  const cleanedQuestion = sanitizeFollowupQuestionText(question.question)
  const blockLabelById: Record<string, string> = {
    core_symptom_profile: 'Symptomprofil',
    medical_context: 'medizinischen Kontext',
    supporting_context: 'Begleitfaktoren',
    program_specific: 'Programmschritt',
  }

  const activeBlockLabel = activeBlockId ? blockLabelById[activeBlockId] ?? null : null

  const lead = includeIntro
    ? activeBlockLabel
      ? `Wir setzen im Abschnitt ${activeBlockLabel} fort. Ich starte mit der wichtigsten offenen Frage.`
      : activeObjectiveCount && activeObjectiveCount > 0
        ? `Ich habe noch ${activeObjectiveCount} offene Anamnese-Punkte. Ich starte mit der wichtigsten Frage.`
        : 'Ich habe eine kurze Frage zu Ihrer Anamnese.'
    : null

  const shortChiefComplaint = chiefComplaint && chiefComplaint.length <= 90 ? chiefComplaint : null
  const isStandardGapQuestion = question.source === 'gap_rule' && /^gap:/.test(question.id)
  const contextPrefix = shortChiefComplaint
    ? `Zum Thema "${shortChiefComplaint}": `
    : 'Kurze Frage: '

  const directQuestion = toPatientFriendlyFollowupQuestion(cleanedQuestion || question.question)

  const politeQuestion =
    isStandardGapQuestion || questionAlreadyContainsContext(directQuestion)
      ? directQuestion
      : `${contextPrefix}${directQuestion}`

  const technicalReason =
    reason &&
    /teilantwort|ambig|klassifikation|kontradik|klar|fehl|praezis|präzis|loop|state-machine/i.test(
      reason,
    )

  const reasonLine = reason
    ? question.source === 'clinician_request'
      ? null
      : technicalReason
        ? null
        : `Ziel: ${reason}.`
    : null

  if (lead && reasonLine) {
    return `${lead}\n\n${politeQuestion}\n${reasonLine}`
  }

  if (lead) {
    return `${lead}\n\n${politeQuestion}`
  }

  if (reasonLine) {
    return `${politeQuestion}\n${reasonLine}`
  }

  return politeQuestion
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
  const objectivesRaw = Array.isArray(record.objectives) ? record.objectives : []
  const programReadinessRaw =
    record.program_readiness && typeof record.program_readiness === 'object' && !Array.isArray(record.program_readiness)
      ? (record.program_readiness as Record<string, unknown>)
      : null
  const activeObjectiveIds = Array.isArray(record.active_objective_ids)
    ? record.active_objective_ids.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    : []
  const objectives: FollowupObjectiveSnapshot[] = objectivesRaw
    .filter((entry) => typeof entry === 'object' && entry !== null && !Array.isArray(entry))
    .map((entry) => {
      const item = entry as Record<string, unknown>
      return {
        id: typeof item.id === 'string' ? item.id : '',
        status: typeof item.status === 'string' ? item.status : 'missing',
      }
    })
    .filter((entry) => entry.id)
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
        objective_id: typeof item.objective_id === 'string' ? item.objective_id : undefined,
      }
    })
    .filter((entry) => entry.id && entry.question)

  return {
    next_questions: nextQuestions,
    active_objective_count: activeObjectiveIds.length,
    objectives,
    program_readiness: {
      active_block_id:
        programReadinessRaw && typeof programReadinessRaw.active_block_id === 'string'
          ? programReadinessRaw.active_block_id
          : null,
    } as ProgramReadinessSnapshot,
  }
}

const buildCaseChecklistSnapshot = (params: {
  latestIntake: IntakeEntry | null
  assessments: PatientAssessmentSummary[]
  history: PersistedChatMessage[]
}) => {
  const followup = params.latestIntake ? getFollowupFromContent(params.latestIntake.content) : null
  const objectives = followup?.objectives ?? []

  const checklistFromObjectives = objectives.map((objective) => ({
    id: objective.id,
    status:
      objective.status === 'answered' || objective.status === 'resolved' || objective.status === 'verified'
        ? 'captured'
        : objective.status === 'missing'
          ? 'missing'
          : objective.status === 'blocked_by_safety'
            ? 'delegated_to_physician'
            : 'unclear',
  }))

  const fallbackChecklist = checklistFromObjectives.length
    ? checklistFromObjectives
    : [
        {
          id: 'case:intake-completeness',
          status: followup?.active_objective_count && followup.active_objective_count > 0 ? 'missing' : 'captured',
        },
      ]

  return {
    checklist: fallbackChecklist,
    openChecklistCount: fallbackChecklist.filter((entry) => entry.status !== 'captured').length,
    completedAssessments: params.assessments.filter((entry) => entry.status === 'completed').length,
    inProgressAssessments: params.assessments.filter((entry) => entry.status === 'in_progress').length,
    recentTurns: params.history.slice(-6).map((entry) => ({
      role: entry.role,
      content: entry.content.slice(0, 220),
      created_at: entry.created_at,
    })),
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
  const prefill = searchParams.get('prefill')
  const correctionType = searchParams.get('correction_type')
  const correctionSourceContext = searchParams.get('correction_source_context')
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
  const [isHydrated, setIsHydrated] = useState(false)
  const [isDictating, setIsDictating] = useState(false)
  const [isDictationSupported, setIsDictationSupported] = useState(true)
  const [intakeEntryId] = useState<string | null>(null)
  const [intakeEvidence, setIntakeEvidence] = useState<IntakeEvidenceItem[]>([])
  const [intakeQuestions, setIntakeQuestions] = useState<string[]>([])
  const [intakeNotes, setIntakeNotes] = useState<string[]>([])
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [lastSummary, setLastSummary] = useState<string | null>(null)
  const [safetyStatus, setSafetyStatus] = useState<SafetyEvaluation | null>(null)
  const [isManualIntakeRunning, setIsManualIntakeRunning] = useState(false)
  const [manualIntakeStatus, setManualIntakeStatus] = useState<'ok' | 'error' | null>(null)
  const [manualIntakeError, setManualIntakeError] = useState<string | null>(null)
  const [isSubmitRunning, setIsSubmitRunning] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'ok' | 'error' | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isIntakeSubmitted, setIsIntakeSubmitted] = useState(false)
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
  const autosaveDirtyRef = useRef(false)
  const autosaveTurnsRef = useRef(0)
  const autosaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autosaveInFlightRef = useRef(false)
  const autosaveAbortRef = useRef<AbortController | null>(null)
  const isDictatingRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    const sanitizedPrefill = prefill?.trim()
    if (!sanitizedPrefill) return

    setInput((previous) => (previous.trim().length > 0 ? previous : sanitizedPrefill))
  }, [prefill])

  const appendAssistantMessage = (text: string) => {
    const normalizedText = normalizeAssistantTextForPatient(text)

    setChatMessages((prev) => {
      if (shouldSkipDuplicateAssistantMessage({ messages: prev, nextText: normalizedText })) {
        return prev
      }

      const assistantMessage: StubbedMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: normalizedText,
        timestamp: buildTimestamp(),
      }

      return [...prev, assistantMessage]
    })
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
    askedQuestionText?: string
    askedAnswerText?: string
    correctionType?: CorrectionType
    correctionSourceContext?: CorrectionSourceContext
  }) => {
    const response = await fetch('/api/patient/followup/generate', {
      method: 'POST',
      headers: getRequestHeaders(),
      body: JSON.stringify({
        intakeId: params.intakeId,
        asked_question_id: params.askedQuestionId,
        asked_question_text: params.askedQuestionText,
        asked_answer_text: params.askedAnswerText,
        correction_type: params.correctionType,
        correction_source_context: params.correctionSourceContext,
      }),
    })

    const payload = await response.json()

    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error?.message || 'Failed to generate followup questions')
    }

    const nextQuestionsRaw = payload?.data?.next_questions
    const askedQuestionId = params.askedQuestionId?.trim() ?? ''
    const askedQuestionNormalized = normalizeFollowupQuestionForCompare(params.askedQuestionText)

    const nextQuestions = Array.isArray(nextQuestionsRaw)
      ? (nextQuestionsRaw as FollowupQuestion[]).filter((entry) => {
          const entryId = typeof entry.id === 'string' ? entry.id.trim() : ''
          const entryQuestionNormalized = normalizeFollowupQuestionForCompare(entry.question)

          if (askedQuestionId && entryId === askedQuestionId) {
            return false
          }

          if (
            askedQuestionNormalized &&
            entryQuestionNormalized &&
            entryQuestionNormalized === askedQuestionNormalized
          ) {
            return false
          }

          return true
        })
      : []

    const intakeId =
      typeof payload?.data?.intake_id === 'string' && payload.data.intake_id
        ? payload.data.intake_id
        : params.intakeId

    return {
      nextQuestions,
      intakeId,
      blocked: Boolean(payload?.data?.blocked),
      activeObjectiveCount: Array.isArray(payload?.data?.followup?.active_objective_ids)
        ? payload.data.followup.active_objective_ids.length
        : null,
      activeBlockId:
        typeof payload?.data?.program_readiness?.active_block_id === 'string'
          ? payload.data.program_readiness.active_block_id
          : typeof payload?.data?.followup?.program_readiness?.active_block_id === 'string'
            ? payload.data.followup.program_readiness.active_block_id
            : null,
    }
  }

  const resolveCorrectionType = (value?: string | null): CorrectionType | undefined => {
    if (value === 'medication_missing') return 'medication_missing'
    if (value === 'medication_incorrect') return 'medication_incorrect'
    if (value === 'history_missing') return 'history_missing'
    if (value === 'symptom_timeline') return 'symptom_timeline'
    if (value === 'free_text') return 'free_text'
    return undefined
  }

  const resolveCorrectionSourceContext = (
    value?: string | null,
  ): CorrectionSourceContext | undefined => {
    if (value === 'status_page') return 'status_page'
    if (value === 'chat') return 'chat'
    if (value === 'followup') return 'followup'
    return undefined
  }

  const resolvedCorrectionType = resolveCorrectionType(correctionType)
  const resolvedCorrectionSourceContext = resolveCorrectionSourceContext(correctionSourceContext)
  const isCorrectionContext = context === 'correction'

  async function syncIntakeDebugMeta(latestIntake?: IntakeEntry | null) {
    try {
      const [latest, checkResponse] = await Promise.all([
        latestIntake !== undefined ? Promise.resolve(latestIntake) : fetchLatestIntake(),
        fetch('/api/patient/meta/intake-write-check', {
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

      const [latestIntake, persistedHistory, assessments] = await Promise.all([
        fetchLatestIntake(),
        fetchPersistedChatHistory(),
        fetchPatientAssessmentsSummary(),
      ])
      if (!isMounted) return

      setLatestClinicalIntakeId(latestIntake?.id ?? null)
      setIsIntakeSubmitted(latestIntake?.status === 'active')
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
            text: normalizeAssistantTextForPatient(
              buildFollowupPrompt({
                question: intakeFollowup.next_questions[0],
                latestIntake,
                includeIntro: true,
                activeObjectiveCount: intakeFollowup.active_objective_count ?? null,
                activeBlockId: intakeFollowup.program_readiness?.active_block_id ?? null,
              }),
            ),
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
                text: normalizeAssistantTextForPatient(
                  buildFollowupPrompt({
                    question: generatedFollowup.nextQuestions[0],
                    latestIntake,
                    includeIntro: true,
                    activeObjectiveCount: generatedFollowup.activeObjectiveCount,
                    activeBlockId: generatedFollowup.activeBlockId,
                  }),
                ),
                timestamp: buildTimestamp(),
              },
            ])
            return
          }
        } catch (followupError) {
          console.warn('[DialogScreenV2] Initial followup generation failed', followupError)
        }
      }

      const caseChecklist = buildCaseChecklistSnapshot({
        latestIntake,
        assessments,
        history: persistedHistory,
      })

      const resumeContext = buildResumeContext(latestIntake, {
        caseChecklist,
        assessments,
      })
      const openingQuestion = resumeContext
        ? await fetchResumeStart(resumeContext)
        : buildOpeningQuestion(latestIntake)
      setChatMessages([
        {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: normalizeAssistantTextForPatient(openingQuestion),
          timestamp: buildTimestamp(),
        },
      ])
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
            status?: 'draft' | 'active' | 'superseded' | 'archived'
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
        status: intake.status ?? null,
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

  const fetchPersistedChatHistory = async (): Promise<PersistedChatMessage[]> => {
    try {
      const response = await fetch('/api/amy/chat', {
        headers: intakeRunIdRef.current ? { 'x-intake-run-id': intakeRunIdRef.current } : undefined,
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.success) return []

      const messagesRaw = Array.isArray(payload?.data?.messages) ? payload.data.messages : []
      return messagesRaw
        .filter((entry: unknown) => typeof entry === 'object' && entry !== null)
        .map((entry: unknown) => {
          const item = entry as Record<string, unknown>
          return {
            id: typeof item.id === 'string' ? item.id : `msg-${Math.random().toString(36).slice(2)}`,
            role:
              item.role === 'assistant' || item.role === 'user' || item.role === 'system'
                ? item.role
                : 'system',
            content: typeof item.content === 'string' ? item.content : '',
            created_at: typeof item.created_at === 'string' ? item.created_at : new Date().toISOString(),
          } as PersistedChatMessage
        })
    } catch (err) {
      console.warn('[DialogScreenV2] Failed to load persisted chat history', err)
      return []
    }
  }

  const fetchPatientAssessmentsSummary = async (): Promise<PatientAssessmentSummary[]> => {
    try {
      const response = await fetch('/api/patient/assessments?limit=10', {
        headers: intakeRunIdRef.current ? { 'x-intake-run-id': intakeRunIdRef.current } : undefined,
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.success) return []

      const assessmentsRaw = Array.isArray(payload?.data?.assessments) ? payload.data.assessments : []
      return assessmentsRaw
        .filter((entry: unknown) => typeof entry === 'object' && entry !== null)
        .map((entry: unknown) => {
          const item = entry as Record<string, unknown>
          return {
            id: typeof item.id === 'string' ? item.id : '',
            status: typeof item.status === 'string' ? item.status : 'unknown',
            startedAt: typeof item.startedAt === 'string' ? item.startedAt : null,
            completedAt: typeof item.completedAt === 'string' ? item.completedAt : null,
          } as PatientAssessmentSummary
        })
        .filter((entry: PatientAssessmentSummary) => entry.id)
    } catch (err) {
      console.warn('[DialogScreenV2] Failed to load patient assessments summary', err)
      return []
    }
  }

  const buildResumeContext = (
    latestIntake: IntakeEntry | null,
    params?: {
      caseChecklist?: ReturnType<typeof buildCaseChecklistSnapshot>
      assessments?: PatientAssessmentSummary[]
    },
  ) => {
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
      caseChecklist: params?.caseChecklist?.checklist ?? [],
      openChecklistCount: params?.caseChecklist?.openChecklistCount ?? 0,
      assessmentSummary: {
        completed: params?.caseChecklist?.completedAssessments ?? 0,
        inProgress:
          params?.caseChecklist?.inProgressAssessments ??
          (params?.assessments ?? []).filter((entry) => entry.status === 'in_progress').length,
      },
      recentTurns: params?.caseChecklist?.recentTurns ?? [],
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
    if (isIntakeSubmitted) return

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

  const submitIntakeExplicitly = async () => {
    if (isSubmitRunning || isSending || isIntakeSubmitted || isSafetyBlocked) return

    setIsSubmitRunning(true)
    setSubmitStatus(null)
    setSubmitError(null)
    setSendError(null)

    try {
      const generateResponse = await fetch('/api/clinical-intake/generate', {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify({ force: true, triggerReason: 'submit' }),
      })

      const generatePayload = await generateResponse.json()
      if (!generateResponse.ok || !generatePayload?.success) {
        throw new Error(generatePayload?.error?.message || 'Intake konnte nicht erstellt werden.')
      }

      const generatedIntakeId =
        typeof generatePayload?.data?.intake?.id === 'string'
          ? generatePayload.data.intake.id
          : latestClinicalIntakeId

      const submitResponse = await fetch('/api/patient/intake/submit', {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify({ intakeId: generatedIntakeId }),
      })

      const submitPayload = await submitResponse.json()
      if (!submitResponse.ok || !submitPayload?.success) {
        throw new Error(submitPayload?.error?.message || 'Intake konnte nicht uebermittelt werden.')
      }

      setIsIntakeSubmitted(true)
      setSubmitStatus('ok')
      setActiveFollowupQuestion(null)
      setFollowupAnsweredCount(0)

      const confirmedIntakeId =
        typeof submitPayload?.data?.intakeId === 'string'
          ? submitPayload.data.intakeId
          : generatedIntakeId

      if (confirmedIntakeId) {
        setLatestClinicalIntakeId(confirmedIntakeId)
      }

      appendAssistantMessage(
        'Ihre Erfassung wurde uebermittelt. Danke. Wenn sich etwas aendert, koennen Sie spaeter eine Aktualisierung senden.',
      )
      await syncIntakeDebugMeta()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Intake-Uebermittlung fehlgeschlagen. Bitte erneut versuchen.'
      console.error('[DialogScreenV2] Explicit intake submit failed', err)
      setSubmitStatus('error')
      setSubmitError(message)
      setSendError(message)
    } finally {
      setIsSubmitRunning(false)
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
    if (isIntakeSubmitted) {
      setSendError('Diese Erfassung wurde bereits uebermittelt. Bitte starten Sie bei Bedarf eine neue Aktualisierung.')
      return
    }
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
          let followupReplySent = false

          await persistUserAnswerToChat(trimmed)

          const followupResult = await generateFollowup({
            intakeId: latestClinicalIntakeId,
            askedQuestionId: currentFollowupQuestion.id,
            askedQuestionText: currentFollowupQuestion.question,
            askedAnswerText: trimmed,
            correctionType: isCorrectionContext ? (resolvedCorrectionType ?? 'free_text') : undefined,
            correctionSourceContext: isCorrectionContext
              ? (resolvedCorrectionSourceContext ?? 'chat')
              : undefined,
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
            const nextQuestion = pickDistinctNextFollowupQuestion({
              currentQuestion: currentFollowupQuestion,
              candidates: followupResult.nextQuestions,
            })

            if (nextQuestion) {
              setActiveFollowupQuestion(nextQuestion)
              appendAssistantMessage(
                buildFollowupPrompt({
                  question: nextQuestion,
                  latestIntake: null,
                  activeObjectiveCount: followupResult.activeObjectiveCount,
                  activeBlockId: followupResult.activeBlockId,
                }),
              )
              followupReplySent = true
              return
            }

            setActiveFollowupQuestion(null)
          }

          setActiveFollowupQuestion(null)

          void syncIntakeDebugMeta()

          if (!followupReplySent) {
            appendAssistantMessage(FOLLOWUP_NO_NEXT_QUESTION_MESSAGE)
          }

          setFollowupAnsweredCount(0)
          return
        } catch (followupLoopError) {
          console.warn('[DialogScreenV2] Followup loop failed, trying followup-only recovery', followupLoopError)

          try {
            let recoveryReplySent = false

            const recoveryFollowup = await generateFollowup({ intakeId: latestClinicalIntakeId })
            setLatestClinicalIntakeId(recoveryFollowup.intakeId)

            if (recoveryFollowup.blocked) {
              setActiveFollowupQuestion(null)
              setFollowupAnsweredCount(0)
              return
            }

            if (recoveryFollowup.nextQuestions.length > 0) {
              const nextQuestion = pickDistinctNextFollowupQuestion({
                currentQuestion: currentFollowupQuestion,
                candidates: recoveryFollowup.nextQuestions,
              })

              if (nextQuestion) {
                setActiveFollowupQuestion(nextQuestion)
                appendAssistantMessage(
                  buildFollowupPrompt({
                    question: nextQuestion,
                    latestIntake: null,
                    activeObjectiveCount: recoveryFollowup.activeObjectiveCount,
                    activeBlockId: recoveryFollowup.activeBlockId,
                  }),
                )
                recoveryReplySent = true
              } else {
                setActiveFollowupQuestion(null)
              }
            }

            if (!recoveryReplySent) {
              appendAssistantMessage(FOLLOWUP_NO_NEXT_QUESTION_MESSAGE)
            }

            setFollowupAnsweredCount(0)
            return
          } catch (followupRecoveryError) {
            console.warn('[DialogScreenV2] Followup recovery failed', followupRecoveryError)
            setSendError('Es gab ein technisches Problem bei der Folgefrage. Bitte senden Sie kurz erneut.')
            return
          }
        }
      }

      if (!currentFollowupQuestion && latestClinicalIntakeId && isCorrectionContext) {
        try {
          await generateFollowup({
            intakeId: latestClinicalIntakeId,
            askedAnswerText: trimmed,
            correctionType: resolvedCorrectionType ?? 'free_text',
            correctionSourceContext: resolvedCorrectionSourceContext ?? 'chat',
          })
        } catch (correctionTraceError) {
          console.warn('[DialogScreenV2] Failed to persist correction trace metadata', correctionTraceError)
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

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return
    event.preventDefault()
    void handleSend()
  }

  const isSendDisabled =
    !isChatEnabled || isSending || isSafetyBlocked || isIntakeSubmitted || input.trim().length === 0
  const isDictationDisabled = !isChatEnabled || isSending || isSafetyBlocked || isIntakeSubmitted
  const canSubmitIntake =
    isChatEnabled &&
    !isSafetyBlocked &&
    !isIntakeSubmitted &&
    !isSending &&
    !isSubmitRunning &&
    !activeFollowupQuestion &&
    chatMessages.length > 0

  if (!isHydrated) {
    return (
      <div className="w-full overflow-x-hidden">
        <div className="flex min-h-[calc(100dvh-56px)] flex-col overflow-hidden" />
      </div>
    )
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

          {isIntakeSubmitted && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
              <p className="font-semibold">Erfassung uebermittelt</p>
              <p className="mt-1">
                Ihre Angaben wurden gespeichert und zur weiteren aerztlichen Einschaetzung bereitgestellt.
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
            <div className="mb-2 flex items-center justify-end">
              <button
                type="button"
                onClick={() => void submitIntakeExplicitly()}
                disabled={!canSubmitIntake}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                {isSubmitRunning ? 'Uebermittle…' : 'Erfassung abschliessen'}
              </button>
            </div>
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
                onKeyDown={handleInputKeyDown}
                disabled={!isChatEnabled || isSending || isSafetyBlocked}
                className="flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <div className="flex items-center justify-end gap-2 pb-1">
                {isDictationSupported && (
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
                    disabled={isDictationDisabled}
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                      isDictating
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400'
                    }`}
                    aria-label={isDictating ? 'Diktat stoppen' : 'Diktat starten'}
                  >
                    <Mic className="h-3.5 w-3.5" />
                    {isDictating && <span className="sr-only">Aufnahme laeuft</span>}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isSendDisabled}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white transition-colors disabled:bg-slate-200 disabled:text-slate-400"
                  aria-label="Senden"
                >
                  {isSending ? <span className="text-[10px]">...</span> : <ChevronRight className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 pt-2">
              {!isDictationSupported && (
                <span className="text-xs text-slate-500">
                  Diktat ist in diesem Browser nicht verfuegbar.
                </span>
              )}
              {dictationError && <span className="text-xs text-rose-700">{dictationError}</span>}
              {sendError && <span className="text-xs text-rose-700">{sendError}</span>}
              {submitStatus === 'ok' && (
                <span className="text-xs text-emerald-700">Erfassung erfolgreich uebermittelt.</span>
              )}
              {submitStatus === 'error' && submitError && (
                <span className="text-xs text-rose-700">{submitError}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
