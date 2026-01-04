/**
 * Page Renderer (V05-I06.2)
 * 
 * Renders a single content page from manifest
 * Orchestrates section rendering in deterministic order
 */

'use client'

import React from 'react'
import { type ContentPage } from '@/lib/contracts/funnelManifest'
import { SectionRenderer } from './SectionRenderer'

export type PageRendererProps = {
  page: ContentPage
  onBlockTypeError?: (blockType: string, sectionKey: string) => void
}

/**
 * Renders a content page with optional title/description
 * Sections rendered in manifest order (deterministic)
 */
export function PageRenderer({ page, onBlockTypeError }: PageRendererProps) {
  // Sort sections by orderIndex if present, otherwise preserve manifest order
  const sections = [...page.sections].sort((a, b) => {
    if (a.orderIndex !== undefined && b.orderIndex !== undefined) {
      return a.orderIndex - b.orderIndex
    }
    // If orderIndex not present, maintain original order
    return 0
  })

  return (
    <div className="content-page" data-page-slug={page.slug}>
      {/* Optional page title/description */}
      {page.title && (
        <div className="content-page-header mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {page.title}
          </h2>
          {page.description && (
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              {page.description}
            </p>
          )}
        </div>
      )}

      {/* Sections stack */}
      <div className="content-sections-stack space-y-4">
        {sections.map((section) => (
          <SectionRenderer
            key={section.key}
            section={section}
            onBlockTypeError={onBlockTypeError}
          />
        ))}
      </div>
    </div>
  )
}
