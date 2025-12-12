/**
 * UI Configuration
 * 
 * Centralized UI-related feature flags and configuration.
 * Controls global UI behaviors like dark mode, theme switching, etc.
 */

export const UI_CONFIG = {
  /**
   * Enable Dark Mode Support
   * 
   * When false: Application always renders in light mode, regardless of OS/browser preferences
   * When true: Application supports dark mode with user toggle and localStorage persistence
   * 
   * Default: true (dark mode enabled)
   */
  enableDarkMode: true,
} as const

/**
 * Check if dark mode is enabled
 */
export function isDarkModeEnabled(): boolean {
  return UI_CONFIG.enableDarkMode
}
