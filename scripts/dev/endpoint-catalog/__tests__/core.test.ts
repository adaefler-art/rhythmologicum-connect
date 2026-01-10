/* eslint-disable @typescript-eslint/no-var-requires */

const {
  matchApiPathToRoutePattern,
  matchCallsiteToAnyRoute,
  extractApiCallsitesFromSource,
  templateToLooseMatchApiPath,
} = require('../core')

describe('endpoint-catalog matcher', () => {
  it('matches dynamic segments', () => {
    expect(
      matchApiPathToRoutePattern(
        '/api/funnels/cardiovascular-age/definition',
        '/api/funnels/[slug]/definition',
      ),
    ).toBe(true)

    expect(
      matchApiPathToRoutePattern('/api/funnels/x/definition/extra', '/api/funnels/[slug]/definition'),
    ).toBe(false)
  })

  it('matches catch-all segments', () => {
    expect(matchApiPathToRoutePattern('/api/content/a/b', '/api/content/[...path]')).toBe(true)
    expect(matchApiPathToRoutePattern('/api/content', '/api/content/[...path]')).toBe(false)
  })

  it('matches optional catch-all segments', () => {
    expect(matchApiPathToRoutePattern('/api/content', '/api/content/[[...path]]')).toBe(true)
    expect(matchApiPathToRoutePattern('/api/content/a', '/api/content/[[...path]]')).toBe(true)
  })

  it('matches template callsites against dynamic route patterns', () => {
    const call = templateToLooseMatchApiPath('/api/funnels/${slug}/definition')
    expect(matchApiPathToRoutePattern(call, '/api/funnels/[slug]/definition')).toBe(true)

    const matched = matchCallsiteToAnyRoute('/api/funnels/${slug}/definition', [
      '/api/health/env',
      '/api/funnels/[slug]/definition',
    ])
    expect(matched).toBe('/api/funnels/[slug]/definition')
  })
})

describe('endpoint-catalog callsite parser', () => {
  it('extracts multi-line fetch callsites', () => {
    const src = `
      async function run(slug: string) {
        const res = await fetch(
          \`/api/funnels/${'${slug}'}/definition?x=1\`,
          { method: 'GET' },
        )
        return res
      }
    `

    const found = extractApiCallsitesFromSource(src)
    expect(found.length).toBe(1)
    expect(found[0].apiPath).toBe('/api/funnels/${slug}/definition')
    expect(found[0].kind).toBe('fetch')
    expect(found[0].isTemplate).toBe(true)
  })

  it('ignores commented-out examples', () => {
    const src = `
      // await fetch('/api/analytics/events', { method: 'POST' })
      const x = 1
    `

    const found = extractApiCallsitesFromSource(src)
    expect(found.length).toBe(0)
  })

  it('ignores non-localhost absolute URLs', () => {
    const src = `
      async function run() {
        return fetch('https://metrics-service.example.com/api/metrics')
      }
    `

    const found = extractApiCallsitesFromSource(src)
    expect(found.length).toBe(0)
  })
})
