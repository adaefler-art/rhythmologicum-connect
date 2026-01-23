'use client'

/**
 * AssessmentProgress - Displays progress through the assessment
 * 
 * Shows both question completion count and visual progress bar
 */

export type AssessmentProgressProps = {
  answeredCount: number
  totalQuestions: number
  progressPercent: number
}

export default function AssessmentProgress({
  answeredCount,
  totalQuestions,
  progressPercent,
}: AssessmentProgressProps) {
  return (
    <div className="mb-4 sm:mb-6 flex flex-col gap-2 sm:gap-3">
      <div className="flex items-center justify-between text-xs sm:text-sm md:text-base text-slate-700">
        <span className="font-medium">
          {answeredCount} / {totalQuestions} Fragen
        </span>
        <span className="text-xs sm:text-sm text-slate-500 font-medium">
          {Math.round(progressPercent)}%
        </span>
      </div>
      <div className="w-full h-2 sm:h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-sky-500 to-sky-600 transition-all duration-300 ease-out rounded-full"
          style={{ width: `${progressPercent}%` }}
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${answeredCount} von ${totalQuestions} Fragen beantwortet`}
        />
      </div>
    </div>
  )
}
