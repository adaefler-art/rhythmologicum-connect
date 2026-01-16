'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Textarea, Button, Alert } from '@/lib/ui'
import { getNavigationTarget, isRoutableAction } from '@/lib/triage/router'
import { storeTriageResult } from '@/lib/triage/storage'
import type { TriageResultV1 } from '@/lib/api/contracts/triage'
import { NON_EMERGENCY_DISCLAIMER, STANDARD_EMERGENCY_GUIDANCE } from '@/lib/safety/disclaimers'

/**
 * E6.6.1 + E6.6.5 + E6.6.9 — AMY Composer Component
 * 
 * Bounded, guided mode for patient-initiated AMY interactions.
 * E6.6.5: Integrates triage router for navigation after triage.
 * E6.6.9: Dev harness with quick-fill test inputs (dev-only).
 * 
 * Features:
 * - AC1: Max length enforced client-side (up to 800 chars, recommended 500)
 * - AC2: Single-turn interaction (no chat history)
 * - AC3: Non-emergency disclaimer visible
 * - AC4: Submit triggers triage API call and shows routed result
 * - E6.6.5: Router applies TriageResult → Navigation (Dashboard-first)
 * - E6.6.9: Dev UI quick-fill buttons (non-prod only)
 * 
 * UX:
 * - Character counter
 * - Loading state during API call
 * - Error state handling
 * - Clear result display with navigation CTA
 * - Optional: Suggested chips for guided input
 * - Dev-only: Quick-fill test inputs for deterministic testing
 */

const MAX_LENGTH = 800 // AC1: Client-side validation
const RECOMMENDED_LENGTH = 500 // Soft recommendation

type TriageState = 'idle' | 'loading' | 'success' | 'error'

// Optional: Suggested chips for guided input
const SUGGESTED_CONCERNS = [
  '💤 Schlafprobleme',
  '😰 Stress',
  '💓 Herzklopfen',
  '😟 Sorgen',
]

// E6.6.9: Dev harness - Quick-fill test inputs (deterministic)
// AC2: Only shown in non-production environments
const DEV_QUICK_FILLS = [
  {
    label: '💬 Info',
    text: 'Was ist Stress und wie wirkt er sich auf meine Gesundheit aus?',
    tier: 'INFO',
    color: 'green',
  },
  {
    label: '📋 Assessment',
    text: 'Ich fühle mich sehr gestresst und erschöpft in letzter Zeit. Es fällt mir schwer, mich zu konzentrieren.',
    tier: 'ASSESSMENT',
    color: 'amber',
  },
  {
    label: '🚨 Escalate',
    text: 'Ich habe Suizidgedanken und weiß nicht mehr weiter. Alles fühlt sich hoffnungslos an.',
    tier: 'ESCALATE',
    color: 'red',
  },
] as const

// E6.6.9: Helper to get button styles based on tier color
const getQuickFillButtonStyles = (color: 'green' | 'amber' | 'red'): string => {
  const baseStyles = 'px-3 py-2 text-xs font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  
  const colorStyles = {
    green: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50',
  }
  
  return `${baseStyles} ${colorStyles[color]}`
}
// Set to true only in development/preview environments
// In production, this should be false to hide dev tools from end users
// Note: Can be toggled via browser localStorage for testing:
//   localStorage.setItem('devHarnessEnabled', 'true')
const isDevHarnessEnabled = (): boolean => {
  if (typeof window === 'undefined') {
    return false // Server-side: disabled
  }
  
  // Check localStorage override first (for testing in deployed environments)
  // Wrapped in try-catch to handle SecurityError in sandboxed environments
  try {
    const storageOverride = localStorage.getItem('devHarnessEnabled')
    if (storageOverride === 'true') {
      return true
    }
  } catch (error) {
    // localStorage access failed (sandboxed environment, disabled storage, etc.)
    // Continue to hostname checks
    console.debug('[DevHarness] localStorage access failed, using hostname check only', error)
  }
  
  // Check hostname to auto-enable on localhost/preview deployments
  const hostname = window.location.hostname
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.includes('preview') ||
    hostname.includes('dev-')
  )
}


