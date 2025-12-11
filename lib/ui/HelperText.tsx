import { type HTMLAttributes } from 'react'
import { spacing, typography } from '@/lib/design-tokens'

export interface HelperTextProps extends HTMLAttributes<HTMLParagraphElement> {
  /** Size variant */
  size?: 'sm' | 'md'
  /** Optional ID for aria-describedby */
  id?: string
}

/**
 * HelperText Component
 * 
 * A styled helper text component for providing additional context to form fields.
 * Part of the V0.4 Design System.
 * 
 * Features:
 * - Consistent styling with form components
 * - Two size variants
 * - Accessible with proper ARIA support
 * 
 * @example
 * <Label htmlFor="email">Email Address</Label>
 * <Input id="email" type="email" aria-describedby="email-helper" />
 * <HelperText id="email-helper">
 *   We'll never share your email with anyone else.
 * </HelperText>
 */
export function HelperText({
  size = 'sm',
  className = '',
  children,
  ...props
}: HelperTextProps) {
  const sizeConfig = {
    sm: typography.fontSize.sm,
    md: typography.fontSize.base,
  }

  return (
    <p
      className={`text-slate-500 ${className}`}
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

export default HelperText
