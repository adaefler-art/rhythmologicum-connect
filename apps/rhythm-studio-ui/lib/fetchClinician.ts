import { env } from '@/lib/env'

type BuildInfo = {
  app?: string
  gitSha?: string
  buildTime?: string
  vercelEnv?: string
  vercelUrl?: string
}

export type ApiError = {
  status: number
  code?: string
  message: string
  endpoint: string
  method: string
}

export type ApiResult<T> = {
  data: T | null
  error: ApiError | null
  response: Response
  debugHint?: string
}

export type ApiCallRouteContext = 'triage' | 'patient-detail'

type FetchClinicianResult<T> = {
  response: Response
  data: T | null
  debugHint?: string
  responseJson?: unknown
  responseTextPreview?: string | null
}

let buildInfoPromise: Promise<BuildInfo | null> | null = null
const loggedMisses = new Set<string>()

const shouldShowDebugHint = () => {
  if (typeof window === 'undefined') return false
  if (env.NODE_ENV !== 'production') return true
  const params = new URLSearchParams(window.location.search)
  return params.get('debug') === '1'
}

const getBuildInfo = async (): Promise<BuildInfo | null> => {
  if (!buildInfoPromise) {
    buildInfoPromise = fetch('/api/_meta/build', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null)
  }
  return buildInfoPromise
}

const getBuildStampSha = (): string | null => {
  if (typeof document === 'undefined') return null
  const meta = document.head?.querySelector('meta[name="x-studio-build-sha"]')
  return meta?.getAttribute('content') || null
}

const nowMs = () => {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now()
  }
  return Date.now()
}

const logApiCall = (payload: {
  kind: 'API_CALL'
  endpoint: string
  method: string
  status: number
  durationMs: number
  routeContext: ApiCallRouteContext
  patientId?: string | null
}) => {
  if (typeof window === 'undefined') return
  console.info(JSON.stringify(payload))
}

const logPatientEndpointCall = (payload: {
  kind: 'PATIENT_ENDPOINT_CALL'
  endpoint: string
  status: number
  patientId: string | null
  routeContext: 'triage'
}) => {
  if (typeof window === 'undefined') return
  console.info(JSON.stringify(payload))
}

const buildApiError = (params: {
  response: Response
  endpoint: string
  method: string
  data: unknown
}) => {
  const { response, endpoint, method, data } = params
  const dataError = data && typeof data === 'object' ? (data as { error?: unknown }).error : null
  const legacyError = dataError && typeof dataError === 'string' ? dataError : null
  const code =
    dataError && typeof dataError === 'object' && dataError !== null
      ? (dataError as { code?: string }).code
      : legacyError || undefined
  const message =
    (dataError && typeof dataError === 'object' && dataError !== null
      ? (dataError as { message?: string }).message
      : legacyError || response.statusText) || `HTTP ${response.status}`

  return {
    status: response.status,
    code,
    message,
    endpoint,
    method,
  } satisfies ApiError
}

const logPatientApiMiss = (payload: {
  requestedUrl: string
  status: number
  buildSha: string
  responseJsonIfAny: unknown
  responseTextPreview: string | null
}) => {
  if (loggedMisses.has(payload.requestedUrl)) return
  loggedMisses.add(payload.requestedUrl)
  console.warn('[patient-api-miss]', payload)
}

export const fetchClinicianJson = async <T>(
  url: string,
  options?: RequestInit,
): Promise<FetchClinicianResult<T>> => {
  const response = await fetch(url, options)
  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json') || contentType.includes('+json')
  let responseJson: unknown = null
  let responseTextPreview: string | null = null

  if (response.status !== 204) {
    if (isJson) {
      responseJson = await response.json().catch(() => null)
    } else {
      const text = await response.text().catch(() => '')
      responseTextPreview = text ? text.slice(0, 120) : null
    }
  }

  let debugHint: string | undefined
  if (response.status === 404 || response.status === 501) {
    const buildInfo = await getBuildInfo()
    const buildSha = buildInfo?.gitSha || getBuildStampSha() || 'unknown'

    logPatientApiMiss({
      requestedUrl: url,
      status: response.status,
      buildSha,
      responseJsonIfAny: responseJson,
      responseTextPreview,
    })

    if (shouldShowDebugHint()) {
      debugHint = `Endpoint fehlt im Deploy. build=${buildSha}`
    }
  }

  return {
    response,
    data: (responseJson as T | null) ?? null,
    debugHint,
    responseJson,
    responseTextPreview,
  }
}

