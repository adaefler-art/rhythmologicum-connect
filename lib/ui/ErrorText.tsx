import { type HTMLAttributes } from 'react'
import { spacing, typography } from '@/lib/design-tokens'

export interface ErrorTextProps extends HTMLAttributes<HTMLParagraphElement> {
  /** Size variant */
  size?: 'sm' | 'md'
  /** Optional ID for aria-describedby */
  id?: string
}

/**
 * ErrorText Component
 * 
 * A styled error message component for displaying validation errors.
 * Part of the V0.4 Design System.
 * 
 * Features:
 * - Consistent error styling across the application
 * - Two size variants
 * - Accessible with proper ARIA support
 * - Red color for clear error indication
 * 
 * @example
 * <Label htmlFor="password" required>Password</Label>
 * <Input
 *   id="password"
 *   type="password"
 *   error
 *   aria-invalid="true"
 *   aria-describedby="password-error"
 * />
 * <ErrorText id="password-error">
 *   Password must be at least 8 characters long.
 * </ErrorText>
 */
export function ErrorText({
  size = 'sm',
  className = '',
  children,
  ...props
}: ErrorTextProps) {
  const sizeConfig = {
    sm: typography.fontSize.sm,
    md: typography.fontSize.base,
  }

  return (
    <p
      className={`text-red-600 ${className}`}
      role="alert"
      style={{
        fontSize: sizeConfig[size],
        marginTop: spacing.xs,
        marginLeft: spacing.xs,
      }}
      {...props}
    >
      {children}
    </p>
  )
}

export default ErrorText
