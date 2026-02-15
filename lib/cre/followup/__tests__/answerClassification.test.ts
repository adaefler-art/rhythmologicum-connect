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

  it('classifies medication "nein" answer as answered', () => {
    const result = classifyFollowupAnswer({
      askedQuestionIds: ['gap:medication'],
      askedQuestionText: 'Nehmen Sie aktuell Medikamente?',
      answerText: 'nein',
      normalizationTurn: null,
    })

    expect(result).toBe('answered')
  })

  it('classifies typo-like medication "nei" answer as answered', () => {
    const result = classifyFollowupAnswer({
      askedQuestionIds: ['gap:medication'],
      askedQuestionText: 'Nehmen Sie Medikamente ein?',
      answerText: 'nei',
    })

    expect(result).toBe('answered')
  })

  it('classifies medication "nope" answer as answered', () => {
    const result = classifyFollowupAnswer({
      askedQuestionIds: ['gap:medication'],
      askedQuestionText: 'Nehmen Sie Medikamente ein?',
      answerText: 'nope',
    })

    expect(result).toBe('answered')
  })

  it('classifies already-provided reference answer as answered', () => {
    const result = classifyFollowupAnswer({
      askedQuestionIds: ['gap:medication'],
      askedQuestionText: 'Nehmen Sie aktuell Medikamente?',
      answerText: 'Bitte schauen Sie in den Daten nach, ich habe das bereits genannt.',
      normalizationTurn: null,
    })

    expect(result).toBe('answered')
  })

  it('classifies "du kennst ... bereits" medication reference as answered', () => {
    const result = classifyFollowupAnswer({
      askedQuestionIds: ['gap:medication'],
      askedQuestionText: 'Nehmen Sie aktuell Medikamente?',
      answerText: 'Du kennst meine Medikation bereits.',
      normalizationTurn: null,
    })

    expect(result).toBe('answered')
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