const requestClinicianJson = async <T>(params: {
  endpoint: string
  method?: string
  body?: unknown
  headers?: HeadersInit
  routeContext: ApiCallRouteContext
  patientId?: string | null
}): Promise<ApiResult<T>> => {
  const { endpoint, method = 'GET', body, headers, routeContext, patientId } = params
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const start = nowMs()
  const options: RequestInit = {
    method,
    headers: headers ?? (body ? { 'Content-Type': 'application/json' } : undefined),
    body: body ? JSON.stringify(body) : undefined,
  }

  const { response, data, debugHint } = await fetchClinicianJson<T>(normalizedEndpoint, options)
  const durationMs = Math.round(nowMs() - start)

  logApiCall({
    kind: 'API_CALL',
    endpoint: normalizedEndpoint,
    method,
    status: response.status,
    durationMs,
    routeContext,
    patientId: patientId ?? null,
  })

  if (normalizedEndpoint.startsWith('/api') && normalizedEndpoint.includes('/clinician/patient/')) {
    logPatientEndpointCall({
      kind: 'PATIENT_ENDPOINT_CALL',
      endpoint: normalizedEndpoint,
      status: response.status,
      patientId: patientId ?? null,
      routeContext: 'triage',
    })
  }

  let error: ApiError | null = null
  if (!response.ok || (data && typeof data === 'object' && (data as { success?: boolean }).success === false)) {
    error = buildApiError({ response, endpoint, method, data })
  }

  return {
    response,
    data,
    error,
    debugHint,
  }
}

export type TriageHealthResponse = {
  success?: boolean
  assessmentsTotal?: number
  latestAssessmentId?: string | null
  projectUrl?: string | null
  membershipStatus?: 'ok' | 'needs_fix' | 'skipped'
  membershipError?: { code?: string; message?: string } | null
}

export type ClinicianInboxPatient = {
  patientId: string
  name: string
  age?: number | null
  sex?: string | null
  lastActivityAt?: string | null
  lastIntakeAt?: string | null
}

export const triageHealth = () =>
  requestClinicianJson<TriageHealthResponse>({
    endpoint: '/api/triage/health',
    method: 'GET',
    routeContext: 'triage',
  })

export const getClinicianInbox = () =>
  requestClinicianJson<{
    success?: boolean
    patients?: ClinicianInboxPatient[]
  }>({
    endpoint: '/api/clinician/inbox',
    method: 'GET',
    routeContext: 'triage',
  })

export const triageFixMembership = (payload: { assessmentId: string }) =>
  requestClinicianJson<{ success?: boolean }>({
    endpoint: '/api/triage/fix-membership',
    method: 'POST',
    body: payload,
    routeContext: 'triage',
  })

export const triageCaseAck = (caseId: string, patientId?: string | null) =>
  requestClinicianJson<{ success?: boolean; data?: Record<string, unknown> }>({
    endpoint: `/api/clinician/triage/cases/${caseId}/ack`,
    method: 'POST',
    routeContext: 'triage',
    patientId: patientId ?? null,
  })

export const triageCaseSnooze = (
  caseId: string,
  payload: { snoozedUntil: string; reason?: string },
  patientId?: string | null,
) =>
  requestClinicianJson<{ success?: boolean; data?: Record<string, unknown> }>({
    endpoint: `/api/clinician/triage/cases/${caseId}/snooze`,
    method: 'POST',
    body: payload,
    routeContext: 'triage',
    patientId: patientId ?? null,
  })

export const triageCaseClose = (
  caseId: string,
  payload: { reason?: string },
  patientId?: string | null,
) =>
  requestClinicianJson<{ success?: boolean; data?: Record<string, unknown> }>({
    endpoint: `/api/clinician/triage/cases/${caseId}/close`,
    method: 'POST',
    body: payload,
    routeContext: 'triage',
    patientId: patientId ?? null,
  })

