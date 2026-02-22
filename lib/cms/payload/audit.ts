import 'server-only'

import { logAuditEvent } from '@/lib/audit/log'
import { AUDIT_ACTION, AUDIT_ENTITY_TYPE, AUDIT_SOURCE, type AuditAction, type UserRole } from '@/lib/contracts/registry'

export type CmsAuditOptions = {
  actorUserId?: string
  actorRole?: UserRole
  action: AuditAction
  entityId: string
  reason?: string
  funnelSlug?: string
  isActive?: boolean
}

export async function logCmsPayloadAudit(options: CmsAuditOptions): Promise<void> {
  await logAuditEvent({
    actor_user_id: options.actorUserId,
    actor_role: options.actorRole,
    source: AUDIT_SOURCE.API,
    entity_type: AUDIT_ENTITY_TYPE.CONFIG,
    entity_id: options.entityId,
    action: options.action,
    metadata: {
      config_key: options.entityId,
      reason: options.reason,
      funnel_slug: options.funnelSlug,
      is_active: options.isActive,
    },
  })
}

export const CMS_AUDIT_ENTITY = {
  SYNC: 'cms-payload-sync',
  WEBHOOK: 'cms-payload-webhook',
  PREVIEW: 'cms-payload-preview',
} as const

export const CMS_AUDIT_ACTION = {
  SYNC: AUDIT_ACTION.UPDATE,
  WEBHOOK: AUDIT_ACTION.UPDATE,
  PREVIEW_ENABLE: AUDIT_ACTION.ACTIVATE,
  PREVIEW_DISABLE: AUDIT_ACTION.DEACTIVATE,
} as const
