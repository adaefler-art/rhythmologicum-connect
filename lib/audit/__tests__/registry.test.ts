import {
  AUDIT_ENTITY_TYPE,
  AUDIT_ACTION,
  AUDIT_SOURCE,
  isValidAuditEntityType,
  isValidAuditAction,
  isValidAuditSource,
} from '@/lib/contracts/registry'

describe('Audit Constants', () => {
  describe('AUDIT_ENTITY_TYPE', () => {
    it('has expected entity types', () => {
      expect(AUDIT_ENTITY_TYPE.ASSESSMENT).toBe('assessment')
      expect(AUDIT_ENTITY_TYPE.REPORT).toBe('report')
      expect(AUDIT_ENTITY_TYPE.TASK).toBe('task')
      expect(AUDIT_ENTITY_TYPE.FUNNEL_VERSION).toBe('funnel_version')
      expect(AUDIT_ENTITY_TYPE.FUNNEL_CATALOG).toBe('funnel_catalog')
      expect(AUDIT_ENTITY_TYPE.CONFIG).toBe('config')
      expect(AUDIT_ENTITY_TYPE.CONSENT).toBe('consent')
      expect(AUDIT_ENTITY_TYPE.ORGANIZATION).toBe('organization')
      expect(AUDIT_ENTITY_TYPE.USER_ORG_MEMBERSHIP).toBe('user_org_membership')
      expect(AUDIT_ENTITY_TYPE.CLINICIAN_ASSIGNMENT).toBe('clinician_assignment')
      expect(AUDIT_ENTITY_TYPE.DOCUMENT).toBe('document') // V05-I04.3
      expect(AUDIT_ENTITY_TYPE.PROCESSING_JOB).toBe('processing_job') // V05-I05.1
      expect(AUDIT_ENTITY_TYPE.REVIEW_RECORD).toBe('review_record') // V05-I05.7
    })

    it('has exactly 17 entity types', () => {
      expect(Object.keys(AUDIT_ENTITY_TYPE)).toHaveLength(17)
    })
  })

  describe('AUDIT_ACTION', () => {
    it('has expected actions', () => {
      expect(AUDIT_ACTION.CREATE).toBe('create')
      expect(AUDIT_ACTION.UPDATE).toBe('update')
      expect(AUDIT_ACTION.DELETE).toBe('delete')
      expect(AUDIT_ACTION.APPROVE).toBe('approve')
      expect(AUDIT_ACTION.REJECT).toBe('reject')
      expect(AUDIT_ACTION.REQUEST_CHANGES).toBe('request_changes') // V05-I05.7
      expect(AUDIT_ACTION.GENERATE).toBe('generate')
      expect(AUDIT_ACTION.FLAG).toBe('flag')
      expect(AUDIT_ACTION.ASSIGN).toBe('assign')
      expect(AUDIT_ACTION.ACTIVATE).toBe('activate')
      expect(AUDIT_ACTION.DEACTIVATE).toBe('deactivate')
      expect(AUDIT_ACTION.ROLLOUT).toBe('rollout')
      expect(AUDIT_ACTION.COMPLETE).toBe('complete')
    })

    it('has exactly 18 actions', () => {
      expect(Object.keys(AUDIT_ACTION)).toHaveLength(18)
    })
  })

  describe('AUDIT_SOURCE', () => {
    it('has expected sources', () => {
      expect(AUDIT_SOURCE.API).toBe('api')
      expect(AUDIT_SOURCE.JOB).toBe('job')
      expect(AUDIT_SOURCE.ADMIN_UI).toBe('admin-ui')
      expect(AUDIT_SOURCE.SYSTEM).toBe('system')
    })

    it('has exactly 4 sources', () => {
      expect(Object.keys(AUDIT_SOURCE)).toHaveLength(4)
    })
  })
})

describe('Audit Type Guards', () => {
  describe('isValidAuditEntityType', () => {
    it('accepts valid entity types', () => {
      expect(isValidAuditEntityType('assessment')).toBe(true)
      expect(isValidAuditEntityType('report')).toBe(true)
      expect(isValidAuditEntityType('task')).toBe(true)
      expect(isValidAuditEntityType('funnel_version')).toBe(true)
      expect(isValidAuditEntityType('config')).toBe(true)
      expect(isValidAuditEntityType('consent')).toBe(true)
      expect(isValidAuditEntityType('document')).toBe(true) // V05-I04.3
    })

    it('rejects unknown entity types', () => {
      expect(isValidAuditEntityType('invalid_entity')).toBe(false)
      expect(isValidAuditEntityType('user')).toBe(false)
      expect(isValidAuditEntityType('REPORT')).toBe(false) // case-sensitive
      expect(isValidAuditEntityType('')).toBe(false)
    })

    it('rejects non-string values', () => {
      expect(isValidAuditEntityType(null)).toBe(false)
      expect(isValidAuditEntityType(undefined)).toBe(false)
      expect(isValidAuditEntityType(123)).toBe(false)
      expect(isValidAuditEntityType({})).toBe(false)
    })
  })

  describe('isValidAuditAction', () => {
    it('accepts valid actions', () => {
      expect(isValidAuditAction('create')).toBe(true)
      expect(isValidAuditAction('update')).toBe(true)
      expect(isValidAuditAction('delete')).toBe(true)
      expect(isValidAuditAction('approve')).toBe(true)
      expect(isValidAuditAction('reject')).toBe(true)
      expect(isValidAuditAction('generate')).toBe(true)
      expect(isValidAuditAction('flag')).toBe(true)
      expect(isValidAuditAction('assign')).toBe(true)
      expect(isValidAuditAction('activate')).toBe(true)
      expect(isValidAuditAction('rollout')).toBe(true)
    })

    it('rejects unknown actions', () => {
      expect(isValidAuditAction('unknown')).toBe(false)
      expect(isValidAuditAction('edit')).toBe(false)
      expect(isValidAuditAction('CREATE')).toBe(false) // case-sensitive
      expect(isValidAuditAction('')).toBe(false)
    })

    it('rejects non-string values', () => {
      expect(isValidAuditAction(null)).toBe(false)
      expect(isValidAuditAction(undefined)).toBe(false)
      expect(isValidAuditAction(123)).toBe(false)
    })
  })

  describe('isValidAuditSource', () => {
    it('accepts valid sources', () => {
      expect(isValidAuditSource('api')).toBe(true)
      expect(isValidAuditSource('job')).toBe(true)
      expect(isValidAuditSource('admin-ui')).toBe(true)
      expect(isValidAuditSource('system')).toBe(true)
    })

    it('rejects unknown sources', () => {
      expect(isValidAuditSource('unknown')).toBe(false)
      expect(isValidAuditSource('cli')).toBe(false)
      expect(isValidAuditSource('API')).toBe(false) // case-sensitive
      expect(isValidAuditSource('')).toBe(false)
    })

    it('rejects non-string values', () => {
      expect(isValidAuditSource(null)).toBe(false)
      expect(isValidAuditSource(undefined)).toBe(false)
      expect(isValidAuditSource(123)).toBe(false)
    })
  })
})
