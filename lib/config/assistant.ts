/**
 * Assistant Identity Configuration
 * 
 * Central source of truth for the AI assistant's identity across the application.
 * This configuration is used in:
 * - UI copy (patient and clinician interfaces)
 * - Chat headers and intro texts
 * - LLM prompts and persona strings
 * - Public documentation
 * 
 * To rename the assistant in the future, update only this file.
 * 
 * @example
 * import { ASSISTANT_CONFIG } from '@/lib/config/assistant'
 * console.log(ASSISTANT_CONFIG.name) // "PAT"
 */

export const ASSISTANT_CONFIG = {
  /**
   * Short name of the assistant (all caps for branding)
   * Used in UI labels, buttons, and short references
   */
  name: 'PAT',

  /**
   * Display name for formal contexts
   * Used in headers, titles, and introductions
   */
  displayName: 'PAT',

  /**
   * Full description of the assistant's purpose
   * Used in onboarding and help texts
   */
  description: 'Ihr persönlicher Assistent für Stress und Resilienz',

  /**
   * Short description for compact UI elements
   */
  shortDescription: 'Persönlicher Assistent',

  /**
   * Persona name for LLM prompts
   * Used in system prompts to define the assistant's identity
   */
  personaName: 'PAT',

  /**
   * Greeting message for chat introductions
   */
  greeting: 'Hallo! Ich bin PAT.',

  /**
   * Role description for clinician interface
   */
  clinicianRole: 'KI-Assistent',
} as const

/**
 * Type-safe access to assistant configuration
 */
export type AssistantConfig = typeof ASSISTANT_CONFIG
