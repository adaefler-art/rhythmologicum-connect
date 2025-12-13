import { type ReactNode, type HTMLAttributes } from 'react'
import { Button } from './Button'

export interface ErrorStateProps extends HTMLAttributes<HTMLDivElement> {
  /** Error title/heading */
  title?: string
  /** Error message or description */
  message?: string | ReactNode
  /** Optional retry button callback */
  onRetry?: () => void
  /** Retry button text */
  retryText?: string
  /** Whether to show the error centered in a larger container */
  centered?: boolean
  /** Optional custom icon */
  icon?: ReactNode
}

/**
 * ErrorState Component
 * 
 * A styled error state component for displaying errors consistently.
 * Part of the V0.4 Design System - E6 Technical Cleanup.
 * 
 * Features:
 * - Consistent error display across the application
 * - Optional retry button
 * - Customizable title, message, and icon
 * - Can be centered in container
 * - Accessible with proper ARIA attributes
 * 
 * @example
 * // Basic error
 * <ErrorState
 *   title="Fehler beim Laden"
 *   message="Die Daten konnten nicht geladen werden."
 * />
 * 
 * @example
 * // Error with retry button
 * <ErrorState
 *   title="Verbindungsfehler"
 *   message="Bitte überprüfen Sie Ihre Internetverbindung."
 *   onRetry={handleRetry}
 *   centered
 * />
 */
export function ErrorState({
  title = 'Ein Fehler ist aufgetreten',
  message = 'Bitte versuchen Sie es später erneut.',
  onRetry,
  retryText = 'Erneut versuchen',
  centered = false,
  icon,
  className = '',
  ...props
}: ErrorStateProps) {
  const containerClasses = `
    ${centered ? 'flex flex-col items-center justify-center min-h-[300px] text-center' : 'flex flex-col items-center text-center'}
    ${className}
  `

  const defaultIcon = (
    <svg
      className="h-16 w-16 text-red-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  )

  return (
    <div className={containerClasses} role="alert" aria-live="assertive" {...props}>
      <div className="mb-4">
        {icon || defaultIcon}
      </div>
      
      <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-2">
        {title}
      </h2>
      
      {typeof message === 'string' ? (
        <p className="text-sm md:text-base text-slate-600 mb-6 max-w-md">
          {message}
        </p>
      ) : (
        <div className="text-sm md:text-base text-slate-600 mb-6 max-w-md">
          {message}
        </div>
      )}
      
      {onRetry && (
        <Button
          variant="primary"
          onClick={onRetry}
          icon={
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          }
        >
          {retryText}
        </Button>
      )}
    </div>
  )
}

export default ErrorState
