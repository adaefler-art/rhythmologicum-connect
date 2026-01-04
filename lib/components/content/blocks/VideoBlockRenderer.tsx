/**
 * Video Block Renderer (V05-I06.2)
 * 
 * Renders video content block
 * 
 * V05-I06.2 Hardening: URL security validation
 * - Validates video URLs to prevent XSS
 * - Validates poster URLs
 */

'use client'

import React from 'react'
import { type ContentSection } from '@/lib/contracts/funnelManifest'
import { sanitizeUrl } from '@/lib/utils/urlSecurity'

export type VideoBlockRendererProps = {
  section: ContentSection
}

/**
 * Video Block - Video player with optional caption
 * 
 * Expected content fields:
 * - url: string (required) - can also use contentRef
 * - caption?: string (optional)
 * - poster?: string (optional thumbnail)
 * - controls?: boolean (optional, default true)
 * 
 * Security:
 * - URLs are validated to prevent XSS attacks
 * - Dangerous protocols (javascript:, data:) are rejected
 */
export function VideoBlockRenderer({ section }: VideoBlockRendererProps) {
  const content = section.content || {}
  const url = (content.url as string | undefined) || section.contentRef || ''
  const caption = content.caption as string | undefined
  const poster = content.poster as string | undefined
  const controls = (content.controls as boolean | undefined) ?? true

  // Sanitize URLs (no data: URLs for video sources)
  const safeUrl = sanitizeUrl(url, '', false)
  const safePoster = poster ? sanitizeUrl(poster, '', true) : undefined

  return (
    <div
      className="video-block bg-white dark:bg-slate-800 rounded-lg p-4"
      data-section-key={section.key}
    >
      {safeUrl && (
        <>
          <video
            src={safeUrl}
            poster={safePoster}
            controls={controls}
            className="w-full h-auto rounded"
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
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
