/**
 * Unified Risk-Badge Utility
 *
 * Provides consistent labels and styling for risk levels
 * across patient and clinician views.
 */

export type RiskLevel = 'low' | 'moderate' | 'high' | null

/**
 * Returns a human-readable German label for the given risk level.
 */
export function getRiskLabel(risk: RiskLevel): string {
  switch (risk) {
    case 'low':
      return 'Niedriges Stressniveau'
    case 'moderate':
      return 'Moderates Stressniveau'
    case 'high':
      return 'Erhöhtes Stressniveau'
    default:
      return 'Noch nicht klassifiziert'
  }
}

/**
 * Returns a short German label for the given risk level (for table views).
 */
export function getRiskLabelShort(risk: RiskLevel): string {
  switch (risk) {
    case 'low':
      return 'Niedrig'
    case 'moderate':
      return 'Mittel'
    case 'high':
      return 'Hoch'
    default:
      return '–'
  }
}

/**
 * Returns Tailwind CSS classes for the risk badge styling.
 */
export function getRiskBadgeClasses(risk: RiskLevel): string {
  switch (risk) {
    case 'low':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'moderate':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

/**
 * Fallback text when AMY report is not available.
 * Provides a reassuring message for patients.
 */
export const AMY_FALLBACK_TEXTS = {
  high: `Deine aktuellen Daten zeigen ein erhöhtes Stressniveau. Das ist ein Hinweis, dass dein System gerade viel tragen muss – du bist damit nicht allein.

Die nächsten Schritte helfen dir, wieder in Balance zu kommen.`,

  moderate: `Dein Stressniveau ist im mittleren Bereich. Es lohnt sich, jetzt gezielt an Schlaf, Erholung und Grenzen zu arbeiten, bevor sich Beschwerden verstärken.

Kleine Veränderungen im Alltag können schon einen großen Unterschied machen.`,

  low: `Aktuell liegen deine Werte im eher entspannten Bereich. Das ist eine gute Basis.

Achte weiter auf Schlaf, Bewegung und Pausen, damit das so bleibt.`,

  unknown: `Deine Antworten sind sicher gespeichert.

Sobald die automatische Auswertung abgeschlossen ist, siehst du hier deinen persönlichen Kurz-Report. Das dauert in der Regel nur wenige Augenblicke.`,
} as const

/**
 * Returns the appropriate fallback text based on risk level.
 */
export function getAmyFallbackText(risk: RiskLevel): string {
  if (!risk) return AMY_FALLBACK_TEXTS.unknown
  return AMY_FALLBACK_TEXTS[risk]
}

/**
 * Reassuring text displayed when AMY is not available or processing.
 */
export const AMY_REASSURANCE_TEXT = `Keine Sorge: Die automatische Auswertung benötigt manchmal etwas Zeit. Deine Daten sind sicher gespeichert und gehen nicht verloren.

Falls diese Meldung länger bestehen bleibt, kannst du die Seite später erneut öffnen oder dich direkt an deine behandelnde Praxis wenden.`
