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
      disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60
      resize-y
    `

    const stateClasses = error
      ? 'border-red-500 bg-red-50 text-red-900 placeholder-red-400'
      : 'border-slate-300 bg-white text-slate-900 placeholder-slate-500 focus:border-sky-500'

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
            className="text-sm text-red-600 mt-1.5"
            style={{ marginLeft: spacing.xs }}
          >
            {errorMessage}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${textareaId}-helper`}
            className="text-sm text-slate-500 mt-1.5"
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
