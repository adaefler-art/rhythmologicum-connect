import { validateCreateEntry } from '@/lib/api/anamnesis/validation'

describe('anamnesis intake validation', () => {
  it('accepts minimal intake payload', () => {
    expect(() =>
      validateCreateEntry({
        title: 'Intake Summary',
        entry_type: 'intake',
        content: {
          narrative: 'Short narrative',
          evidence: [],
          openQuestions: [],
          redFlags: [],
        },
      }),
    ).not.toThrow()
  })

  it('rejects oversized intake narrative', () => {
    const longNarrative = 'a'.repeat(5000)
    expect(() =>
      validateCreateEntry({
        title: 'Intake Summary',
        entry_type: 'intake',
        content: {
          narrative: longNarrative,
          evidence: [],
          openQuestions: [],
          redFlags: [],
        },
      }),
    ).toThrow()
  })
})
