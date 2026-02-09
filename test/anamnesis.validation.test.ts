import { validateCreateEntry } from '@/lib/api/anamnesis/validation'

describe('anamnesis intake validation', () => {
  it('accepts minimal intake payload', () => {
    expect(() =>
      validateCreateEntry({
        title: 'Intake Summary',
        entry_type: 'intake',
        content: {
          status: 'draft',
          narrativeSummary: 'Short narrative',
          structured: { timeline: [], keySymptoms: [] },
          openQuestions: [],
          redFlags: [],
          evidenceRefs: [],
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
          status: 'draft',
          narrativeSummary: longNarrative,
          structured: { timeline: [], keySymptoms: [] },
          openQuestions: [],
          redFlags: [],
          evidenceRefs: [],
        },
      }),
    ).toThrow()
  })
})
