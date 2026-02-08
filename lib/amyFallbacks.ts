// lib/amyFallbacks.ts
/**
 * Fallback texts for AI assistant LLM integration failures
 * These texts are used when the LLM is unavailable or returns an error
 * 
 * Note: File name retains "amy" prefix for backward compatibility.
 * The actual assistant identity is configured in /lib/config/assistant.ts
 */

export type RiskLevel = 'low' | 'moderate' | 'high' | null;

export interface FallbackParams {
  riskLevel: RiskLevel;
  stressScore?: number | null;
  sleepScore?: number | null;
}

/**
 * Builds score information text if scores are available
 */
function buildScoreInfo(stressScore?: number | null, sleepScore?: number | null): string {
  if (stressScore == null && sleepScore == null) {
    return '';
  }

  const parts: string[] = [];
  
  if (stressScore != null) {
    parts.push(`ein Stress-Score von etwa ${Math.round(stressScore)} von 100`);
  }
  
  if (sleepScore != null) {
    parts.push(`ein Schlaf-Score von etwa ${Math.round(sleepScore)} von 100`);
  }
  
  return `Basierend auf deinen Antworten ergibt sich ${parts.join(' und ')}. `;
}

/**
 * Returns a calming, generic fallback text based on risk level
 * These texts provide orientation without suggesting clinical decisions
 */
export function getAmyFallbackText(params: FallbackParams): string {
  const { riskLevel, stressScore, sleepScore } = params;

  // Build score information if available
  const scoreInfo = buildScoreInfo(stressScore, sleepScore);

  // Risk-specific fallback texts
  switch (riskLevel) {
    case 'low':
      return (
        scoreInfo +
        'Deine aktuellen Werte liegen im eher entspannten Bereich. ' +
        'Das ist eine gute Basis. Achte weiterhin auf ausreichend Schlaf, regelmäßige Bewegung und kleine Pausen im Alltag, ' +
        'damit das so bleibt. Bei Fragen oder Veränderungen wende dich gerne an deine behandelnde Praxis.'
      );

    case 'moderate':
      return (
        scoreInfo +
        'Dein aktuelles Stressniveau liegt im mittleren Bereich. ' +
        'Es kann hilfreich sein, jetzt auf ausreichend Erholung und klare Grenzen zu achten. ' +
        'Kleine Anpassungen bei Schlaf, Bewegung oder Auszeiten können bereits einen Unterschied machen. ' +
        'Bei Unsicherheiten oder wenn sich Beschwerden verstärken, wende dich an deine behandelnde Praxis.'
      );

    case 'high':
      return (
        scoreInfo +
        'Deine aktuellen Werte zeigen ein erhöhtes Stressniveau. ' +
        'Das ist ein Hinweis, dass dein System gerade viel trägt – du bist damit nicht allein. ' +
        'Es ist wichtig, jetzt gut für dich zu sorgen: ausreichend Schlaf, Pausen und bei Bedarf Unterstützung anzunehmen. ' +
        'Bitte wende dich bei anhaltenden Beschwerden an deine behandelnde Praxis.'
      );

    default:
      // Unknown status - no clear risk classification available
      return (
        scoreInfo +
        'Deine Antworten sind sicher gespeichert. ' +
        'Eine detaillierte Einschätzung ist aktuell noch nicht verfügbar. ' +
        'Das ist kein Notfallhinweis. Bei Fragen oder Beschwerden wende dich gerne an deine behandelnde Praxis. ' +
        'Du kannst diese Seite später erneut aufrufen oder den Fragebogen wiederholen.'
      );
  }
}

/**
 * Short labels for risk levels
 */
export function getRiskLabel(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'low':
      return 'Niedriges Stressniveau';
    case 'moderate':
      return 'Mittleres Stressniveau';
    case 'high':
      return 'Erhöhtes Stressniveau';
    default:
      return 'Noch nicht klassifiziert';
  }
}
