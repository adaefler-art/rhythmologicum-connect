/**
 * Tests for Structured Logging Functions
 * 
 * Tests new assessment lifecycle and error logging functions
 * added for minimal monitoring hooks.
 */

import {
  logAssessmentStarted,
  logAssessmentCompleted,
  logAssessmentError,
  logClinicianFlowError,
  logPatientFlowError,
  LogLevel,
  type LogContext,
} from '../logger'

// Mock console methods to capture output
const originalConsoleLog = console.log
const originalConsoleError = console.error

describe('Assessment Lifecycle Logging', () => {
  let consoleLogSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    // Spy on console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    // Restore original console methods
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  describe('logAssessmentStarted', () => {
    it('should log assessment start with correct type', () => {
      const context: LogContext = {
        userId: 'user-123',
        assessmentId: 'assessment-456',
        endpoint: '/api/funnels/stress/assessments',
        funnel: 'stress',
      }

      logAssessmentStarted(context)

      expect(consoleLogSpy).toHaveBeenCalledTimes(1)
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0])

      expect(loggedData.level).toBe(LogLevel.INFO)
      expect(loggedData.message).toBe('Assessment started')
      expect(loggedData.context.type).toBe('assessment_started')
      expect(loggedData.context.userId).toBe('user-123')
      expect(loggedData.context.assessmentId).toBe('assessment-456')
      expect(loggedData.context.funnel).toBe('stress')
      expect(loggedData.timestamp).toBeDefined()
    })

    it('should include all provided context fields', () => {
      const context: LogContext = {
        userId: 'user-789',
        assessmentId: 'assessment-101',
        endpoint: '/api/funnels/resilience/assessments',
        funnel: 'resilience',
        customField: 'custom-value',
      }

      logAssessmentStarted(context)

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0])
      expect(loggedData.context.customField).toBe('custom-value')
    })
  })

  describe('logAssessmentCompleted', () => {
    it('should log assessment completion with correct type', () => {
      const context: LogContext = {
        userId: 'user-123',
        assessmentId: 'assessment-456',
        endpoint: '/api/funnels/stress/assessments/456/complete',
        funnel: 'stress',
      }

      logAssessmentCompleted(context)

      expect(consoleLogSpy).toHaveBeenCalledTimes(1)
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0])

      expect(loggedData.level).toBe(LogLevel.INFO)
      expect(loggedData.message).toBe('Assessment completed')
      expect(loggedData.context.type).toBe('assessment_completed')
      expect(loggedData.context.assessmentId).toBe('assessment-456')
    })
  })

  describe('logAssessmentError', () => {
    it('should log assessment error with error details', () => {
      const context: LogContext = {
        userId: 'user-123',
        assessmentId: 'assessment-456',
        endpoint: '/api/funnels/stress/assessments/456',
      }
      const testError = new Error('Test assessment error')

      logAssessmentError(context, testError)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0])

      expect(loggedData.level).toBe(LogLevel.ERROR)
      expect(loggedData.message).toBe('Assessment error')
      expect(loggedData.error.message).toBe('Test assessment error')
      expect(loggedData.error.stack).toBeDefined()
      expect(loggedData.error.name).toBe('Error')
      expect(loggedData.context.assessmentId).toBe('assessment-456')
    })

    it('should include digest and cause when present', () => {
      const context: LogContext = { assessmentId: 'assessment-999' }
      const testError = new Error('RSC error')
      ;(testError as { digest?: string }).digest = 'digest-123'
      ;(testError as { cause?: unknown }).cause = 'root-cause'

      logAssessmentError(context, testError)

      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0])
      expect(loggedData.error.digest).toBe('digest-123')
      expect(loggedData.error.cause).toBe('root-cause')
    })

    it('should handle non-Error objects', () => {
      const context: LogContext = {
        assessmentId: 'assessment-789',
      }

      logAssessmentError(context, 'String error message')

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0])

      expect(loggedData.error.message).toBe('String error message')
    })
  })
})

describe('Flow-Specific Error Logging', () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('logClinicianFlowError', () => {
    it('should log clinician flow error with area tag', () => {
      const context: LogContext = {
        userId: 'clinician-123',
        endpoint: '/api/admin/funnels',
      }
      const testError = new Error('Clinician flow error')

      logClinicianFlowError(context, testError)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0])

      expect(loggedData.level).toBe(LogLevel.ERROR)
      expect(loggedData.message).toBe('Clinician flow error')
      expect(loggedData.context.area).toBe('clinician')
      expect(loggedData.context.endpoint).toBe('/api/admin/funnels')
      expect(loggedData.error.message).toBe('Clinician flow error')
    })

    it('should preserve existing context fields', () => {
      const context: LogContext = {
        userId: 'clinician-456',
        endpoint: '/api/admin/funnels',
        funnelId: 'funnel-123',
      }

      logClinicianFlowError(context, new Error('Test error'))

      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0])
      expect(loggedData.context.funnelId).toBe('funnel-123')
      expect(loggedData.context.area).toBe('clinician')
    })
  })

  describe('logPatientFlowError', () => {
    it('should log patient flow error with area tag', () => {
      const context: LogContext = {
        userId: 'patient-123',
        endpoint: '/api/amy/stress-report',
      }
      const testError = new Error('Patient flow error')

      logPatientFlowError(context, testError)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0])

      expect(loggedData.level).toBe(LogLevel.ERROR)
      expect(loggedData.message).toBe('Patient flow error')
      expect(loggedData.context.area).toBe('patient')
      expect(loggedData.context.endpoint).toBe('/api/amy/stress-report')
      expect(loggedData.error.message).toBe('Patient flow error')
    })

    it('should handle errors with additional metadata', () => {
      const context: LogContext = {
        userId: 'patient-789',
        endpoint: '/api/amy/stress-report',
        assessmentId: 'assessment-999',
      }

      logPatientFlowError(context, new Error('Test error'))

      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0])
      expect(loggedData.context.assessmentId).toBe('assessment-999')
      expect(loggedData.context.area).toBe('patient')
    })
  })
})

describe('Log Structure and Format', () => {
  let consoleLogSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  it('should produce valid JSON output for info logs', () => {
    const context: LogContext = {
      userId: 'user-123',
      assessmentId: 'assessment-456',
    }

    logAssessmentStarted(context)

    expect(() => {
      JSON.parse(consoleLogSpy.mock.calls[0][0])
    }).not.toThrow()
  })

  it('should produce valid JSON output for error logs', () => {
    const context: LogContext = {
      userId: 'user-123',
      assessmentId: 'assessment-456',
    }

    logAssessmentError(context, new Error('Test error'))

    expect(() => {
      JSON.parse(consoleErrorSpy.mock.calls[0][0])
    }).not.toThrow()
  })

  it('should include ISO 8601 timestamp', () => {
    const context: LogContext = { assessmentId: 'test' }
    logAssessmentStarted(context)

    const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0])
    const timestamp = new Date(loggedData.timestamp)

    expect(timestamp.toISOString()).toBe(loggedData.timestamp)
    expect(timestamp.getTime()).toBeGreaterThan(Date.now() - 1000)
  })
})
