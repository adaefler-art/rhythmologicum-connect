import { buildFallbackMarkdown, mapPayloadDocToContentPageInsert } from '@/lib/cms/payload/sync'

describe('payload sync transform', () => {
  it('builds markdown fallback from supported blocks', () => {
    const markdown = buildFallbackMarkdown([
      {
        id: 'hero-1',
        type: 'hero',
        title: 'Was ist Stress?',
        subtitle: 'Grundlagen',
        order: 0,
      },
      {
        id: 'cta-1',
        type: 'cta',
        label: 'Mehr erfahren',
        href: '/patient/start',
        order: 1,
      },
    ])

    expect(markdown).toContain('## Was ist Stress?')
    expect(markdown).toContain('[Mehr erfahren](/patient/start)')
  })

  it('maps payload docs to content_pages insert shape', () => {
    const mapped = mapPayloadDocToContentPageInsert(
      {
        id: '12',
        slug: 'stress-verstehen',
        title: 'Stress verstehen',
        excerpt: 'Kurz erklärt',
        status: 'published',
        blocks: [
          {
            id: 'rt-1',
            type: 'rich_text',
            markdown: 'Stress ist eine natürliche Reaktion.',
            order: 0,
          },
        ],
      },
      null,
    )

    expect(mapped.slug).toBe('stress-verstehen')
    expect(mapped.title).toBe('Stress verstehen')
    expect(mapped.status).toBe('published')
    expect(mapped.body_markdown).toContain('Stress ist eine natürliche Reaktion.')
    expect(Array.isArray(mapped.blocks)).toBe(true)
    expect((mapped.blocks as Array<{ type: string }>)[0]?.type).toBe('rich_text')
  })
})
