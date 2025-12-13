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
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-8">
          <div className="text-center">
            <div className="mb-4 text-4xl" role="img" aria-label="Fehler">
              ❌
            </div>
            <p className="text-lg font-semibold text-red-700 mb-4">
              Inhalt konnte nicht geladen werden
            </p>
            <p className="text-sm text-slate-600 mb-6">
              Der Inhalt dieser Seite ist nicht verfügbar. Bitte versuchen Sie es später erneut
              oder überspringen Sie diesen Schritt.
            </p>
            <button
              onClick={onNextStep}
              className="inline-flex justify-center items-center px-6 py-3 bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-700 transition-all"
              style={{ minHeight: '56px' }}
            >
              Weiter →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Mobile layout using MobileContentPage
  if (isMobile) {
    return (
      <MobileContentPage
        title={contentPage.title}
        subtitle={step.description || undefined}
        ctaLabel={isLastStep ? 'Abschließen →' : 'Weiter →'}
        onCtaClick={onNextStep}
        secondaryLabel={!isFirstStep ? 'Zurück' : undefined}
        onSecondaryClick={!isFirstStep ? onPreviousStep : undefined}
        isLoading={submitting}
      >
        {contentPage.excerpt && (
          <div className="mb-6 p-4 sm:p-5 bg-sky-50 border-l-4 border-sky-500 rounded-lg">
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              {contentPage.excerpt}
            </p>
          </div>
        )}
        <Suspense fallback={<div className="animate-pulse text-slate-500">Lädt...</div>}>
          <MarkdownRenderer content={contentPage.body_markdown} />
        </Suspense>
      </MobileContentPage>
    )
  }

  // Desktop card-based layout - consistent with PatientFlowRenderer styling
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200/80 overflow-hidden">
        {/* Content Header */}
        <div className="bg-gradient-to-br from-sky-50 to-blue-50 px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-200/80">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-900 leading-tight">
            {contentPage.title}
          </h2>
          {step.description && (
            <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
              {step.description}
            </p>
          )}
        </div>

        {/* Content Body */}
        <div className="px-6 sm:px-8 py-6 sm:py-8">
          {/* Excerpt */}
          {contentPage.excerpt && (
            <div className="mb-6 p-4 sm:p-5 bg-sky-50 border-l-4 border-sky-500 rounded-lg">
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                {contentPage.excerpt}
              </p>
            </div>
          )}

          {/* Main Content */}
          <div className="prose prose-slate prose-sm sm:prose-base max-w-none">
            <Suspense fallback={<div className="animate-pulse text-slate-500">Lädt...</div>}>
              <MarkdownRenderer content={contentPage.body_markdown} />
            </Suspense>
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="bg-slate-50 px-6 sm:px-8 py-5 sm:py-6 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {!isFirstStep && (
              <button
                onClick={onPreviousStep}
                disabled={submitting}
                className="w-full sm:flex-1 inline-flex justify-center items-center px-5 sm:px-6 py-3 sm:py-4 rounded-xl bg-slate-200 text-slate-700 text-sm sm:text-base font-semibold hover:bg-slate-300 active:bg-slate-400 disabled:opacity-60 disabled:cursor-not-allowed transition-all touch-manipulation"
                style={{ minHeight: '56px' }}
              >
                ← Zurück
              </button>
            )}
            <button
              onClick={onNextStep}
              disabled={submitting}
              className={`${isFirstStep ? 'w-full' : 'w-full sm:flex-1'} inline-flex justify-center items-center px-5 sm:px-6 py-3 sm:py-4 rounded-xl bg-sky-600 text-white text-sm sm:text-base font-semibold shadow-md hover:bg-sky-700 active:bg-sky-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all touch-manipulation`}
              style={{ minHeight: '56px' }}
            >
              {submitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Bitte warten...
                </>
              ) : isLastStep ? (
                'Abschließen →'
              ) : (
                'Weiter →'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
