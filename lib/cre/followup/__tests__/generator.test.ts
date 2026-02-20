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

  it('maps clinician requested items to objective ids', () => {
    const merged = mergeClinicianRequestedItemsIntoFollowup({
      structuredData: {
        status: 'draft',
      },
      requestedItems: ['Onset genau klären'],
      now: new Date('2026-02-14T10:00:00.000Z'),
    })

    const onsetQuestion = merged.followup?.next_questions.find(
      (question) => question.source === 'clinician_request',
    )

    expect(onsetQuestion).toBeDefined()
    expect(onsetQuestion?.objective_id).toBe('objective:onset')
  })

  it('filters clinician requested items whose objective is already resolved', () => {
    const merged = mergeClinicianRequestedItemsIntoFollowup({
      structuredData: {
        status: 'draft',
        chief_complaint: 'Migräne',
        history_of_present_illness: {
          onset: 'vor drei Monaten',
          course: 'zunehmende Frequenz',
        },
        medication: ['keine'],
      },
      requestedItems: ['Onset genauer erfragen'],
      now: new Date('2026-02-14T10:00:00.000Z'),
    })

    const clinicianOnset = [
      ...(merged.followup?.next_questions ?? []),
      ...(merged.followup?.queue ?? []),
    ].find((question) => question.source === 'clinician_request')

    expect(clinicianOnset).toBeUndefined()
  })

  it('marks objective as unclear when override is present and keeps it active', () => {
    const generated = generateFollowupQuestions({
      structuredData: {
        status: 'draft',
        followup: {
          next_questions: [],
          queue: [],
          asked_question_ids: [],
          last_generated_at: '2026-02-14T00:00:00.000Z',
          objective_state_overrides: {
            'objective:medication': 'unclear',
          },
        },
      },
      now: new Date('2026-02-14T10:00:00.000Z'),
    })

    const medicationObjective = (generated.objectives ?? []).find(
      (entry) => entry.id === 'objective:medication',
    )

    expect(medicationObjective?.status).toBe('unclear')
    expect(generated.active_objective_ids).toContain('objective:medication')
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

  it('sets ProblemReady when symptom duration is at least 12 weeks', () => {
    const generated = generateFollowupQuestions({
      structuredData: {
        status: 'draft',
        chief_complaint: 'Brustschmerzen',
        history_of_present_illness: {
          duration: 'seit 14 Wochen',
        },
        followup: {
          next_questions: [],
          queue: [],
          asked_question_ids: [],
          last_generated_at: '2026-02-20T00:00:00.000Z',
        },
      },
      now: new Date('2026-02-20T10:00:00.000Z'),
    })

    expect(generated.readiness?.state).toBe('ProblemReady')
    expect(generated.readiness?.uc2_triggered).toBe(true)
    expect(generated.readiness?.uc2_trigger_reasons).toContain('symptom_duration_gte_12_weeks')
  })

  it('sets ProblemReady when multiple symptom clusters are present without explicit connection', () => {
    const generated = generateFollowupQuestions({
      structuredData: {
        status: 'draft',
        chief_complaint: 'Herzrasen und Schwindel',
        history_of_present_illness: {
          associated_symptoms: ['Atemnot'],
        },
        followup: {
          next_questions: [],
          queue: [],
          asked_question_ids: [],
          last_generated_at: '2026-02-20T00:00:00.000Z',
        },
      },
      now: new Date('2026-02-20T10:00:00.000Z'),
    })

    expect(generated.readiness?.state).toBe('ProblemReady')
    expect(generated.readiness?.uc2_trigger_reasons).toContain('multiple_symptom_clusters')
  })

  it('sets ProblemReady on chronic condition signal', () => {
    const generated = generateFollowupQuestions({
      structuredData: {
        status: 'draft',
        chief_complaint: 'Muedigkeit',
        past_medical_history: ['Diabetes mellitus Typ 2'],
        followup: {
          next_questions: [],
          queue: [],
          asked_question_ids: [],
          last_generated_at: '2026-02-20T00:00:00.000Z',
        },
      },
      now: new Date('2026-02-20T10:00:00.000Z'),
    })

    expect(generated.readiness?.state).toBe('ProblemReady')
    expect(generated.readiness?.uc2_trigger_reasons).toContain('chronic_condition_signal')
  })

  it('sets ProblemReady on explicit clinician requirement', () => {
    const generated = generateFollowupQuestions({
      structuredData: {
        status: 'draft',
        chief_complaint: 'Kopfschmerz',
        followup: {
          next_questions: [
            {
              id: 'clinician-request:bitte-chronologie-klaeren',
              question: 'Bitte Chronologie klaeren?',
              why: 'Rueckfrage aus aerztlicher Pruefung',
              priority: 1,
              source: 'clinician_request',
            },
          ],
          queue: [],
          asked_question_ids: [],
          last_generated_at: '2026-02-20T00:00:00.000Z',
        },
      },
      now: new Date('2026-02-20T10:00:00.000Z'),
    })

    expect(generated.readiness?.state).toBe('ProblemReady')
    expect(generated.readiness?.uc2_trigger_reasons).toContain('explicit_clinician_requirement')
  })

  it('keeps lifecycle at needs_review when UC2 is triggered and no open followup questions remain', () => {
    const generated = generateFollowupQuestions({
      structuredData: {
        status: 'draft',
        chief_complaint: 'Kopfschmerz',
        history_of_present_illness: {
          duration: 'seit 6 Monaten',
          onset: 'vor 6 Monaten',
          course: 'stabil',
          trigger: 'kein klarer Zusammenhang',
          frequency: 'taeglich',
        },
        medication: ['none_reported'],
        past_medical_history: ['chronische Migräne'],
        psychosocial_factors: ['Arbeitsstress'],
        prior_findings_documents: [{ id: 'doc-1', name: 'arztbrief.pdf' }],
        followup: {
          next_questions: [],
          queue: [],
          asked_question_ids: [],
          last_generated_at: '2026-02-20T00:00:00.000Z',
        },
      },
      now: new Date('2026-02-20T10:00:00.000Z'),
    })

    expect(generated.next_questions).toHaveLength(0)
    expect(generated.lifecycle?.state).toBe('needs_review')
    expect(generated.readiness?.state).toBe('ProblemReady')
    expect(generated.readiness?.uc2_triggered).toBe(true)
  })

  it('adds UC2 deep-dive objective slots when ProblemReady is active', () => {
    const generated = generateFollowupQuestions({
      structuredData: {
        status: 'draft',
        chief_complaint: 'Herzrasen und Atemnot',
        history_of_present_illness: {
          duration: 'seit 5 Monaten',
          onset: 'vor 5 Monaten',
          course: 'zunehmend',
          trigger: 'nicht eindeutig',
          frequency: 'mehrmals pro Woche',
        },
        medication: ['none_reported'],
        past_medical_history: ['Hypertonie'],
        psychosocial_factors: ['Belastung im Alltag'],
        followup: {
          next_questions: [],
          queue: [],
          asked_question_ids: [],
          last_generated_at: '2026-02-20T00:00:00.000Z',
        },
      },
      now: new Date('2026-02-20T10:00:00.000Z'),
    })

    const objectiveIds = (generated.objectives ?? []).map((entry) => entry.id)
    expect(objectiveIds).toContain('objective:associated-symptoms')
    expect(objectiveIds).toContain('objective:aggravating-relieving-factors')
    expect(objectiveIds).toContain('objective:relevant-negatives')

    const questionIds = generated.next_questions.map((entry) => entry.id)
    expect(questionIds.some((id) => id === 'gap:associated-symptoms')).toBe(true)
  })

  it('keeps UC2 deep-dive slots hidden when UC2 is not triggered', () => {
    const generated = generateFollowupQuestions({
      structuredData: {
        status: 'draft',
        chief_complaint: 'Kopfschmerz seit gestern',
        history_of_present_illness: {
          onset: 'gestern',
        },
        followup: {
          next_questions: [],
          queue: [],
          asked_question_ids: [],
          last_generated_at: '2026-02-20T00:00:00.000Z',
        },
      },
      now: new Date('2026-02-20T10:00:00.000Z'),
    })

    const objectiveIds = (generated.objectives ?? []).map((entry) => entry.id)
    expect(objectiveIds).not.toContain('objective:associated-symptoms')
    expect(objectiveIds).not.toContain('objective:aggravating-relieving-factors')
    expect(objectiveIds).not.toContain('objective:relevant-negatives')
  })

  it('derives ProgramReady when all non-UC2 intake blocks are complete', () => {
    const generated = generateFollowupQuestions({
      structuredData: {
        status: 'draft',
        chief_complaint: 'Migräne',
        history_of_present_illness: {
          onset: 'vor 3 Tagen',
          duration: '2 Stunden',
          course: 'unveraendert',
          trigger: 'Stress',
          frequency: 'taeglich',
        },
        medication: ['Ibuprofen 400mg bei Bedarf'],
        past_medical_history: ['Migräne'],
        prior_findings_documents: [{ id: 'doc-1', name: 'befund.pdf' }],
        psychosocial_factors: ['Arbeitsbelastung'],
        followup: {
          next_questions: [],
          queue: [],
          asked_question_ids: [],
          last_generated_at: '2026-02-20T00:00:00.000Z',
        },
      },
      now: new Date('2026-02-20T10:00:00.000Z'),
    })

    expect(generated.lifecycle?.state).toBe('completed')
    expect(generated.readiness?.state).toBe('ProgramReady')
    expect(generated.lifecycle?.active_block_id).toBeNull()
    expect((generated.lifecycle?.savepoints ?? []).every((entry) => entry.status === 'completed')).toBe(
      true,
    )
  })

  it('emits in-progress savepoints and active block id for partial long-flow data', () => {
    const generated = generateFollowupQuestions({
      structuredData: {
        status: 'draft',
        chief_complaint: 'Schwindel',
        followup: {
          next_questions: [],
          queue: [],
          asked_question_ids: [],
          last_generated_at: '2026-02-20T00:00:00.000Z',
        },
      },
      now: new Date('2026-02-20T10:00:00.000Z'),
    })

    const coreSavepoint = (generated.lifecycle?.savepoints ?? []).find(
      (entry) => entry.block_id === 'core_symptom_profile',
    )

    expect(coreSavepoint?.status).toBe('in_progress')
    expect(generated.lifecycle?.active_block_id).toBe('core_symptom_profile')
    expect(generated.readiness?.state).toBe('VisitReady')
  })

  it('does not re-ask completed block questions on resume when stale clinician prompts exist', () => {
    const resumed = transitionFollowupLifecycle({
      structuredData: {
        status: 'draft',
        chief_complaint: 'Schwindel',
        history_of_present_illness: {
          onset: 'seit gestern',
          duration: '30 Minuten',
          course: 'unveraendert',
          trigger: 'Lagerungswechsel',
          frequency: 'mehrmals taeglich',
        },
        followup: {
          next_questions: [
            {
              id: 'clinician-request:bitte-beginn-klaeren',
              question: 'Bitte den Beginn nochmal genauer klaeren?',
              why: 'Rueckfrage aus aerztlicher Pruefung',
              priority: 1,
              source: 'clinician_request',
            },
          ],
          queue: [],
          asked_question_ids: [],
          last_generated_at: '2026-02-20T00:00:00.000Z',
        },
      },
      action: 'resume',
      now: new Date('2026-02-20T10:00:00.000Z'),
    })

    const generated = generateFollowupQuestions({
      structuredData: resumed,
      now: new Date('2026-02-20T10:01:00.000Z'),
    })

    expect(generated.lifecycle?.active_block_id).toBe('medical_context')
    expect(
      generated.next_questions.some((entry) =>
        entry.question.toLowerCase().includes('beginn') || entry.id.includes('beginn'),
      ),
    ).toBe(false)
    expect(
      generated.next_questions.some(
        (entry) => entry.objective_id === 'objective:medication' || entry.id.includes('medication'),
      ),
    ).toBe(true)
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
