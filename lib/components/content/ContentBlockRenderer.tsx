/**
 * Content Block Renderer (V05-I06.2)
 * 
 * Manifest-driven content renderer for mobile UI v0.5.
 * Renders content blocks (cards/sections stack) from FunnelContentManifest.
 * 
 * **NO MAGIC STRINGS**: All block types from SECTION_TYPE registry.
 * **DETERMINISTIC**: Same manifest input → identical render order and structure.
 * **FAIL-CLOSED**: Unknown block types → controlled error, no silent fallbacks.
 * 
 * Usage:
 * ```tsx
 * // Server Component loads manifest
 * const manifest = await loadFunnelVersion(slug)
 * 
 * // Client Component renders blocks
 * <ContentBlockRenderer manifest={manifest.manifest.content_manifest} />
 * ```
 */

'use client'

import React from 'react'
import { type FunnelContentManifest, type ContentPage } from '@/lib/contracts/funnelManifest'
import { PageRenderer } from './PageRenderer'

export type ContentBlockRendererProps = {
  /**
   * Validated content manifest from funnel version
   * Must be validated server-side before passing to renderer
   */
  manifest: FunnelContentManifest
  
  /**
   * Optional: Specific page slug to render
   * If provided, only renders that page
   * If omitted, renders all pages in manifest order
   */
  pageSlug?: string
  
  /**
   * Optional: Custom error handler for unsupported block types
   * If omitted, throws error
   */
  onBlockTypeError?: (blockType: string, sectionKey: string) => void
}

/**
 * Content Block Renderer - Main orchestrator
 * 
 * Renders content manifest as UI stack (pages → sections → blocks)
 * Preserves manifest order for deterministic rendering
 */
export function ContentBlockRenderer({
  manifest,
  pageSlug,
  onBlockTypeError,
}: ContentBlockRendererProps) {
  // Filter to specific page if slug provided
  const pages = pageSlug
    ? manifest.pages.filter((p) => p.slug === pageSlug)
    : manifest.pages

  // Empty manifest → empty valid UI
  if (pages.length === 0) {
    return null
  }

  // Render pages in manifest order (deterministic)
  return (
    <div className="content-block-renderer">
      {pages.map((page) => (
        <PageRenderer
          key={page.slug}
          page={page}
          onBlockTypeError={onBlockTypeError}
        />
      ))}
    </div>
  )
}
