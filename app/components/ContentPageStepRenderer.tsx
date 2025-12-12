'use client'

import { lazy, Suspense } from 'react'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import { MobileContentPage } from '@/app/components/mobile'
import type { ContentPageStepDefinition } from '@/lib/types/funnel'

// Lazy load the markdown renderer for performance
const MarkdownRenderer = lazy(() => import('@/app/components/MarkdownRenderer'))

type ContentPageStepRendererProps = {
  step: ContentPageStepDefinition
  onNextStep: () => void
  onPreviousStep: () => void
  isFirstStep: boolean
  isLastStep: boolean
  submitting: boolean
  totalQuestions: number
  answeredCount: number
}

/**
 * ContentPageStepRenderer - Renders content page steps in funnel flow
 * 
 * Displays editorial content as part of the assessment flow.
 * On mobile, uses MobileContentPage for optimized viewing.
 * On desktop, uses card-based layout consistent with question steps.
 */
export default function ContentPageStepRenderer({
  step,
  onNextStep,
  onPreviousStep,
  isFirstStep,
  isLastStep,
  submitting,
}: ContentPageStepRendererProps) {
  const isMobile = useIsMobile()
  const contentPage = step.contentPage

  if (!contentPage) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">Inhalt konnte nicht geladen werden.</p>
        <button
          onClick={onNextStep}
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Weiter
        </button>
      </div>
    )
  }

  // Mobile layout using MobileContentPage
  if (isMobile) {
    return (
      <MobileContentPage
        title={contentPage.title}
        subtitle={step.description || undefined}
        ctaLabel={isLastStep ? 'Abschließen' : 'Weiter'}
        onCtaClick={onNextStep}
        secondaryLabel={!isFirstStep ? 'Zurück' : undefined}
        onSecondaryClick={!isFirstStep ? onPreviousStep : undefined}
        isLoading={submitting}
      >
        {contentPage.excerpt && (
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-sm text-gray-700">{contentPage.excerpt}</p>
          </div>
        )}
        <Suspense fallback={<div className="animate-pulse">Lädt...</div>}>
          <MarkdownRenderer content={contentPage.body_markdown || ''} />
        </Suspense>
      </MobileContentPage>
    )
  }

  // Desktop card-based layout
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        {/* Title */}
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">{contentPage.title}</h2>
        
        {/* Description/subtitle */}
        {step.description && (
          <p className="text-sm text-gray-600 mb-6">{step.description}</p>
        )}

        {/* Excerpt */}
        {contentPage.excerpt && (
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-sm text-gray-700">{contentPage.excerpt}</p>
          </div>
        )}

        {/* Content */}
        <div className="prose prose-sm max-w-none mb-8">
          <Suspense fallback={<div className="animate-pulse">Lädt...</div>}>
            <MarkdownRenderer content={contentPage.body_markdown || ''} />
          </Suspense>
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t">
          {!isFirstStep ? (
            <button
              onClick={onPreviousStep}
              disabled={submitting}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Zurück
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onNextStep}
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Lädt...' : isLastStep ? 'Abschließen' : 'Weiter'}
          </button>
        </div>
      </div>
    </div>
  )
}
