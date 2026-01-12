/**
 * Alert Component
 * 
 * A notification component for displaying important messages to users.
 * Part of the V0.4 Design System.
 * 
 * Features:
 * - Multiple variants for different message types (info, success, warning, error)
 * - Optional title and description
 * - Optional dismiss button
 * - Uses semantic design tokens for consistent styling
 * - Accessible with proper ARIA attributes
 * 
 * @example
 * // Info alert
 * <Alert variant="info" title="New Feature">
 *   Check out our new assessment features!
 * </Alert>
 * 
 * @example
 * // Warning with dismiss
 * <Alert variant="warning" dismissible onDismiss={handleDismiss}>
 *   Your session will expire soon.
 * </Alert>
 */

import { type ReactNode, useState } from 'react'
import { X, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react'

export type AlertVariant = 'info' | 'success' | 'warning' | 'error'

export interface AlertProps {
  /**
   * The visual style variant
   * @default 'info'
   */
  variant?: AlertVariant
  
  /**
   * Optional title/heading for the alert
   */
  title?: string
  
  /**
   * Alert content/message
   */
  children: ReactNode
  
  /**
   * Whether the alert can be dismissed
   * @default false
   */
  dismissible?: boolean
  
  /**
   * Callback when alert is dismissed
   */
  onDismiss?: () => void
  
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Alert component for displaying contextual messages
 */
export function Alert({
  variant = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  className = '',
}: AlertProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  if (!isVisible) {
    return null
  }

  // Variant configurations
  const variantConfig = {
    info: {
      container: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800',
      title: 'text-sky-900 dark:text-sky-100',
      text: 'text-sky-800 dark:text-sky-200',
      icon: Info,
      iconColor: 'text-sky-600 dark:text-sky-400',
    },
    success: {
      container: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
      title: 'text-emerald-900 dark:text-emerald-100',
      text: 'text-emerald-800 dark:text-emerald-200',
      icon: CheckCircle,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    warning: {
      container: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
      title: 'text-amber-900 dark:text-amber-100',
      text: 'text-amber-800 dark:text-amber-200',
      icon: AlertTriangle,
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    error: {
      container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      title: 'text-red-900 dark:text-red-100',
      text: 'text-red-800 dark:text-red-200',
      icon: AlertCircle,
      iconColor: 'text-red-600 dark:text-red-400',
    },
  }

  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <div
      className={`
        relative flex gap-3 p-4 border rounded-lg
        ${config.container}
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        <Icon className={`w-5 h-5 ${config.iconColor}`} aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className={`text-sm font-semibold mb-1 ${config.title}`}>
            {title}
          </h3>
        )}
        <div className={`text-sm ${config.text}`}>
          {children}
        </div>
      </div>

      {/* Dismiss button */}
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          className={`
            flex-shrink-0 inline-flex rounded-md p-1.5
            hover:bg-black/5 dark:hover:bg-white/10
            focus:outline-none focus:ring-2 focus:ring-offset-2
            focus:ring-${variant === 'info' ? 'sky' : variant === 'success' ? 'emerald' : variant === 'warning' ? 'amber' : 'red'}-500
            transition-colors duration-200
            ${config.text}
          `}
          aria-label="Dismiss alert"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

export default Alert
