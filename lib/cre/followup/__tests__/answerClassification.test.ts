import { classifyFollowupAnswer } from '@/lib/cre/followup/answerClassification'

describe('classifyFollowupAnswer', () => {
  it('classifies concrete medication answer as answered', () => {
    const result = classifyFollowupAnswer({
      askedQuestionIds: ['gap:medication'],
      askedQuestionText: 'Nehmen Sie aktuell Medikamente?',
      answerText: 'Ich nehme Omega 3.',
      normalizationTurn: {
        mapped_entities: [
          { canonical: 'omega_3', entity_type: 'medication' },
        ],
      },
    })

    expect(result).toBe('answered')
  })

  it('classifies yes/no only medication answer as partial', () => {
    const result = classifyFollowupAnswer({
      askedQuestionIds: ['gap:medication'],
      askedQuestionText: 'Nehmen Sie aktuell Medikamente?',
      answerText: 'Ja',
      normalizationTurn: null,
    })

    expect(result).toBe('partial')
  })

  it('classifies empty/unknown answer as unclear', () => {
    expect(
      classifyFollowupAnswer({
        askedQuestionIds: ['gap:onset'],
        askedQuestionText: 'Seit wann bestehen die Beschwerden?',
        answerText: 'weiß nicht',
        normalizationTurn: null,
      }),
    ).toBe('unclear')
  })

  it('classifies contradictory medication signals as contradiction', () => {
    const result = classifyFollowupAnswer({
      askedQuestionIds: ['gap:medication'],
      askedQuestionText: 'Nehmen Sie aktuell Medikamente?',
      answerText: 'Keine Medikamente, nur Omega 3.',
      normalizationTurn: {
        mapped_entities: [
          { canonical: 'none_reported', entity_type: 'medication' },
          { canonical: 'omega_3', entity_type: 'medication' },
        ],
      },
    })

    expect(result).toBe('contradiction')
  })
})
