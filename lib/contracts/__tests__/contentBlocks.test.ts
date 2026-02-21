import { parseContentBlocks } from '@/lib/contracts/contentBlocks'

describe('contentBlocks contract', () => {
  it('parses and sorts valid blocks by order', () => {
    const result = parseContentBlocks([
      { id: 'b', type: 'badge', label: 'Auszeichnung', order: 2 },
      { id: 'h', type: 'hero', title: 'Was ist Stress?', order: 0 },
      { id: 'r', type: 'rich_text', markdown: 'Hallo', order: 1 },
    ])

    expect(result).not.toBeNull()
    expect(result?.map((block) => block.id)).toEqual(['h', 'r', 'b'])
  })

  it('accepts valid JSON string payload', () => {
    const raw = JSON.stringify([
      {
        id: 'cta-1',
        type: 'cta',
        label: 'Mehr erfahren',
        href: '/patient/start',
      },
    ])

    const result = parseContentBlocks(raw)
    expect(result).not.toBeNull()
    expect(result?.[0].type).toBe('cta')
  })

  it('rejects unsafe URLs and falls back to null', () => {
    const result = parseContentBlocks([
      {
        id: 'cta-unsafe',
        type: 'cta',
        label: 'Click',
        href: 'javascript:alert(1)',
      },
    ])

    expect(result).toBeNull()
  })

  it('returns null for unknown block types', () => {
    const result = parseContentBlocks([
      {
        id: 'x-1',
        type: 'unknown_type',
      },
    ])

    expect(result).toBeNull()
  })
})
