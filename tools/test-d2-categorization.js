/**
 * Test script for D2 content page categorization
 * 
 * This script tests the categorization logic without requiring a database connection.
 * Since we're testing TypeScript logic, we inline the functions here for Node.js compatibility.
 */

// Inline the categorization logic for testing
function categorizeContentPage(page) {
  const slug = page.slug.toLowerCase()

  if (slug.startsWith('intro-')) {
    return 'intro'
  }
  if (slug.startsWith('info-')) {
    return 'info'
  }
  if (slug.startsWith('outro-') || slug.startsWith('result-')) {
    return 'result'
  }

  // Special handling for common patterns
  if (slug === 'ueber-das-assessment' || slug.includes('about')) {
    return 'intro'
  }
  if (slug.includes('ergebnis') || slug.includes('results')) {
    return 'result'
  }

  return 'other'
}

function filterContentPagesByCategory(pages, category) {
  return pages.filter((page) => categorizeContentPage(page) === category)
}

function getIntroPages(pages) {
  return filterContentPagesByCategory(pages, 'intro')
}

function getInfoPages(pages) {
  return filterContentPagesByCategory(pages, 'info')
}

function getResultPages(pages) {
  return filterContentPagesByCategory(pages, 'result')
}

// Mock content pages based on the migration data
const mockContentPages = [
  {
    id: '1',
    slug: 'intro-vorbereitung',
    title: 'Vorbereitung auf Ihr Stress-Assessment',
    excerpt: 'Tipps zur optimalen Vorbereitung...',
    body_markdown: '# Content',
    status: 'published',
    layout: 'default',
    funnel_id: 'funnel-1',
    created_at: '2025-12-10T08:00:00Z',
    updated_at: '2025-12-10T08:00:00Z',
  },
  {
    id: '2',
    slug: 'result-naechste-schritte',
    title: 'Nächste Schritte nach Ihrem Assessment',
    excerpt: 'Was Sie nach Abschluss tun können...',
    body_markdown: '# Content',
    status: 'published',
    layout: 'default',
    funnel_id: 'funnel-1',
    created_at: '2025-12-10T08:00:00Z',
    updated_at: '2025-12-10T08:00:00Z',
  },
  {
    id: '3',
    slug: 'info-wissenschaftliche-grundlage',
    title: 'Wissenschaftliche Grundlage',
    excerpt: 'Validierte psychologische Messinstrumente...',
    body_markdown: '# Content',
    status: 'published',
    layout: 'wide',
    funnel_id: 'funnel-1',
    created_at: '2025-12-10T08:00:00Z',
    updated_at: '2025-12-10T08:00:00Z',
  },
  {
    id: '4',
    slug: 'ueber-das-assessment',
    title: 'Über das Assessment',
    excerpt: 'Wie unser Assessment funktioniert...',
    body_markdown: '# Content',
    status: 'published',
    layout: 'wide',
    funnel_id: 'funnel-1',
    created_at: '2025-12-10T08:00:00Z',
    updated_at: '2025-12-10T08:00:00Z',
  },
  {
    id: '5',
    slug: 'was-ist-stress',
    title: 'Was ist Stress?',
    excerpt: 'Grundlagen über Stress...',
    body_markdown: '# Content',
    status: 'published',
    layout: 'default',
    funnel_id: 'funnel-1',
    created_at: '2025-12-10T08:00:00Z',
    updated_at: '2025-12-10T08:00:00Z',
  },
]

console.log('🧪 Testing D2 Content Page Categorization\n')
console.log('='.repeat(60))

// Test individual categorization
console.log('\n📋 Individual Page Categories:\n')
mockContentPages.forEach((page) => {
  const category = categorizeContentPage(page)
  console.log(`  ${page.slug}`)
  console.log(`    → Category: ${category}`)
  console.log(`    → Title: ${page.title}`)
  console.log()
})

// Test filtering functions
console.log('=' .repeat(60))
console.log('\n📚 Filtered Categories:\n')

const introPages = getIntroPages(mockContentPages)
console.log(`Intro Pages (${introPages.length}):`)
introPages.forEach((p) => console.log(`  - ${p.slug}: ${p.title}`))

const infoPages = getInfoPages(mockContentPages)
console.log(`\nInfo Pages (${infoPages.length}):`)
infoPages.forEach((p) => console.log(`  - ${p.slug}: ${p.title}`))

const resultPages = getResultPages(mockContentPages)
console.log(`\nResult Pages (${resultPages.length}):`)
resultPages.forEach((p) => console.log(`  - ${p.slug}: ${p.title}`))

// Summary
console.log('\n' + '='.repeat(60))
console.log('\n✅ All categorization tests completed!\n')
console.log('Summary:')
console.log(`  Total pages: ${mockContentPages.length}`)
console.log(`  Intro: ${introPages.length}`)
console.log(`  Info: ${infoPages.length}`)
console.log(`  Result: ${resultPages.length}`)
console.log(`  Other: ${mockContentPages.length - introPages.length - infoPages.length - resultPages.length}`)
console.log()
