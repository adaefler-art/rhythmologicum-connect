'use client'

import { motion } from 'framer-motion'
import { componentTokens, motion as motionTokens } from '@/lib/design-tokens'

export type MobileAnswerButtonProps = {
  value: number | string
  label: string
  sublabel?: string
  checked: boolean
  onChange: () => void
  disabled?: boolean
  name: string
  variant?: 'scale' | 'binary' | 'choice'
}

/**
 * Base Mobile Answer Button Component
 * 
 * A reusable button component for mobile questionnaires with:
 * - Touch-optimized 44x44px minimum target
 * - Visual states: idle, hover, active/pressed, disabled
 * - Micro-animations: scale effect and color transitions
 * - Accessible hidden radio input
 */
export default function MobileAnswerButton({
  value,
  label,
  sublabel,
  checked,
  onChange,
  disabled = false,
  name,
  variant = 'scale',
}: MobileAnswerButtonProps) {
  const buttonId = `${name}-${value}`
  
  // Use design tokens for consistent styling
  const tokens = componentTokens.answerButton

  // Base styles shared across all variants
  const baseStyles = 'flex flex-col items-center gap-1 border-2 cursor-pointer'
  
  // Checked state styles
  const checkedStyles = 'bg-sky-600 text-white border-sky-600 shadow-md'
  
  // Unchecked state styles with hover and active
  const uncheckedStyles = 'bg-white text-slate-700 border-slate-300 hover:border-sky-400 hover:bg-sky-50'
  
  // Disabled styles
  const disabledStyles = 'opacity-50 cursor-not-allowed'

  return (
    <motion.label
      htmlFor={buttonId}
      className={`${baseStyles} ${checked ? checkedStyles : uncheckedStyles} ${disabled ? disabledStyles : ''}`}
      style={{ 
        minHeight: tokens.minHeight,
        minWidth: tokens.minWidth,
        padding: `${tokens.paddingY} ${tokens.paddingX}`,
        borderRadius: tokens.borderRadius,
        transition: tokens.transition,
      }}
      // Micro-animations on tap - using design tokens
      whileTap={!disabled && !checked ? { scale: 0.95 } : undefined}
      initial={{ scale: 1 }}
      animate={{ 
        scale: checked ? 1.05 : 1,
        transition: motionTokens.spring.default
      }}
    >
      <input
        id={buttonId}
        type="radio"
        className="sr-only"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      
      {variant === 'scale' && (
        <>
          <span className="text-2xl font-bold" aria-hidden="true">
            {value}
          </span>
          <span className="text-sm font-medium text-center">{label}</span>
        </>
      )}
      
      {(variant === 'binary' || variant === 'choice') && (
        <>
          <span className="text-lg font-semibold text-center leading-tight">
            {label}
          </span>
          {sublabel && (
            <span className="text-xs text-center opacity-80">{sublabel}</span>
          )}
        </>
      )}
    </motion.label>
  )
}
