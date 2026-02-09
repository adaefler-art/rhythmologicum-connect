import { getPatientConsultPrompt } from '@/lib/llm/prompts'

type ExampleSnippet = {
  label: string
  assistantMessage: string
}

const EXAMPLE_SNIPPETS: ExampleSnippet[] = [
  {
    label: 'Kopfschmerz unsicher',
    assistantMessage:
      'Danke fuer die Schilderung. Seit wann bestehen die Kopfschmerzen?',
  },
  {
    label: 'Brustdruck (safety sensibel)',
    assistantMessage:
      'Ich hoere Brustdruck. Haben Sie gerade starke Atemnot?',
  },
  {
    label: 'Folgegespraech mit Kontext',
    assistantMessage:
      'Danke fuer die Infos von gestern. Hat sich die Intensitaet seitdem veraendert?',
  },
]

function countQuestions(text: string): number {
  return (text.match(/\?/g) ?? []).length
}

describe('patient consult prompt guardrails', () => {
  it('requires one-question-at-a-time rule in the prompt', () => {
    const prompt = getPatientConsultPrompt()

    expect(prompt).toContain('maximal 1 Frage')
    expect(prompt).toContain('Verboten: Mehrfachfragen')
    expect(prompt).toContain('nummerierte Frage-Listen')
  })

  it('keeps example snippets to one question each', () => {
    EXAMPLE_SNIPPETS.forEach((snippet) => {
      expect(countQuestions(snippet.assistantMessage)).toBeLessThanOrEqual(1)
    })
  })

  it('matches the example snapshot set', () => {
    expect(EXAMPLE_SNIPPETS).toMatchInlineSnapshot(`
[
  {
    "assistantMessage": "Danke fuer die Schilderung. Seit wann bestehen die Kopfschmerzen?",
    "label": "Kopfschmerz unsicher",
  },
  {
    "assistantMessage": "Ich hoere Brustdruck. Haben Sie gerade starke Atemnot?",
    "label": "Brustdruck (safety sensibel)",
  },
  {
    "assistantMessage": "Danke fuer die Infos von gestern. Hat sich die Intensitaet seitdem veraendert?",
    "label": "Folgegespraech mit Kontext",
  },
]
`)
  })
})
