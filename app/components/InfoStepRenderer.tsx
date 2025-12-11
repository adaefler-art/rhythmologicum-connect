'use client'

import type { InfoStepDefinition } from '@/lib/types/funnel'

/**
 * InfoStepRenderer - Renders informational/content steps
 * 
 * Displays content-only steps without questions
 */

export type InfoStepRendererProps = {
  step: InfoStepDefinition
}

export default function InfoStepRenderer({ step }: InfoStepRendererProps) {
  const content = 'content' in step ? step.content : step.description

  return (
    <div className="bg-sky-50 border border-sky-200 rounded-lg p-6">
      <p className="text-blue-900 leading-relaxed">{content}</p>
    </div>
  )
}
