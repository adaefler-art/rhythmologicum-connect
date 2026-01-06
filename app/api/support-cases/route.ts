/**
 * Support Cases API - V05-I08.4
 * 
 * Manage support cases with escalation workflow
 * Auth: patient/nurse/clinician/admin
 * 
 * POST /api/support-cases - Create a new support case
 * GET /api/support-cases - List support cases with optional filters
 * 
 * Security:
 * - organization_id set server-side (not client-trusted)
 * - Audit logs are PHI-free (no subject/description/notes)
 * - RLS enforces multi-tenant isolation
 * - Patients can only see/create their own cases
 * - Staff can see all cases in their organization
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import {
  CreateSupportCaseRequestSchema,
  SupportCaseFiltersSchema,
  SUPPORT_CASE_STATUS,
  SUPPORT_CASE_PRIORITY,
  SUPPORT_CASE_CATEGORY,
} from '@/lib/contracts/supportCase'
import { logSupportCaseCreated } from '@/lib/audit/log'

type ServerSupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

/**
 * Get user's organization ID server-side (never trust client)
 */
async function getUserOrgId(
  supabase: ServerSupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_org_membership')
    .select('organization_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    console.error('[support-cases] Failed to get user org:', error)
    return null
  }

  return data.organization_id
}

/**
 * Get patient profile ID from user ID
 */
async function getPatientProfileId(
  supabase: ServerSupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('patient_profiles')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    console.error('[support-cases] Failed to get patient profile:', error)
    return null
  }

  return data.id
}

/**
 * POST /api/support-cases - Create a new support case
 */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
    // Auth check FIRST (401 before parsing body)
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'User must be authenticated',
          },
        },
        { status: 401 },
      )
    }

    const userRole = user.app_metadata?.role

    // Parse and validate request body
    const body = await request.json()

    const requestParse = CreateSupportCaseRequestSchema.safeParse(body)
    if (!requestParse.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request format',
            details: requestParse.error.issues,
          },
        },
        { status: 422 },
      )
    }

    const caseRequest = requestParse.data

    // Get organization_id SERVER-SIDE (never trust client)
    const organizationId = await getUserOrgId(supabase, user.id)
    if (!organizationId && userRole && ['clinician', 'admin', 'nurse'].includes(userRole)) {
      // Staff users must have an organization
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'User not associated with an organization',
          },
        },
        { status: 403 },
      )
    }

    // For patients creating their own support cases, verify they're creating for themselves
    if (userRole === 'patient' || !userRole) {
      const patientProfileId = await getPatientProfileId(supabase, user.id)
      if (!patientProfileId || patientProfileId !== caseRequest.patient_id) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Patients can only create support cases for themselves',
            },
          },
          { status: 403 },
        )
      }
    }

    // Create support case record with org_id set server-side (RLS enforced)
    const { data: supportCase, error: insertError } = await supabase
      .from('support_cases')
      .insert({
        organization_id: organizationId,
        patient_id: caseRequest.patient_id,
        created_by_user_id: user.id,
        category: caseRequest.category ?? SUPPORT_CASE_CATEGORY.GENERAL,
        priority: caseRequest.priority ?? SUPPORT_CASE_PRIORITY.MEDIUM,
        status: SUPPORT_CASE_STATUS.OPEN,
        subject: caseRequest.subject,
        description: caseRequest.description ?? null,
        metadata: (caseRequest.metadata ?? {}) as never,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[support-cases] Insert error:', insertError, 'requestId:', requestId)

      // Check for specific error types
      if (insertError.code === '23503') {
        // Foreign key violation
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_REFERENCE',
              message: 'Referenced patient does not exist',
            },
          },
          { status: 422 },
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to create support case',
          },
        },
        { status: 500 },
      )
    }

    // Log audit event (PHI-free)
    await logSupportCaseCreated({
      org_id: organizationId ?? undefined,
      actor_user_id: user.id,
      actor_role: userRole,
      support_case_id: supportCase.id,
      patient_id: caseRequest.patient_id,
      category: supportCase.category,
      priority: supportCase.priority,
    })

    console.log('[support-cases] Created successfully:', {
      support_case_id: supportCase.id,
      patient_id: caseRequest.patient_id,
      category: supportCase.category,
      priority: supportCase.priority,
      requestId,
    })

    return NextResponse.json(
      {
        success: true,
        data: supportCase,
      },
      { status: 201 },
    )
  } catch (err) {
    console.error('[support-cases] Unexpected error:', err, 'requestId:', requestId)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 },
    )
  }
}

/**
 * GET /api/support-cases - List support cases with optional filters
 */
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
    // Auth check
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'User must be authenticated',
          },
        },
        { status: 401 },
      )
    }

    const userRole = user.app_metadata?.role

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const filters = {
      patient_id: searchParams.get('patient_id') || undefined,
      organization_id: searchParams.get('organization_id') || undefined,
      assigned_to_user_id: searchParams.get('assigned_to_user_id') || undefined,
      category: searchParams.get('category') || undefined,
      priority: searchParams.get('priority') || undefined,
      status: searchParams.get('status') || undefined,
      is_escalated: searchParams.get('is_escalated') === 'true' ? true : undefined,
    }

    const filtersParse = SupportCaseFiltersSchema.safeParse(filters)
    if (!filtersParse.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid filter parameters',
            details: filtersParse.error.issues,
          },
        },
        { status: 422 },
      )
    }

    const validFilters = filtersParse.data

    // Build query - RLS will enforce access control
    let query = supabase
      .from('support_cases')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (validFilters.patient_id) {
      query = query.eq('patient_id', validFilters.patient_id)
    }
    if (validFilters.organization_id) {
      query = query.eq('organization_id', validFilters.organization_id)
    }
    if (validFilters.assigned_to_user_id) {
      query = query.eq('assigned_to_user_id', validFilters.assigned_to_user_id)
    }
    if (validFilters.category) {
      query = query.eq('category', validFilters.category)
    }
    if (validFilters.priority) {
      query = query.eq('priority', validFilters.priority)
    }
    if (validFilters.status) {
      query = query.eq('status', validFilters.status)
    }
    if (validFilters.is_escalated !== undefined) {
      if (validFilters.is_escalated) {
        query = query.not('escalated_task_id', 'is', null)
      } else {
        query = query.is('escalated_task_id', null)
      }
    }

    const { data: supportCases, error: selectError } = await query

    if (selectError) {
      console.error('[support-cases] Select error:', selectError, 'requestId:', requestId)

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to retrieve support cases',
          },
        },
        { status: 500 },
      )
    }

    console.log('[support-cases] Retrieved successfully:', {
      count: supportCases?.length ?? 0,
      filters: validFilters,
      requestId,
    })

    return NextResponse.json(
      {
        success: true,
        data: supportCases ?? [],
      },
      { status: 200 },
    )
  } catch (err) {
    console.error('[support-cases] Unexpected error:', err, 'requestId:', requestId)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 },
    )
  }
}
