/**
 * Section Renderer (V05-I06.2)
 * 
 * Renders individual content sections based on type
 * Type-safe switch on SECTION_TYPE from registry
 * Fail-closed: Unknown types → error
 */

'use client'

import React from 'react'
import { type ContentSection, SECTION_TYPE, isValidSectionType } from '@/lib/contracts/funnelManifest'
import { HeroBlockRenderer } from './blocks/HeroBlockRenderer'
import { TextBlockRenderer } from './blocks/TextBlockRenderer'
import { ImageBlockRenderer } from './blocks/ImageBlockRenderer'
import { VideoBlockRenderer } from './blocks/VideoBlockRenderer'
import { MarkdownBlockRenderer } from './blocks/MarkdownBlockRenderer'
import { CTABlockRenderer } from './blocks/CTABlockRenderer'
import { DividerBlockRenderer } from './blocks/DividerBlockRenderer'

export type SectionRendererProps = {
  section: ContentSection
  onBlockTypeError?: (blockType: string, sectionKey: string) => void
}

/**
 * UnsupportedBlockTypeError
 * Thrown when encountering unknown block type (fail-closed behavior)
 */
export class UnsupportedBlockTypeError extends Error {
  constructor(public blockType: string, public sectionKey: string) {
    super(`Unsupported block type: "${blockType}" in section "${sectionKey}"`)
    this.name = 'UnsupportedBlockTypeError'
  }
}

/**
 * Section Renderer - Type-safe switch on section type
 * 
 * Uses registry SECTION_TYPE for type checking
 * Unknown types → controlled error (no silent fallbacks)
 */
export function SectionRenderer({ section, onBlockTypeError }: SectionRendererProps) {
  // Type guard validation (should already be validated by Zod, but double-check)
  if (!isValidSectionType(section.type)) {
    const error = new UnsupportedBlockTypeError(section.type, section.key)
    
    if (onBlockTypeError) {
      onBlockTypeError(section.type, section.key)
      return null
    }
    
    throw error
  }

  // Type-safe switch on SECTION_TYPE (exhaustive)
  switch (section.type) {
    case SECTION_TYPE.HERO:
      return <HeroBlockRenderer section={section} />
    
    case SECTION_TYPE.TEXT:
      return <TextBlockRenderer section={section} />
    
    case SECTION_TYPE.IMAGE:
      return <ImageBlockRenderer section={section} />
    
    case SECTION_TYPE.VIDEO:
      return <VideoBlockRenderer section={section} />
    
    case SECTION_TYPE.MARKDOWN:
      return <MarkdownBlockRenderer section={section} />
    
    case SECTION_TYPE.CTA:
      return <CTABlockRenderer section={section} />
    
    case SECTION_TYPE.DIVIDER:
      return <DividerBlockRenderer section={section} />
    
    default: {
      // TypeScript exhaustiveness check
      const _exhaustiveCheck: never = section.type
      const error = new UnsupportedBlockTypeError(String(_exhaustiveCheck), section.key)
      
      if (onBlockTypeError) {
        onBlockTypeError(String(_exhaustiveCheck), section.key)
        return null
      }
      
      throw error
    }
  }
}
