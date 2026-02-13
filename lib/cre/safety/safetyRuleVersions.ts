import { ruleDefaultsSchema, validateRuleConfig, type RuleDefaults, type RuleLogicConfig } from './ruleConfig'

export type SafetyRuleVersionRecord = {
  id: string
  version: number
  status: 'draft' | 'active' | 'archived'
  rule_id: string
  rule_key: string
  logic: RuleLogicConfig
  defaults?: RuleDefaults
}

export type SafetyRuleOverridesMap = Record<
  string,
  {
    logic: RuleLogicConfig
    defaults?: RuleDefaults
    version_id: string
    version: number
  }
>

const normalizeVersionRecord = (record: {
  id: string
  version: number
  status: string
  rule_id: string
  safety_rules?: { key?: string | null } | null
  logic_json?: unknown
  defaults?: unknown
}): SafetyRuleVersionRecord | null => {
  const key = record.safety_rules?.key
  if (!key) return null

  const configResult = validateRuleConfig(record.logic_json)
  if (!configResult.ok) return null

  const defaultsParsed = ruleDefaultsSchema.safeParse(record.defaults ?? {})

  return {
    id: record.id,
    version: record.version,
    status: record.status as SafetyRuleVersionRecord['status'],
    rule_id: record.rule_id,
    rule_key: key,
    logic: configResult.value,
    defaults: defaultsParsed.success ? defaultsParsed.data : undefined,
  }
}

export const buildSafetyRuleOverrides = (
  records: SafetyRuleVersionRecord[],
): SafetyRuleOverridesMap => {
  return records.reduce<SafetyRuleOverridesMap>((acc, record) => {
    acc[record.rule_key] = {
      logic: record.logic,
      defaults: record.defaults,
      version_id: record.id,
      version: record.version,
    }
    return acc
  }, {})
}

export const loadActiveSafetyRuleOverrides = async (params: {
  supabase: any
}): Promise<SafetyRuleOverridesMap> => {
  const { supabase } = params
  const { data, error } = await supabase
    .from('safety_rule_versions' as any)
    .select('id, version, status, rule_id, logic_json, defaults, safety_rules ( key )')
    .eq('status', 'active')

  if (error || !data) {
    return {}
  }

  const records = data
    .map((entry: any) =>
      normalizeVersionRecord({
        id: entry.id,
        version: entry.version,
        status: entry.status,
        rule_id: entry.rule_id,
        safety_rules: entry.safety_rules,
        logic_json: entry.logic_json,
        defaults: entry.defaults,
      })
    )
    .filter((entry: SafetyRuleVersionRecord | null): entry is SafetyRuleVersionRecord => Boolean(entry))

  return buildSafetyRuleOverrides(records)
}

export const loadSafetyRuleVersionById = async (params: {
  supabase: any
  versionId: string
}): Promise<SafetyRuleVersionRecord | null> => {
  const { supabase, versionId } = params
  const { data, error } = await supabase
    .from('safety_rule_versions' as any)
    .select('id, version, status, rule_id, logic_json, defaults, safety_rules ( key )')
    .eq('id', versionId)
    .maybeSingle()

  if (error || !data) return null

  return normalizeVersionRecord({
    id: data.id,
    version: data.version,
    status: data.status,
    rule_id: data.rule_id,
    safety_rules: data.safety_rules,
    logic_json: data.logic_json,
    defaults: data.defaults,
  })
}
