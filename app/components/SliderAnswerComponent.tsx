'use client'

import { memo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { componentTokens, typography, spacing, colors } from '@/lib/design-tokens'

/**
 * SliderAnswerComponent - A continuous slider for scale questions
 * 
 * Provides an alternative to discrete button-based scales for questions
 * that benefit from continuous input (e.g., "Rate your stress level from 0-100").
 * 
 * Features:
 * - Touch-optimized slider with large thumb
 * - Visual feedback with gradient track
 * - Real-time value display
 * - Labels for min/max values
 * - Smooth animations
 * - Accessible with keyboard support
 */

export type SliderAnswerComponentProps = {
  questionId: string
  minValue: number
  maxValue: number
  value?: number
  onChange: (value: number) => void
  disabled?: boolean
  minLabel?: string
  maxLabel?: string
  step?: number
  showValue?: boolean
}

const SliderAnswerComponent = memo(function SliderAnswerComponent({
  questionId,
  minValue,
  maxValue,
  value,
  onChange,
  disabled = false,
  minLabel,
  maxLabel,
  step = 1,
  showValue = true,
}: SliderAnswerComponentProps) {
  const [localValue, setLocalValue] = useState(value ?? minValue)
  const [isDragging, setIsDragging] = useState(false)

  // Update local value when prop changes
  useEffect(() => {
    if (value !== undefined && value !== localValue) {
      setLocalValue(value)
    }
  }, [value, localValue])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value)
    setLocalValue(newValue)
    onChange(newValue)
  }

  const handleMouseDown = () => setIsDragging(true)
  const handleMouseUp = () => setIsDragging(false)

  // Calculate percentage for visual feedback
  const percentage = ((localValue - minValue) / (maxValue - minValue)) * 100

  return (
    <div className="w-full">
      {/* Value Display */}
      {showValue && (
        <motion.div
          className="text-center mb-4"
          animate={{ scale: isDragging ? 1.1 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="inline-flex items-center justify-center font-bold text-white rounded-full"
            style={{
              fontSize: typography.fontSize['3xl'],
              width: '80px',
              height: '80px',
              background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`,
              boxShadow: isDragging ? '0 10px 20px rgba(14, 165, 233, 0.3)' : '0 4px 8px rgba(14, 165, 233, 0.2)',
              transition: 'box-shadow 0.2s ease',
            }}
          >
            {Math.round(localValue)}
          </div>
        </motion.div>
      )}

      {/* Slider Track Container */}
      <div className="relative" style={{ padding: `${spacing.lg} ${spacing.md}` }}>
        {/* Custom Track Background */}
        <div
          className="absolute w-full h-2 rounded-full overflow-hidden"
          style={{
            top: '50%',
            transform: 'translateY(-50%)',
            left: spacing.md,
            right: spacing.md,
            width: `calc(100% - ${spacing.md} * 2)`,
          }}
        >
          {/* Background track */}
          <div
            className="absolute inset-0 bg-slate-200"
            style={{ borderRadius: componentTokens.progressBar.borderRadius }}
          />
          {/* Filled track */}
          <motion.div
            className="absolute inset-y-0 left-0"
            style={{
              width: `${percentage}%`,
              background: `linear-gradient(90deg, ${colors.primary[400]} 0%, ${colors.primary[600]} 100%)`,
              borderRadius: componentTokens.progressBar.borderRadius,
            }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>

        {/* Native Slider Input */}
        <input
          id={questionId}
          type="range"
          min={minValue}
          max={maxValue}
          step={step}
          value={localValue}
          onChange={handleChange}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          disabled={disabled}
          className="relative w-full h-12 cursor-pointer appearance-none bg-transparent z-10"
          style={{
            // Custom thumb styling (webkit)
            WebkitAppearance: 'none',
          }}
          aria-label={`Wert zwischen ${minValue} und ${maxValue}`}
          aria-valuemin={minValue}
          aria-valuemax={maxValue}
          aria-valuenow={localValue}
        />
      </div>

      {/* Min/Max Labels */}
      <div className="flex justify-between items-center" style={{ padding: `0 ${spacing.md}` }}>
        <span
          className="text-slate-600 font-medium"
          style={{ fontSize: typography.fontSize.sm }}
        >
          {minLabel || minValue}
        </span>
        <span
          className="text-slate-600 font-medium"
          style={{ fontSize: typography.fontSize.sm }}
        >
          {maxLabel || maxValue}
        </span>
      </div>

      {/* Custom CSS for slider thumb */}
      <style jsx>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          border: 3px solid ${colors.primary[500]};
          transition: all 0.2s ease;
        }

        input[type='range']::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
        }

        input[type='range']::-webkit-slider-thumb:active {
          transform: scale(1.15);
          box-shadow: 0 8px 16px rgba(14, 165, 233, 0.3);
        }

        input[type='range']::-moz-range-thumb {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          border: 3px solid ${colors.primary[500]};
          transition: all 0.2s ease;
        }

        input[type='range']::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
        }

        input[type='range']::-moz-range-thumb:active {
          transform: scale(1.15);
          box-shadow: 0 8px 16px rgba(14, 165, 233, 0.3);
        }

        input[type='range']:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        input[type='range']:disabled::-webkit-slider-thumb {
          cursor: not-allowed;
        }

        input[type='range']:disabled::-moz-range-thumb {
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
})

export default SliderAnswerComponent
