import { type LabelHTMLAttributes, type ReactNode } from 'react'
import { typography, spacing } from '@/lib/design-tokens'

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /** Whether the field is required */
  required?: boolean
  /** Label text */
  children: ReactNode
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Label Component
 * 
 * A styled label component for form fields with optional required indicator.
 * Part of the V0.4 Design System.
 * 
 * Features:
 * - Required field indicator
 * - Three size variants
 * - Consistent typography
 * - Accessible with proper ARIA attributes
 * 
 * @example
 * <Label htmlFor="email" required>
 *   Email Address
 * </Label>
 * <Input id="email" type="email" />
 */
export function Label({
  required = false,
  children,
  size = 'md',
  className = '',
  ...props
}: LabelProps) {
  const sizeConfig = {
    sm: {
      fontSize: typography.fontSize.sm,
      marginBottom: spacing.xs,
    },
    md: {
      fontSize: typography.fontSize.base,
      marginBottom: spacing.sm,
    },
    lg: {
      fontSize: typography.fontSize.lg,
      marginBottom: spacing.sm,
    },
  }

  const config = sizeConfig[size]

  return (
    <label
      className={`block font-medium text-slate-700 dark:text-slate-300 ${className}`}
      style={{
        fontSize: config.fontSize,
        marginBottom: config.marginBottom,
      }}
      {...props}
    >
      {children}
      {required && (
        <span className="text-red-600 dark:text-red-400 ml-1" aria-label="required">
          *
        </span>
      )}
    </label>
  )
}

export default Label
