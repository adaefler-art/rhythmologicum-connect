/**
 * CTA (Call-to-Action) Block Renderer (V05-I06.2)
 * 
 * Renders call-to-action button/link
 * 
 * V05-I06.2 Hardening: URL security validation
 * - Validates URLs to prevent XSS (javascript:, data:, etc.)
 * - External links get rel="noopener noreferrer"
 */

'use client'

import React from 'react'
import { type ContentSection } from '@/lib/contracts/funnelManifest'
import Link from 'next/link'
import { getSafeLinkProps } from '@/lib/utils/urlSecurity'

export type CTABlockRendererProps = {
  section: ContentSection
}

/**
 * CTA Block - Call-to-action button or link
 * 
 * Expected content fields:
 * - text: string (required) - button text
 * - href: string (required) - link destination
 * - variant?: 'primary' | 'secondary' | 'outline' (optional, default 'primary')
 * - alignment?: 'left' | 'center' | 'right' (optional, default 'center')
 * 
 * Security:
 * - URLs are validated to prevent XSS attacks
 * - Dangerous protocols (javascript:, data:) are rejected
 * - External links get rel="noopener noreferrer"
 */
export function CTABlockRenderer({ section }: CTABlockRendererProps) {
  const content = section.content || {}
  const text = content.text as string | undefined
  const href = content.href as string | undefined
  const variant = (content.variant as string | undefined) || 'primary'
  const alignment = (content.alignment as string | undefined) || 'center'

  const variantClasses = {
    primary: 'bg-sky-600 hover:bg-sky-700 text-white',
    secondary: 'bg-slate-600 hover:bg-slate-700 text-white',
    outline: 'border-2 border-sky-600 text-sky-600 hover:bg-sky-50 dark:border-sky-400 dark:text-sky-400 dark:hover:bg-slate-800',
  }[variant] || 'bg-sky-600 hover:bg-sky-700 text-white'

  const alignmentClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  }[alignment] || 'justify-center'

  if (!text || !href) {
    return (
      <div
        className={`cta-block flex ${alignmentClass} py-4`}
        data-section-key={section.key}
      />
    )
  }

  // Get safe link props with URL validation
  const linkProps = getSafeLinkProps(href)

  return (
    <div
      className={`cta-block flex ${alignmentClass} py-4`}
      data-section-key={section.key}
    >
      <Link
        {...linkProps}
        className={`px-6 py-3 rounded-lg font-semibold transition-colors duration-200 ${variantClasses}`}
      >
        {text}
      </Link>
    </div>
  )
}
