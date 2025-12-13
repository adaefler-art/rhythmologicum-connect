import { type HTMLAttributes } from 'react'

export type LoadingSpinnerSize = 'sm' | 'md' | 'lg' | 'xl'

export interface LoadingSpinnerProps extends HTMLAttributes<HTMLDivElement> {
  /** Size of the spinner */
  size?: LoadingSpinnerSize
  /** Optional text to display below spinner */
  text?: string
  /** Whether to center the spinner in container */
  centered?: boolean
}

/**
 * LoadingSpinner Component
 * 
 * A styled loading spinner component for indicating loading states.
 * Part of the V0.4 Design System - E6 Technical Cleanup.
 * 
 * Features:
 * - Four size variants (sm, md, lg, xl)
 * - Optional loading text
 * - Can be centered in container
 * - Accessible with proper ARIA attributes
 * - Smooth animation
 * 
 * @example
 * // Basic spinner
 * <LoadingSpinner />
 * 
 * @example
 * // Large centered spinner with text
 * <LoadingSpinner size="lg" text="Laden..." centered />
 * 
 * @example
 * // Small inline spinner
 * <LoadingSpinner size="sm" />
 */
export function LoadingSpinner({
  size = 'md',
  text,
  centered = false,
  className = '',
  ...props
}: LoadingSpinnerProps) {
  // Size configurations
  const sizeConfig = {
    sm: {
      spinner: 'h-4 w-4',
      text: 'text-xs',
    },
    md: {
      spinner: 'h-8 w-8',
      text: 'text-sm',
    },
    lg: {
      spinner: 'h-12 w-12',
      text: 'text-base',
    },
    xl: {
      spinner: 'h-16 w-16',
      text: 'text-lg',
    },
  }

  const config = sizeConfig[size]

  const containerClasses = `
    ${centered ? 'flex flex-col items-center justify-center min-h-[200px]' : 'inline-flex flex-col items-center'}
    ${className}
  `

  return (
    <div className={containerClasses} role="status" aria-live="polite" {...props}>
      <svg
        className={`animate-spin text-sky-600 ${config.spinner}`}
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
      {text && (
        <p className={`mt-3 text-slate-600 font-medium ${config.text}`}>
          {text}
        </p>
      )}
      <span className="sr-only">{text || 'Laden...'}</span>
    </div>
  )
}

export default LoadingSpinner
