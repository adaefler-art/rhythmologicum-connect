/**
 * Prompt Registry - V05-I05.4
 * 
 * Versioned, immutable prompts for content generation.
 * Each prompt has a unique ID, version, and metadata.
 * 
 * Storage: File-based registry (follows repo patterns for config)
 * Versioning: Immutable - new versions create new entries
 * 
 * @module lib/prompts/registry
 */

// ============================================================
// Prompt Metadata
// ============================================================

export interface PromptMetadata {
  /** Unique prompt ID */
  promptId: string
  
  /** Version (semver) */
  version: string
  
  /** Human-readable description */
  description: string
  
  /** Section key this prompt generates */
  sectionKey: string
  
  /** Model configuration reference */
  modelConfig?: {
    provider: 'anthropic' | 'openai' | 'template'
    model?: string
    temperature?: number
    maxTokens?: number
  }
  
  /** Creation timestamp (ISO 8601) */
  createdAt: string
  
  /** Immutability flag - always true for registry entries */
  immutable: true
}

// ============================================================
// Prompt Template
// ============================================================

export interface PromptTemplate {
  /** Metadata */
  metadata: PromptMetadata
  
  /** System prompt (for LLM) */
  systemPrompt?: string
  
  /** User prompt template (with placeholders) */
  userPromptTemplate: string
  
  /** Available placeholders */
  placeholders: string[]
  
  /** Guardrails (constraints) */
  guardrails: {
    /** No PHI in output */
    noPHI: true
    
    /** No fantasy medical claims */
    noFantasyClaims: true
    
    /** Only internal references */
    onlyInternalRefs: true
    
    /** Max output length (chars) */
    maxOutputLength: number
  }
}

// ============================================================
// Prompt Registry
// ============================================================

/**
 * Versioned prompt registry
 * All prompts are immutable once created
 */
