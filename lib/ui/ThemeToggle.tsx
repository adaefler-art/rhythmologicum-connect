'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/lib/contexts/ThemeContext'
import { motion } from 'framer-motion'

interface ThemeToggleProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Show label next to icon */
  showLabel?: boolean
  /** Custom className */
  className?: string
}

/**
 * ThemeToggle Component
 * 
 * Toggles between light and dark mode with smooth animation.
 * Works on both desktop and mobile.
 * 
 * Features:
 * - Sun/Moon icon toggle
 * - Smooth fade transition (150ms)
 * - localStorage persistence via ThemeContext
 * - Touch-optimized for mobile
 * - Optional label display
 * 
 * @example
 * // Simple toggle
 * <ThemeToggle />
 * 
 * @example
 * // With label
 * <ThemeToggle showLabel size="lg" />
 */
export function ThemeToggle({ 
  size = 'md', 
  showLabel = false,
  className = '' 
}: ThemeToggleProps) {
  const themeContext = useTheme()
  const theme = themeContext?.theme || 'light'
  const toggleTheme = themeContext?.toggleTheme || (() => {})
  
  const sizeClasses = {
    sm: 'p-1.5 min-h-[36px] min-w-[36px]',
    md: 'p-2 min-h-[44px] min-w-[44px]',
    lg: 'p-2.5 min-h-[48px] min-w-[48px]',
  }
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }
  
  const isDark = theme === 'dark'
  
  return (
    <button
      onClick={toggleTheme}
      className={`
        ${sizeClasses[size]}
        inline-flex items-center justify-center gap-2
        rounded-lg
        bg-slate-100 dark:bg-slate-800
        text-slate-700 dark:text-slate-200
        hover:bg-slate-200 dark:hover:bg-slate-700
        active:bg-slate-300 dark:active:bg-slate-600
        transition-all duration-150 ease-in-out
        touch-manipulation
        ${className}
      `}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light Mode' : 'Dark Mode'}
    >
      <motion.div
        initial={false}
        animate={{ 
          scale: [0.8, 1.1, 1],
          rotate: isDark ? 0 : 180,
        }}
        transition={{ duration: 0.15 }}
        className="flex items-center"
      >
        {isDark ? (
          <Moon className={iconSizes[size]} />
        ) : (
          <Sun className={iconSizes[size]} />
        )}
      </motion.div>
      {showLabel && (
        <span className="text-sm font-medium whitespace-nowrap">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  )
}

export default ThemeToggle
