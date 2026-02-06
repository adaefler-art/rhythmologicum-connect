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
      rounded-xl
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1
      disabled:bg-neutral-100 dark:disabled:bg-neutral-700 disabled:text-neutral-500 dark:disabled:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-60
    `

    const stateClasses = error
      ? 'border-error bg-error/10 text-foreground placeholder-error/60'
      : 'border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 text-foreground placeholder-neutral-500 dark:placeholder-neutral-400 focus:border-primary-500'

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
            borderRadius: radii.xl,
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
            className="text-sm text-error mt-1.5"
            style={{ marginLeft: spacing.xs }}
          >
            {errorMessage}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="text-sm text-neutral-600 dark:text-neutral-400 mt-1.5"
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
