import { forwardRef, useId, type SelectHTMLAttributes } from 'react'
import { radii, spacing } from '@/lib/design-tokens'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Error state */
  error?: boolean
  /** Error message to display */
  errorMessage?: string
  /** Helper text */
  helperText?: string
  /** Select size */
  selectSize?: 'sm' | 'md' | 'lg'
}

/**
 * Select Component
 * 
 * A styled select dropdown component with error states and helper text.
 * Part of the V0.4 Design System.
 * 
 * Features:
 * - Error state with custom styling
 * - Helper text support
 * - Three size variants
 * - Accessible with proper ARIA attributes
 * - Custom dropdown arrow
 * 
 * @example
 * <Select error={hasError} errorMessage="Please select an option">
 *   <option value="">Choose...</option>
 *   <option value="1">Option 1</option>
 *   <option value="2">Option 2</option>
 * </Select>
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      error = false,
      errorMessage,
      helperText,
      selectSize = 'md',
      className = '',
      disabled = false,
      children,
      ...props
    },
    ref
  ) => {
    // Size configurations
    const sizeConfig = {
      sm: {
        padding: '0.5rem 2rem 0.5rem 0.75rem',
        fontSize: '0.875rem',
        minHeight: '36px',
      },
      md: {
        padding: '0.625rem 2.5rem 0.625rem 0.875rem',
        fontSize: '1rem',
        minHeight: '44px',
      },
      lg: {
        padding: '0.75rem 3rem 0.75rem 1rem',
        fontSize: '1.125rem',
        minHeight: '52px',
      },
    }

    const config = sizeConfig[selectSize]

    const baseClasses = `
      w-full
      border
      rounded-xl
      transition-all duration-200
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background
      disabled:bg-neutral-100 dark:disabled:bg-neutral-700 disabled:text-neutral-500 dark:disabled:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-60
      appearance-none
      bg-no-repeat
      cursor-pointer
    `

    const stateClasses = error
      ? 'border-error bg-error/10 text-foreground'
      : 'border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 text-foreground focus-visible:border-primary-500'

    // Custom dropdown arrow using semantic color tokens
    // For error state, use red; for normal state, use neutral-400 which works in both themes
    const backgroundImage = error
      ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23dc2626' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`
      : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`
    
    // Alternative: Use CSS background-image with currentColor via mask-image
    // This would require refactoring to use mask-image property instead

    const generatedId = useId()
    const selectId = props.id || generatedId

    return (
      <div className="w-full">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={`${baseClasses} ${stateClasses} ${className}`}
          style={{
            padding: config.padding,
            fontSize: config.fontSize,
            minHeight: config.minHeight,
            borderRadius: radii.xl,
            backgroundImage,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.5rem center',
            backgroundSize: '1.5rem 1.5rem',
          }}
          aria-invalid={error}
          aria-describedby={
            errorMessage ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
          }
          {...props}
        >
          {children}
        </select>
        {errorMessage && error && (
          <p
            id={`${selectId}-error`}
            className="text-sm text-error mt-1.5"
            style={{ marginLeft: spacing.xs }}
          >
            {errorMessage}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${selectId}-helper`}
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

Select.displayName = 'Select'

export default Select
