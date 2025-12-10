/**
 * Usage examples for Content Resolver (F5)
 * 
 * These examples demonstrate common use cases for the content resolver utility.
 * This file serves as documentation and can be referenced when integrating
 * the resolver into application code.
 */

import { getContentPage, getContentPages, hasContentPage } from './contentResolver'

/**
 * Example 1: Get a specific content page by exact match
 * Use case: Direct link to a specific educational page
 */
export async function exampleExactMatch() {
  const result = await getContentPage({
    funnel: 'stress-assessment',
    category: 'intro',
    slug: 'was-ist-stress',
  })

  if (result.page) {
    console.log('Found page:', result.page.title)
    console.log('Resolution strategy:', result.strategy) // Should be 'exact-match'
    return result.page
  } else {
    console.warn('Page not found:', result.error)
    return null
  }
}

/**
 * Example 2: Get the default page for a category
 * Use case: Show an intro page when user starts a funnel
 */
export async function exampleCategoryDefault() {
  const result = await getContentPage({
    funnel: 'stress-assessment',
    category: 'intro',
  })

  if (result.page) {
    console.log('Default intro page:', result.page.title)
    console.log('Strategy:', result.strategy) // Likely 'category-default'
    return result.page
  }

  return null
}

/**
 * Example 3: Get the most important page in a funnel (any category)
 * Use case: Fallback when no specific category is needed
 */
export async function exampleFunnelDefault() {
  const result = await getContentPage({
    funnel: 'stress-assessment',
  })

  if (result.page) {
    console.log('Default funnel page:', result.page.title)
    console.log('Strategy:', result.strategy) // Should be 'funnel-default'
    return result.page
  }

  return null
}

/**
 * Example 4: Get all pages for a specific category
 * Use case: Display a list of related articles
 */
export async function exampleMultiplePages() {
  const pages = await getContentPages({
    funnel: 'stress-assessment',
    category: 'info',
  })

  console.log(`Found ${pages.length} info pages:`)
  pages.forEach((page) => {
    console.log(`- ${page.title} (priority: ${page.priority})`)
  })

  return pages
}

/**
 * Example 5: Check if content exists before rendering UI
 * Use case: Conditionally show content sections
 */
export async function exampleCheckExistence() {
  const hasResultPages = await hasContentPage({
    funnel: 'stress-assessment',
    category: 'result',
  })

  if (hasResultPages) {
    console.log('Result pages available - showing "Learn More" section')
  } else {
    console.log('No result pages - hiding "Learn More" section')
  }

  return hasResultPages
}

/**
 * Example 6: Error handling - non-existent funnel
 * Use case: Graceful degradation when data is missing
 */
export async function exampleErrorHandling() {
  const result = await getContentPage({
    funnel: 'non-existent-funnel',
    category: 'intro',
  })

  // This will NOT throw an error - it returns gracefully
  console.log('Result:', {
    found: result.page !== null,
    strategy: result.strategy, // Will be 'not-found'
    error: result.error, // Contains error message
  })

  // Safe to use without try/catch
  return result.page // Will be null
}

/**
 * Example 7: Include draft pages (for preview/admin)
 * Use case: Content editor preview functionality
 */
export async function exampleIncludeDrafts() {
  const result = await getContentPage({
    funnel: 'stress-assessment',
    slug: 'draft-page',
    includeDrafts: true, // Also return draft/unpublished pages
  })

  if (result.page) {
    console.log('Draft page found:', result.page.title)
    console.log('Status:', result.page.status) // Could be 'draft'
  }

  return result.page
}

/**
 * Example 8: React Server Component integration
 * Use case: Fetch content in Next.js server components
 */
export async function FunnelIntroServerComponent({
  funnelSlug,
}: {
  funnelSlug: string
}) {
  const result = await getContentPage({
    funnel: funnelSlug,
    category: 'intro',
  })

  if (!result.page) {
    return <div>No intro content available</div>
  }

  return (
    <div className="intro-section">
      <h2>{result.page.title}</h2>
      <p>{result.page.excerpt}</p>
      <div dangerouslySetInnerHTML={{ __html: result.page.body_markdown }} />
    </div>
  )
}

/**
 * Example 9: Client-side fetch with caching
 * Use case: Load content on demand with React cache
 */
import { cache } from 'react'

export const getCachedContentPage = cache(async (funnel: string, category?: string) => {
  return await getContentPage({ funnel, category })
})

/**
 * Example 10: Multiple fallback strategies
 * Use case: Try specific page, fall back to category, then funnel default
 */
export async function exampleAdvancedFallback(funnelSlug: string, preferredSlug: string) {
  // Try exact match first
  let result = await getContentPage({
    funnel: funnelSlug,
    slug: preferredSlug,
  })

  if (result.page) {
    console.log('✓ Found preferred page')
    return result.page
  }

  // Try category default
  result = await getContentPage({
    funnel: funnelSlug,
    category: 'intro',
  })

  if (result.page) {
    console.log('✓ Found category default')
    return result.page
  }

  // Try funnel default
  result = await getContentPage({
    funnel: funnelSlug,
  })

  if (result.page) {
    console.log('✓ Found funnel default')
    return result.page
  }

  console.warn('✗ No content available')
  return null
}
