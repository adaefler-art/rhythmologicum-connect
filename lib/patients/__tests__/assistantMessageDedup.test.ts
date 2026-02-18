import { shouldSkipDuplicateAssistantMessage } from '@/lib/patients/assistantMessageDedup'

describe('shouldSkipDuplicateAssistantMessage', () => {
  it('skips consecutive duplicate assistant messages', () => {
    expect(
      shouldSkipDuplicateAssistantMessage({
        messages: [{ sender: 'assistant', text: 'Sind diese Beschwerden aktuell noch da?' }],
        nextText: '  sind   diese  beschwerden aktuell NOCH da? ',
      }),
    ).toBe(true)
  })

  it('does not skip when previous message is from user', () => {
    expect(
      shouldSkipDuplicateAssistantMessage({
        messages: [{ sender: 'user', text: 'Ja, die Beschwerden sind noch da.' }],
        nextText: 'Sind diese Beschwerden aktuell noch da?',
      }),
    ).toBe(false)
  })

  it('does not skip different assistant messages', () => {
    expect(
      shouldSkipDuplicateAssistantMessage({
        messages: [{ sender: 'assistant', text: 'Seit wann bestehen die Beschwerden?' }],
        nextText: 'Sind diese Beschwerden aktuell noch da?',
      }),
    ).toBe(false)
  })

  it('skips empty assistant output', () => {
    expect(
      shouldSkipDuplicateAssistantMessage({
        messages: [{ sender: 'assistant', text: 'Seit wann bestehen die Beschwerden?' }],
        nextText: '   ',
      }),
    ).toBe(true)
  })
})
