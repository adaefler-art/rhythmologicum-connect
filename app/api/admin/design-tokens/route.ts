/**
 * Design Tokens API - GET endpoint
 * 
 * V05-I09.2: Fetch design token overrides for an organization
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  createServerSupabaseClient,
  getCurrentUser,
  hasClinicianRole,
} from '@/lib/db/supabase.server'

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID()
  
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      console.warn('[design-tokens-api][GET] Unauthorized access attempt', { requestId })
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }
    
    // Check if user has admin/clinician role
    const isAuthorized = await hasClinicianRole()
    if (!isAuthorized) {
      console.warn('[design-tokens-api][GET] Forbidden access attempt', { requestId, userId: user.id })
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin or clinician role required' } },
        { status: 403 }
      )
    }
    
    // Get organization_id from query params
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    
    // Build query
    let query = supabase
      .from('design_tokens')
      .select('*')
      .eq('is_active', true)
      .order('token_category')
      .order('token_key')
    
    // Filter by organization if provided
    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }
    
    const { data: tokens, error } = await query
    
    if (error) {
      console.error('[design-tokens-api][GET] Database error', { requestId, error })
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DATABASE_ERROR', message: 'Failed to fetch design tokens' },
        },
        { status: 500 }
      )
    }
    
    // Group tokens by category for easier consumption
    const tokensByCategory: Record<string, Record<string, any>> = {}
    
    // Type assertion needed until types are regenerated
    const tokenArray = (tokens || []) as any[]
    
    for (const token of tokenArray) {
      if (!tokensByCategory[token.token_category]) {
        tokensByCategory[token.token_category] = {}
      }
      tokensByCategory[token.token_category][token.token_key] = {
        id: token.id,
        value: token.token_value,
        organizationId: token.organization_id,
        createdAt: token.created_at,
        updatedAt: token.updated_at,
      }
    }
    
    console.log('[design-tokens-api][GET] Success', {
      requestId,
      userId: user.id,
      organizationId,
      tokenCount: tokens?.length || 0,
    })
    
    return NextResponse.json({
      success: true,
      data: {
        tokens: tokensByCategory,
        rawTokens: tokens,
      },
    })
  } catch (err) {
    console.error('[design-tokens-api][GET] Unexpected error', { requestId, error: err })
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    )
  }
}

/**
 * Design Tokens API - POST endpoint
 * 
 * V05-I09.2: Create or update design token overrides
 */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      console.warn('[design-tokens-api][POST] Unauthorized access attempt', { requestId })
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }
    
    // Check if user has admin/clinician role
    const isAuthorized = await hasClinicianRole()
    if (!isAuthorized) {
      console.warn('[design-tokens-api][POST] Forbidden access attempt', { requestId, userId: user.id })
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin or clinician role required' } },
        { status: 403 }
      )
    }
    
    // Parse request body
    const body = await request.json()
    const { organization_id, token_category, token_key, token_value, is_active = true } = body
    
    // Validate required fields
    if (!token_category || !token_key || !token_value) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' },
        },
        { status: 400 }
      )
    }
    
    // Validate token category
    const validCategories = ['spacing', 'typography', 'radii', 'shadows', 'motion', 'colors', 'componentTokens', 'layout']
    if (!validCategories.includes(token_category)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid token category' },
        },
        { status: 400 }
      )
    }
    
    // Upsert token
    const { data: token, error } = await supabase
      .from('design_tokens')
      .upsert(
        {
          organization_id,
          token_category,
          token_key,
          token_value,
          is_active,
          created_by: user.id,
          updated_at: new Date().toISOString(),
        } as any,
        {
          onConflict: 'organization_id,token_category,token_key',
        }
      )
      .select()
      .single()
    
    if (error) {
      console.error('[design-tokens-api][POST] Database error', { requestId, error })
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DATABASE_ERROR', message: 'Failed to save design token' },
        },
        { status: 500 }
      )
    }
    
    console.log('[design-tokens-api][POST] Success', {
      requestId,
      userId: user.id,
      tokenId: token.id,
      organizationId: organization_id,
    })
    
    return NextResponse.json({
      success: true,
      data: { token },
    })
  } catch (err) {
    console.error('[design-tokens-api][POST] Unexpected error', { requestId, error: err })
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    )
  }
}
