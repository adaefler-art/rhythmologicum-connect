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
