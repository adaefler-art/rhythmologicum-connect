import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { componentTokens } from '@/lib/design-tokens'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant
  /** Size preset */
  size?: ButtonSize
  /** Whether button should take full width */
  fullWidth?: boolean
  /** Optional icon to display before label */
  icon?: ReactNode
  /** Whether button is in loading state */
  loading?: boolean
  /** Children content */
  children: ReactNode
}

/**
 * Button Component
 * 
 * A versatile, accessible button component with multiple variants and sizes.
 * Part of the V0.4 Design System.
 * 
 * Features:
 * - Multiple variants: primary, secondary, outline, ghost, destructive
 * - Three sizes: sm, md, lg
 * - Loading state with disabled interaction
 * - Optional icon support
 * - Touch-optimized with minimum 44px height
 * - Smooth animations using design tokens
 * - Fully accessible with proper ARIA attributes
 * 
 * @example
 * // Primary button
 * <Button variant="primary" onClick={handleClick}>
 *   Save Changes
 * </Button>
 * 
 * @example
 * // Button with icon
 * <Button variant="secondary" icon={<PlusIcon />}>
 *   Add New
 * </Button>
 * 
 * @example
 * // Loading state
 * <Button variant="primary" loading disabled>
 *   Processing...
 * </Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      icon,
      loading = false,
      disabled = false,
      className = '',
      children,
      type = 'button',
      onClick,
      onMouseDown,
      onMouseUp,
      onTouchStart,
      onTouchEnd,
      onKeyDown,
      onKeyUp,
      onFocus,
      onBlur,
      ...otherProps
    },
    ref
  ) => {
    // Size configurations
    const sizeConfig = {
      sm: {
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
        minHeight: '36px',
      },
      md: {
        padding: '0.625rem 1.5rem',
        fontSize: '1rem',
        minHeight: componentTokens.navigationButton.minHeight,
      },
      lg: {
        padding: '0.875rem 2rem',
        fontSize: '1.125rem',
        minHeight: '56px',
      },
    }

    // Variant styles
    const variantStyles = {
      primary: `
        bg-sky-600 dark:bg-sky-500 text-white 
        hover:bg-sky-700 dark:hover:bg-sky-600
        active:bg-sky-800 dark:active:bg-sky-700
        disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-400
        shadow-md hover:shadow-lg
      `,
      secondary: `
        bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100
        hover:bg-slate-200 dark:hover:bg-slate-600
        active:bg-slate-300 dark:active:bg-slate-500
        disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600
        border-2 border-slate-200 dark:border-slate-600
      `,
      outline: `
        bg-transparent text-sky-600 dark:text-sky-400
        border-2 border-sky-600 dark:border-sky-500
        hover:bg-sky-50 dark:hover:bg-sky-900/30
        active:bg-sky-100 dark:active:bg-sky-900/50
        disabled:border-slate-300 dark:disabled:border-slate-600 disabled:text-slate-400 dark:disabled:text-slate-500
      `,
      ghost: `
        bg-transparent text-slate-700 dark:text-slate-300
        hover:bg-slate-100 dark:hover:bg-slate-700
        active:bg-slate-200 dark:active:bg-slate-600
        disabled:text-slate-400 dark:disabled:text-slate-500
      `,
      destructive: `
        bg-red-600 dark:bg-red-500 text-white
        hover:bg-red-700 dark:hover:bg-red-600
        active:bg-red-800 dark:active:bg-red-700
        disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-400
        shadow-md hover:shadow-lg
      `,
      // Deprecated: Use 'destructive' instead
      danger: `
        bg-red-600 dark:bg-red-500 text-white
        hover:bg-red-700 dark:hover:bg-red-600
        active:bg-red-800 dark:active:bg-red-700
        disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-400
        shadow-md hover:shadow-lg
      `,
    }

    const config = sizeConfig[size]
    const variantClass = variantStyles[variant]

    const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-semibold rounded-xl
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2
      disabled:cursor-not-allowed disabled:opacity-60
      active:scale-[0.98]
      touch-manipulation
      ${fullWidth ? 'w-full' : ''}
      ${variantClass}
      ${className}
    `

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={baseStyles}
        style={{
          padding: config.padding,
          fontSize: config.fontSize,
          minHeight: config.minHeight,
        }}
        onClick={onClick}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onFocus={onFocus}
        onBlur={onBlur}
        aria-busy={loading}
        {...otherProps}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && icon && <span className="flex-shrink-0">{icon}</span>}
        <span>{children}</span>
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