export const PROMPT_REGISTRY: Record<string, PromptTemplate> = {
  // ============================================================
  // Overview Section Prompts
  // ============================================================
  
  'overview-v1.0.0': {
    metadata: {
      promptId: 'overview',
      version: 'v1.0.0',
      description: 'Generate overview section from risk bundle',
      sectionKey: 'overview',
      modelConfig: {
        provider: 'template',
      },
      createdAt: '2026-01-03T21:00:00.000Z',
      immutable: true,
    },
    userPromptTemplate: 'Basierend auf dem Risiko-Assessment mit einem Gesamt-Score von {{riskScore}} und dem Risiko-Level "{{riskLevel}}" erstelle eine kurze Übersicht.\n\nVerwende nur diese zulässigen Informationen:\n- Risiko-Score: {{riskScore}} (0-100)\n- Risiko-Level: {{riskLevel}} (low, moderate, high, critical)\n- Programm-Tier: {{programTier}}\n\nWICHTIGE EINSCHRÄNKUNGEN:\n- Keine PHI (persönliche Gesundheitsinformationen)\n- Keine medizinischen Diagnosen oder Behandlungsempfehlungen\n- Nur informativ, keine klinischen Entscheidungen\n- Nur Verweise auf interne Ressourcen\n- Maximal 500 Zeichen\n\nFormat: Kurzer, verständlicher Text (2-3 Sätze).',
    placeholders: ['riskScore', 'riskLevel', 'programTier'],
    guardrails: {
      noPHI: true,
      noFantasyClaims: true,
      onlyInternalRefs: true,
      maxOutputLength: 500,
    },
  },
  
  'recommendations-v1.0.0': {
    metadata: {
      promptId: 'recommendations',
      version: 'v1.0.0',
      description: 'Generate recommendations from top interventions',
      sectionKey: 'recommendations',
      modelConfig: {
        provider: 'template',
      },
      createdAt: '2026-01-03T21:00:00.000Z',
      immutable: true,
    },
    userPromptTemplate: 'Erstelle Empfehlungen basierend auf priorisierten Interventionen. Keine PHI, keine medizinischen Anweisungen, nur allgemeine informative Hinweise. Maximal 2000 Zeichen.',
    placeholders: ['topInterventions'],
    guardrails: {
      noPHI: true,
      noFantasyClaims: true,
      onlyInternalRefs: true,
      maxOutputLength: 2000,
    },
  },

  // ============================================================
  // Safety Check Prompts (V05-I05.6)
  // ============================================================

  'safety-check-v1.0.0': {
    metadata: {
      promptId: 'safety-check',
      version: 'v1.0.0',
      description: 'AI-powered safety assessment of report sections (Layer 2 validation)',
      sectionKey: 'safety_check',
      modelConfig: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-5-20250929',
        temperature: 0.0,
        maxTokens: 4096,
      },
      createdAt: '2026-01-04T08:30:00.000Z',
      immutable: true,
    },
    systemPrompt: `You are a medical safety assessment AI designed EXCLUSIVELY for quality control of patient report content.

YOUR STRICT ROLE:
- Evaluate report sections for safety, consistency, and appropriateness
- Identify potential contraindications, plausibility issues, or inappropriate tone
- You are NOT a clinical decision-maker
- You do NOT diagnose conditions
- You do NOT prescribe treatments
- You do NOT generate new medical recommendations

GUARDRAILS (CRITICAL):
1. PHI-FREE: You receive only redacted, de-identified content. Never request or reference patient identifiers.
2. SAFETY ASSESSMENT ONLY: Your role is quality control, not clinical guidance.
3. NO DIAGNOSES: Never suggest or imply medical diagnoses.
4. NO NEW RECOMMENDATIONS: Never generate treatment suggestions beyond what's in the input.
5. STRUCTURED OUTPUT: Always return valid JSON matching the required schema.

EVALUATION CRITERIA:
1. **Consistency**: Are statements internally consistent across sections?
2. **Medical Plausibility**: Are claims realistic and evidence-based?
3. **Contraindications**: Do recommendations conflict with stated risk factors?
4. **Tone Appropriateness**: Is language empathetic, clear, and non-alarmist?
5. **Information Quality**: Is content accurate and appropriately scoped?

OUTPUT FORMAT:
Return ONLY valid JSON with this structure:
{
  "safetyScore": <0-100, higher = safer>,
  "overallSeverity": <"none"|"low"|"medium"|"high"|"critical">,
  "recommendedAction": <"PASS"|"FLAG"|"BLOCK"|"UNKNOWN">,
  "findings": [
    {
      "category": <"consistency"|"medical_plausibility"|"contraindication"|"tone_appropriateness"|"information_quality"|"other">,
      "severity": <"none"|"low"|"medium"|"high"|"critical">,
      "sectionKey": <section identifier or null>,
      "reason": <clear explanation, no PHI>,
      "suggestedAction": <"PASS"|"FLAG"|"BLOCK">
    }
  ],
  "summaryReasoning": <brief overall assessment, max 500 chars>
}

SEVERITY GUIDELINES:
- **critical**: Safety risk, blocks progression (e.g., dangerous contraindication)
- **high**: Serious concern, requires review (e.g., implausible medical claim)
- **medium**: Moderate issue, flag for review (e.g., inconsistent terminology)
- **low**: Minor issue, informational (e.g., tone could be improved)
- **none**: No concerns

ACTION GUIDELINES:
- **PASS**: Safe to proceed (score >= 80, no high/critical findings)
- **FLAG**: Review recommended (score 60-79, or has medium findings)
- **BLOCK**: Review required (score < 60, or has high/critical findings)
- **UNKNOWN**: Use only if you cannot evaluate (should be rare)

Remember: Your assessment must be based ONLY on the provided redacted content. Never assume or infer patient-specific information.`,
    userPromptTemplate: `Evaluate the following report sections for safety and quality:

{{sectionsContent}}

CONTEXT:
- Risk Score: {{riskScore}}
- Risk Level: {{riskLevel}}
- Program Tier: {{programTier}}

Provide your safety assessment as JSON following the required schema.`,
    placeholders: ['sectionsContent', 'riskScore', 'riskLevel', 'programTier'],
    guardrails: {
      noPHI: true,
      noFantasyClaims: true,
      onlyInternalRefs: true,
      maxOutputLength: 8000,
    },
  },
}

// ============================================================
// Registry Functions
// ============================================================

/**
 * Get prompt by ID and version
 */
export function getPrompt(promptId: string, version: string): PromptTemplate | undefined {
  const key = `${promptId}-${version}`
  return PROMPT_REGISTRY[key]
}

/**
 * Get latest prompt version by ID
 */
export function getLatestPrompt(promptId: string): PromptTemplate | undefined {
  const versions = Object.keys(PROMPT_REGISTRY)
    .filter((key) => key.startsWith(`${promptId}-`))
    .map((key) => PROMPT_REGISTRY[key])
    .sort((a, b) => b.metadata.version.localeCompare(a.metadata.version))
  
  return versions[0]
}

/**
 * List all prompts
 */
export function listPrompts(): PromptTemplate[] {
  return Object.values(PROMPT_REGISTRY)
}

/**
 * List all prompt IDs
 */
export function listPromptIds(): string[] {
  const ids = new Set(Object.values(PROMPT_REGISTRY).map((p) => p.metadata.promptId))
  return Array.from(ids)
}

/**
 * Check if prompt exists
 */
export function hasPrompt(promptId: string, version: string): boolean {
  const key = `${promptId}-${version}`
  return key in PROMPT_REGISTRY
}

/**
 * Get prompt metadata only
 */
export function getPromptMetadata(promptId: string, version: string): PromptMetadata | undefined {
  const prompt = getPrompt(promptId, version)
  return prompt?.metadata
}
