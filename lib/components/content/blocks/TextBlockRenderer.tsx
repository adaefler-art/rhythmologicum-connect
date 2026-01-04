/**
 * Text Block Renderer (V05-I06.2)
 * 
 * Renders simple text content block
 */

'use client'

import React from 'react'
import { type ContentSection } from '@/lib/contracts/funnelManifest'

export type TextBlockRendererProps = {
  section: ContentSection
}

/**
 * Text Block - Simple text content with optional title
 * 
 * Expected content fields:
 * - title?: string (optional)
 * - text: string (required)
 * - alignment?: 'left' | 'center' | 'right' (optional, default 'left')
 */
export function TextBlockRenderer({ section }: TextBlockRendererProps) {
  const content = section.content || {}
  const title = content.title as string | undefined
  const text = content.text as string | undefined
  const alignment = (content.alignment as string | undefined) || 'left'

  const alignmentClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[alignment] || 'text-left'

  return (
    <div
      className={`text-block bg-white dark:bg-slate-800 rounded-lg p-6 ${alignmentClass}`}
      data-section-key={section.key}
    >
      {title && (
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
          {title}
        </h3>
      )}
      {text && (
        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
          {text}
        </p>
      )}
    </div>
  )
}
