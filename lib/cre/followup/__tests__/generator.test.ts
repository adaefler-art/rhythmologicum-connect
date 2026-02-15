import {
  appendAskedQuestionIds,
  generateFollowupQuestions,
  mergeClinicianRequestedItemsIntoFollowup,
  transitionFollowupLifecycle,
} from '@/lib/cre/followup/generator'
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
    expect(Array.isArray(generated.objectives)).toBe(true)
    expect(Array.isArray(generated.active_objective_ids)).toBe(true)
    expect(generated.active_objective_ids).toContain('objective:onset')
    expect(generated.active_objective_ids).toContain('objective:medication')
  })

  it('merges clinician requested items with dedupe and keeps max-3 in next_questions', () => {
    const structuredData = {
      status: 'draft' as const,
      followup: {
        next_questions: [
          {
            id: 'reasoning:foo:bar',
            question: 'Wie ist der Verlauf?',
            why: 'Offene Frage',
            priority: 2 as const,
            source: 'reasoning' as const,
          },
        ],
        asked_question_ids: [],
        last_generated_at: '2026-02-14T00:00:00.000Z',
      },
    }

    const merged = mergeClinicianRequestedItemsIntoFollowup({
      structuredData,
      requestedItems: ['Bitte aktuelle Medikation nennen', 'Bitte aktuelle Medikation nennen', 'Seit wann?', 'Trigger?'],
      now: new Date('2026-02-14T10:00:00.000Z'),
    })

    const followup = merged.followup
    expect(followup).toBeDefined()
    expect(followup?.next_questions.length).toBe(3)
    expect(followup?.queue?.length).toBeGreaterThanOrEqual(1)

    const ids = (followup?.next_questions ?? []).map((entry) => entry.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect((followup?.next_questions ?? []).every((entry) => entry.source === 'clinician_request')).toBe(true)
  })

  it('prioritizes clinician_request over reasoning and gap_rule in generated followups', () => {
    const structuredData = {
      status: 'draft' as const,
      chief_complaint: '',
      history_of_present_illness: {},
      reasoning: {
        risk_estimation: {
          score: 3,
          level: 'medium' as const,
          components: {
            verified_red_flags: 0,
            chronicity_signal: 1,
            anxiety_signal: 1,
          },
        },
        differentials: [],
        open_questions: [
          {
            condition_label: 'General',
            text: 'Wann genau traten die Symptome auf?',
            priority: 1 as const,
          },
        ],
        recommended_next_steps: [],
        uncertainties: [],
      },
      followup: {
        next_questions: [
          {
            id: 'clinician-request:bitte-medikation-erganzen',
            question: 'Bitte Medikation ergaenzen?',
            why: 'Rueckfrage aus aerztlicher Pruefung',
            priority: 1 as const,
            source: 'clinician_request' as const,
          },
        ],
        queue: [],
        asked_question_ids: [],
        last_generated_at: '2026-02-14T00:00:00.000Z',
      },
    }

    const generated = generateFollowupQuestions({
      structuredData,
      now: new Date('2026-02-14T12:00:00.000Z'),
    })

    expect(generated.next_questions.length).toBeGreaterThan(0)
    expect(generated.next_questions[0].source).toBe('clinician_request')
  })

  it('deduplicates semantically identical questions across different IDs', () => {
    const structuredData = {
      status: 'draft' as const,
      chief_complaint: '',
      history_of_present_illness: {},
      reasoning: {
        risk_estimation: {
          score: 2,
          level: 'low' as const,
          components: {
            verified_red_flags: 0,
            chronicity_signal: 0,
            anxiety_signal: 0,
          },
        },
        differentials: [],
        open_questions: [
          {
            condition_label: 'General',
            text: 'Nehmen Sie aktuell Medikamente oder relevante Nahrungsergaenzungsmittel ein?',
            priority: 3 as const,
          },
        ],
        recommended_next_steps: [],
        uncertainties: [],
      },
      followup: {
        next_questions: [
          {
            id: 'clinician-request:bitte-medikation-pruefen',
            question: 'Nehmen Sie aktuell Medikamente oder relevante Nahrungsergaenzungsmittel ein?',
            why: 'Rueckfrage aus aerztlicher Pruefung',
            priority: 1 as const,
            source: 'clinician_request' as const,
          },
        ],
        queue: [],
        asked_question_ids: [],
        last_generated_at: '2026-02-15T00:00:00.000Z',
      },
    }

    const generated = generateFollowupQuestions({
      structuredData,
      now: new Date('2026-02-15T12:00:00.000Z'),
    })

    const sameQuestionCount = generated.next_questions.filter((entry) =>
      entry.question.includes('Medikamente oder relevante Nahrungsergaenzungsmittel'),
    ).length

    expect(sameQuestionCount).toBe(1)
  })

  it('transitions lifecycle via skip and complete without repeating asked questions', () => {
    const structuredData = {
      status: 'draft' as const,
      followup: {
        next_questions: [
          {
            id: 'gap:onset',
            question: 'Seit wann bestehen die Beschwerden?',
            why: 'Beginn fehlt',
            priority: 1 as const,
            source: 'gap_rule' as const,
          },
        ],
        queue: [
          {
            id: 'gap:duration',
            question: 'Wie lange dauern die Beschwerden?',
            why: 'Dauer fehlt',
            priority: 2 as const,
            source: 'gap_rule' as const,
          },
        ],
        asked_question_ids: [],
        last_generated_at: '2026-02-14T00:00:00.000Z',
      },
    }

    const afterSkip = transitionFollowupLifecycle({
      structuredData,
      action: 'skip',
      questionId: 'gap:onset',
      now: new Date('2026-02-14T10:00:00.000Z'),
    })

    expect(afterSkip.followup?.asked_question_ids).toContain('gap:onset')
    expect(afterSkip.followup?.lifecycle?.skipped_question_ids).toContain('gap:onset')

    const afterComplete = transitionFollowupLifecycle({
      structuredData: afterSkip,
      action: 'complete',
      questionId: 'gap:duration',
      now: new Date('2026-02-14T10:01:00.000Z'),
    })

    expect(afterComplete.followup?.asked_question_ids).toContain('gap:duration')
    expect(afterComplete.followup?.lifecycle?.completed_question_ids).toContain('gap:duration')
    expect(afterComplete.followup?.lifecycle?.state).toBe('completed')

    const regenerated = generateFollowupQuestions({
      structuredData: afterComplete,
      now: new Date('2026-02-14T10:02:00.000Z'),
    })

    expect(regenerated.next_questions).toHaveLength(0)
    expect(regenerated.queue ?? []).toHaveLength(0)
  })
})
