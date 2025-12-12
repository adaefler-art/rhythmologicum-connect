import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * B7 API Endpoint: Get funnel details with steps and questions
 * GET /api/admin/funnels/[id]
 * 
 * Returns complete funnel structure with all steps and questions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check authentication and authorization
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = user.app_metadata?.role || user.user_metadata?.role
    // Allow access for clinician and admin roles
    const hasAccess = role === 'clinician' || role === 'admin'
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Use service role for admin operations
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase configuration missing')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const adminClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })

    // Fetch funnel
    const { data: funnel, error: funnelError } = await adminClient
      .from('funnels')
      .select('*')
      .eq('id', id)
      .single()

    if (funnelError || !funnel) {
      return NextResponse.json({ error: 'Funnel not found' }, { status: 404 })
    }

    // Fetch funnel steps
    const { data: steps, error: stepsError } = await adminClient
      .from('funnel_steps')
      .select('*')
      .eq('funnel_id', id)
      .order('order_index', { ascending: true })

    if (stepsError) {
      console.error('Error fetching steps:', stepsError)
      return NextResponse.json({ error: 'Failed to fetch steps' }, { status: 500 })
    }

    // For each step, fetch questions and content pages
    const stepsWithQuestions = await Promise.all(
      (steps || []).map(async (step) => {
        // Fetch content page if this is a content_page step
        let contentPage = null
        if (step.type === 'content_page' && step.content_page_id) {
          const { data: cpData } = await adminClient
            .from('content_pages')
            .select('id, slug, title, excerpt, status')
            .eq('id', step.content_page_id)
            .single()
          contentPage = cpData
        }

        const { data: stepQuestions, error: stepQuestionsError } = await adminClient
          .from('funnel_step_questions')
          .select('*')
          .eq('funnel_step_id', step.id)
          .order('order_index', { ascending: true })

        if (stepQuestionsError) {
          console.error('Error fetching step questions:', stepQuestionsError)
          return { ...step, questions: [], content_page: contentPage }
        }

        const questionIds = (stepQuestions || []).map((sq) => sq.question_id)

        if (questionIds.length === 0) {
          return { ...step, questions: [], content_page: contentPage }
        }

        const { data: questions, error: questionsError } = await adminClient
          .from('questions')
          .select('*')
          .in('id', questionIds)

        if (questionsError) {
          console.error('Error fetching questions:', questionsError)
          return { ...step, questions: [], content_page: contentPage }
        }

        // Combine questions with metadata
        const questionsWithMeta = (stepQuestions || [])
          .map((sq) => {
            const question = (questions || []).find((q) => q.id === sq.question_id)
            if (!question) return null

            return {
              ...question,
              funnel_step_question_id: sq.id,
              is_required: sq.is_required,
              order_index: sq.order_index,
            }
          })
          .filter((q) => q !== null)

        return {
          ...step,
          questions: questionsWithMeta,
          content_page: contentPage,
        }
      })
    )

    return NextResponse.json({
      funnel,
      steps: stepsWithQuestions,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/funnels/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * B7 API Endpoint: Update funnel is_active status or content fields
 * PATCH /api/admin/funnels/[id]
 * 
 * Body: { is_active?: boolean, title?: string, subtitle?: string, description?: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check authentication and authorization
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = user.app_metadata?.role || user.user_metadata?.role
    // Allow access for clinician and admin roles
    const hasAccess = role === 'clinician' || role === 'admin'
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (typeof body.is_active === 'boolean') {
      updateData.is_active = body.is_active
    }
    if (typeof body.title === 'string') {
      const trimmedTitle = body.title.trim()
      if (trimmedTitle.length === 0) {
        return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 })
      }
      if (trimmedTitle.length > 255) {
        return NextResponse.json({ error: 'Title too long (max 255 characters)' }, { status: 400 })
      }
      updateData.title = trimmedTitle
    }
    if (typeof body.subtitle === 'string') {
      const trimmedSubtitle = body.subtitle.trim()
      if (trimmedSubtitle.length > 500) {
        return NextResponse.json({ error: 'Subtitle too long (max 500 characters)' }, { status: 400 })
      }
      updateData.subtitle = trimmedSubtitle || null
    }
    if (typeof body.description === 'string') {
      const trimmedDescription = body.description.trim()
      if (trimmedDescription.length > 2000) {
        return NextResponse.json({ error: 'Description too long (max 2000 characters)' }, { status: 400 })
      }
      updateData.description = trimmedDescription || null
    }

    // Use service role for admin operations
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase configuration missing')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const adminClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })

    // Update funnel
    const { data, error } = await adminClient
      .from('funnels')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating funnel:', error)
      return NextResponse.json({ error: 'Failed to update funnel' }, { status: 500 })
    }

    return NextResponse.json({ funnel: data })
  } catch (error) {
    console.error('Error in PATCH /api/admin/funnels/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
