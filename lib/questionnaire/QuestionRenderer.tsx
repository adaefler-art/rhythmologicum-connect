/**
 * Adaptive Question Renderer (V05-I03.2)
 * 
 * Renders questions based on their type from the registry.
 * Supports: radio, checkbox, text, textarea, number, scale, slider
 * All types from QUESTION_TYPE in registry - NO NEW TYPES.
 */

'use client'

import { memo } from 'react'
import type { QuestionConfig, QuestionOption } from '@/lib/contracts/funnelManifest'
import { QUESTION_TYPE } from '@/lib/contracts/registry'

export type QuestionRendererProps = {
  question: QuestionConfig
  value: string | number | boolean | string[] | undefined
  onChange: (value: string | number | boolean | string[]) => void
  error?: string | null
  className?: string
}

/**
 * Main question renderer - delegates to specific type renderers
 */
export default memo(function QuestionRenderer({
  question,
  value,
  onChange,
  error,
  className = '',
}: QuestionRendererProps) {
  // Render based on question type
  switch (question.type) {
    case QUESTION_TYPE.RADIO:
      return <RadioQuestion question={question} value={value} onChange={onChange} error={error} className={className} />
    case QUESTION_TYPE.CHECKBOX:
      return <CheckboxQuestion question={question} value={value} onChange={onChange} error={error} className={className} />
    case QUESTION_TYPE.TEXT:
      return <TextQuestion question={question} value={value} onChange={onChange} error={error} className={className} />
    case QUESTION_TYPE.TEXTAREA:
      return <TextareaQuestion question={question} value={value} onChange={onChange} error={error} className={className} />
    case QUESTION_TYPE.NUMBER:
      return <NumberQuestion question={question} value={value} onChange={onChange} error={error} className={className} />
    case QUESTION_TYPE.SCALE:
      return <ScaleQuestion question={question} value={value} onChange={onChange} error={error} className={className} />
    case QUESTION_TYPE.SLIDER:
      return <SliderQuestion question={question} value={value} onChange={onChange} error={error} className={className} />
    default:
      return <UnknownTypeError type={question.type} />
  }
})

/**
 * Radio question renderer (single choice)
 */
function RadioQuestion({ question, value, onChange, error, className }: QuestionRendererProps) {
  const options = question.options || []

  return (
    <div className={className}>
      <fieldset>
        <legend className="sr-only">{question.label}</legend>
        <div className="space-y-2">
          {options.map((option) => (
            <label
              key={option.value}
              className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:border-sky-300 ${
                value === option.value
                  ? 'border-sky-500 bg-sky-50'
                  : error
                    ? 'border-red-200 bg-red-50/30'
                    : 'border-slate-200 bg-white'
              }`}
            >
              <input
                type="radio"
                name={question.id}
                value={option.value}
                checked={value === option.value}
                onChange={(e) => onChange(e.target.value)}
                className="mt-1 h-4 w-4 text-sky-600 focus:ring-sky-500"
              />
              <div className="flex-1">
                <div className="font-medium text-slate-900">{option.label}</div>
                {option.helpText && (
                  <div className="text-sm text-slate-600 mt-1">{option.helpText}</div>
                )}
              </div>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  )
}

/**
 * Checkbox question renderer (multiple choice)
 */
function CheckboxQuestion({ question, value, onChange, error, className }: QuestionRendererProps) {
  const options = question.options || []
  const selectedValues = Array.isArray(value) ? value : []

  const handleToggle = (optionValue: string) => {
    const newValues = selectedValues.includes(optionValue)
      ? selectedValues.filter((v) => v !== optionValue)
      : [...selectedValues, optionValue]
    onChange(newValues)
  }

  return (
    <div className={className}>
      <fieldset>
        <legend className="sr-only">{question.label}</legend>
        <div className="space-y-2">
          {options.map((option) => (
            <label
              key={option.value}
              className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:border-sky-300 ${
                selectedValues.includes(option.value)
                  ? 'border-sky-500 bg-sky-50'
                  : error
                    ? 'border-red-200 bg-red-50/30'
                    : 'border-slate-200 bg-white'
              }`}
            >
              <input
                type="checkbox"
                value={option.value}
                checked={selectedValues.includes(option.value)}
                onChange={() => handleToggle(option.value)}
                className="mt-1 h-4 w-4 text-sky-600 focus:ring-sky-500 rounded"
              />
              <div className="flex-1">
                <div className="font-medium text-slate-900">{option.label}</div>
                {option.helpText && (
                  <div className="text-sm text-slate-600 mt-1">{option.helpText}</div>
                )}
              </div>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  )
}

/**
 * Text input renderer
 */
function TextQuestion({ question, value, onChange, error, className }: QuestionRendererProps) {
  return (
    <div className={className}>
      <input
        type="text"
        id={question.id}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.helpText}
        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 ${
          error ? 'border-red-300 bg-red-50' : 'border-slate-200'
        }`}
      />
    </div>
  )
}

/**
 * Textarea renderer
 */
function TextareaQuestion({ question, value, onChange, error, className }: QuestionRendererProps) {
  return (
    <div className={className}>
      <textarea
        id={question.id}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.helpText}
        rows={4}
        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 resize-y ${
          error ? 'border-red-300 bg-red-50' : 'border-slate-200'
        }`}
      />
    </div>
  )
}

