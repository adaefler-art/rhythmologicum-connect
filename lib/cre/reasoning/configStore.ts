import {
  defaultClinicalReasoningConfig,
  validateClinicalReasoningConfig,
  type ClinicalReasoningConfig,
} from './config'
import type { SupabaseClient } from '@supabase/supabase-js'

const CLINICAL_REASONING_CONFIGS_TABLE =
  'clinical_reasoning_configs' as unknown as 'safety_rules'

export type ClinicalReasoningConfigRecord = {
  id: string
  version: number
  status: 'draft' | 'active' | 'archived'
  config_json: ClinicalReasoningConfig
  change_reason: string
  created_by: string
  created_at: string
}

const normalizeConfigRecord = (record: {
  id: string
  version: number
  status: string
  config_json: unknown
  change_reason: string
  created_by: string
  created_at: string
}): ClinicalReasoningConfigRecord | null => {
  const validation = validateClinicalReasoningConfig(record.config_json)
  if (!validation.ok) return null

  return {
    id: record.id,
    version: record.version,
    status: record.status as ClinicalReasoningConfigRecord['status'],
    config_json: validation.value,
    change_reason: record.change_reason,
    created_by: record.created_by,
    created_at: record.created_at,
  }
}

export const loadClinicalReasoningConfigById = async (params: {
  supabase: SupabaseClient
  id: string
}): Promise<ClinicalReasoningConfigRecord | null> => {
  const { supabase, id } = params

  const { data, error } = (await supabase
    .from(CLINICAL_REASONING_CONFIGS_TABLE)
    .select('id, version, status, config_json, change_reason, created_by, created_at')
    .eq('id', id)
    .maybeSingle()) as unknown as {
      data: {
        id: string
        version: number
        status: string
        config_json: unknown
        change_reason: string
        created_by: string
        created_at: string
      } | null
      error: unknown
    }

  if (error || !data) return null

  return normalizeConfigRecord(data)
}

export const loadActiveClinicalReasoningConfig = async (params: {
  supabase: SupabaseClient
}): Promise<ClinicalReasoningConfigRecord | null> => {
  const { supabase } = params

  const { data, error } = (await supabase
    .from(CLINICAL_REASONING_CONFIGS_TABLE)
    .select('id, version, status, config_json, change_reason, created_by, created_at')
    .eq('status', 'active')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()) as unknown as {
      data: {
        id: string
        version: number
        status: string
        config_json: unknown
        change_reason: string
        created_by: string
        created_at: string
      } | null
      error: unknown
    }

  if (error || !data) return null

  return normalizeConfigRecord(data)
}

export const loadAllClinicalReasoningConfigs = async (params: {
  supabase: SupabaseClient
}): Promise<ClinicalReasoningConfigRecord[]> => {
  const { supabase } = params

  const { data, error } = (await supabase
    .from(CLINICAL_REASONING_CONFIGS_TABLE)
    .select('id, version, status, config_json, change_reason, created_by, created_at')
    .order('version', { ascending: false })) as unknown as {
      data:
        | Array<{
            id: string
            version: number
            status: string
            config_json: unknown
            change_reason: string
            created_by: string
            created_at: string
          }>
        | null
      error: unknown
    }

  if (error || !data) return []

  return data
    .map((entry) => normalizeConfigRecord(entry))
    .filter((entry: ClinicalReasoningConfigRecord | null): entry is ClinicalReasoningConfigRecord =>
      Boolean(entry),
    )
}

export const getSeedClinicalReasoningConfig = () => defaultClinicalReasoningConfig
