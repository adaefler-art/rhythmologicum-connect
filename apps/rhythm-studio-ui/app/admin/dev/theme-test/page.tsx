'use client'

import { Card, Button } from '@/lib/ui'
import { useTheme } from '@/lib/contexts/ThemeContext'
import { Sun, Moon, Palette } from 'lucide-react'
import { accentPalettes, type AccentColor } from '@/lib/ui/theme/themeConfig'

const accentColors = Object.entries(accentPalettes).map(([value, config]) => ({
  value: value as AccentColor,
  name: config.name,
  color: config.primary[500],
}))

/**
 * Theme Test Page
 *
 * Interactive testing page for theme configuration.
 * Allows switching between light/dark mode and accent colors.
 */
export default function ThemeTestPage() {
  const { theme, toggleTheme, accent, setAccent } = useTheme()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 transition-colors">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Theme Configuration Test
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Test light/dark mode and accent color switching
          </p>
        </div>

        {/* Mode Toggle Card */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Theme Mode
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Current mode: <span className="font-semibold capitalize">{theme}</span>
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-150"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Moon className="w-8 h-8" />
              ) : (
                <Sun className="w-8 h-8" />
              )}
            </button>
          </div>
          <div className="flex gap-3">
            <Button
              variant={theme === 'light' ? 'primary' : 'outline'}
              onClick={() => {
                if (theme === 'dark') toggleTheme()
              }}
              icon={<Sun className="w-5 h-5" />}
            >
              Light Mode
            </Button>
            <Button
              variant={theme === 'dark' ? 'primary' : 'outline'}
              onClick={() => {
                if (theme === 'light') toggleTheme()
              }}
              icon={<Moon className="w-5 h-5" />}
            >
              Dark Mode
            </Button>
          </div>
        </Card>

        {/* Accent Color Card */}
        <Card>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Accent Color
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Current accent: <span className="font-semibold capitalize">{accent}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {accentColors.map((color) => (
              <button
                key={color.value}
                onClick={() => setAccent(color.value as AccentColor)}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200
                  ${
                    accent === color.value
                      ? 'border-current shadow-lg scale-105'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }
                  bg-white dark:bg-slate-800
                `}
                style={{
                  borderColor: accent === color.value ? color.color : undefined,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg shadow-md flex items-center justify-center"
                    style={{ backgroundColor: color.color }}
                  >
                    <Palette className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {color.name}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {color.value}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Demo Components Card */}
        <Card>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Component Showcase
          </h2>

          <div className="space-y-6">
            {/* Buttons with current accent */}
            <div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Buttons (Primary uses accent color)
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary Button</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
            </div>

            {/* Color Swatches */}
            <div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Primary Color Scale (Current Accent)
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {[50, 100, 200, 400, 500, 600, 700, 800, 900].map((shade) => (
                  <div key={shade} className="text-center">
                    <div
                      className="h-16 rounded-lg mb-2 border border-slate-200 dark:border-slate-700"
                      style={{
                        backgroundColor: `var(--color-primary-${shade})`,
                      }}
                    />
                    <p className="text-xs text-slate-600 dark:text-slate-400">{shade}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Text Examples */}
            <div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Text Colors
              </h3>
              <div className="space-y-2">
                <p className="text-slate-900 dark:text-white">
                  Primary text (slate-900/white)
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  Secondary text (slate-600/slate-400)
                </p>
                <p className="text-slate-500 dark:text-slate-500">
                  Muted text (slate-500)
                </p>
              </div>
            </div>

            {/* Cards */}
            <div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Nested Cards
              </h3>
              <Card shadow="md">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Example Card
                </h4>
                <p className="text-slate-600 dark:text-slate-400">
                  This demonstrates how cards look with the current theme settings.
                  Background adapts to light/dark mode.
                </p>
              </Card>
            </div>
          </div>
        </Card>

        {/* Persistence Info */}
        <Card>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Persistence Information
          </h2>
          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <p>
              ✓ Theme mode is persisted to <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">localStorage.theme</code>
            </p>
            <p>
              ✓ Accent color is persisted to <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">localStorage.theme-accent</code>
            </p>
            <p>
              ✓ System preference is respected when no user preference is stored
            </p>
            <p>
              ✓ No SSR/hydration mismatches due to inline script in app/layout.tsx
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
