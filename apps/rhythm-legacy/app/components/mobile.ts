/**
 * Mobile UI Components
 * 
 * Reusable mobile-optimized components based on C1 design tokens.
 * These components provide a consistent mobile experience across the application.
 * 
 * @module components/mobile
 */

export { default as MobileCard } from './MobileCard'
export type { MobileCardProps } from './MobileCard'

export { default as MobileProgress } from './MobileProgress'
export type { MobileProgressProps } from './MobileProgress'

export { default as MobileSectionTitle } from './MobileSectionTitle'
export type { MobileSectionTitleProps } from './MobileSectionTitle'

// Re-export existing mobile components for convenience
export { default as MobileAnswerButton } from './MobileAnswerButton'
export type { MobileAnswerButtonProps } from './MobileAnswerButton'

export { default as MobileQuestionCard } from './MobileQuestionCard'
export type { MobileQuestionCardProps } from './MobileQuestionCard'

export { default as MobileContentPage } from './MobileContentPage'
export type { MobileContentPageProps } from './MobileContentPage'

export { default as MobileHeader } from './MobileHeader'
export type { MobileHeaderProps, MobileHeaderVariant } from './MobileHeader'
