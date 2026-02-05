/**
 * Clinician AMY Insights API
 *
 * GET /api/clinician/patient/[patientId]/amy-insights
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient, hasClinicianRole } from '@/lib/db/supabase.server'
import { ErrorCode } from '@/lib/api/responseTypes'

type RouteContext = {
  params: Promise<{ patientId: string }>
}

type AmyMessage = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
  metadata: Record<string, unknown> | null
}

type Conversation = {
  id: string
  timestamp: string
  channel: 'AMY Chat'
  summary: string
  messages: AmyMessage[]
}

const MAX_MESSAGES = 200

const getCorrelationId = (metadata: Record<string, unknown> | null): string | null => {
  if (!metadata) return null
  const value = metadata.correlationId
  if (typeof value === 'string' && value.trim().length > 0) return value
  return null
}

const truncateSummary = (value: string, maxLength: number) => {
  if (value.length <= maxLength) return value
  return `${value.slice(0, Math.max(0, maxLength - 1)).trim()}…`
}

const buildConversations = (messages: AmyMessage[]): Conversation[] => {
  const grouped = new Map<string, AmyMessage[]>()

  messages.forEach((message) => {
    const correlationId = getCorrelationId(message.metadata)
    const fallbackKey = `unknown-${message.created_at.split('T')[0] ?? 'thread'}`
    const key = correlationId ?? fallbackKey
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(message)
  })

  const conversations: Conversation[] = []

  grouped.forEach((groupMessages, key) => {
    const sorted = [...groupMessages].sort((a, b) => a.created_at.localeCompare(b.created_at))
    const lastMessage = sorted[sorted.length - 1]
    const assistantMessage = [...sorted].reverse().find((item) => item.role === 'assistant')
    const summarySource = assistantMessage?.content || lastMessage?.content || ''

    conversations.push({
      id: key,
      timestamp: lastMessage?.created_at ?? sorted[0]?.created_at ?? new Date().toISOString(),
      channel: 'AMY Chat',
      summary: truncateSummary(summarySource, 140),
      messages: sorted,
    })
  })

  return conversations.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { patientId } = await context.params
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.UNAUTHORIZED, message: 'Authentication required' },
        },
        { status: 401 },
      )
    }

    const isClinician = await hasClinicianRole()
    if (!isClinician) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.FORBIDDEN, message: 'Clinician or admin role required' },
        },
        { status: 403 },
      )
    }

    const { data: patient, error: patientError } = await supabase
      .from('patient_profiles')
      .select('id, user_id')
      .eq('id', patientId)
      .maybeSingle()

    if (patientError || !patient) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.NOT_FOUND, message: 'Patient not found' },
        },
        { status: 404 },
      )
    }

    const { data: messages, error: messageError } = await supabase
      .from('amy_chat_messages')
      .select('id, role, content, created_at, metadata')
      .eq('user_id', patient.user_id)
      .order('created_at', { ascending: true })
      .limit(MAX_MESSAGES)

    if (messageError) {
      console.error('[clinician/patient/amy-insights GET] Message error:', messageError)
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to fetch AMY messages' },
        },
        { status: 500 },
      )
    }

    const conversations = buildConversations((messages || []) as AmyMessage[])

    return NextResponse.json({
      success: true,
      data: {
        conversations,
      },
    })
  } catch (err) {
    console.error('[clinician/patient/amy-insights GET] Unexpected error:', err)
    return NextResponse.json(
      {
        success: false,
        error: { code: ErrorCode.INTERNAL_ERROR, message: 'An unexpected error occurred' },
      },
      { status: 500 },
    )
  }
}
