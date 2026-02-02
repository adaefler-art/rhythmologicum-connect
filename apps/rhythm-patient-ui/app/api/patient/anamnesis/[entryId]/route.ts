/**
 * E75.2: Patient Anamnesis API - Get Single Entry
 * E75.3: Patient Anamnesis API - Update Entry (creates new version)
 * 
 * GET /api/patient/anamnesis/[entryId]
 * 
 * Returns a single anamnesis entry with full version history.
 * 
 * Security:
 * - Requires authentication
 * - RLS ensures patient can only see their own entries
 * - Returns 404 if entry not found or not accessible
 * 
 * Response Format:
 * {
 *   success: true,
 *   data: {
 *     entry: {
 *       id: string,
 *       title: string,
 *       content: object,
 *       entry_type: string | null,
 *       tags: string[],
 *       is_archived: boolean,
 *       created_at: string,
 *       updated_at: string
 *     },
 *     versions: Array<{
 *       id: string,
 *       version_number: number,
 *       title: string,
 *       content: object,
 *       changed_at: string,
 *       change_reason: string | null
 *     }>
 *   }
 * }
 * 
 * PATCH /api/patient/anamnesis/[entryId]
 * 
 * Updates an anamnesis entry. Database trigger automatically creates new version.
 * 
 * Request Body:
 * {
 *   title?: string,
 *   content?: object,
 *   entry_type?: string,
 *   tags?: string[],
 *   change_reason?: string
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     entry: { id, title, content, ... },
 *     new_version_number: number
 *   }
 * }
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { getAnamnesisEntry, getEntryVersions } from '@/lib/api/anamnesis/helpers'
import { ErrorCode } from '@/lib/api/responseTypes'
import { validateCreateVersion } from '@/lib/api/anamnesis/validation'
import type { Json } from '@/lib/types/supabase'
import { z } from 'zod'

type RouteContext = {
  params: Promise<{ entryId: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { entryId } = await context.params
    const supabase = await createServerSupabaseClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'Authentication required',
          },
        },
        { status: 401 }
      )
    }

    // Fetch entry (RLS will ensure it's patient's own entry)
    const entry = await getAnamnesisEntry(supabase, entryId)

    if (!entry) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Anamnesis entry not found',
          },
        },
        { status: 404 }
      )
    }

    // Fetch all versions
    const versions = await getEntryVersions(supabase, entryId)

    // Transform versions to include only necessary fields
    const transformedVersions = versions.map((v) => ({
      id: v.id,
      version_number: v.version_number,
      title: v.title,
      content: v.content,
      entry_type: v.entry_type,
      tags: v.tags,
      changed_at: v.changed_at,
      change_reason: v.change_reason,
      changed_by: v.changed_by,
    }))

    return NextResponse.json({
      success: true,
      data: {
        entry: {
          id: entry.id,
          title: entry.title,
          content: entry.content,
          entry_type: entry.entry_type,
          tags: entry.tags,
          is_archived: entry.is_archived,
          created_at: entry.created_at,
          updated_at: entry.updated_at,
          created_by: entry.created_by,
          updated_by: entry.updated_by,
        },
        versions: transformedVersions,
      },
    })
  } catch (err) {
    console.error('[patient/anamnesis/[entryId] GET] Unexpected error:', err)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { entryId } = await context.params
    const supabase = await createServerSupabaseClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'Authentication required',
          },
        },
        { status: 401 }
      )
    }

    // Fetch entry (RLS will ensure it's patient's own entry)
    const entry = await getAnamnesisEntry(supabase, entryId)

    if (!entry) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Anamnesis entry not found',
          },
        },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    let validatedData

    try {
      validatedData = validateCreateVersion(body)
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ErrorCode.VALIDATION_FAILED,
              message: 'Validation failed',
              details: err.issues,
            },
          },
          { status: 400 }
        )
      }
      throw err
    }

    // Update entry (trigger will create new version automatically)
    const { data: updatedEntry, error: updateError } = await supabase
      .from('anamnesis_entries')
      .update({
        title: validatedData.title,
        content: validatedData.content as Json,
        entry_type: validatedData.entry_type || null,
        tags: validatedData.tags || entry.tags,
        updated_by: user.id,
      })
      .eq('id', entryId)
      .select()
      .single()

    if (updateError) {
      console.error('[patient/anamnesis/[entryId] PATCH] Update error:', updateError)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: 'Failed to update anamnesis entry',
          },
        },
        { status: 500 }
      )
    }

    // Get the latest version number (created by trigger)
    const { data: latestVersion, error: versionError } = await supabase
      .from('anamnesis_entry_versions')
      .select('version_number')
      .eq('entry_id', entryId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    if (versionError) {
      console.error('[patient/anamnesis/[entryId] PATCH] Version fetch error:', versionError)
    }

    return NextResponse.json({
      success: true,
      data: {
        entry: updatedEntry,
        new_version_number: latestVersion?.version_number || null,
      },
    })
  } catch (err) {
    console.error('[patient/anamnesis/[entryId] PATCH] Unexpected error:', err)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    )
  }
}
