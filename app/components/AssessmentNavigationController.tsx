'use client'

/**
 * AssessmentNavigationController - Manages navigation between assessment steps
 * 
 * Provides Back and Next buttons with appropriate states
 */

export type AssessmentNavigationControllerProps = {
  onNextStep: () => void
  onPreviousStep: () => void
  isFirstStep: boolean
  isLastStep: boolean
  submitting: boolean
}

export default function AssessmentNavigationController({
  onNextStep,
  onPreviousStep,
  isFirstStep,
  isLastStep,
  submitting,
}: AssessmentNavigationControllerProps) {
  return (
    <div className="mt-8 flex gap-4">
      {!isFirstStep && (
        <button
          type="button"
          onClick={onPreviousStep}
          disabled={submitting}
          className="flex-1 inline-flex justify-center items-center px-6 py-4 md:py-5 rounded-xl bg-slate-200 text-slate-700 text-base md:text-lg font-semibold hover:bg-slate-300 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          ← Zurück
        </button>
      )}
      <button
        type="button"
        onClick={onNextStep}
        disabled={submitting}
        className="flex-1 inline-flex justify-center items-center px-6 py-4 md:py-5 rounded-xl bg-sky-600 text-white text-base md:text-lg font-semibold shadow-md hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-sky-600 transition-all"
        style={{ minHeight: '56px' }}
      >
        {submitting ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Bitte warten…
          </>
        ) : isLastStep ? (
          '✓ Antworten speichern & weiter'
        ) : (
          'Weiter →'
        )}
      </button>
    </div>
  )
}
