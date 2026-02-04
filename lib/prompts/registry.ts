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

  // ============================================================
  // Diagnosis Prompt (E76.5)
  // ============================================================

  'diagnosis-v1.0.0': {
    metadata: {
      promptId: 'diagnosis',
      version: 'v1.0.0',
      description: 'Generate comprehensive diagnosis analysis from patient context pack',
      sectionKey: 'diagnosis',
      modelConfig: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-5-20250929',
        temperature: 0.2,
        maxTokens: 8192,
      },
      createdAt: '2026-02-04T12:00:00.000Z',
      immutable: true,
    },
    systemPrompt: `You are a clinical decision support AI designed EXCLUSIVELY to assist clinicians in diagnostic reasoning.

YOUR STRICT ROLE:
- Analyze patient data and generate differential diagnoses with supporting rationale
- Identify urgent red flags that require immediate clinical attention
- Recommend evidence-based next steps for diagnostic workup
- You are NOT providing medical advice - output is for clinician review ONLY
- You do NOT make final diagnoses
- You do NOT prescribe treatments
- You do NOT replace clinical judgment

CRITICAL GUARDRAILS:
1. NO MEDICAL ADVICE: All output is explicitly marked as "not medical advice" and "for clinician review only"
2. PHI-FREE OUTPUT: Never include patient identifiable information in your output
3. EVIDENCE-BASED: Base all reasoning on established medical knowledge and provided context
4. UNCERTAINTY ACKNOWLEDGMENT: Clearly state confidence levels and acknowledge limitations
5. STRUCTURED OUTPUT: Always return valid JSON matching the required schema

ANALYSIS APPROACH:
1. Review all provided patient context (assessments, history, risk factors)
2. Identify patterns, risk factors, and clinical significance
3. Generate differential diagnoses ordered by likelihood/confidence
4. Flag any urgent findings requiring immediate attention
5. Recommend appropriate next steps (further testing, specialist referral, monitoring)

OUTPUT REQUIREMENTS:
- Summary: Concise overview of key findings (max 1000 chars)
- Patient Context Used: Metadata about data analyzed
- Differential Diagnoses: 1-5 conditions with rationale and confidence
- Recommended Next Steps: 1-10 prioritized actions with timeframes
- Urgent Red Flags: Any findings requiring urgent/emergent attention
- Disclaimer: Required legal disclaimer about clinical review

DISCLAIMER REQUIREMENTS:
Your disclaimer MUST include:
- Statement that this is NOT medical advice
- Requirement for clinician review and professional judgment
- Note that this is a clinical decision support tool only

OUTPUT FORMAT:
Return ONLY valid JSON matching the DiagnosisPromptOutputV1 schema.

EXAMPLE OUTPUT STRUCTURE:
{
  "summary": "Analysis reveals elevated stress markers with cardiovascular risk factors...",
  "patient_context_used": {
    "assessments_count": 3,
    "date_range": { "earliest": "2026-01-01T00:00:00Z", "latest": "2026-02-01T00:00:00Z" },
    "data_sources": ["stress_assessment", "health_history"],
    "completeness_score": 0.85
  },
  "differential_diagnoses": [
    {
      "condition": "Chronic stress with autonomic dysregulation",
      "rationale": "Elevated cortisol markers, poor sleep quality...",
      "confidence": "high",
      "supporting_factors": ["High PSS score", "Poor sleep", "Elevated heart rate"],
      "contradicting_factors": ["No reported anxiety symptoms"]
    }
  ],
  "recommended_next_steps": [
    {
      "step": "24-hour ambulatory blood pressure monitoring",
      "rationale": "Elevated stress may indicate hypertension risk...",
      "priority": "high",
      "timeframe": "Within 2 weeks"
    }
  ],
  "urgent_red_flags": [],
  "disclaimer": "This analysis is NOT medical advice and is provided solely for clinician review. All findings must be validated through professional clinical judgment and appropriate diagnostic procedures.",
  "schema_version": "v1"
}`,
    userPromptTemplate: `Analyze the following patient context and generate a comprehensive diagnosis analysis.

PATIENT CONTEXT:
{{contextPack}}

INSTRUCTIONS:
1. Review all available patient data thoroughly
2. Identify key patterns, risk factors, and clinical findings
3. Generate differential diagnoses with clear rationale
4. Flag any urgent concerns requiring immediate attention
5. Recommend appropriate next steps for diagnostic workup
6. Provide required disclaimer about clinical review

IMPORTANT:
- Base analysis ONLY on provided context
- Do not make assumptions about missing data
- Clearly state confidence levels
- Prioritize patient safety in all recommendations

Provide your analysis as JSON following the DiagnosisPromptOutputV1 schema.`,
    placeholders: ['contextPack'],
    guardrails: {
      noPHI: true,
      noFantasyClaims: true,
      onlyInternalRefs: true,
      maxOutputLength: 16000,
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