export const triageCaseReopen = (
  caseId: string,
  payload: { reason?: string },
  patientId?: string | null,
) =>
  requestClinicianJson<{ success?: boolean; data?: Record<string, unknown> }>({
    endpoint: `/api/clinician/triage/cases/${caseId}/reopen`,
    method: 'POST',
    body: payload,
    routeContext: 'triage',
    patientId: patientId ?? null,
  })

export const triageCaseFlag = (
  caseId: string,
  payload: { action: 'set' | 'clear'; severity?: 'critical' | 'warning' | 'info'; reason?: string },
  patientId?: string | null,
) =>
  requestClinicianJson<{ success?: boolean; data?: Record<string, unknown> }>({
    endpoint: `/api/clinician/triage/cases/${caseId}/flag`,
    method: 'POST',
    body: payload,
    routeContext: 'triage',
    patientId: patientId ?? null,
  })

export const triageCaseNote = (
  caseId: string,
  payload: { note: string },
  patientId?: string | null,
) =>
  requestClinicianJson<{ success?: boolean; data?: Record<string, unknown> }>({
    endpoint: `/api/clinician/triage/cases/${caseId}/note`,
    method: 'POST',
    body: payload,
    routeContext: 'triage',
    patientId: patientId ?? null,
  })

export const getAmyInsights = (patientId: string) =>
  requestClinicianJson<{
    success?: boolean
    data?: {
      conversations?: Array<{
        id: string
        timestamp: string
        channel: string
        summary: string
        messages: Array<{
          id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          created_at: string
        }>
      }>
    }
  }>({
    endpoint: `/api/clinician/patient/${patientId}/amy-insights`,
    method: 'GET',
    routeContext: 'patient-detail',
    patientId,
  })

export const getConsultNotes = (patientId: string) =>
  requestClinicianJson<{
    success?: boolean
    data?: {
      consultNotes?: Array<Record<string, unknown>>
      total?: number
      page?: number
      perPage?: number
    }
  }>({
    endpoint: `/api/clinician/consult-notes?patientId=${patientId}`,
    method: 'GET',
    routeContext: 'patient-detail',
    patientId,
  })

export const createConsultNote = (payload: {
  patientId: string
  organizationId: string
  content: Record<string, unknown>
}) =>
  requestClinicianJson<{
    success?: boolean
    data?: { consultNote?: Record<string, unknown> }
  }>({
    endpoint: '/api/clinician/consult-notes',
    method: 'POST',
    body: {
      patient_id: payload.patientId,
      organization_id: payload.organizationId,
      content: payload.content,
    },
    routeContext: 'patient-detail',
    patientId: payload.patientId,
  })

export const getConsultNote = (consultNoteId: string) =>
  requestClinicianJson<{
    success?: boolean
    data?: Record<string, unknown>
  }>({
    endpoint: `/api/clinician/consult-notes/${consultNoteId}`,
    method: 'GET',
    routeContext: 'patient-detail',
  })

export const getConsultNoteVersions = (consultNoteId: string) =>
  requestClinicianJson<{
    success?: boolean
    data?: Array<Record<string, unknown>>
  }>({
    endpoint: `/api/clinician/consult-notes/${consultNoteId}/versions`,
    method: 'GET',
    routeContext: 'patient-detail',
  })

export const updateConsultNote = (payload: {
  consultNoteId: string
  content: Record<string, unknown>
}) =>
  requestClinicianJson<{
    success?: boolean
    data?: { consultNote?: Record<string, unknown> }
  }>({
    endpoint: `/api/clinician/consult-notes/${payload.consultNoteId}`,
    method: 'PATCH',
    body: {
      content: payload.content,
    },
    routeContext: 'patient-detail',
  })

export const getAnamnesis = (patientId: string) =>
  requestClinicianJson<{
    success?: boolean
    data?: {
      entries?: Array<Record<string, unknown>>
      latestEntry?: Record<string, unknown> | null
      versions?: Array<Record<string, unknown>>
      suggestedFacts?: Array<Record<string, unknown>>
      patientOrganizationId?: string | null
    }
  }>({
    endpoint: `/api/clinician/patient/${patientId}/anamnesis`,
    method: 'GET',
    routeContext: 'patient-detail',
    patientId,
  })

