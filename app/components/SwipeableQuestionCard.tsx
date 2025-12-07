'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, PanInfo, AnimatePresence } from 'framer-motion'
import type { Variants, Transition } from 'framer-motion'
import MobileQuestionCard, { type MobileQuestionCardProps } from './MobileQuestionCard'

type SwipeDirection = 'left' | 'right' | null

const SPRING_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
}

const FADE_TRANSITION: Transition = {
  duration: 0.2,
}

const SWIPE_VARIANTS: Variants = {
  enter: (direction: SwipeDirection) => ({
    x: direction === 'left' ? '100%' : direction === 'right' ? '-100%' : 0,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      x: SPRING_TRANSITION,
      opacity: FADE_TRANSITION,
    },
  },
  exit: (direction: SwipeDirection) => ({
    x: direction === 'left' ? '-100%' : direction === 'right' ? '100%' : 0,
    opacity: 0,
    transition: {
      x: SPRING_TRANSITION,
      opacity: FADE_TRANSITION,
    },
  }),
}

export type SwipeableQuestionCardProps = MobileQuestionCardProps & {
  enableSwipe?: boolean
}

/**
 * Helper function to check if a question has been answered
 */
function isAnswered(value: number | string | undefined): boolean {
  if (value === undefined || value === null) return false
  if (typeof value === 'string' && value.trim() === '') return false
  return true
}

/**
 * SwipeableQuestionCard - Wrapper component that adds swipe navigation to MobileQuestionCard
 * 
 * Features:
 * - Swipe left → next question
 * - Swipe right → previous question
 * - Enter/exit/snap-back animations
 * - Animation lock to prevent double triggers
 * - Maintains fallback buttons for accessibility
 */
export default function SwipeableQuestionCard({
  enableSwipe = true,
  onNext,
  onPrevious,
  isFirst,
  isLast,
  ...props
}: SwipeableQuestionCardProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [direction, setDirection] = useState<SwipeDirection>(null)
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
    }
  }, [])

  // Swipe threshold and velocity settings
  const SWIPE_THRESHOLD = 100 // pixels
  const SWIPE_VELOCITY_THRESHOLD = 500 // pixels per second

  /**
   * Handle swipe gesture end
   */
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Prevent action during animation
    if (isAnimating) return

    const swipeDistance = info.offset.x
    const swipeVelocity = info.velocity.x

    // Determine if swipe was strong enough
    const shouldSwipe =
      Math.abs(swipeDistance) > SWIPE_THRESHOLD ||
      Math.abs(swipeVelocity) > SWIPE_VELOCITY_THRESHOLD

    if (!shouldSwipe) {
      // Snap back - no action
      return
    }

    // Swipe right (previous question)
    if (swipeDistance > 0 && !isFirst && onPrevious) {
      setDirection('right')
      setIsAnimating(true)
      
      // Clear any existing timeout
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
      
      // Trigger navigation after animation starts
      animationTimeoutRef.current = setTimeout(() => {
        onPrevious()
        setIsAnimating(false)
        setDirection(null)
      }, 300) // Match animation duration
    }
    // Swipe left (next question)
    else if (swipeDistance < 0 && !isLast && onNext) {
      // Only allow swipe to next if question is answered
      if (!isAnswered(props.value)) {
        // Snap back - question not answered
        return
      }

      setDirection('left')
      setIsAnimating(true)
      
      // Clear any existing timeout
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
      
      // Trigger navigation after animation starts
      animationTimeoutRef.current = setTimeout(() => {
        onNext()
        setIsAnimating(false)
        setDirection(null)
      }, 300) // Match animation duration
    }
  }

  /**
   * Wrapped navigation handlers with animation lock
   */
  const handleNext = () => {
    if (isAnimating || !onNext) return
    setDirection('left')
    setIsAnimating(true)
    
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current)
    }
    
    animationTimeoutRef.current = setTimeout(() => {
      onNext()
      setIsAnimating(false)
      setDirection(null)
    }, 300)
  }

  const handlePrevious = () => {
    if (isAnimating || !onPrevious) return
    setDirection('right')
    setIsAnimating(true)
    
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current)
    }
    
    animationTimeoutRef.current = setTimeout(() => {
      onPrevious()
      setIsAnimating(false)
      setDirection(null)
    }, 300)
  }

  // Animation variants
  const variants = SWIPE_VARIANTS

  // Drag constraints
  const dragConstraints = {
    left: isLast ? 0 : -50,
    right: isFirst ? 0 : 50,
  }

  if (!enableSwipe) {
    // Swipe disabled - render without motion wrapper
    return (
      <MobileQuestionCard
        {...props}
        onNext={onNext}
        onPrevious={onPrevious}
        isFirst={isFirst}
        isLast={isLast}
      />
    )
  }

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={props.question.id}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        drag="x"
        dragConstraints={dragConstraints}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        dragListener={!isAnimating}
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        <MobileQuestionCard
          {...props}
          onNext={handleNext}
          onPrevious={handlePrevious}
          isFirst={isFirst}
          isLast={isLast}
          isLoading={props.isLoading || isAnimating}
        />
      </motion.div>
    </AnimatePresence>
  )
}
