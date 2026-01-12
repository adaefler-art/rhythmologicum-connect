'use client'

import { Card, Button } from '@/lib/ui'
import { useTheme } from '@/lib/contexts/ThemeContext'
import { Sun, Moon, Palette, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const accentColors = [
  { value: 'sky', name: 'Sky Blue', color: '#0ea5e9', description: 'Default calm, medical theme' },
  {
    value: 'emerald',
    name: 'Emerald',
    color: '#10b981',
    description: 'Growth and wellness theme',
  },
  {
    value: 'violet',
    name: 'Violet',
    color: '#8b5cf6',
    description: 'Focus and mindfulness theme',
  },
  { value: 'amber', name: 'Amber', color: '#f59e0b', description: 'Energy and warmth theme' },
] as const

/**
 * Theme Demo Page (Public Access)
 *
 * Demonstrates theme configuration without requiring authentication.
 * Tests light/dark mode and accent color switching.
 */
export default function ThemeDemoPage() {
  const { theme, toggleTheme, accent, setAccent } = useTheme()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 transition-colors">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back to Home */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Theme Configuration Demo
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Interactive demonstration of light/dark mode and accent color switching
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
              {theme === 'dark' ? <Moon className="w-8 h-8" /> : <Sun className="w-8 h-8" />}
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
                onClick={() =>
                  setAccent(color.value as 'sky' | 'emerald' | 'violet' | 'amber')
                }
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
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-lg shadow-md flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: color.color }}
                  >
                    <Palette className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900 dark:text-white">{color.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {color.description}
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
                <p className="text-slate-900 dark:text-white">Primary text (slate-900/white)</p>
                <p className="text-slate-600 dark:text-slate-400">
                  Secondary text (slate-600/slate-400)
                </p>
                <p className="text-slate-500 dark:text-slate-500">Muted text (slate-500)</p>
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
                  This demonstrates how cards look with the current theme settings. Background
                  adapts to light/dark mode automatically.
                </p>
              </Card>
            </div>
          </div>
        </Card>

        {/* Technical Info */}
        <Card>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Technical Implementation
          </h2>
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
              <p>
                Theme mode persisted to{' '}
                <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                  localStorage.theme
                </code>
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
              <p>
                Accent color persisted to{' '}
                <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                  localStorage.theme-accent
                </code>
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
              <p>System color scheme preference respected when no user preference stored</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
              <p>No SSR/hydration mismatches via inline script in app/layout.tsx</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
              <p>Smooth transitions with CSS custom properties</p>
            </div>
          </div>
        </Card>

        {/* Storage Info */}
        <Card>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Current Configuration
          </h2>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex gap-2">
              <span className="text-slate-500 dark:text-slate-400">Theme Mode:</span>
              <span className="text-slate-900 dark:text-white font-semibold">{theme}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-slate-500 dark:text-slate-400">Accent Color:</span>
              <span className="text-slate-900 dark:text-white font-semibold">{accent}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-slate-500 dark:text-slate-400">Storage Keys:</span>
              <span className="text-slate-900 dark:text-white">theme, theme-accent</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
