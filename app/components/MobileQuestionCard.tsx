'use client'

import { useState } from 'react'
import type { Question, Funnel } from '@/lib/types/funnel'

export type MobileQuestionCardProps = {
  funnel: Funnel
  question: Question
  currentQuestionIndex: number
  totalQuestions: number
  value?: number | string
  onChange: (questionId: string, value: number | string) => void
  onNext?: () => void
  onPrevious?: () => void
  isFirst?: boolean
  isLast?: boolean
  isRequired?: boolean
  error?: string | null
  isLoading?: boolean
}

const SCALE_OPTIONS = [
  { value: 0, label: 'Nie' },
  { value: 1, label: 'Selten' },
  { value: 2, label: 'Manchmal' },
  { value: 3, label: 'Oft' },
  { value: 4, label: 'Sehr häufig' },
]

export default function MobileQuestionCard({
  funnel,
  question,
  currentQuestionIndex,
  totalQuestions,
  value,
  onChange,
  onNext,
  onPrevious,
  isFirst = false,
  isLast = false,
  isRequired = true,
  error = null,
  isLoading = false,
}: MobileQuestionCardProps) {
  const [isFocused, setIsFocused] = useState(false)
  const isAnswered = value !== undefined && value !== null

  const progressPercent = ((currentQuestionIndex + 1) / totalQuestions) * 100

  // Determine scale options based on question type
  const getScaleOptions = () => {
    if (question.question_type === 'scale' && question.min_value !== null && question.max_value !== null) {
      const options = []
      for (let i = question.min_value; i <= question.max_value; i++) {
        options.push({ value: i, label: i.toString() })
      }
      return options
    }
    return SCALE_OPTIONS
  }

  const scaleOptions = getScaleOptions()

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4 shadow-sm">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-medium uppercase tracking-wide text-sky-600 mb-1">
            {funnel.subtitle || 'Fragebogen'}
          </p>
          <h1 className="text-lg font-semibold text-slate-900 leading-tight">
            {funnel.title}
          </h1>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between text-sm text-slate-700 mb-2">
            <span className="font-medium">
              Frage {currentQuestionIndex + 1} von {totalQuestions}
            </span>
            <span className="text-xs text-slate-500">{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-2 bg-sky-500 transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Card - Scrollable Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div
            className={`bg-white rounded-2xl shadow-lg border-2 transition-all duration-200 ${
              isFocused ? 'border-sky-400 shadow-xl' : 'border-slate-200'
            } ${isAnswered ? 'border-sky-200 bg-sky-50/30' : ''}`}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          >
            {/* Question Text */}
            <div className="p-6 pb-4">
              <h2 className="text-xl font-semibold text-slate-900 leading-relaxed mb-3">
                {question.label}
              </h2>
              {question.help_text && (
                <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-sky-900 leading-relaxed flex items-start gap-2">
                    <span className="text-lg flex-shrink-0">💡</span>
                    <span>{question.help_text}</span>
                  </p>
                </div>
              )}
              {isRequired && !isAnswered && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                  ⚠️ Bitte wählen Sie eine Antwort aus
                </p>
              )}
            </div>

            {/* Answer Options */}
            <div className="px-6 pb-6">
              {question.question_type === 'scale' && (
                <div className="flex flex-wrap gap-2">
                  {scaleOptions.map((option) => {
                    const optionId = `${question.id}-${option.value}`
                    const checked = value === option.value
                    return (
                      <label
                        key={option.value}
                        htmlFor={optionId}
                        className={`flex-1 min-w-[70px] flex flex-col items-center gap-1 px-3 py-4 rounded-xl border-2 cursor-pointer transition-all ${
                          checked
                            ? 'bg-sky-600 text-white border-sky-600 shadow-md scale-105'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-sky-400 hover:bg-sky-50 active:scale-95'
                        }`}
                        style={{ minHeight: '44px' }}
                      >
                        <input
                          id={optionId}
                          type="radio"
                          className="sr-only"
                          name={question.id}
                          value={option.value}
                          checked={checked}
                          onChange={() => onChange(question.id, option.value)}
                          aria-label={`${option.label} (Wert ${option.value})`}
                          disabled={isLoading}
                        />
                        <span className="text-2xl font-bold">{option.value}</span>
                        <span className="text-sm font-medium text-center">{option.label}</span>
                      </label>
                    )
                  })}
                </div>
              )}

              {question.question_type === 'text' && (
                <textarea
                  value={(value as string) || ''}
                  onChange={(e) => onChange(question.id, e.target.value)}
                  className="w-full min-h-[120px] px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all text-base leading-relaxed"
                  placeholder="Ihre Antwort..."
                  disabled={isLoading}
                  style={{ fontSize: '16px' }}
                />
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mx-6 mb-6 text-sm text-red-700 bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
                <span className="text-xl flex-shrink-0">❌</span>
                <p className="leading-relaxed">{error}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Navigation Footer */}
      <footer className="bg-white border-t border-slate-200 px-4 py-4 shadow-lg">
        <div className="max-w-2xl mx-auto flex gap-3">
          {!isFirst && onPrevious && (
            <button
              type="button"
              onClick={onPrevious}
              disabled={isLoading}
              className="px-6 py-4 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              style={{ minHeight: '56px' }}
            >
              ← Zurück
            </button>
          )}
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              disabled={!isAnswered || isLoading}
              className="flex-1 px-6 py-4 rounded-xl bg-sky-600 text-white font-semibold shadow-md hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95"
              style={{ minHeight: '56px' }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
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
                </span>
              ) : (
                <>{isLast ? '✓ Abschließen' : 'Weiter →'}</>
              )}
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}
