'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Textarea, Button, Alert } from '@/lib/ui'
import { getNavigationTarget, isRoutableAction } from '@/lib/triage/router'
import type { TriageResultV1 } from '@/lib/api/contracts/triage'

/**
 * E6.6.1 + E6.6.5 — AMY Composer Component
 * 
 * Bounded, guided mode for patient-initiated AMY interactions.
 * E6.6.5: Integrates triage router for navigation after triage.
 * 
 * Features:
 * - AC1: Max length enforced client-side (up to 800 chars, recommended 500)
 * - AC2: Single-turn interaction (no chat history)
 * - AC3: Non-emergency disclaimer visible
 * - AC4: Submit triggers triage API call and shows routed result
 * - E6.6.5: Router applies TriageResult → Navigation (Dashboard-first)
 * 
 * UX:
 * - Character counter
 * - Loading state during API call
 * - Error state handling
 * - Clear result display with navigation CTA
 * - Optional: Suggested chips for guided input
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

export function AMYComposer() {
  const router = useRouter()
  const [concern, setConcern] = useState('')
  const [state, setState] = useState<TriageState>('idle')
  const [result, setResult] = useState<TriageResultV1 | null>(null)
  const [error, setError] = useState<string | null>(null)

  const charCount = concern.length
  const isOverLimit = charCount > MAX_LENGTH
  const isNearLimit = charCount > RECOMMENDED_LENGTH && charCount <= MAX_LENGTH
  const canSubmit = concern.trim().length >= 10 && !isOverLimit && state !== 'loading'

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
        if (typeof window !== 'undefined') {
          try {
            window.sessionStorage.setItem('lastTriageResult', JSON.stringify(triageResult))
          } catch (storageError) {
            console.warn('[AMYComposer] Failed to store triage result', storageError)
          }
        }
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

        {/* AC3: Non-emergency disclaimer */}
        <Alert variant="info">
          <p className="text-sm">
            <strong>Hinweis:</strong> Dies ist kein Notfalldienst. Bei akuten medizinischen Notfällen
            wählen Sie bitte 112.
          </p>
        </Alert>

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

            {/* Escalation warning for urgent cases */}
            {result.tier === 'ESCALATE' && (
              <Alert variant="error">
                <p className="text-sm font-medium">
                  Bei akuten Notfällen wählen Sie bitte sofort 112 oder wenden Sie sich an
                  Ihren Arzt.
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
