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
    <div className="mb-6 flex flex-col gap-3">
      <div className="flex items-center justify-between text-sm md:text-base text-slate-700">
        <span className="font-medium">
          Frage {answeredCount} von {totalQuestions} beantwortet
        </span>
        <span className="text-xs md:text-sm text-slate-500">
          {Math.round(progressPercent)}% abgeschlossen
        </span>
      </div>
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-3 bg-sky-500 transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  )
}
