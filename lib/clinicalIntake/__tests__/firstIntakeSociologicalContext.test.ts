import {
  getFirstIntakeSociologicalAssessmentContext,
  mergePsychosocialFactors,
} from '../firstIntakeSociologicalContext'

type MockInputs = {
  profileId?: string | null
  assessmentId?: string | null
  answers?: Array<{ question_id: string; answer_data: unknown; answer_value: number | null }>
}

function createMockSupabase(inputs: MockInputs) {
  const { profileId = 'patient-profile-1', assessmentId = 'assessment-1', answers = [] } = inputs

  return {
    from(table: string) {
      const chain: any = {
        select() {
          return chain
        },
        eq(column: string) {
          if (table === 'assessment_answers' && column === 'assessment_id') {
            return Promise.resolve({ data: answers, error: null })
          }
          return chain
        },
        order() {
          return chain
        },
        limit() {
          return chain
        },
        single() {
          if (table === 'patient_profiles') {
            if (!profileId) return Promise.resolve({ data: null, error: { message: 'not found' } })
            return Promise.resolve({ data: { id: profileId }, error: null })
          }
          return Promise.resolve({ data: null, error: { message: 'unsupported' } })
        },
        maybeSingle() {
          if (table === 'assessments') {
            if (!assessmentId) return Promise.resolve({ data: null, error: null })
            return Promise.resolve({ data: { id: assessmentId, created_at: '2026-02-16T12:00:00.000Z' }, error: null })
          }
          return Promise.resolve({ data: null, error: null })
        },
      }
      return chain
    },
  }
}

describe('firstIntakeSociologicalContext', () => {
  it('returns null when patient profile is missing', async () => {
    const supabase = createMockSupabase({ profileId: null })

    const result = await getFirstIntakeSociologicalAssessmentContext('user-1', supabase as any)

    expect(result).toBeNull()
  })

  it('builds context lines and psychosocial factors from first-intake answers', async () => {
    const supabase = createMockSupabase({
      answers: [
        { question_id: 'q2-living-situation', answer_data: 'alone', answer_value: null },
        { question_id: 'q5-social-support', answer_data: 2, answer_value: 2 },
        { question_id: 'q7-loneliness', answer_data: 4, answer_value: 4 },
        { question_id: 'q10-financial-stress', answer_data: 5, answer_value: 5 },
        { question_id: 'q11-language-barriers', answer_data: 'yes', answer_value: null },
        {
          question_id: 'q12-primary-concern',
          answer_data: 'Unsicherheit wegen Arbeitsplatz',
          answer_value: null,
        },
      ],
    })

    const result = await getFirstIntakeSociologicalAssessmentContext('user-1', supabase as any)

    expect(result).not.toBeNull()
    expect(result?.assessmentId).toBe('assessment-1')
    expect(result?.lines).toEqual(
      expect.arrayContaining([
        'Wohnsituation: Allein',
        'Soziale Unterstützung: 2',
        'Einsamkeitsempfinden: 4',
      ]),
    )

    expect(result?.psychosocialFactors).toEqual(
      expect.arrayContaining([
        'Geringe soziale Unterstützung (2/5)',
        'Erhöhtes Einsamkeitsempfinden (4/5)',
        'Hohe finanzielle Belastung (5/5)',
        'Sprachliche Hürden beim Zugang zu Gesundheitsangeboten',
        'Genannte Hauptbelastung: Unsicherheit wegen Arbeitsplatz',
      ]),
    )

    expect(result?.contextText).toContain('Erstaufnahme Soziologische Anamnese')
    expect(result?.contextText).toContain('Abgeleitete psychosoziale Faktoren')
  })

  it('deduplicates psychosocial factor merge', () => {
    const merged = mergePsychosocialFactors(
      ['Hohe finanzielle Belastung (5/5)', 'Sprachliche Hürden beim Zugang zu Gesundheitsangeboten'],
      ['Sprachliche Hürden beim Zugang zu Gesundheitsangeboten', 'Geringe soziale Unterstützung (2/5)'],
    )

    expect(merged).toHaveLength(3)
    expect(merged).toEqual(
      expect.arrayContaining([
        'Hohe finanzielle Belastung (5/5)',
        'Sprachliche Hürden beim Zugang zu Gesundheitsangeboten',
        'Geringe soziale Unterstützung (2/5)',
      ]),
    )
  })
})
