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
 * Sections rendered in deterministic order with stable sorting
 * 
 * V05-I06.2 Hardening: Stable sort with explicit tie-breakers
 * - Primary: orderIndex (ascending)
 * - Secondary: original array index (ascending)
 * - Tertiary: section key (lexicographic)
 */
export function PageRenderer({ page, onBlockTypeError }: PageRendererProps) {
  // Create sections with original index for stable sorting
  const sectionsWithIndex = page.sections.map((section, originalIndex) => ({
    section,
    originalIndex,
  }))

  // Stable deterministic sort
  const sortedSections = [...sectionsWithIndex].sort((a, b) => {
    const aOrder = a.section.orderIndex
    const bOrder = b.section.orderIndex

    // Both have orderIndex: sort by orderIndex
    if (aOrder !== undefined && bOrder !== undefined) {
      if (aOrder !== bOrder) {
        return aOrder - bOrder
      }
      // Tie-breaker 1: original index
      if (a.originalIndex !== b.originalIndex) {
        return a.originalIndex - b.originalIndex
      }
      // Tie-breaker 2: key (lexicographic)
      return a.section.key.localeCompare(b.section.key)
    }

    // Only a has orderIndex: a comes first
    if (aOrder !== undefined) {
      return -1
    }

    // Only b has orderIndex: b comes first
    if (bOrder !== undefined) {
      return 1
    }

    // Neither has orderIndex: preserve original order
    return a.originalIndex - b.originalIndex
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
        {sortedSections.map(({ section }) => (
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
