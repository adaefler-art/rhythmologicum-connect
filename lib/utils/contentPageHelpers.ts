import type { ContentPage } from '@/lib/types/content'

/**
 * Content page categories based on slug naming conventions
 */
export type ContentPageCategory = 'intro' | 'info' | 'result' | 'other'

/**
 * Categorizes a content page based on its slug
 * 
 * Conventions:
 * - intro-* : Pages shown before starting the funnel
 * - info-* : Additional information pages (e.g., "More about stress")
 * - outro-* or result-* : Pages shown on the result page
 * - Other slugs: Uncategorized pages
 */
export function categorizeContentPage(page: ContentPage): ContentPageCategory {
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

/**
 * Filters content pages by category
 */
export function filterContentPagesByCategory(
  pages: ContentPage[],
  category: ContentPageCategory,
): ContentPage[] {
  return pages.filter((page) => categorizeContentPage(page) === category)
}

/**
 * Gets intro pages from a list of content pages
 */
export function getIntroPages(pages: ContentPage[]): ContentPage[] {
  return filterContentPagesByCategory(pages, 'intro')
}

/**
 * Gets info pages from a list of content pages
 */
export function getInfoPages(pages: ContentPage[]): ContentPage[] {
  return filterContentPagesByCategory(pages, 'info')
}

/**
 * Gets result/outro pages from a list of content pages
 */
export function getResultPages(pages: ContentPage[]): ContentPage[] {
  return filterContentPagesByCategory(pages, 'result')
}

/**
 * Checks if there are any pages of a specific category
 */
export function hasContentPagesOfCategory(
  pages: ContentPage[],
  category: ContentPageCategory,
): boolean {
  return pages.some((page) => categorizeContentPage(page) === category)
}
