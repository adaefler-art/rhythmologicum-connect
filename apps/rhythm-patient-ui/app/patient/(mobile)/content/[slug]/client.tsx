/**
 * E6.5.7: Content Page Client Component (I2.5 Navigation Consistency)
 * 
 * Renders content page with:
 * - Safe markdown rendering (XSS-protected)
 * - Back navigation to start (canonical route)
 * - No PHI/user-specific data
 */

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import type { ContentPage } from '@/lib/types/content'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { type Components } from 'react-markdown'
import { ArrowLeft } from '@/lib/ui/mobile-v2/icons'
import { CANONICAL_ROUTES } from '../../utils/navigation'

type ContentPageClientProps = {
  contentPage: ContentPage
}

/**
 * Custom link component with security attributes
 * Adds rel="noopener noreferrer" for external links
 */
const SafeLink: Components['a'] = ({ href, children, ...props }) => {
  const isExternal = href?.startsWith('http://') || href?.startsWith('https://')

  if (isExternal) {
    return (
      <a href={href} rel="noopener noreferrer" target="_blank" {...props}>
        {children}
      </a>
    )
  }

  return (
    <a href={href} {...props}>
      {children}
    </a>
  )
}

function normalizeImageSource(src: string): string {
  const trimmed = src.trim()

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
    return encodeURI(trimmed)
  }

  if (trimmed.startsWith('images/')) {
    return encodeURI(`/${trimmed}`)
  }

  return encodeURI(trimmed)
}

function normalizeMarkdownImages(markdown: string): string {
  return markdown.replace(
    /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi,
    (_match, src: string) => `![](${normalizeImageSource(src)})`,
  )
}

const SafeImage: Components['img'] = ({ src, alt }) => {
  if (!src) {
    return null
  }

  return (
    <img
      src={normalizeImageSource(src)}
      alt={alt ?? ''}
      loading="lazy"
      decoding="async"
      className="my-4 w-full rounded-lg object-cover"
    />
  )
}

export default function ContentPageClient({ contentPage }: ContentPageClientProps) {
  const router = useRouter()
  const normalizedMarkdown = normalizeMarkdownImages(contentPage.body_markdown ?? '')

  const handleBackToDashboard = () => {
    // I2.5: Use canonical route for deterministic navigation
    router.push(CANONICAL_ROUTES.DASHBOARD)
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* AC3: Back navigation to start */}
        <button
          onClick={handleBackToDashboard}
          className="mb-6 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Zurück zum Start</span>
        </button>

        {/* Content page header */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            {contentPage.title}
          </h1>

          {contentPage.excerpt && (
            <p className="text-lg text-slate-600 mb-6">
              {contentPage.excerpt}
            </p>
          )}

          {/* Safe markdown rendering - XSS protected */}
          {/* Uses react-markdown with skipHtml: true to prevent XSS */}
          <div className="prose prose-slate max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              skipHtml={true}
              components={{
                a: SafeLink,
                img: SafeImage,
                table: ({ children, ...props }) => (
                  <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[640px]" {...props}>
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children, ...props }) => (
                  <th className="whitespace-nowrap" {...props}>
                    {children}
                  </th>
                ),
              }}
            >
              {normalizedMarkdown}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}
