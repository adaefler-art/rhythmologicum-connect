import { type ReactNode, type HTMLAttributes } from 'react'
import { shadows, radii, spacing } from '@/lib/design-tokens'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional header content */
  header?: ReactNode
  /** Optional footer content */
  footer?: ReactNode
  /** Main content */
  children: ReactNode
  /** Padding variant */
  padding?: 'none' | 'sm' | 'md' | 'lg'
  /** Border radius variant */
  radius?: 'md' | 'lg' | 'xl' | '2xl'
  /** Shadow depth */
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  /** Whether card is interactive (clickable) */
  interactive?: boolean
  /** Whether to show border */
  border?: boolean
  /** Optional onClick handler */
  onClick?: () => void
}

/**
 * Card Component
 * 
 * A flexible container component for grouping related content.
 * Part of the V0.4 Design System.
 * 
 * Features:
 * - Optional header and footer sections
 * - Configurable padding, shadow, and border radius
 * - Interactive variant with hover effects
 * - Consistent with design tokens
 * - Semantic HTML structure
 * 
 * @example
 * // Basic card
 * <Card>
 *   <p>Card content goes here</p>
 * </Card>
 * 
 * @example
 * // Card with header and footer
 * <Card
 *   header={<h3>Card Title</h3>}
 *   footer={<Button>Action</Button>}
 * >
 *   <p>Card body content</p>
 * </Card>
 * 
 * @example
 * // Interactive card
 * <Card interactive onClick={() => navigate('/details')}>
 *   <p>Click me!</p>
 * </Card>
 */
export function Card({
  header,
  footer,
  children,
  padding = 'lg',
  radius: radiusVariant = 'xl',
  shadow: shadowVariant = 'sm',
  interactive = false,
  border = true,
  onClick,
  className = '',
  ...props
}: CardProps) {
  // Padding configurations
  const paddingConfig = {
    none: '0',
    sm: spacing.md,
    md: spacing.lg,
    lg: spacing.xl,
  }

  // Shadow configurations
  const shadowConfig = {
    none: shadows.none,
    sm: shadows.sm,
    md: shadows.md,
    lg: shadows.lg,
  }

  // Radius configurations
  const radiusConfig = {
    md: radii.md,
    lg: radii.lg,
    xl: radii.xl,
    '2xl': radii['2xl'],
  }

  const paddingValue = paddingConfig[padding]
  const shadowValue = shadowConfig[shadowVariant]
  const radiusValue = radiusConfig[radiusVariant]

  // Base styles - use semantic tokens for consistency with design system
  const baseClasses = `bg-neutral-50 dark:bg-neutral-800 ${border ? 'border border-neutral-200 dark:border-neutral-700' : ''} transition-colors duration-150`

  // Interactive styles
  const interactiveClasses = interactive
    ? 'cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-lg active:scale-[0.99] transition-all duration-200'
    : ''

  if (onClick) {
    return (
      <button
        type="button"
        className={`${baseClasses} ${interactiveClasses} ${className}`}
        style={{
          borderRadius: radiusValue,
          boxShadow: shadowValue,
        }}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick()
          }
        }}
      >
        {header && (
          <div
            className="border-b border-neutral-200 dark:border-neutral-700"
            style={{
              padding: paddingValue,
            }}
          >
            {header}
          </div>
        )}
        <div
          style={{
            padding: paddingValue,
          }}
        >
          {children}
        </div>
        {footer && (
          <div
            className="border-t border-neutral-200 dark:border-neutral-700"
            style={{
              padding: paddingValue,
            }}
          >
            {footer}
          </div>
        )}
      </button>
    )
  }

  return (
    <div
      className={`${baseClasses} ${interactiveClasses} ${className}`}
      style={{
        borderRadius: radiusValue,
        boxShadow: shadowValue,
      }}
      {...props}
    >
      {header && (
        <div
          className="border-b border-neutral-200 dark:border-neutral-700"
          style={{
            padding: paddingValue,
          }}
        >
          {header}
        </div>
      )}
      <div
        style={{
          padding: paddingValue,
        }}
      >
        {children}
      </div>
      {footer && (
        <div
          className="border-t border-neutral-200 dark:border-neutral-700"
          style={{
            padding: paddingValue,
          }}
          >
          {footer}
        </div>
      )}
    </div>
  )
}

export default Card
