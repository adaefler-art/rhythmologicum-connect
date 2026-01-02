import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { env } from '@/lib/env'
import { getCanonicalFunnelSlug } from '@/lib/contracts/registry'
import type {
  FunnelDefinition,
  QuestionDefinition,
  StepDefinition,
  QuestionStepDefinition,
  InfoStepDefinition,
  ContentPageStepDefinition,
  OtherStepDefinition,
} from '@/lib/types/funnel'

/**
 * B1 API Endpoint: Funnel Definition from Database
 * 
 * Builds a complete funnel definition from database tables:
 * - funnels (meta: title, subtitle, description, theme)
 * - funnel_steps (step sequence & type via order_index, type, title, description)
 * - funnel_step_questions (question-to-step assignment)
 * - questions (question content & type)
 * 
 * Returns a structured FunnelDefinition consumable by desktop & mobile UI.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params

    type RawStep = {
      id: string
      funnel_id: string
      order_index: number
      title: string
      description: string | null
      type: string
      content_page_id?: string | null
    }

    // Use canonical funnel slug from registry
    const effectiveSlug = getCanonicalFunnelSlug(slug)

    if (!slug) {
      return NextResponse.json({ error: 'Funnel slug is required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // 1. Fetch funnel by slug - selective fields for performance
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .select('id, slug, title, subtitle, description, default_theme, is_active')
      .eq('slug', effectiveSlug)
      .single()

    if (funnelError) {
      console.error('Error fetching funnel:', funnelError)
      return NextResponse.json({ error: 'Funnel not found' }, { status: 404 })
    }

    if (!funnel) {
      return NextResponse.json({ error: 'Funnel not found' }, { status: 404 })
    }

    // 2. Fetch funnel steps ordered by order_index - selective fields for performance
    const { data: steps, error: stepsError } = await supabase
      .from('funnel_steps')
      .select('id, funnel_id, order_index, title, description, type, content_page_id')
      .eq('funnel_id', funnel.id)
      .order('order_index', { ascending: true })

    let resolvedSteps: RawStep[] = (steps || []) as RawStep[]

    if (stepsError) {
      if (stepsError.code === '42703') {
        console.warn('content_page_id missing on funnel_steps, retrying without column (run migration 20251212204909)')
        const { data: fallbackSteps, error: fallbackError } = await supabase
          .from('funnel_steps')
          .select('id, funnel_id, order_index, title, description, type')
          .eq('funnel_id', funnel.id)
          .order('order_index', { ascending: true })

        if (fallbackError) {
          console.error('Error fetching steps (fallback):', fallbackError)
          return NextResponse.json(
            { error: 'Error loading funnel steps' },
            { status: 500 },
          )
        }

        resolvedSteps = (fallbackSteps || []) as RawStep[]
      } else {
        console.error('Error fetching steps:', stepsError)
        return NextResponse.json(
          { error: 'Error loading funnel steps' },
          { status: 500 },
        )
      }
    }

    // 3. For each step, fetch associated questions
    const stepsWithQuestions: StepDefinition[] = await Promise.all(
      (resolvedSteps || []).map(async (step): Promise<StepDefinition> => {
        const stepType = (step.type || '').toLowerCase()
        const contentPageId = step.content_page_id || null

        // For question steps, fetch questions
        if (stepType === 'question_step' || stepType === 'form') {
          // Fetch funnel_step_questions join table - selective fields
          const { data: stepQuestions, error: stepQuestionsError } = await supabase
            .from('funnel_step_questions')
            .select('question_id, is_required, order_index')
            .eq('funnel_step_id', step.id)
            .order('order_index', { ascending: true })

          if (stepQuestionsError) {
            console.error('Error fetching step questions:', stepQuestionsError)
            throw stepQuestionsError
          }

          // Fetch actual questions
          const questionIds = (stepQuestions || []).map((sq) => sq.question_id)
          
          let questions: QuestionDefinition[] = []
          
          if (questionIds.length > 0) {
            const { data: questionsData, error: questionsError } = await supabase
              .from('questions')
              .select('id, key, label, help_text, question_type, min_value, max_value')
              .in('id', questionIds)

            if (questionsError) {
              console.error('Error fetching questions:', questionsError)
              throw questionsError
            }

            // Combine questions with their metadata from funnel_step_questions
            questions = (stepQuestions || [])
              .map((sq) => {
                const question = (questionsData || []).find((q) => q.id === sq.question_id)
                if (!question) return null

                return {
                  id: question.id,
                  key: question.key,
                  label: question.label,
                  helpText: question.help_text,
                  questionType: question.question_type,
                  minValue: question.min_value,
                  maxValue: question.max_value,
                  isRequired: sq.is_required,
                  orderIndex: sq.order_index,
                } as QuestionDefinition
              })
              .filter((q): q is QuestionDefinition => q !== null)
          }

          return {
            id: step.id,
            orderIndex: step.order_index,
            title: step.title,
            description: step.description,
            type: stepType as 'question_step' | 'form',
            questions,
          } as QuestionStepDefinition
        } 
        
        // Info steps
        else if (stepType === 'info_step' || stepType === 'info') {
          return {
            id: step.id,
            orderIndex: step.order_index,
            title: step.title,
            description: step.description,
            type: stepType as 'info_step' | 'info',
            content: step.description || '',
          } as InfoStepDefinition
        } 
        
        // Content page steps
        else if (stepType === 'content_page') {
          // Fetch the content page data
          const contentPageResult = contentPageId
            ? await supabase
                .from('content_pages')
                .select('id, slug, title, excerpt, body_markdown, status')
                .eq('id', contentPageId)
                .single()
            : null

          if (contentPageResult?.error?.code === '42703') {
            console.warn('content_pages.body_markdown missing, retrying with minimal fields (run migration)')
            const fallbackContent = await supabase
              .from('content_pages')
              .select('id, slug, title, excerpt, status')
              .eq('id', contentPageId || '')
              .single()

            if (fallbackContent.error) {
              console.error('Error fetching content page (fallback):', fallbackContent.error)
              throw fallbackContent.error
            }

            return {
              id: step.id,
              orderIndex: step.order_index,
              title: step.title,
              description: step.description,
              type: 'content_page',
              contentPageId: contentPageId || '',
              contentPage: fallbackContent.data,
            } as ContentPageStepDefinition
          }

          return {
            id: step.id,
            orderIndex: step.order_index,
            title: step.title,
            description: step.description,
            type: 'content_page',
            contentPageId: contentPageId || '',
            contentPage: contentPageResult?.data || undefined,
          } as ContentPageStepDefinition
        }
        
        // Other step types (summary, etc.)
        else {
          return {
            id: step.id,
            orderIndex: step.order_index,
            title: step.title,
            description: step.description,
            type: stepType as 'summary' | 'other',
          } as OtherStepDefinition
        }
      }),
    )

    // 4. Calculate totals
    const totalQuestions = stepsWithQuestions.reduce((total, step) => {
      if ('questions' in step) {
        return total + step.questions.length
      }
      return total
    }, 0)

    // 5. Build final funnel definition
    const funnelDefinition: FunnelDefinition = {
      id: funnel.id,
      slug: funnel.slug,
      title: funnel.title,
      subtitle: funnel.subtitle,
      description: funnel.description,
      theme: funnel.default_theme,
      steps: stepsWithQuestions,
      totalSteps: stepsWithQuestions.length,
      totalQuestions,
      isActive: funnel.is_active,
    }

    // Add cache headers for static funnel definitions (revalidate every 5 minutes)
    return NextResponse.json(funnelDefinition, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    // Log full error server-side for diagnostics
    console.error('Error building funnel definition:', error)

    const isDev = process.env.NODE_ENV !== 'production'
    const payload: { error: string; message: string; details?: string; stack?: string } = {
      error: 'Internal server error',
      message: 'Funnel konnte nicht geladen werden.',
    }
    if (isDev && error instanceof Error) {
      payload.details = error.message
      payload.stack = error.stack
    }

    return NextResponse.json(payload, { status: 500 })
  }
}