/**
 * Number input renderer
 */
function NumberQuestion({ question, value, onChange, error, className }: QuestionRendererProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val === '') {
      // Allow clearing the input for optional fields
      onChange(val as any)
    } else {
      const numValue = parseFloat(val)
      if (!isNaN(numValue)) {
        onChange(numValue)
      }
    }
  }

  return (
    <div className={className}>
      <input
        type="number"
        id={question.id}
        value={typeof value === 'number' ? value : ''}
        onChange={handleChange}
        min={question.validation?.min}
        max={question.validation?.max}
        placeholder={question.helpText}
        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 ${
          error ? 'border-red-300 bg-red-50' : 'border-slate-200'
        }`}
      />
    </div>
  )
}

/**
 * Scale question renderer (buttons 1-10 or custom range)
 */
function ScaleQuestion({ question, value, onChange, error, className }: QuestionRendererProps) {
  const min = question.minValue || 1
  const max = question.maxValue || 10
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`flex-1 min-w-[3rem] px-4 py-3 border-2 rounded-lg font-semibold transition-all ${
              value === option
                ? 'border-sky-500 bg-sky-500 text-white'
                : error
                  ? 'border-red-200 bg-red-50 text-slate-700 hover:border-red-300'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      {(question.minValue !== undefined || question.maxValue !== undefined) && (
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  )
}

/**
 * Slider question renderer
 */
function SliderQuestion({ question, value, onChange, error, className }: QuestionRendererProps) {
  const min = question.minValue || 0
  const max = question.maxValue || 100
  const currentValue = typeof value === 'number' ? value : min

  return (
    <div className={className}>
      <input
        type="range"
        id={question.id}
        value={currentValue}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
      />
      <div className="flex justify-between mt-2 text-sm text-slate-600">
        <span>{min}</span>
        <span className="font-semibold text-sky-600">{currentValue}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

/**
 * Unknown type error - controlled error path as per requirements
 */
function UnknownTypeError({ type }: { type: string }) {
  return (
    <div className="p-4 border-2 border-amber-300 bg-amber-50 rounded-lg">
      <p className="text-sm font-semibold text-amber-900">Unbekannter Fragetyp</p>
      <p className="text-xs text-amber-700 mt-1">
        Der Fragetyp &quot;{type}&quot; wird nicht unterstützt. Bitte kontaktieren Sie den Support.
      </p>
    </div>
  )
}
