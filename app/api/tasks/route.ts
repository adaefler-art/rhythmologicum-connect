/**
 * Tasks API - V05-I07.4
 * 
 * Manage tasks with role-based assignment
 * Auth: clinician/admin/nurse
 * 
 * POST /api/tasks - Create a new task
 * GET /api/tasks - List tasks with optional filters
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { 
  CreateTaskRequestSchema,
  TaskFiltersSchema,
  TASK_STATUS,
} from '@/lib/contracts/task'
import { logAuditEvent } from '@/lib/audit/log'

/**
 * POST /api/tasks - Create a new task
 */
export async function POST(request: NextRequest) {
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
        { status: 401 }
      )
    }

    // Role check: only clinician/admin can create tasks
    const userRole = user.app_metadata?.role
    
    if (!userRole || !['clinician', 'admin'].includes(userRole)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
          },
        },
        { status: 403 }
      )
    }
    
    // Parse and validate request body
    const body = await request.json()
    
    const requestParse = CreateTaskRequestSchema.safeParse(body)
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
        { status: 400 }
      )
    }
    
    const taskRequest = requestParse.data
    
    // Use admin client for task creation (bypasses RLS for insert)
    const admin = createAdminSupabaseClient()
    
    // Create task record
    const { data: task, error: insertError } = await admin
      .from('tasks')
      .insert({
        patient_id: taskRequest.patient_id,
        assessment_id: taskRequest.assessment_id ?? null,
        created_by_role: userRole,
        assigned_to_role: taskRequest.assigned_to_role,
        task_type: taskRequest.task_type,
        payload: (taskRequest.payload ?? {}) as never,
        status: TASK_STATUS.PENDING,
        due_at: taskRequest.due_at ?? null,
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('[tasks] Insert error:', insertError, 'requestId:', requestId)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSERT_FAILED',
            message: 'Failed to create task',
          },
        },
        { status: 500 }
      )
    }
    
    // Log audit event
    await logAuditEvent({
      source: 'api',
      actor_user_id: user.id,
      actor_role: userRole as 'clinician' | 'admin',
      entity_type: 'task',
      entity_id: task.id,
      action: 'create',
      diff: {
        before: {},
        after: {
          task_type: task.task_type,
          assigned_to_role: task.assigned_to_role,
          status: task.status,
        },
      },
      metadata: {
        request_id: requestId,
        ...(task.patient_id && { patient_id: task.patient_id }),
        ...(task.assessment_id && { assessment_id: task.assessment_id }),
      },
    })
    
    return NextResponse.json(
      {
        success: true,
        data: task,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[tasks] Unexpected error:', err, 'requestId:', requestId)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/tasks - List tasks with optional filters
 */
export async function GET(request: NextRequest) {
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
        { status: 401 }
      )
    }

    // Role check: clinician/admin/nurse can view tasks
    const userRole = user.app_metadata?.role
    
    if (!userRole || !['clinician', 'admin', 'nurse'].includes(userRole)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
          },
        },
        { status: 403 }
      )
    }
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const filters = {
      patient_id: searchParams.get('patient_id') ?? undefined,
      assessment_id: searchParams.get('assessment_id') ?? undefined,
      assigned_to_role: searchParams.get('assigned_to_role') ?? undefined,
      task_type: searchParams.get('task_type') ?? undefined,
      status: searchParams.get('status') ?? undefined,
    }
    
    const filtersParse = TaskFiltersSchema.safeParse(filters)
    if (!filtersParse.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid filters',
            details: filtersParse.error.issues,
          },
        },
        { status: 400 }
      )
    }
    
    const validFilters = filtersParse.data
    
    // Build query with RLS - will automatically filter based on user's org and role
    let query = supabase
      .from('tasks')
      .select('*, patient_profiles!tasks_patient_id_fkey(id, full_name, user_id)')
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (validFilters.patient_id) {
      query = query.eq('patient_id', validFilters.patient_id)
    }
    if (validFilters.assessment_id) {
      query = query.eq('assessment_id', validFilters.assessment_id)
    }
    if (validFilters.assigned_to_role) {
      query = query.eq('assigned_to_role', validFilters.assigned_to_role)
    }
    if (validFilters.task_type) {
      query = query.eq('task_type', validFilters.task_type)
    }
    if (validFilters.status) {
      query = query.eq('status', validFilters.status)
    }
    
    const { data: tasks, error: queryError } = await query
    
    if (queryError) {
      console.error('[tasks] Query error:', queryError)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'QUERY_FAILED',
            message: 'Failed to fetch tasks',
          },
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      {
        success: true,
        data: tasks ?? [],
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('[tasks] Unexpected error:', err)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    )
  }
}
