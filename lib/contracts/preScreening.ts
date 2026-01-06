/**
 * Pre-screening Call Contract Types
 * V05-I08.2: Pre-screening call script UI
 */

export type ProgramTier = 'tier_1' | 'tier_2' | 'tier_3'

export type RedFlag = {
  id: string
  label: string
  checked: boolean
  notes?: string
}

export type PreScreeningCall = {
  id: string
  patient_id: string
  clinician_id: string
  organization_id?: string | null
  
  // Screening results
  is_suitable: boolean
  suitability_notes?: string | null
  
  // Red flags
  red_flags: RedFlag[]
  red_flags_notes?: string | null
  
  // Tier recommendation
  recommended_tier?: ProgramTier | null
  tier_notes?: string | null
  
  // General notes
  general_notes?: string | null
  
  // Timestamps
  call_date: string
  created_at: string
  updated_at: string
}

export type PreScreeningCallInput = {
  patient_id: string
  is_suitable: boolean
  suitability_notes?: string
  red_flags: RedFlag[]
  red_flags_notes?: string
  recommended_tier?: ProgramTier
  tier_notes?: string
  general_notes?: string
  call_date?: string
}

// Common red flags for pre-screening
export const COMMON_RED_FLAGS: Omit<RedFlag, 'checked'>[] = [
  { id: 'suicidal_ideation', label: 'Suizidgedanken oder akute Selbstgefährdung' },
  { id: 'psychosis', label: 'Psychotische Symptome' },
  { id: 'substance_abuse', label: 'Schwere Substanzmissbrauchsproblematik' },
  { id: 'severe_depression', label: 'Schwere depressive Episode' },
  { id: 'cognitive_impairment', label: 'Kognitive Beeinträchtigung' },
  { id: 'language_barrier', label: 'Sprachbarriere' },
  { id: 'no_device', label: 'Kein Zugang zu digitalen Geräten' },
  { id: 'medical_emergency', label: 'Akuter medizinischer Notfall' },
  { id: 'other', label: 'Sonstiges' },
]

export const TIER_LABELS: Record<ProgramTier, string> = {
  tier_1: 'Tier 1 - Basisversorgung',
  tier_2: 'Tier 2 - Standardversorgung',
  tier_3: 'Tier 3 - Intensivversorgung',
}

export const TIER_DESCRIPTIONS: Record<ProgramTier, string> = {
  tier_1: 'Selbstgesteuerte digitale Intervention mit minimalem Support',
  tier_2: 'Regelmäßige Begleitung durch Pflegekräfte und digitale Tools',
  tier_3: 'Intensive ärztliche Betreuung mit engmaschigem Monitoring',
}
