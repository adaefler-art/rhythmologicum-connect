import { normalizeClinicalLanguageTurn } from '@/lib/cre/language/normalization'

describe('clinical language normalization', () => {
  it('detects language and maps entities for clear phrases', () => {
    const result = normalizeClinicalLanguageTurn({
      structuredData: { status: 'draft' },
      turnId: 'turn-1',
      phrase: 'Seit heute habe ich Brustschmerz und Herzrasen',
      now: new Date('2026-02-15T09:00:00.000Z'),
    })

    expect(result.turn?.detected_language).toBe('de')
    expect(result.turn?.mapped_entities.length).toBeGreaterThan(0)
    expect(result.clarificationPrompt).toBeNull()
    expect(result.structuredData.language_normalization?.turns.length).toBe(1)
  })

  it('triggers clarification for ambiguous/unmapped phrases', () => {
    const result = normalizeClinicalLanguageTurn({
      structuredData: { status: 'draft' },
      turnId: 'turn-2',
      phrase: 'es ist irgendwie komisch',
      now: new Date('2026-02-15T09:01:00.000Z'),
    })

    expect(result.turn?.clarification_required).toBe(true)
    expect(result.clarificationPrompt).toContain('praezisieren')
    expect(result.structuredData.language_normalization?.pending_clarifications?.length).toBe(1)
  })
})