export const getClinicalIntakeLatest = (patientId: string) =>
  requestClinicianJson<{
    success?: boolean
    intake?: Record<string, unknown> | null
  }>({
    endpoint: `/api/clinician/patient/${patientId}/clinical-intake/latest`,
    method: 'GET',
    routeContext: 'patient-detail',
    patientId,
  })

export const getClinicalIntakeHistory = (patientId: string, limit?: number) => {
  const params = typeof limit === 'number' ? `?limit=${encodeURIComponent(limit)}` : ''
  return requestClinicianJson<{
    success?: boolean
    intakes?: Array<Record<string, unknown>>
  }>({
    endpoint: `/api/clinician/patient/${patientId}/clinical-intake/history${params}`,
    method: 'GET',
    routeContext: 'patient-detail',
    patientId,
  })
}

export const getClinicalIntakeVersion = (patientId: string, versionNumber: number) =>
  requestClinicianJson<{
    success?: boolean
    intake?: Record<string, unknown> | null
  }>({
    endpoint: `/api/clinician/patient/${patientId}/intake/version/${versionNumber}`,
    method: 'GET',
    routeContext: 'patient-detail',
    patientId,
  })

export const updateClinicalIntakeOverride = (
  patientId: string,
  intakeId: string,
  payload: {
    override_level?: string | null
    override_action?: string | null
    reason: string
  },
) =>
  requestClinicianJson<{
    success?: boolean
    intake?: Record<string, unknown> | null
  }>({
    endpoint: `/api/clinician/patient/${patientId}/clinical-intake/${intakeId}/policy-override`,
    method: 'POST',
    body: payload,
    routeContext: 'patient-detail',
    patientId,
  })

export const getClinicalIntakeReviewLatest = (patientId: string, intakeId: string) =>
  requestClinicianJson<{
    success?: boolean
    review_state?: Record<string, unknown> | null
    audit?: Array<Record<string, unknown>>
  }>({
    endpoint: `/api/clinician/patient/${patientId}/clinical-intake/review/latest?intakeId=${encodeURIComponent(intakeId)}`,
    method: 'GET',
    routeContext: 'patient-detail',
    patientId,
  })

export const updateClinicalIntakeReview = (
  patientId: string,
  intakeId: string,
  payload: {
    status: 'draft' | 'in_review' | 'approved' | 'needs_more_info' | 'rejected'
    review_notes?: string
    requested_items?: string[]
  },
) =>
  requestClinicianJson<{
    success?: boolean
    review_state?: Record<string, unknown> | null
    audit?: Array<Record<string, unknown>>
  }>({
    endpoint: `/api/clinician/patient/${patientId}/clinical-intake/${intakeId}/review`,
    method: 'POST',
    body: payload,
    routeContext: 'patient-detail',
    patientId,
  })

export const postAnamnesis = (patientId: string, body: Record<string, unknown>) =>
  requestClinicianJson<{ success?: boolean }>({
    endpoint: `/api/clinician/patient/${patientId}/anamnesis`,
    method: 'POST',
    body,
    routeContext: 'patient-detail',
    patientId,
  })

export const getDiagnosisRuns = (patientId: string) =>
  requestClinicianJson<{
    success?: boolean
    data?:
      | {
          runs?: Array<Record<string, unknown>>
        }
      | Array<Record<string, unknown>>
  }>({
    endpoint: `/api/clinician/patient/${patientId}/diagnosis/runs`,
    method: 'GET',
    routeContext: 'patient-detail',
    patientId,
  })

export const getResults = (patientId: string) =>
  requestClinicianJson<{
    success?: boolean
    data?: {
      reports?: Array<Record<string, unknown>>
      calculatedResults?: Array<Record<string, unknown>>
      priorityRankings?: Array<Record<string, unknown>>
      reviewRecords?: Array<{ id: string }>
    }
    error?: unknown
  }>({
    endpoint: `/api/clinician/patient/${patientId}/results`,
    method: 'GET',
    routeContext: 'patient-detail',
    patientId,
  })
