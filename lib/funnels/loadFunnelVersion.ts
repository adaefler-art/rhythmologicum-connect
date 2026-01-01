/**
 * Funnel Version Loader (V05-I02.2)
 * 
 * Server-only module for loading and validating funnel versions with their plugin manifests.
 * 
 * **IMPORTANT**: This module uses Supabase server client and should ONLY be used in:
 * - Server Components
 * - API Routes
 * - Server Actions
 * 
 * DO NOT import this in client components!
 */

import { createClient } from '@supabase/supabase-js'
import {
  FunnelPluginManifestSchema,
  FunnelQuestionnaireConfigSchema,
  FunnelContentManifestSchema,
  parseQuestionnaireConfig,
  parseContentManifest,
  type FunnelPluginManifest,
  type FunnelQuestionnaireConfig,
  type FunnelContentManifest,
} from '@/lib/contracts/funnelManifest'
import { getCanonicalFunnelSlug } from '@/lib/contracts/registry'

// ============================================================
// Type Definitions
// ============================================================

/**
 * Raw funnel version data from database
 */
export type FunnelVersionRow = {
  id: string
  funnel_id: string
  version: string
  questionnaire_config: unknown
  content_manifest: unknown
  algorithm_bundle_version: string
  prompt_version: string
  is_default: boolean
  rollout_percent: number
  created_at: string
  updated_at: string | null
}

/**
 * Loaded and validated funnel version with parsed manifest
 */
export type LoadedFunnelVersion = {
  id: string
  funnelId: string
  version: string
  manifest: FunnelPluginManifest
  isDefault: boolean
  rolloutPercent: number
  createdAt: string
  updatedAt: string | null
}

/**
 * Funnel catalog entry
 */
export type FunnelCatalogEntry = {
  id: string
  slug: string
  title: string
  pillarId: string | null
  description: string | null
  isActive: boolean
}

/**
 * Error types for funnel loading
 */
export class FunnelNotFoundError extends Error {
  constructor(slug: string) {
    super(`Funnel not found: ${slug}`)
    this.name = 'FunnelNotFoundError'
  }
}

export class FunnelVersionNotFoundError extends Error {
  constructor(funnelId: string, version?: string) {
    super(
      version
        ? `Funnel version not found: ${funnelId}@${version}`
        : `No default version found for funnel: ${funnelId}`,
    )
    this.name = 'FunnelVersionNotFoundError'
  }
}

export class ManifestValidationError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(`Manifest validation failed: ${message}`)
    this.name = 'ManifestValidationError'
  }
}

// ============================================================
// Supabase Client (Server-only)
// ============================================================

/**
 * Get Supabase server client
 * Uses environment variables for auth
 */
function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseKey)
}

// ============================================================
// Core Loader Functions
// ============================================================

/**
 * Loads a funnel by slug (canonical resolution)
 * 
 * @param slug - Funnel slug (can be legacy alias)
 * @returns Funnel catalog entry or null if not found
 */
export async function loadFunnel(slug: string): Promise<FunnelCatalogEntry | null> {
  const supabase = getSupabaseServerClient()
  const canonicalSlug = getCanonicalFunnelSlug(slug)

  const { data, error } = await supabase
    .from('funnels_catalog')
    .select('id, slug, title, pillar_id, description, is_active')
    .eq('slug', canonicalSlug)
    .single()

  if (error || !data) {
    return null
  }

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    pillarId: data.pillar_id,
    description: data.description,
    isActive: data.is_active,
  }
}

/**
 * Loads a specific funnel version by ID
 * 
 * @param versionId - UUID of the funnel version
 * @returns Loaded and validated funnel version
 * @throws {FunnelVersionNotFoundError} If version not found
 * @throws {ManifestValidationError} If manifest validation fails
 */
export async function loadFunnelVersionById(
  versionId: string,
): Promise<LoadedFunnelVersion> {
  const supabase = getSupabaseServerClient()

  const { data, error } = await supabase
    .from('funnel_versions')
    .select('*')
    .eq('id', versionId)
    .single()

  if (error || !data) {
    throw new FunnelVersionNotFoundError(versionId)
  }

  return parseAndValidateFunnelVersion(data as FunnelVersionRow)
}

/**
 * Loads the default version for a funnel
 * 
 * @param funnelId - UUID of the funnel
 * @returns Loaded and validated default funnel version
 * @throws {FunnelVersionNotFoundError} If no default version found
 * @throws {ManifestValidationError} If manifest validation fails
 */
