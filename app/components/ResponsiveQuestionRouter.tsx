'use client'

import { useIsMobile } from '@/lib/hooks/useIsMobile'
import MobileQuestionCard, { type MobileQuestionCardProps } from './MobileQuestionCard'
import DesktopQuestionCard from './DesktopQuestionCard'
import SwipeableQuestionCard from './SwipeableQuestionCard'

export type ResponsiveQuestionRouterProps = MobileQuestionCardProps & {
  /**
   * Whether to enable swipe navigation on mobile
   * Only applies to mobile view
   */
  enableSwipe?: boolean
}

/**
 * Responsive Question Router Component
 * 
 * Automatically switches between Desktop and Mobile question views based on viewport width.
 * 
 * Features:
 * - Uses useIsMobile() hook to detect viewport size
 * - Renders Mobile view for <640px viewport
 * - Renders Desktop view for ≥640px viewport
 * - Preserves funnel state (current question, answers) across layout switches
 * - Never renders both views simultaneously
 * - No UI flicker during resize
 * 
 * Breakpoint: 640px (Tailwind's sm breakpoint)
 * 
 * @example
 * ```tsx
 * <ResponsiveQuestionRouter
 *   funnel={funnel}
 *   question={currentQuestion}
 *   currentQuestionIndex={index}
 *   totalQuestions={total}
 *   value={answers[question.id]}
 *   onChange={handleAnswerChange}
 *   onNext={handleNext}
 *   onPrevious={handlePrevious}
 *   isFirst={index === 0}
 *   isLast={index === total - 1}
 *   enableSwipe={true}
 * />
 * ```
 */
export default function ResponsiveQuestionRouter({
  enableSwipe = false,
  ...props
}: ResponsiveQuestionRouterProps) {
  const isMobile = useIsMobile()

  // Mobile view: use SwipeableQuestionCard if swipe is enabled
  if (isMobile) {
    if (enableSwipe) {
      return <SwipeableQuestionCard {...props} enableSwipe={true} />
    }
    return <MobileQuestionCard {...props} />
  }

  // Desktop view
  return <DesktopQuestionCard {...props} />
}
