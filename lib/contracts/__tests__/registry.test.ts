import {
  getCanonicalFunnelSlug,
  isValidUserRole,
  isValidAssessmentStatus,
  isValidContentStatus,
  isValidNodeType,
  ASSESSMENT_STATUS,
  CONTENT_STATUS,
  USER_ROLE,
  NODE_TYPE,
} from '../registry'

describe('getCanonicalFunnelSlug', () => {
  it('normalizes legacy slugs to canonical', () => {
    expect(getCanonicalFunnelSlug('stress')).toBe('stress-assessment')
    expect(getCanonicalFunnelSlug('stress-check')).toBe('stress-assessment')
    expect(getCanonicalFunnelSlug('stress-check-v2')).toBe('stress-assessment')
  })

  it('handles case-insensitive input', () => {
    expect(getCanonicalFunnelSlug('STRESS')).toBe('stress-assessment')
    expect(getCanonicalFunnelSlug('Stress-Check')).toBe('stress-assessment')
    expect(getCanonicalFunnelSlug('STRESS-CHECK-V2')).toBe('stress-assessment')
  })

  it('trims whitespace', () => {
    expect(getCanonicalFunnelSlug(' stress ')).toBe('stress-assessment')
    expect(getCanonicalFunnelSlug('  stress-check  ')).toBe('stress-assessment')
    expect(getCanonicalFunnelSlug('\t stress \n')).toBe('stress-assessment')
  })

  it('returns unknown slugs as-is (normalized)', () => {
    expect(getCanonicalFunnelSlug('unknown-funnel')).toBe('unknown-funnel')
    expect(getCanonicalFunnelSlug('UNKNOWN-FUNNEL')).toBe('unknown-funnel')
    expect(getCanonicalFunnelSlug(' Unknown-Funnel ')).toBe('unknown-funnel')
  })

  it('returns canonical slug unchanged', () => {
    expect(getCanonicalFunnelSlug('stress-assessment')).toBe('stress-assessment')
    expect(getCanonicalFunnelSlug('STRESS-ASSESSMENT')).toBe('stress-assessment')
  })

  it('handles empty string', () => {
    expect(getCanonicalFunnelSlug('')).toBe('')
    expect(getCanonicalFunnelSlug('   ')).toBe('')
  })
})

describe('Type Guards', () => {
  describe('isValidUserRole', () => {
    it('accepts valid roles', () => {
      expect(isValidUserRole('patient')).toBe(true)
      expect(isValidUserRole('clinician')).toBe(true)
      expect(isValidUserRole('admin')).toBe(true)
      expect(isValidUserRole('nurse')).toBe(true)
    })

    it('rejects unknown roles', () => {
      expect(isValidUserRole('hacker')).toBe(false)
      expect(isValidUserRole('doctor')).toBe(false)
      expect(isValidUserRole('PATIENT')).toBe(false) // case-sensitive
      expect(isValidUserRole('')).toBe(false)
    })

    it('rejects non-string values', () => {
      expect(isValidUserRole(null)).toBe(false)
      expect(isValidUserRole(undefined)).toBe(false)
      expect(isValidUserRole(123)).toBe(false)
      expect(isValidUserRole({})).toBe(false)
    })
  })

  describe('isValidAssessmentStatus', () => {
    it('accepts valid statuses', () => {
      expect(isValidAssessmentStatus('in_progress')).toBe(true)
      expect(isValidAssessmentStatus('completed')).toBe(true)
    })

    it('rejects unknown statuses', () => {
      expect(isValidAssessmentStatus('processing')).toBe(false)
      expect(isValidAssessmentStatus('abandoned')).toBe(false)
      expect(isValidAssessmentStatus('pending')).toBe(false)
      expect(isValidAssessmentStatus('IN_PROGRESS')).toBe(false) // case-sensitive
    })

    it('rejects non-string values', () => {
      expect(isValidAssessmentStatus(null)).toBe(false)
      expect(isValidAssessmentStatus(undefined)).toBe(false)
      expect(isValidAssessmentStatus(123)).toBe(false)
    })
  })

  describe('isValidContentStatus', () => {
    it('accepts valid statuses', () => {
      expect(isValidContentStatus('draft')).toBe(true)
      expect(isValidContentStatus('published')).toBe(true)
      expect(isValidContentStatus('archived')).toBe(true)
    })

    it('rejects unknown statuses', () => {
      expect(isValidContentStatus('pending')).toBe(false)
      expect(isValidContentStatus('DRAFT')).toBe(false) // case-sensitive
    })
  })

  describe('isValidNodeType', () => {
    it('accepts valid node types', () => {
      expect(isValidNodeType('question_step')).toBe(true)
      expect(isValidNodeType('form')).toBe(true)
      expect(isValidNodeType('info_step')).toBe(true)
      expect(isValidNodeType('content_page')).toBe(true)
      expect(isValidNodeType('summary')).toBe(true)
    })

    it('rejects unknown node types', () => {
      expect(isValidNodeType('invalid_type')).toBe(false)
      expect(isValidNodeType('QUESTION_STEP')).toBe(false) // case-sensitive
    })
  })
})

describe('Constants', () => {
  it('ASSESSMENT_STATUS has expected values', () => {
    expect(ASSESSMENT_STATUS.IN_PROGRESS).toBe('in_progress')
    expect(ASSESSMENT_STATUS.COMPLETED).toBe('completed')
    expect(Object.keys(ASSESSMENT_STATUS)).toHaveLength(2)
  })

  it('CONTENT_STATUS has expected values', () => {
    expect(CONTENT_STATUS.DRAFT).toBe('draft')
    expect(CONTENT_STATUS.PUBLISHED).toBe('published')
    expect(CONTENT_STATUS.ARCHIVED).toBe('archived')
    expect(Object.keys(CONTENT_STATUS)).toHaveLength(3)
  })

  it('USER_ROLE has expected values', () => {
    expect(USER_ROLE.PATIENT).toBe('patient')
    expect(USER_ROLE.CLINICIAN).toBe('clinician')
    expect(USER_ROLE.ADMIN).toBe('admin')
    expect(USER_ROLE.NURSE).toBe('nurse')
    expect(Object.keys(USER_ROLE)).toHaveLength(4)
  })

  it('NODE_TYPE has expected values', () => {
    expect(NODE_TYPE.QUESTION_STEP).toBe('question_step')
    expect(NODE_TYPE.FORM).toBe('form')
    expect(NODE_TYPE.INFO_STEP).toBe('info_step')
    expect(NODE_TYPE.INFO).toBe('info')
    expect(NODE_TYPE.CONTENT_PAGE).toBe('content_page')
    expect(NODE_TYPE.SUMMARY).toBe('summary')
    expect(NODE_TYPE.OTHER).toBe('other')
    expect(Object.keys(NODE_TYPE)).toHaveLength(7)
  })
})
