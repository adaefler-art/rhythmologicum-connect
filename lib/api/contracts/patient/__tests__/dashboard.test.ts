/**
 * Tests for Patient Dashboard Contracts (E6.5.2)
 * 
 * E6.5.2 AC1: Contract as Zod schema with runtime validation
 * E6.5.2 AC2: Response envelope + error semantics standardized
 * E6.5.2 AC3: Version marker present
 */

import {
  PATIENT_DASHBOARD_SCHEMA_VERSION,
  DASHBOARD_VERSION,
  ONBOARDING_STATUS,
  NEXT_STEP_TYPE,
  FUNNEL_STATUS,
  WORKUP_STATE,
  CONTENT_TILE_TYPE,
  OnboardingStatusSchema,
  NextStepSchema,
  FunnelSummarySchema,
  WorkupSummarySchema,
  ContentTileSchema,
  DashboardMetaSchema,
  DashboardViewModelV1Schema,
  DashboardResponseSchema,
  DashboardErrorSchema,
  validateDashboardResponse,
  safeValidateDashboardResponse,
  validateDashboardViewModel,
  safeValidateDashboardViewModel,
  createEmptyDashboardViewModel,
} from '../dashboard'

describe('E6.5.2: Patient Dashboard Contracts', () => {
  describe('Schema Version and Constants', () => {
    it('should have consistent schema version', () => {
      expect(PATIENT_DASHBOARD_SCHEMA_VERSION).toBe('v1')
    })

    it('should have dashboard version marker', () => {
      expect(DASHBOARD_VERSION).toBe(1)
    })
  })

  describe('OnboardingStatusSchema', () => {
    it('should validate valid onboarding status values', () => {
      const validStatuses = ['not_started', 'in_progress', 'completed']
      validStatuses.forEach((status) => {
        const result = OnboardingStatusSchema.safeParse(status)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid onboarding status', () => {
      const result = OnboardingStatusSchema.safeParse('invalid_status')
      expect(result.success).toBe(false)
    })
  })

  describe('NextStepSchema', () => {
    it('should validate a valid next step object', () => {
      const validNextStep = {
        type: NEXT_STEP_TYPE.FUNNEL,
        target: '/patient/funnel/stress-assessment',
        label: 'Continue Stress Assessment',
      }

      const result = NextStepSchema.safeParse(validNextStep)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.type).toBe('funnel')
        expect(result.data.target).toBe('/patient/funnel/stress-assessment')
      }
    })

    it('should validate next step with null target', () => {
      const validNextStep = {
        type: NEXT_STEP_TYPE.NONE,
        target: null,
        label: 'No next step',
      }

      const result = NextStepSchema.safeParse(validNextStep)
      expect(result.success).toBe(true)
    })

    it('should reject invalid next step type', () => {
      const invalidNextStep = {
        type: 'invalid_type',
        target: '/some/path',
        label: 'Some Label',
      }

      const result = NextStepSchema.safeParse(invalidNextStep)
      expect(result.success).toBe(false)
    })

    it('should reject missing required fields', () => {
      const invalidNextStep = {
        type: NEXT_STEP_TYPE.FUNNEL,
        // missing target and label
      }

      const result = NextStepSchema.safeParse(invalidNextStep)
      expect(result.success).toBe(false)
    })
  })

  describe('FunnelSummarySchema', () => {
    it('should validate a complete funnel summary', () => {
      const validFunnel = {
        slug: 'stress-assessment',
        title: 'Stress Assessment',
        description: 'Evaluate your stress levels',
        status: FUNNEL_STATUS.IN_PROGRESS,
        lastAssessmentId: '123e4567-e89b-12d3-a456-426614174000',
        completedAt: '2026-01-15T10:30:00Z',
        progress: {
          current: 3,
          total: 10,
        },
      }

      const result = FunnelSummarySchema.safeParse(validFunnel)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.slug).toBe('stress-assessment')
        expect(result.data.progress?.current).toBe(3)
      }
    })

    it('should validate funnel summary with null optional fields', () => {
      const validFunnel = {
        slug: 'resilience-assessment',
        title: 'Resilience Assessment',
        description: null,
        status: FUNNEL_STATUS.NOT_STARTED,
        lastAssessmentId: null,
        completedAt: null,
        progress: null,
      }

      const result = FunnelSummarySchema.safeParse(validFunnel)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID for lastAssessmentId', () => {
      const invalidFunnel = {
        slug: 'test-funnel',
        title: 'Test',
        description: null,
        status: FUNNEL_STATUS.COMPLETED,
        lastAssessmentId: 'not-a-uuid',
        completedAt: null,
        progress: null,
      }

      const result = FunnelSummarySchema.safeParse(invalidFunnel)
      expect(result.success).toBe(false)
    })

    it('should reject negative progress values', () => {
      const invalidFunnel = {
        slug: 'test-funnel',
        title: 'Test',
        description: null,
        status: FUNNEL_STATUS.IN_PROGRESS,
        lastAssessmentId: null,
        completedAt: null,
        progress: {
          current: -1,
          total: 10,
        },
      }

      const result = FunnelSummarySchema.safeParse(invalidFunnel)
      expect(result.success).toBe(false)
    })

    it('should reject zero or negative total in progress', () => {
      const invalidFunnel = {
        slug: 'test-funnel',
        title: 'Test',
        description: null,
        status: FUNNEL_STATUS.IN_PROGRESS,
        lastAssessmentId: null,
        completedAt: null,
        progress: {
          current: 5,
          total: 0,
        },
      }

      const result = FunnelSummarySchema.safeParse(invalidFunnel)
      expect(result.success).toBe(false)
    })
  })

  describe('WorkupSummarySchema', () => {
    it('should validate a valid workup summary', () => {
      const validWorkup = {
        state: WORKUP_STATE.NEEDS_MORE_DATA,
        counts: {
          needsMoreData: 2,
          readyForReview: 1,
          total: 3,
        },
      }

      const result = WorkupSummarySchema.safeParse(validWorkup)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.state).toBe('needs_more_data')
        expect(result.data.counts.total).toBe(3)
      }
    })

    it('should validate empty workup summary', () => {
      const emptyWorkup = {
        state: WORKUP_STATE.NO_DATA,
        counts: {
          needsMoreData: 0,
          readyForReview: 0,
          total: 0,
        },
      }

      const result = WorkupSummarySchema.safeParse(emptyWorkup)
      expect(result.success).toBe(true)
    })

    it('should reject negative counts', () => {
      const invalidWorkup = {
        state: WORKUP_STATE.NO_DATA,
        counts: {
          needsMoreData: -1,
          readyForReview: 0,
          total: 0,
        },
      }

      const result = WorkupSummarySchema.safeParse(invalidWorkup)
      expect(result.success).toBe(false)
    })

    it('should reject invalid workup state', () => {
      const invalidWorkup = {
        state: 'invalid_state',
        counts: {
          needsMoreData: 0,
          readyForReview: 0,
          total: 0,
        },
      }

      const result = WorkupSummarySchema.safeParse(invalidWorkup)
      expect(result.success).toBe(false)
    })
  })

  describe('ContentTileSchema', () => {
    it('should validate a complete content tile', () => {
      const validTile = {
        id: 'tile-1',
        type: CONTENT_TILE_TYPE.ACTION,
        title: 'Complete Your Assessment',
        description: 'Finish the stress assessment to get personalized recommendations',
        actionLabel: 'Start Now',
        actionTarget: '/patient/funnel/stress-assessment',
        priority: 10,
      }

      const result = ContentTileSchema.safeParse(validTile)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.type).toBe('action')
        expect(result.data.priority).toBe(10)
      }
    })

    it('should validate content tile with null optional fields', () => {
      const validTile = {
        id: 'tile-2',
        type: CONTENT_TILE_TYPE.INFO,
        title: 'Welcome',
        description: null,
        actionLabel: null,
        actionTarget: null,
        priority: 0,
      }

      const result = ContentTileSchema.safeParse(validTile)
      expect(result.success).toBe(true)
    })

    it('should use default priority when not provided', () => {
      const tileWithoutPriority = {
        id: 'tile-3',
        type: CONTENT_TILE_TYPE.PROMOTION,
        title: 'New Feature',
        description: null,
        actionLabel: null,
        actionTarget: null,
      }

      const result = ContentTileSchema.safeParse(tileWithoutPriority)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.priority).toBe(0)
      }
    })

    it('should reject negative priority', () => {
      const invalidTile = {
        id: 'tile-4',
        type: CONTENT_TILE_TYPE.INFO,
        title: 'Test',
        description: null,
        actionLabel: null,
        actionTarget: null,
        priority: -5,
      }

      const result = ContentTileSchema.safeParse(invalidTile)
      expect(result.success).toBe(false)
    })
  })

  describe('DashboardMetaSchema', () => {
    it('should validate valid dashboard meta', () => {
      const validMeta = {
        version: DASHBOARD_VERSION,
        correlationId: '123e4567-e89b-12d3-a456-426614174000',
        generatedAt: '2026-01-15T10:30:00Z',
      }

      const result = DashboardMetaSchema.safeParse(validMeta)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.version).toBe(1)
        expect(result.data.correlationId).toBe('123e4567-e89b-12d3-a456-426614174000')
      }
    })

    it('should reject wrong version number', () => {
      const invalidMeta = {
        version: 2,
        correlationId: '123e4567-e89b-12d3-a456-426614174000',
        generatedAt: '2026-01-15T10:30:00Z',
      }

      const result = DashboardMetaSchema.safeParse(invalidMeta)
      expect(result.success).toBe(false)
    })

    it('should reject invalid UUID for correlationId', () => {
      const invalidMeta = {
        version: DASHBOARD_VERSION,
        correlationId: 'not-a-uuid',
        generatedAt: '2026-01-15T10:30:00Z',
      }

      const result = DashboardMetaSchema.safeParse(invalidMeta)
      expect(result.success).toBe(false)
    })
  })

  describe('DashboardViewModelV1Schema', () => {
    it('should validate a complete dashboard view model', () => {
      const validViewModel = {
        onboardingStatus: ONBOARDING_STATUS.COMPLETED,
        nextStep: {
          type: NEXT_STEP_TYPE.FUNNEL,
          target: '/patient/funnel/stress-assessment',
          label: 'Continue Assessment',
        },
        funnelSummaries: [
          {
            slug: 'stress-assessment',
            title: 'Stress Assessment',
            description: 'Evaluate stress',
            status: FUNNEL_STATUS.IN_PROGRESS,
            lastAssessmentId: '123e4567-e89b-12d3-a456-426614174000',
            completedAt: null,
            progress: { current: 5, total: 10 },
          },
          {
            slug: 'resilience-assessment',
            title: 'Resilience Assessment',
            description: null,
            status: FUNNEL_STATUS.NOT_STARTED,
            lastAssessmentId: null,
            completedAt: null,
            progress: null,
          },
        ],
        workupSummary: {
          state: WORKUP_STATE.NEEDS_MORE_DATA,
          counts: {
            needsMoreData: 1,
            readyForReview: 0,
            total: 1,
          },
        },
        contentTiles: [
          {
            id: 'tile-1',
            type: CONTENT_TILE_TYPE.ACTION,
            title: 'Complete Assessment',
            description: null,
            actionLabel: 'Start',
            actionTarget: '/patient/funnel/stress-assessment',
            priority: 10,
          },
        ],
        meta: {
          version: DASHBOARD_VERSION,
          correlationId: '123e4567-e89b-12d3-a456-426614174000',
          generatedAt: '2026-01-15T10:30:00Z',
        },
      }

      const result = DashboardViewModelV1Schema.safeParse(validViewModel)
      expect(result.success).toBe(true)
    })

    it('should validate empty dashboard view model (E6.5.2: empty state)', () => {
      const emptyViewModel = {
        onboardingStatus: ONBOARDING_STATUS.NOT_STARTED,
        nextStep: {
          type: NEXT_STEP_TYPE.ONBOARDING,
          target: '/patient/onboarding',
          label: 'Complete Onboarding',
        },
        funnelSummaries: [],
        workupSummary: {
          state: WORKUP_STATE.NO_DATA,
          counts: {
            needsMoreData: 0,
            readyForReview: 0,
            total: 0,
          },
        },
        contentTiles: [],
        meta: {
          version: DASHBOARD_VERSION,
          correlationId: '123e4567-e89b-12d3-a456-426614174000',
          generatedAt: '2026-01-15T10:30:00Z',
        },
      }

      const result = DashboardViewModelV1Schema.safeParse(emptyViewModel)
      expect(result.success).toBe(true)
    })

    it('should validate view model without contentTiles (uses default)', () => {
      const viewModelWithoutTiles = {
        onboardingStatus: ONBOARDING_STATUS.COMPLETED,
        nextStep: {
          type: NEXT_STEP_TYPE.NONE,
          target: null,
          label: 'All done',
        },
        funnelSummaries: [],
        workupSummary: {
          state: WORKUP_STATE.NO_DATA,
          counts: {
            needsMoreData: 0,
            readyForReview: 0,
            total: 0,
          },
        },
        meta: {
          version: DASHBOARD_VERSION,
          correlationId: '123e4567-e89b-12d3-a456-426614174000',
          generatedAt: '2026-01-15T10:30:00Z',
        },
      }

      const result = DashboardViewModelV1Schema.safeParse(viewModelWithoutTiles)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.contentTiles).toEqual([])
      }
    })

    it('should reject view model missing required fields', () => {
      const invalidViewModel = {
        onboardingStatus: ONBOARDING_STATUS.COMPLETED,
        // missing nextStep, funnelSummaries, workupSummary, meta
      }

      const result = DashboardViewModelV1Schema.safeParse(invalidViewModel)
      expect(result.success).toBe(false)
    })
  })

  describe('DashboardResponseSchema', () => {
    it('should validate complete dashboard response (E6.5.2: happy path)', () => {
      const validResponse = {
        success: true,
        data: {
          onboardingStatus: ONBOARDING_STATUS.COMPLETED,
          nextStep: {
            type: NEXT_STEP_TYPE.FUNNEL,
            target: '/patient/funnel/stress-assessment',
            label: 'Start Stress Assessment',
          },
          funnelSummaries: [
            {
              slug: 'stress-assessment',
              title: 'Stress Assessment',
              description: 'Assess your stress',
              status: FUNNEL_STATUS.NOT_STARTED,
              lastAssessmentId: null,
              completedAt: null,
              progress: null,
            },
            {
              slug: 'resilience-assessment',
              title: 'Resilience Assessment',
              description: null,
              status: FUNNEL_STATUS.NOT_STARTED,
              lastAssessmentId: null,
              completedAt: null,
              progress: null,
            },
          ],
          workupSummary: {
            state: WORKUP_STATE.NO_DATA,
            counts: {
              needsMoreData: 0,
              readyForReview: 0,
              total: 0,
            },
          },
          contentTiles: [],
          meta: {
            version: DASHBOARD_VERSION,
            correlationId: '123e4567-e89b-12d3-a456-426614174000',
            generatedAt: '2026-01-15T10:30:00Z',
          },
        },
        schemaVersion: PATIENT_DASHBOARD_SCHEMA_VERSION,
        requestId: 'req-123',
      }

      const result = DashboardResponseSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.success).toBe(true)
        expect(result.data.schemaVersion).toBe('v1')
        expect(result.data.data.meta.version).toBe(1)
      }
    })

    it('should validate response without optional requestId', () => {
      const validResponse = {
        success: true,
        data: {
          onboardingStatus: ONBOARDING_STATUS.NOT_STARTED,
          nextStep: {
            type: NEXT_STEP_TYPE.ONBOARDING,
            target: '/patient/onboarding',
            label: 'Complete Onboarding',
          },
          funnelSummaries: [],
          workupSummary: {
            state: WORKUP_STATE.NO_DATA,
            counts: {
              needsMoreData: 0,
              readyForReview: 0,
              total: 0,
            },
          },
          contentTiles: [],
          meta: {
            version: DASHBOARD_VERSION,
            correlationId: '123e4567-e89b-12d3-a456-426614174000',
            generatedAt: '2026-01-15T10:30:00Z',
          },
        },
        schemaVersion: PATIENT_DASHBOARD_SCHEMA_VERSION,
      }

      const result = DashboardResponseSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
    })

    it('should reject response without schemaVersion', () => {
      const invalidResponse = {
        success: true,
        data: {
          onboardingStatus: ONBOARDING_STATUS.NOT_STARTED,
          nextStep: {
            type: NEXT_STEP_TYPE.ONBOARDING,
            target: '/patient/onboarding',
            label: 'Complete Onboarding',
          },
          funnelSummaries: [],
          workupSummary: {
            state: WORKUP_STATE.NO_DATA,
            counts: {
              needsMoreData: 0,
              readyForReview: 0,
              total: 0,
            },
          },
          contentTiles: [],
          meta: {
            version: DASHBOARD_VERSION,
            correlationId: '123e4567-e89b-12d3-a456-426614174000',
            generatedAt: '2026-01-15T10:30:00Z',
          },
        },
      }

      const result = DashboardResponseSchema.safeParse(invalidResponse)
      expect(result.success).toBe(false)
    })

    it('should reject response with wrong schemaVersion', () => {
      const invalidResponse = {
        success: true,
        data: {
          onboardingStatus: ONBOARDING_STATUS.NOT_STARTED,
          nextStep: {
            type: NEXT_STEP_TYPE.ONBOARDING,
            target: '/patient/onboarding',
            label: 'Complete Onboarding',
          },
          funnelSummaries: [],
          workupSummary: {
            state: WORKUP_STATE.NO_DATA,
            counts: {
              needsMoreData: 0,
              readyForReview: 0,
              total: 0,
            },
          },
          contentTiles: [],
          meta: {
            version: DASHBOARD_VERSION,
            correlationId: '123e4567-e89b-12d3-a456-426614174000',
            generatedAt: '2026-01-15T10:30:00Z',
          },
        },
        schemaVersion: 'v2',
      }

      const result = DashboardResponseSchema.safeParse(invalidResponse)
      expect(result.success).toBe(false)
    })
  })

  describe('DashboardErrorSchema', () => {
    it('should validate error response (E6.5.2: error semantics)', () => {
      const validError = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          details: { reason: 'No session found' },
        },
        schemaVersion: PATIENT_DASHBOARD_SCHEMA_VERSION,
        requestId: 'req-456',
      }

      const result = DashboardErrorSchema.safeParse(validError)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.success).toBe(false)
        expect(result.data.error.code).toBe('UNAUTHORIZED')
      }
    })

    it('should validate error without details', () => {
      const validError = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Something went wrong',
        },
        schemaVersion: PATIENT_DASHBOARD_SCHEMA_VERSION,
      }

      const result = DashboardErrorSchema.safeParse(validError)
      expect(result.success).toBe(true)
    })
  })

  describe('Helper Functions', () => {
    describe('validateDashboardResponse', () => {
      it('should validate and return parsed response', () => {
        const validResponse = {
          success: true,
          data: {
            onboardingStatus: ONBOARDING_STATUS.COMPLETED,
            nextStep: {
              type: NEXT_STEP_TYPE.NONE,
              target: null,
              label: 'All done',
            },
            funnelSummaries: [],
            workupSummary: {
              state: WORKUP_STATE.NO_DATA,
              counts: {
                needsMoreData: 0,
                readyForReview: 0,
                total: 0,
              },
            },
            contentTiles: [],
            meta: {
              version: DASHBOARD_VERSION,
              correlationId: '123e4567-e89b-12d3-a456-426614174000',
              generatedAt: '2026-01-15T10:30:00Z',
            },
          },
          schemaVersion: PATIENT_DASHBOARD_SCHEMA_VERSION,
        }

        const result = validateDashboardResponse(validResponse)
        expect(result.success).toBe(true)
        expect(result.data.onboardingStatus).toBe('completed')
      })

      it('should throw on invalid response', () => {
        const invalidResponse = { invalid: 'data' }

        expect(() => validateDashboardResponse(invalidResponse)).toThrow()
      })
    })

    describe('safeValidateDashboardResponse', () => {
      it('should return parsed response on valid data', () => {
        const validResponse = {
          success: true,
          data: {
            onboardingStatus: ONBOARDING_STATUS.NOT_STARTED,
            nextStep: {
              type: NEXT_STEP_TYPE.ONBOARDING,
              target: '/patient/onboarding',
              label: 'Start',
            },
            funnelSummaries: [],
            workupSummary: {
              state: WORKUP_STATE.NO_DATA,
              counts: {
                needsMoreData: 0,
                readyForReview: 0,
                total: 0,
              },
            },
            contentTiles: [],
            meta: {
              version: DASHBOARD_VERSION,
              correlationId: '123e4567-e89b-12d3-a456-426614174000',
              generatedAt: '2026-01-15T10:30:00Z',
            },
          },
          schemaVersion: PATIENT_DASHBOARD_SCHEMA_VERSION,
        }

        const result = safeValidateDashboardResponse(validResponse)
        expect(result).not.toBeNull()
        expect(result?.success).toBe(true)
      })

      it('should return null on invalid data', () => {
        const invalidResponse = { invalid: 'data' }

        const result = safeValidateDashboardResponse(invalidResponse)
        expect(result).toBeNull()
      })
    })

    describe('createEmptyDashboardViewModel', () => {
      it('should create valid empty view model', () => {
        const correlationId = '123e4567-e89b-12d3-a456-426614174000'
        const emptyModel = createEmptyDashboardViewModel(correlationId)

        const result = DashboardViewModelV1Schema.safeParse(emptyModel)
        expect(result.success).toBe(true)
        
        expect(emptyModel.onboardingStatus).toBe(ONBOARDING_STATUS.NOT_STARTED)
        expect(emptyModel.nextStep.type).toBe(NEXT_STEP_TYPE.ONBOARDING)
        expect(emptyModel.funnelSummaries).toEqual([])
        expect(emptyModel.workupSummary.state).toBe(WORKUP_STATE.NO_DATA)
        expect(emptyModel.contentTiles).toEqual([])
        expect(emptyModel.meta.version).toBe(DASHBOARD_VERSION)
        expect(emptyModel.meta.correlationId).toBe(correlationId)
      })

      it('should create model with current timestamp', () => {
        const correlationId = '123e4567-e89b-12d3-a456-426614174000'
        const beforeTime = new Date().toISOString()
        const emptyModel = createEmptyDashboardViewModel(correlationId)
        const afterTime = new Date().toISOString()

        expect(emptyModel.meta.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
        expect(emptyModel.meta.generatedAt >= beforeTime).toBe(true)
        expect(emptyModel.meta.generatedAt <= afterTime).toBe(true)
      })
    })
  })
})
