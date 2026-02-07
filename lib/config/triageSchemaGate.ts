import { env } from '@/lib/env'

export type TriageSchemaGateMode = 'off' | 'soft' | 'hard'

const DEFAULT_GATE_MODE: TriageSchemaGateMode = 'soft'

export function getTriageSchemaGateMode(): TriageSchemaGateMode {
  const raw = env.TRIAGE_SCHEMA_GATE?.trim().toLowerCase()
  if (raw === 'off' || raw === 'soft' || raw === 'hard') {
    return raw
  }
  return DEFAULT_GATE_MODE
}
