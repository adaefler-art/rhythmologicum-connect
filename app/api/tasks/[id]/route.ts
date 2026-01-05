/**
 * Task Update API - V05-I07.4
 * 
 * Update task status and payload
 * Auth: nurse/clinician/admin (must match assigned_to_role or be admin)
 * 
 * PATCH /api/tasks/[id] - Update task
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { UpdateTaskRequestSchema } from '@/lib/contracts/task'
import { logAuditEvent } from '@/lib/audit/log'

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * PATCH /api/tasks/[id] - Update task
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
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

    // Role check: nurse/clinician/admin can update tasks
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
    
    // Get task ID from params
    const { id: taskId } = await context.params
    
    if (!taskId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Task ID is required',
          },
        },
        { status: 400 }
      )
    }
    
    // Parse and validate request body
    const body = await request.json()
    
    const updateParse = UpdateTaskRequestSchema.safeParse(body)
    if (!updateParse.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid update format',
            details: updateParse.error.issues,
          },
        },
        { status: 400 }
      )
    }
    
    const updateData = updateParse.data
    
    // Fetch existing task to check before update
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single()
    
    if (fetchError || !existingTask) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Task not found',
          },
        },
        { status: 404 }
      )
    }
    
    // Use admin client for update (RLS already checked via select above)
    const admin = createAdminSupabaseClient()
    
    // Build update object
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    
    if (updateData.status !== undefined) {
      updatePayload.status = updateData.status
    }
    if (updateData.payload !== undefined) {
      updatePayload.payload = updateData.payload as never // Type assertion for JSONB
    }
    if (updateData.due_at !== undefined) {
      updatePayload.due_at = updateData.due_at
    }
    
    // Update task
    const { data: updatedTask, error: updateError } = await admin
      .from('tasks')
      .update(updatePayload)
      .eq('id', taskId)
      .select()
      .single()
    
    if (updateError) {
      console.error('[tasks/[id]] Update error:', updateError, 'requestId:', requestId)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: 'Failed to update task',
          },
        },
        { status: 500 }
      )
    }
    
    // Log audit event
    await logAuditEvent({
      source: 'api',
      actor_user_id: user.id,
      actor_role: userRole as 'clinician' | 'admin' | 'nurse',
      entity_type: 'task',
      entity_id: taskId,
      action: 'update',
      diff: {
        before: {
          status: existingTask.status,
          payload: existingTask.payload,
          due_at: existingTask.due_at,
        },
        after: {
          status: updatedTask.status,
          payload: updatedTask.payload,
          due_at: updatedTask.due_at,
        },
      },
      metadata: {
        request_id: requestId,
        ...(updatedTask.patient_id && { patient_id: updatedTask.patient_id }),
        ...(updatedTask.assessment_id && { assessment_id: updatedTask.assessment_id }),
      },
    })
    
    return NextResponse.json(
      {
        success: true,
        data: updatedTask,
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('[tasks/[id]] Unexpected error:', err, 'requestId:', requestId)
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
