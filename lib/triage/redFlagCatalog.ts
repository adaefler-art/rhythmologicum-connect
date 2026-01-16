/**
 * E6.6.7 — Red Flag Catalog v1
 *
 * Clinical red flag allowlist with conservative keyword patterns.
 * This is the ONLY source of truth for red flag detection.
 *
 * Key Principles:
 * - Allowlist-only: No ad-hoc red flags
 * - Conservative patterns: Better false positives than false negatives
 * - Red flag dominance: Always triggers ESCALATE tier
 * - Versioned: For governance and audit
 */

/**
 * Clinical red flag types (allowlist)
 * These are the ONLY permitted red flag types
 */
export const CLINICAL_RED_FLAG = {
  /** Chest pain, pressure, or discomfort - potential cardiac emergency */
  CHEST_PAIN: 'CHEST_PAIN',
  /** Loss of consciousness or near-syncope */
  SYNCOPE: 'SYNCOPE',
  /** Severe difficulty breathing */
  SEVERE_DYSPNEA: 'SEVERE_DYSPNEA',
  /** Suicidal ideation or self-harm */
  SUICIDAL_IDEATION: 'SUICIDAL_IDEATION',
  /** Severe mental health crisis */
  ACUTE_PSYCHIATRIC_CRISIS: 'ACUTE_PSYCHIATRIC_CRISIS',
  /** Severe palpitations or arrhythmia symptoms */
  SEVERE_PALPITATIONS: 'SEVERE_PALPITATIONS',
  /** Acute neurological symptoms (stroke-like) */
  ACUTE_NEUROLOGICAL: 'ACUTE_NEUROLOGICAL',
  /** Severe uncontrolled symptoms requiring immediate care */
  SEVERE_UNCONTROLLED_SYMPTOMS: 'SEVERE_UNCONTROLLED_SYMPTOMS',
} as const

export type ClinicalRedFlag = typeof CLINICAL_RED_FLAG[keyof typeof CLINICAL_RED_FLAG]

/**
 * Red flag catalog version for governance
 */
export const RED_FLAG_CATALOG_VERSION = '1.0.0' as const

/**
 * Keyword patterns for each red flag type
 * Conservative approach: Better to escalate unnecessarily than miss a real emergency
 *
 * NOTE: All patterns MUST be lowercase for efficient matching
 */
export const RED_FLAG_PATTERNS: Record<ClinicalRedFlag, readonly string[]> = {
  [CLINICAL_RED_FLAG.CHEST_PAIN]: [
    // German
    'brustschmerz',
    'brustschmerzen',
    'herzschmerz',
    'herzschmerzen',
    'schmerz in der brust',
    'schmerzen in der brust',
    'brust druck',
    'brustdruck',
    'herzenge',
    'angina pectoris',
    'stechen in der brust',
    'brennen in der brust',
    'engegefühl brust',
    // English
    'chest pain',
    'chest discomfort',
    'chest pressure',
    'heart pain',
    'angina',
    'tightness in chest',
    'crushing chest',
    'squeezing chest',
  ],
  [CLINICAL_RED_FLAG.SYNCOPE]: [
    // German
    'ohnmacht',
    'ohnmächtig', // with umlaut
    'bewusstlos',
    'bewusstlosigkeit',
    'umgekippt',
    'kollabiert',
    'zusammengebrochen',
    'black out',
    'schwarz vor augen',
    'bewusstsein verloren',
    'synkope',
    // English
    'syncope',
    'fainted',
    'passed out',
    'lost consciousness',
    'blacked out',
    'collapsed',
    'blackout',
  ],
  [CLINICAL_RED_FLAG.SEVERE_DYSPNEA]: [
    // German
    'atemnot',
    'keine luft',
    'nicht atmen',
    'erstick',
    'luftnot',
    'schwer zu atmen',
    'kann nicht atmen',
    'bekomme keine luft',
    'kurzatmig',
    'dyspnoe',
    // English
    'cant breathe',
    'cannot breathe',
    'shortness of breath',
    'difficulty breathing',
    'gasping for air',
    'suffocating',
    'dyspnea',
    'severe breathlessness',
  ],
  [CLINICAL_RED_FLAG.SUICIDAL_IDEATION]: [
    // German
    'suizid',
    'selbstmord',
    'umbringen',
    'sterben will',
    'nicht mehr leben',
    'selbstverletzung',
    'verletze mich',
    'selbstschädigung',
    'leben beenden',
    'suizidgedanken',
    'todesgedanken',
    // English
    'suicide',
    'kill myself',
    'end my life',
    'self-harm',
    'self harm',
    'hurt myself',
    'suicidal',
    'want to die',
    'better off dead',
  ],
  [CLINICAL_RED_FLAG.ACUTE_PSYCHIATRIC_CRISIS]: [
    // German
    'panikattacke',
    'akute panik',
    'totale panik',
    'nervenzusammenbruch',
    'psychose',
    'halluzinationen',
    'stimmen hören',
    'höre stimmen', // alternate phrasing
    'wahnvorstellungen',
    'akute krise',
    'psychiatrischer notfall',
    // English
    'panic attack',
    'severe panic',
    'psychotic',
    'hallucinations',
    'hearing voices',
    'delusions',
    'nervous breakdown',
    'psychiatric emergency',
    'mental breakdown',
  ],
  [CLINICAL_RED_FLAG.SEVERE_PALPITATIONS]: [
    // German
    'herzrasen extrem',
    'herz rast unkontrolliert',
    'herzrhythmusstörung',
    'herzrhythmusstorung', // without umlaut
    'arrhythmie',
    'herzstolpern stark',
    'starkes herzstolpern', // alternate word order
    'puls über 150',
    'puls uber 150', // without umlaut
    'puls sehr schnell',
    'herzjagen',
    // English
    'heart racing uncontrollably',
    'severe palpitations',
    'arrhythmia',
    'irregular heartbeat severe',
    'heart rate over 150',
    'tachycardia severe',
  ],
  [CLINICAL_RED_FLAG.ACUTE_NEUROLOGICAL]: [
    // German
    'schlaganfall',
    'lähmung',
    'lahmung', // without umlaut
    'gesichtslähmung',
    'gesichtslahmung', // without umlaut
    'plötzliche lähmung',
    'plotzliche lahmung', // without umlauts
    'sprachstörung plötzlich',
    'sprachstorung plotzlich', // without umlauts
    'sehstörung plötzlich',
    'sehstorung plotzlich', // without umlauts
    'kribbeln halbseitig',
    'halbseitiges kribbeln', // alternate word order
    'taubheit halbseitig',
    'halbseitige taubheit', // alternate word order
    'kann nicht sprechen',
    'kann plötzlich nicht sprechen',
    'kann plotzlich nicht sprechen', // without umlaut
    'koordinationsverlust',
    // English
    'stroke',
    'paralysis',
    'facial droop',
    'sudden speech difficulty',
    'sudden vision loss',
    'one-sided numbness',
    'one-sided weakness',
    'cannot speak suddenly',
    'loss of coordination',
  ],
  [CLINICAL_RED_FLAG.SEVERE_UNCONTROLLED_SYMPTOMS]: [
    // German
    'notfall',
    'akute gefahr',
    'unerträglich',
    'unertraglich', // without umlaut
    'unkontrollierbar',
    'sofort hilfe',
    'dringend hilfe',
    'notaufnahme',
    'krankenwagen',
    'rettungsdienst',
    '112',
    // English
    'emergency',
    'acute danger',
    'unbearable',
    'uncontrollable',
    'immediate help',
    'urgent help',
    'emergency room',
    'ambulance',
    '911',
  ],
}

