/**
 * Image Block Renderer (V05-I06.2)
 * 
 * Renders image content block
 */

'use client'

import React from 'react'
import { type ContentSection } from '@/lib/contracts/funnelManifest'

export type ImageBlockRendererProps = {
  section: ContentSection
}

/**
 * Image Block - Image with optional caption
 * 
 * Expected content fields:
 * - url: string (required) - can also use contentRef
 * - alt: string (required for accessibility)
 * - caption?: string (optional)
 * - width?: number (optional)
 * - height?: number (optional)
 */
export function ImageBlockRenderer({ section }: ImageBlockRendererProps) {
  const content = section.content || {}
  const url = (content.url as string | undefined) || section.contentRef || ''
  const alt = (content.alt as string | undefined) || 'Image'
  const caption = content.caption as string | undefined
  const width = content.width as number | undefined
  const height = content.height as number | undefined

  return (
    <div
      className="image-block bg-white dark:bg-slate-800 rounded-lg p-4"
      data-section-key={section.key}
    >
      {url && (
        <>
          <img
            src={url}
            alt={alt}
            width={width}
            height={height}
            className="w-full h-auto rounded"
            loading="lazy"
          />
          {caption && (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 text-center">
              {caption}
            </p>
          )}
        </>
      )}
    </div>
  )
}
