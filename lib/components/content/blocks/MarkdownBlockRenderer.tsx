/**
 * Markdown Block Renderer (V05-I06.2)
 * 
 * Renders markdown content using react-markdown
 */

'use client'

import React from 'react'
import { type ContentSection } from '@/lib/contracts/funnelManifest'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export type MarkdownBlockRendererProps = {
  section: ContentSection
}

/**
 * Markdown Block - Renders markdown content
 * 
 * Expected content fields:
 * - markdown: string (required) - markdown content
 * - contentRef can also be used to reference external markdown file
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
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {markdown}
        </ReactMarkdown>
      )}
    </div>
  )
}
