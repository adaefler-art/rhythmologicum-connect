import { forwardRef, useId, type InputHTMLAttributes } from 'react'
import { radii, spacing } from '@/lib/design-tokens'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Error state */
  error?: boolean
  /** Error message to display */
  errorMessage?: string
  /** Helper text */
  helperText?: string
  /** Input size */
  inputSize?: 'sm' | 'md' | 'lg'
}

/**
 * Input Component
 * 
 * A styled text input component with error states and helper text.
 * Part of the V0.4 Design System.
 * 
 * Features:
 * - Error state with custom styling
 * - Helper text support
 * - Three size variants
 * - Accessible with proper ARIA attributes
 * - Consistent with form field styling from globals.css
 * 
 * @example
 * <Input
 *   type="email"
 *   placeholder="Enter your email"
 *   error={hasError}
 *   errorMessage="Invalid email address"
 * />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      error = false,
      errorMessage,
      helperText,
      inputSize = 'md',
      className = '',
      disabled = false,
      ...props
    },
    ref
  ) => {
    // Size configurations
    const sizeConfig = {
      sm: {
        padding: '0.5rem 0.75rem',
        fontSize: '0.875rem',
        minHeight: '36px',
      },
      md: {
        padding: '0.625rem 0.875rem',
        fontSize: '1rem',
        minHeight: '44px',
      },
      lg: {
        padding: '0.75rem 1rem',
        fontSize: '1.125rem',
        minHeight: '52px',
      },
    }

    const config = sizeConfig[inputSize]

    const baseClasses = `
      w-full
      border-2
      rounded-lg
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1
      disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed disabled:opacity-60
    `

    const stateClasses = error
      ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100 placeholder-red-400 dark:placeholder-red-300'
      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:border-sky-500'

    const generatedId = useId()
    const inputId = props.id || generatedId

    return (
      <div className="w-full">
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={`${baseClasses} ${stateClasses} ${className}`}
          style={{
            padding: config.padding,
            fontSize: config.fontSize,
            minHeight: config.minHeight,
            borderRadius: radii.lg,
          }}
          aria-invalid={error}
          aria-describedby={
            errorMessage ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        {errorMessage && error && (
          <p
            id={`${inputId}-error`}
            className="text-sm text-red-600 dark:text-red-400 mt-1.5"
            style={{ marginLeft: spacing.xs }}
          >
            {errorMessage}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="text-sm text-slate-500 dark:text-slate-400 mt-1.5"
            style={{ marginLeft: spacing.xs }}
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
