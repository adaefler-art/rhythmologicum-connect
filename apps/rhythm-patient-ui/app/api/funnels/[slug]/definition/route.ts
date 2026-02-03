import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { env } from '@/lib/env'
import { getCanonicalFunnelSlug } from '@/lib/contracts/registry'
import { loadFunnelWithClient, loadFunnelVersionWithClient } from '@/lib/funnels/loadFunnelVersion'
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
  _request: NextRequest,
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

    if (!slug) {
      return NextResponse.json({ error: 'Funnel slug is required' }, { status: 400 })
    }

    const effectiveSlug = getCanonicalFunnelSlug(slug)

    const supabase = (await createServerSupabaseClient()) as any

    const catalogFunnel = await loadFunnelWithClient(supabase, effectiveSlug)

    if (catalogFunnel) {
      let steps: StepDefinition[] = []
      let totalQuestions = 0

      try {
        const loadedVersion = await loadFunnelVersionWithClient(supabase, effectiveSlug)
        const questionnaireSteps = loadedVersion.manifest.questionnaire_config.steps

        steps = questionnaireSteps.map((step, stepIndex): StepDefinition => {
          const questions: QuestionDefinition[] = step.questions.map((q, questionIndex) => ({
            id: q.id,
            key: q.key,
            label: q.label,
            helpText: q.helpText ?? null,
            questionType: q.type,
            minValue: q.minValue ?? null,
            maxValue: q.maxValue ?? null,
            isRequired: q.required ?? false,
            orderIndex: questionIndex,
            options: q.options ?? null,
          }))

          totalQuestions += questions.length

          return {
            id: step.id,
            orderIndex: stepIndex,
            title: step.title,
            description: step.description ?? null,
            type: 'question_step',
            questions,
          } as QuestionStepDefinition
        })
      } catch {
        steps = []
        totalQuestions = 0
      }

      const funnelDefinition: FunnelDefinition = {
        id: catalogFunnel.id,
        slug: catalogFunnel.slug,
        title: catalogFunnel.title,
        subtitle: null,
        description: catalogFunnel.description,
        theme: null,
        steps,
        totalSteps: steps.length,
        totalQuestions,
        isActive: catalogFunnel.isActive,
      }

      return NextResponse.json(funnelDefinition, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      })
    }

    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .select('id, slug, title, subtitle, description, default_theme, is_active')
      .eq('slug', effectiveSlug)
      .single()

    if (funnelError || !funnel) {
      return NextResponse.json({ error: 'Funnel not found' }, { status: 404 })
    }

    const { data: steps, error: stepsError } = await supabase
      .from('funnel_steps')
      .select('id, funnel_id, order_index, title, description, type, content_page_id')
      .eq('funnel_id', funnel.id)
      .order('order_index', { ascending: true })

    let resolvedSteps: RawStep[] = (steps || []) as RawStep[]

    if (stepsError) {
      if (stepsError.code === '42703') {
        console.warn(
          'content_page_id missing on funnel_steps, retrying without column (run migration 20251212204909)',
        )
        const { data: fallbackSteps, error: fallbackError } = await supabase
          .from('funnel_steps')
          .select('id, funnel_id, order_index, title, description, type')
          .eq('funnel_id', funnel.id)
          .order('order_index', { ascending: true })

        if (fallbackError) {
          console.error('Error fetching steps (fallback):', fallbackError)
          return NextResponse.json({ error: 'Error loading funnel steps' }, { status: 500 })
        }

        resolvedSteps = (fallbackSteps || []) as RawStep[]
      } else {
        console.error('Error fetching steps:', stepsError)
        return NextResponse.json({ error: 'Error loading funnel steps' }, { status: 500 })
      }
    }

    const stepsWithQuestions: StepDefinition[] = await Promise.all(
      (resolvedSteps || []).map(async (step): Promise<StepDefinition> => {
        const stepType = (step.type || '').toLowerCase()
        const contentPageId = step.content_page_id || null

        if (stepType === 'question_step' || stepType === 'form') {
          const { data: stepQuestions, error: stepQuestionsError } = await supabase
            .from('funnel_step_questions')
            .select('question_id, is_required, order_index')
            .eq('funnel_step_id', step.id)
            .order('order_index', { ascending: true })

          if (stepQuestionsError) {
            console.error('Error fetching step questions:', stepQuestionsError)
            throw stepQuestionsError
          }

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
        } else if (stepType === 'info_step' || stepType === 'info') {
          return {
            id: step.id,
            orderIndex: step.order_index,
            title: step.title,
            description: step.description,
            type: stepType as 'info_step' | 'info',
            content: step.description || '',
          } as InfoStepDefinition
        } else if (stepType === 'content_page') {
          const contentPageResult = contentPageId
            ? await supabase
                .from('content_pages')
                .select('id, slug, title, excerpt, body_markdown, status')
                .eq('id', contentPageId)
                .single()
            : null

          if (contentPageResult?.error?.code === '42703') {
            console.warn(
              'content_pages.body_markdown missing, retrying with minimal fields (run migration)',
            )
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

        return {
          id: step.id,
          orderIndex: step.order_index,
          title: step.title,
          description: step.description,
          type: stepType as 'summary' | 'other',
        } as OtherStepDefinition
      }),
    )

    const totalQuestions = stepsWithQuestions.reduce((total, step) => {
      if ('questions' in step) {
        return total + step.questions.length
      }
      return total
    }, 0)

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

    return NextResponse.json(funnelDefinition, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Error building funnel definition:', error)

    const isDev = env.NODE_ENV !== 'production'
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