import { appendAskedQuestionIds, generateFollowupQuestions } from '@/lib/cre/followup/generator'
import { validateClinicalFollowup } from '@/lib/cre/followup/schema'

describe('followup generator', () => {
  it('generates deterministic max-3 questions without duplicates and valid schema', () => {
    const structuredData = {
      status: 'draft' as const,
      chief_complaint: 'Herzrasen',
      history_of_present_illness: {
        onset: 'gestern',
      },
      reasoning: {
        risk_estimation: {
          score: 4,
          level: 'medium' as const,
          components: {
            verified_red_flags: 0,
            chronicity_signal: 1,
            anxiety_signal: 1,
          },
        },
        differentials: [
          {
            label: 'Panic-like autonomic episode',
            likelihood: 'medium' as const,
            matched_triggers: ['angst'],
            base_likelihood: 'medium' as const,
          },
        ],
        open_questions: [
          {
            condition_label: 'Panic-like autonomic episode',
            text: 'Wann treten die Episoden auf?',
            priority: 1 as const,
          },
          {
            condition_label: 'Panic-like autonomic episode',
            text: 'Wann treten die Episoden auf?',
            priority: 1 as const,
          },
          {
            condition_label: 'Panic-like autonomic episode',
            text: 'Wie lange dauern die Episoden?',
            priority: 2 as const,
          },
        ],
        recommended_next_steps: [],
        uncertainties: [],
      },
      followup: {
        next_questions: [],
        asked_question_ids: ['reasoning:panic-like-autonomic-episode:wann-treten-die-episoden-auf'],
        last_generated_at: '2026-02-13T00:00:00.000Z',
      },
    }

    const generated = generateFollowupQuestions({
      structuredData,
      now: new Date('2026-02-13T10:00:00.000Z'),
    })

    const questionIds = generated.next_questions.map((entry) => entry.id)
    expect(questionIds.length).toBeLessThanOrEqual(3)
    expect(new Set(questionIds).size).toBe(questionIds.length)
    expect(questionIds).not.toContain(
      'reasoning:panic-like-autonomic-episode:wann-treten-die-episoden-auf',
    )

    const validation = validateClinicalFollowup(generated)
    expect(validation.ok).toBe(true)
  })

  it('falls back to gap rules when reasoning is missing', () => {
    const structuredData = {
      status: 'draft' as const,
      chief_complaint: '',
      history_of_present_illness: {},
      medication: [],
      psychosocial_factors: [],
    }

    const withAsked = appendAskedQuestionIds({
      structuredData,
      askedQuestionIds: ['gap:chief-complaint'],
    })

    const generated = generateFollowupQuestions({
      structuredData: withAsked,
      now: new Date('2026-02-13T10:00:00.000Z'),
    })

    expect(generated.next_questions.length).toBeGreaterThan(0)
    expect(generated.next_questions.every((entry) => entry.source === 'gap_rule')).toBe(true)
    expect(generated.next_questions.some((entry) => entry.id === 'gap:chief-complaint')).toBe(false)
  })
})
