/**
 * Markdown Block Renderer (V05-I06.2)
 * 
 * Renders markdown content using react-markdown
 * 
 * V05-I06.2 Hardening: Security measures
 * - Raw HTML is NOT rendered (skipHtml: true)
 * - Markdown content is sanitized by react-markdown
 * - Links automatically get safe attributes
 */

'use client'

import React from 'react'
import { type ContentSection } from '@/lib/contracts/funnelManifest'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { type Components } from 'react-markdown'

export type MarkdownBlockRendererProps = {
  section: ContentSection
}

/**
 * Custom link component with security attributes
 * Adds rel="noopener noreferrer" for external links
 */
const SafeLink: Components['a'] = ({ href, children, ...props }) => {
  const isExternal = href?.startsWith('http://') || href?.startsWith('https://')

  if (isExternal) {
    return (
      <a
        href={href}
        rel="noopener noreferrer"
        target="_blank"
        {...props}
      >
        {children}
      </a>
    )
  }

  return <a href={href} {...props}>{children}</a>
}

/**
 * Markdown Block - Renders markdown content
 * 
 * Expected content fields:
 * - markdown: string (required) - markdown content
 * - contentRef can also be used to reference external markdown file
 * 
 * Security:
 * - Raw HTML is disabled (skipHtml: true)
 * - External links get rel="noopener noreferrer"
 * - All content is sanitized by react-markdown
 */
export function MarkdownBlockRenderer({ section }: MarkdownBlockRendererProps) {
  const content = section.content || {}
  const markdown = (content.markdown as string | undefined) || section.contentRef || ''

  return (
    <div
      className="markdown-block bg-white dark:bg-slate-800 rounded-lg p-6 prose prose-slate dark:prose-invert max-w-none"
      data-section-key={section.key}
    >
      {markdown && (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          skipHtml={true}
          components={{
            a: SafeLink,
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
          {markdown}
        </ReactMarkdown>
      )}
    </div>
  )
}
