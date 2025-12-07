'use client'

import MobileAnswerButton from './MobileAnswerButton'

export type ScaleOption = {
  value: number
  label: string
}

export type ScaleAnswerButtonsProps = {
  questionId: string
  minValue: number
  maxValue: number
  value?: number
  onChange: (value: number) => void
  disabled?: boolean
  labels?: Record<number, string>
}

/**
 * Default labels for 0-4 scale (common stress assessment pattern)
 */
const DEFAULT_SCALE_LABELS: Record<number, string> = {
  0: 'Nie',
  1: 'Selten',
  2: 'Manchmal',
  3: 'Oft',
  4: 'Sehr häufig',
}

/**
 * ScaleAnswerButtons Component
 * 
 * Displays a horizontal scale of answer buttons from min_value to max_value.
 * Adapts to the range specified in the question database fields.
 * 
 * Features:
 * - Generates buttons dynamically based on min/max values
 * - Uses custom labels if provided, falls back to defaults for 0-4 scale
 * - Touch-optimized with 44x44px minimum targets
 * - Responsive flex layout with wrapping
 * 
 * @param questionId - Unique ID for the question (for radio group name)
 * @param minValue - Minimum value from questions.min_value
 * @param maxValue - Maximum value from questions.max_value
 * @param value - Currently selected value
 * @param onChange - Callback when value changes
 * @param disabled - Whether buttons are disabled
 * @param labels - Optional custom labels for scale values
 */
export default function ScaleAnswerButtons({
  questionId,
  minValue,
  maxValue,
  value,
  onChange,
  disabled = false,
  labels,
}: ScaleAnswerButtonsProps) {
  // Generate scale options based on min/max values
  const scaleOptions: ScaleOption[] = []
  for (let i = minValue; i <= maxValue; i++) {
    const customLabels = labels || DEFAULT_SCALE_LABELS
    scaleOptions.push({
      value: i,
      label: customLabels[i] || i.toString(),
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {scaleOptions.map((option) => (
        <div key={option.value} className="flex-1 min-w-[70px]">
          <MobileAnswerButton
            value={option.value}
            label={option.label}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            disabled={disabled}
            name={questionId}
            variant="scale"
          />
        </div>
      ))}
    </div>
  )
}
