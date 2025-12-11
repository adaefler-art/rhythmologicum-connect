import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type {
  FunnelDefinition,
  QuestionDefinition,
  StepDefinition,
  QuestionStepDefinition,
  InfoStepDefinition,
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
    const effectiveSlug =
      slug === 'stress' || slug === 'stress-check' || slug === 'stress-check-v2'
        ? 'stress-assessment'
        : slug

    if (!slug) {
      return NextResponse.json({ error: 'Funnel slug is required' }, { status: 400 })
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase configuration missing')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 },
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })

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
      .select('id, funnel_id, order_index, title, description, type')
      .eq('funnel_id', funnel.id)
      .order('order_index', { ascending: true })

    if (stepsError) {
      console.error('Error fetching steps:', stepsError)
      return NextResponse.json(
        { error: 'Error loading funnel steps' },
        { status: 500 },
      )
    }

    // 3. For each step, fetch associated questions
    const stepsWithQuestions: StepDefinition[] = await Promise.all(
      (steps || []).map(async (step): Promise<StepDefinition> => {
        const stepType = step.type.toLowerCase()

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
    console.error('Error building funnel definition:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
