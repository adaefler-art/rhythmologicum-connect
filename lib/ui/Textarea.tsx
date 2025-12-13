import { forwardRef, useId, type TextareaHTMLAttributes } from 'react'
import { radii, spacing } from '@/lib/design-tokens'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Error state */
  error?: boolean
  /** Error message to display */
  errorMessage?: string
  /** Helper text */
  helperText?: string
  /** Textarea size */
  textareaSize?: 'sm' | 'md' | 'lg'
}

/**
 * Textarea Component
 * 
 * A styled textarea component with error states and helper text.
 * Part of the V0.4 Design System.
 * 
 * Features:
 * - Error state with custom styling
 * - Helper text support
 * - Three size variants
 * - Accessible with proper ARIA attributes
 * - Auto-resizing capable
 * 
 * @example
 * <Textarea
 *   placeholder="Enter description"
 *   rows={4}
 *   error={hasError}
 *   errorMessage="Description is required"
 * />
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      error = false,
      errorMessage,
      helperText,
      textareaSize = 'md',
      className = '',
      disabled = false,
      rows = 4,
      ...props
    },
    ref
  ) => {
    // Size configurations
    const sizeConfig = {
      sm: {
        padding: '0.5rem 0.75rem',
        fontSize: '0.875rem',
      },
      md: {
        padding: '0.625rem 0.875rem',
        fontSize: '1rem',
      },
      lg: {
        padding: '0.75rem 1rem',
        fontSize: '1.125rem',
      },
    }

    const config = sizeConfig[textareaSize]

    const baseClasses = `
      w-full
      border-2
      rounded-lg
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1
      disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed disabled:opacity-60
      resize-y
    `

    const stateClasses = error
      ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100 placeholder-red-400 dark:placeholder-red-300'
      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:border-sky-500'

    const generatedId = useId()
    const textareaId = props.id || generatedId

    return (
      <div className="w-full">
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          rows={rows}
          className={`${baseClasses} ${stateClasses} ${className}`}
          style={{
            padding: config.padding,
            fontSize: config.fontSize,
            borderRadius: radii.lg,
          }}
          aria-invalid={error}
          aria-describedby={
            errorMessage ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
          }
          {...props}
        />
        {errorMessage && error && (
          <p
            id={`${textareaId}-error`}
            className="text-sm text-red-600 dark:text-red-400 mt-1.5"
            style={{ marginLeft: spacing.xs }}
          >
            {errorMessage}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${textareaId}-helper`}
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

Textarea.displayName = 'Textarea'

export default Textarea
