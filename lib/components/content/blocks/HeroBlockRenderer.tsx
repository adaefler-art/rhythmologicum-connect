/**
 * Hero Block Renderer (V05-I06.2)
 * 
 * Renders hero section with title, subtitle, and optional background
 */

'use client'

import React from 'react'
import { type ContentSection } from '@/lib/contracts/funnelManifest'

export type HeroBlockRendererProps = {
  section: ContentSection
}

/**
 * Hero Block - Large header section for page introduction
 * 
 * Expected content fields:
 * - title: string (required)
 * - subtitle?: string (optional)
 * - backgroundImage?: string (optional)
 * - alignment?: 'left' | 'center' | 'right' (optional, default 'center')
 */
export function HeroBlockRenderer({ section }: HeroBlockRendererProps) {
  const content = section.content || {}
  const title = content.title as string | undefined
  const subtitle = content.subtitle as string | undefined
  const backgroundImage = content.backgroundImage as string | undefined
  const alignment = (content.alignment as string | undefined) || 'center'

  const alignmentClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[alignment] || 'text-center'

  return (
    <div
      className={`hero-block rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 dark:from-sky-700 dark:to-sky-800 p-8 ${alignmentClass}`}
      data-section-key={section.key}
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
    >
      {title && (
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          {title}
        </h1>
      )}
      {subtitle && (
        <p className="text-lg text-sky-50">
          {subtitle}
        </p>
      )}
    </div>
  )
}
