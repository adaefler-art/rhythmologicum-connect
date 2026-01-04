/**
 * Divider Block Renderer (V05-I06.2)
 * 
 * Renders visual divider/separator
 */

'use client'

import React from 'react'
import { type ContentSection } from '@/lib/contracts/funnelManifest'

export type DividerBlockRendererProps = {
  section: ContentSection
}

/**
 * Divider Block - Visual separator between content sections
 * 
 * Expected content fields:
 * - style?: 'solid' | 'dashed' | 'dotted' (optional, default 'solid')
 * - spacing?: 'sm' | 'md' | 'lg' (optional, default 'md')
 */
export function DividerBlockRenderer({ section }: DividerBlockRendererProps) {
  const content = section.content || {}
  const style = (content.style as string | undefined) || 'solid'
  const spacing = (content.spacing as string | undefined) || 'md'

  const styleClasses = {
    solid: 'border-solid',
    dashed: 'border-dashed',
    dotted: 'border-dotted',
  }[style] || 'border-solid'

  const spacingClasses = {
    sm: 'my-2',
    md: 'my-4',
    lg: 'my-8',
  }[spacing] || 'my-4'

  return (
    <hr
      className={`divider-block border-slate-200 dark:border-slate-700 ${styleClasses} ${spacingClasses}`}
      data-section-key={section.key}
    />
  )
}