export async function loadDefaultFunnelVersion(
  funnelId: string,
): Promise<LoadedFunnelVersion> {
  const supabase = getSupabaseServerClient()

  const { data, error } = await supabase
    .from('funnel_versions')
    .select('*')
    .eq('funnel_id', funnelId)
    .eq('is_default', true)
    .single()

  if (error || !data) {
    throw new FunnelVersionNotFoundError(funnelId)
  }

  return parseAndValidateFunnelVersion(data as FunnelVersionRow)
}

/**
 * Loads a specific version by funnel ID and version string
 * 
 * @param funnelId - UUID of the funnel
 * @param version - Version string (e.g., '1.0.0')
 * @returns Loaded and validated funnel version
 * @throws {FunnelVersionNotFoundError} If version not found
 * @throws {ManifestValidationError} If manifest validation fails
 */
export async function loadFunnelVersionByVersion(
  funnelId: string,
  version: string,
): Promise<LoadedFunnelVersion> {
  const supabase = getSupabaseServerClient()

  const { data, error } = await supabase
    .from('funnel_versions')
    .select('*')
    .eq('funnel_id', funnelId)
    .eq('version', version)
    .single()

  if (error || !data) {
    throw new FunnelVersionNotFoundError(funnelId, version)
  }

  return parseAndValidateFunnelVersion(data as FunnelVersionRow)
}

/**
 * High-level loader: Loads funnel and its default version by slug
 * 
 * @param slug - Funnel slug (canonical or legacy alias)
 * @returns Loaded funnel version with manifest
 * @throws {FunnelNotFoundError} If funnel not found
 * @throws {FunnelVersionNotFoundError} If no default version found
 * @throws {ManifestValidationError} If manifest validation fails
 */
export async function loadFunnelVersion(slug: string): Promise<LoadedFunnelVersion> {
  const funnel = await loadFunnel(slug)

  if (!funnel) {
    throw new FunnelNotFoundError(slug)
  }

  return loadDefaultFunnelVersion(funnel.id)
}

// ============================================================
// Validation Helpers
// ============================================================

/**
 * Parses and validates a funnel version row from the database
 * 
 * @param row - Raw funnel version data
 * @returns Validated funnel version with parsed manifest
 * @throws {ManifestValidationError} If validation fails
 */
function parseAndValidateFunnelVersion(row: FunnelVersionRow): LoadedFunnelVersion {
  try {
    // Parse and validate questionnaire config
    const questionnaireConfig = parseQuestionnaireConfig(row.questionnaire_config)

    // Parse and validate content manifest
    const contentManifest = parseContentManifest(row.content_manifest)

    // Construct complete manifest
    const manifest: FunnelPluginManifest = {
      questionnaire_config: questionnaireConfig,
      content_manifest: contentManifest,
      algorithm_bundle_version: row.algorithm_bundle_version,
      prompt_version: row.prompt_version,
    }

    // Final validation of complete manifest
    FunnelPluginManifestSchema.parse(manifest)

    return {
      id: row.id,
      funnelId: row.funnel_id,
      version: row.version,
      manifest,
      isDefault: row.is_default,
      rolloutPercent: row.rollout_percent,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new ManifestValidationError(error.message, error)
    }
    throw new ManifestValidationError('Unknown validation error', error)
  }
}

/**
 * Validates questionnaire config without loading from database
 * Useful for validation during creation/update operations
 * 
 * @param config - Questionnaire config to validate
 * @returns Validated config
 * @throws {ManifestValidationError} If validation fails
 */
export function validateQuestionnaireConfig(
  config: unknown,
): FunnelQuestionnaireConfig {
  try {
    return FunnelQuestionnaireConfigSchema.parse(config)
  } catch (error) {
    if (error instanceof Error) {
      throw new ManifestValidationError(
        `Questionnaire config validation failed: ${error.message}`,
        error,
      )
    }
    throw new ManifestValidationError('Unknown questionnaire config validation error', error)
  }
}

/**
 * Validates content manifest without loading from database
 * Useful for validation during creation/update operations
 * 
 * @param manifest - Content manifest to validate
 * @returns Validated manifest
 * @throws {ManifestValidationError} If validation fails
 */
export function validateContentManifest(manifest: unknown): FunnelContentManifest {
  try {
    return FunnelContentManifestSchema.parse(manifest)
  } catch (error) {
    if (error instanceof Error) {
      throw new ManifestValidationError(
        `Content manifest validation failed: ${error.message}`,
        error,
      )
    }
    throw new ManifestValidationError('Unknown content manifest validation error', error)
  }
}
