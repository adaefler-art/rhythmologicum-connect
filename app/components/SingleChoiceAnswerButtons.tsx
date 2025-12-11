'use client'

import { memo } from 'react'
import MobileAnswerButton from './MobileAnswerButton'

export type ChoiceOption = {
  value: string | number
  label: string
  sublabel?: string
}

export type SingleChoiceAnswerButtonsProps = {
  questionId: string
  options: ChoiceOption[]
  value?: string | number
  onChange: (value: string | number) => void
  disabled?: boolean
  layout?: 'vertical' | 'grid'
}

/**
 * SingleChoiceAnswerButtons Component
 * 
 * Displays multiple choice buttons for single-select questions.
 * Options can be provided dynamically based on the question key.
 * 
 * Features:
 * - Flexible option configuration (label, value, optional sublabel)
 * - Two layout modes: vertical (stacked) or grid (2-column)
 * - Touch-optimized with 44x44px minimum targets
 * - Each option can have a main label and optional sublabel
 * 
 * Layout modes:
 * - vertical: One button per row (default, good for 2-4 options)
 * - grid: Two columns (good for 4+ short options)
 * 
 * Option mapping:
 * The parent component or a helper function should map question.key
 * to appropriate option sets. For example:
 * - "exercise_frequency" -> ["Nie", "1-2x/Woche", "3-4x/Woche", "Täglich"]
 * - "employment_status" -> ["Vollzeit", "Teilzeit", "Selbstständig", "Arbeitslos"]
 * 
 * @param questionId - Unique ID for the question (for radio group name)
 * @param options - Array of choice options with value and label
 * @param value - Currently selected value
 * @param onChange - Callback when value changes
 * @param disabled - Whether buttons are disabled
 * @param layout - Layout mode: 'vertical' or 'grid'
 * 
 * Performance: Memoized to prevent unnecessary re-renders
 */
const SingleChoiceAnswerButtons = memo(function SingleChoiceAnswerButtons({
  questionId,
  options,
  value,
  onChange,
  disabled = false,
  layout = 'vertical',
}: SingleChoiceAnswerButtonsProps) {
  const containerClass =
    layout === 'grid'
      ? 'grid grid-cols-2 gap-3'
      : 'flex flex-col gap-3'

  return (
    <div className={containerClass}>
      {options.map((option) => (
        <div key={option.value}>
          <MobileAnswerButton
            value={option.value}
            label={option.label}
            sublabel={option.sublabel}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            disabled={disabled}
            name={questionId}
            variant="choice"
          />
        </div>
      ))}
    </div>
  )
})

export default SingleChoiceAnswerButtons