export function AMYComposer() {
  const router = useRouter()
  const [concern, setConcern] = useState('')
  const [state, setState] = useState<TriageState>('idle')
  const [result, setResult] = useState<TriageResultV1 | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showDevHarness, setShowDevHarness] = useState(false)

  const charCount = concern.length
  const isOverLimit = charCount > MAX_LENGTH
  const isNearLimit = charCount > RECOMMENDED_LENGTH && charCount <= MAX_LENGTH
  const canSubmit = concern.trim().length >= 10 && !isOverLimit && state !== 'loading'

  // E6.6.9: Handler for dev quick-fill buttons
  const handleDevQuickFill = (text: string) => {
    setConcern(text)
    setState('idle')
    setResult(null)
    setError(null)
  }

  const handleSubmit = async () => {
    if (!canSubmit) return

    setState('loading')
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/amy/triage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ concern: concern.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Triage request failed')
      }

      if (data.success && data.data) {
        const triageResult = data.data as TriageResultV1
        setResult(triageResult)
        setState('success')

        // E6.6.5: Store last triage result for rationale/retry
        storeTriageResult(triageResult)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error('[AMYComposer] Triage failed', err)
      setError(err instanceof Error ? err.message : 'Ein unerwarteter Fehler ist aufgetreten.')
      setState('error')
    }
  }

  // E6.6.5: Handle navigation based on triage result
  const handleNavigate = () => {
    if (!result) return

    // Validate nextAction is routable
    if (!isRoutableAction(result.nextAction)) {
      console.error('[AMYComposer] Invalid nextAction', { nextAction: result.nextAction })
      setError('Ungültige Triage-Aktion. Bitte versuchen Sie es erneut.')
      return
    }

    // Get navigation target from router
    const { url, description } = getNavigationTarget(result.nextAction, result)

    console.log('[AMYComposer] Navigating to', { url, description, tier: result.tier })

    // Navigate to target
    router.push(url)
  }

  const handleChipClick = (chip: string) => {
    // Extract text after emoji (emojis are typically 1-2 chars at start)
    // This preserves German characters (ä, ö, ü, ß)
    const text = chip.slice(2).trim() // Remove emoji and leading space
    if (concern) {
      setConcern(concern + ', ' + text)
    } else {
      setConcern(text)
    }
  }

  const handleReset = () => {
    setConcern('')
    setState('idle')
    setResult(null)
    setError(null)
  }

  return (
    <Card padding="lg" radius="lg">
      <div className="space-y-4">
        {/* Header with AMY branding */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl" role="img" aria-label="AMY Assistant">
              🤖
            </span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
              AMY - Ihr persönlicher Assistent
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Beschreiben Sie Ihr Anliegen in 1–2 Sätzen
            </p>
          </div>
        </div>

        {/* AC3: Non-emergency disclaimer - E6.6.8: Use centralized disclaimer */}
        <Alert variant="info">
          <p className="text-sm">
            <strong>{NON_EMERGENCY_DISCLAIMER.title}:</strong> {NON_EMERGENCY_DISCLAIMER.text}
          </p>
        </Alert>

        {/* E6.6.9: Dev Harness - Quick-fill test inputs (AC2: dev-only) */}
        {isDevHarnessEnabled() && (
          <div className="border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-lg p-4 bg-purple-50 dark:bg-purple-950/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg" role="img" aria-label="Developer">
                  👨‍💻
                </span>
                <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-300">
                  Dev Harness - Test Inputs
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowDevHarness(!showDevHarness)}
                className="text-xs px-2 py-1 rounded bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-300 hover:bg-purple-300 dark:hover:bg-purple-700 transition-colors"
              >
                {showDevHarness ? 'Hide' : 'Show'}
              </button>
            </div>
            
            {showDevHarness && (
              <div className="space-y-2">
                <p className="text-xs text-purple-700 dark:text-purple-400 mb-2">
                  Deterministic test inputs for all router paths (INFO/ASSESSMENT/ESCALATE)
                </p>
                <div className="flex flex-wrap gap-2">
                  {DEV_QUICK_FILLS.map((fill) => (
                    <button
                      key={fill.label}
                      type="button"
                      onClick={() => handleDevQuickFill(fill.text)}
                      disabled={state === 'loading'}
                      className={getQuickFillButtonStyles(fill.color)}
                    >
                      {fill.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                  ⚠️ Dev-only feature. Hidden in production.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Show input form when idle/loading/error */}
        {(state === 'idle' || state === 'loading' || state === 'error') && (
          <>
            {/* Optional: Suggested chips */}
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_CONCERNS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  disabled={state === 'loading'}
                  className="px-3 py-1.5 text-sm rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Textarea with character counter */}
            <div className="space-y-2">
              <Textarea
                value={concern}
                onChange={(e) => setConcern(e.target.value)}
                placeholder="z.B. Ich habe in letzter Zeit Schlafprobleme und fühle mich gestresst..."
                rows={4}
                disabled={state === 'loading'}
                error={isOverLimit}
                errorMessage={
                  isOverLimit ? `Maximal ${MAX_LENGTH} Zeichen erlaubt` : undefined
                }
                helperText={
                  !isOverLimit && isNearLimit
                    ? `Empfohlen: bis zu ${RECOMMENDED_LENGTH} Zeichen`
                    : undefined
                }
                maxLength={MAX_LENGTH + 50} // Allow typing a bit over to show error
              />
              <div className="flex justify-between items-center text-sm">
                <span
                  className={`${
                    isOverLimit
                      ? 'text-red-600 dark:text-red-400 font-medium'
                      : isNearLimit
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {charCount} / {MAX_LENGTH} Zeichen
                </span>
                {concern.trim().length < 10 && concern.trim().length > 0 && (
                  <span className="text-slate-500 dark:text-slate-400 text-xs">
                    Mindestens 10 Zeichen erforderlich
                  </span>
                )}
              </div>
            </div>

            {/* Error display */}
            {error && (
              <Alert variant="error">
                <p className="text-sm">{error}</p>
              </Alert>
            )}

            {/* Submit button */}
            <Button
              variant="primary"
              fullWidth
              onClick={handleSubmit}
              disabled={!canSubmit}
              loading={state === 'loading'}
            >
              {state === 'loading' ? 'Wird analysiert...' : 'Anliegen einreichen'}
            </Button>
          </>
        )}

        {/* Show result when successful */}
        {state === 'success' && result && (
          <div className="space-y-4">
            {/* Tier badge - E6.6.5: Use v1 tier format */}
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  result.tier === 'ESCALATE'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    : result.tier === 'ASSESSMENT'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                }`}
              >
                {result.tier === 'ESCALATE'
                  ? '🚨 Dringend'
                  : result.tier === 'ASSESSMENT'
                    ? '📋 Einschätzung empfohlen'
                    : '✅ Information'}
              </span>
            </div>

            {/* Rationale - E6.6.5: Show rationale from v1 result */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {result.rationale}
              </p>
            </div>

            {/* E6.6.5: Navigation CTA based on nextAction */}
            <div className="space-y-3">
              <Button variant="primary" fullWidth onClick={handleNavigate}>
                {result.nextAction === 'SHOW_CONTENT' && '📚 Inhalte ansehen'}
                {result.nextAction === 'START_FUNNEL_A' && '📋 Fragebogen starten'}
                {result.nextAction === 'START_FUNNEL_B' && '💤 Schlaf-Assessment starten'}
                {result.nextAction === 'RESUME_FUNNEL' && '▶️ Fragebogen fortsetzen'}
                {result.nextAction === 'SHOW_ESCALATION' && '🆘 Unterstützung erhalten'}
              </Button>

              {/* Secondary action: Try again */}
              <Button variant="secondary" fullWidth onClick={handleReset}>
                Neues Anliegen eingeben
              </Button>
            </div>

            {/* Escalation warning for urgent cases - E6.6.8: Use centralized guidance */}
            {result.tier === 'ESCALATE' && (
              <Alert variant="error">
                <p className="text-sm font-medium">
                  <strong>{STANDARD_EMERGENCY_GUIDANCE.title}:</strong>{' '}
                  {STANDARD_EMERGENCY_GUIDANCE.text}
                </p>
              </Alert>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

export default AMYComposer