/**
 * Get all red flag keywords as a flat array
 * Used for efficient detection without exposing internal structure
 */
export function getAllRedFlagKeywords(): readonly string[] {
  return Object.values(RED_FLAG_PATTERNS).flat()
}

/**
 * Detect which clinical red flags are present in normalized input
 *
 * @param normalizedInput - Lowercase, trimmed input text
 * @returns Array of detected clinical red flag types
 */
export function detectClinicalRedFlags(normalizedInput: string): ClinicalRedFlag[] {
  const detectedFlags: ClinicalRedFlag[] = []

  // Check each red flag type
  // Note: patterns are pre-normalized to lowercase
  for (const [flagType, patterns] of Object.entries(RED_FLAG_PATTERNS)) {
    for (const pattern of patterns) {
      if (normalizedInput.includes(pattern)) {
        detectedFlags.push(flagType as ClinicalRedFlag)
        break // One match per flag type is enough
      }
    }
  }

  return detectedFlags
}

/**
 * Check if input contains ANY red flag
 * Fast path for escalation decision
 *
 * @param normalizedInput - Lowercase, trimmed input text
 * @returns true if any red flag is detected
 */
export function hasAnyRedFlag(normalizedInput: string): boolean {
  const allKeywords = getAllRedFlagKeywords()
  
  // Note: keywords are pre-normalized to lowercase
  for (const keyword of allKeywords) {
    if (normalizedInput.includes(keyword)) {
      return true
    }
  }
  
  return false
}

/**
 * Get human-readable description for a red flag type (German)
 *
 * @param flag - Clinical red flag type
 * @returns German description
 */
export function getRedFlagDescription(flag: ClinicalRedFlag): string {
  switch (flag) {
    case CLINICAL_RED_FLAG.CHEST_PAIN:
      return 'Brustschmerzen oder Herzschmerzen'
    case CLINICAL_RED_FLAG.SYNCOPE:
      return 'Bewusstlosigkeit oder Ohnmacht'
    case CLINICAL_RED_FLAG.SEVERE_DYSPNEA:
      return 'Schwere Atemnot'
    case CLINICAL_RED_FLAG.SUICIDAL_IDEATION:
      return 'Suizidgedanken oder Selbstverletzung'
    case CLINICAL_RED_FLAG.ACUTE_PSYCHIATRIC_CRISIS:
      return 'Akute psychiatrische Krise'
    case CLINICAL_RED_FLAG.SEVERE_PALPITATIONS:
      return 'Schwere Herzrhythmusstörungen'
    case CLINICAL_RED_FLAG.ACUTE_NEUROLOGICAL:
      return 'Akute neurologische Symptome'
    case CLINICAL_RED_FLAG.SEVERE_UNCONTROLLED_SYMPTOMS:
      return 'Schwere unkontrollierte Symptome'
    default:
      return 'Unbekannte Warnung'
  }
}
