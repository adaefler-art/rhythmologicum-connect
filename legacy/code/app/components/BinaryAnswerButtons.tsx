'use client'

import { memo } from 'react'
import MobileAnswerButton from './MobileAnswerButton'

export type BinaryAnswerButtonsProps = {
  questionId: string
  value?: boolean | number | string
  onChange: (value: boolean | number | string) => void
  disabled?: boolean
  yesLabel?: string
  noLabel?: string
  yesValue?: boolean | number | string
  noValue?: boolean | number | string
}

/**
 * BinaryAnswerButtons Component
 * 
 * Displays two large buttons for binary choice questions (Yes/No, True/False, etc.)
 * 
 * Features:
 * - Customizable labels and values for both options
 * - Equal-width buttons for visual balance
 * - Touch-optimized with 44x44px minimum targets
 * - Supports boolean, number, or string values
 * 
 * Performance: Memoized to prevent unnecessary re-renders
 * 
 * Common use cases:
 * - Yes/No questions
 * - True/False questions
 * - Agree/Disagree questions
 * - Any binary choice
 * 
 * @param questionId - Unique ID for the question (for radio group name)
 * @param value - Currently selected value
 * @param onChange - Callback when value changes
 * @param disabled - Whether buttons are disabled
 * @param yesLabel - Label for affirmative option (default: "Ja")
 * @param noLabel - Label for negative option (default: "Nein")
 * @param yesValue - Value for affirmative option (default: true)
 * @param noValue - Value for negative option (default: false)
 */
const BinaryAnswerButtons = memo(function BinaryAnswerButtons({
  questionId,
  value,
  onChange,
  disabled = false,
  yesLabel = 'Ja',
  noLabel = 'Nein',
  yesValue = true,
  noValue = false,
}: BinaryAnswerButtonsProps) {
  return (
    <div className="flex gap-3">
      <div className="flex-1">
        <MobileAnswerButton
          value={String(noValue)}
          label={noLabel}
          checked={value === noValue}
          onChange={() => onChange(noValue)}
          disabled={disabled}
          name={questionId}
          variant="binary"
        />
      </div>
      <div className="flex-1">
        <MobileAnswerButton
          value={String(yesValue)}
          label={yesLabel}
          checked={value === yesValue}
          onChange={() => onChange(yesValue)}
          disabled={disabled}
          name={questionId}
          variant="binary"
        />
      </div>
    </div>
  )
})

export default BinaryAnswerButtons
