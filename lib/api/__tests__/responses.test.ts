/**
 * E6.2.2: Unit Tests for Standardized API Response Helpers
 * 
 * Tests the response helper functions that create consistent API responses
 * across all endpoints, with special focus on new 409 conflict error codes.
 */

import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  missingFieldsResponse,
  invalidInputResponse,
  stepSkippingResponse,
  assessmentCompletedResponse,
  stateConflictResponse,
  versionMismatchResponse,
  duplicateOperationResponse,
  internalErrorResponse,
  databaseErrorResponse,
  configurationErrorResponse,
  schemaNotReadyResponse,
  unsupportedMediaTypeResponse,
  payloadTooLargeResponse,
} from '../responses'
import { ErrorCode } from '../responseTypes'

// Helper to extract JSON from NextResponse
async function getResponseBody<T = unknown>(response: Response): Promise<T> {
  return await response.json()
}

describe('E6.2.2: Standardized API Response Helpers', () => {
  describe('successResponse', () => {
    it('should create success response with data and default 200 status', async () => {
      const data = { id: '123', name: 'Test' }
      const response = successResponse(data)
      
      expect(response.status).toBe(200)
      const body = await getResponseBody(response)
      expect(body.success).toBe(true)
      expect(body.data).toEqual(data)
    })

    it('should create success response with custom status code', () => {
      const data = { id: '123' }
      const response = successResponse(data, 201)
      
      expect(response.status).toBe(201)
    })
  })

  describe('errorResponse', () => {
    it('should create error response with code and message', async () => {
      const response = errorResponse(
        ErrorCode.INVALID_INPUT,
        'Invalid input provided',
        400,
      )
      
      expect(response.status).toBe(400)
      const body = await getResponseBody(response)
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('INVALID_INPUT')
      expect(body.error.message).toBe('Invalid input provided')
    })

    it('should include details when provided', async () => {
      const details = { field: 'email', reason: 'Invalid format' }
      const response = errorResponse(
        ErrorCode.VALIDATION_FAILED,
        'Validation failed',
        400,
        details,
      )
      
      const body = await getResponseBody(response)
      expect(body.error.details).toEqual(details)
    })
  })

  describe('Authentication Error Responses (401)', () => {
    it('should create unauthorized response with default message', async () => {
      const response = unauthorizedResponse()
      
      expect(response.status).toBe(401)
      const body = await getResponseBody(response)
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('UNAUTHORIZED')
      expect(body.error.message).toContain('Authentifizierung')
    })

    it('should create unauthorized response with custom message', async () => {
      const customMessage = 'Token expired'
      const response = unauthorizedResponse(customMessage)
      
      const body = await getResponseBody(response)
      expect(body.error.message).toBe(customMessage)
    })
  })

  describe('Authorization Error Responses (403)', () => {
    it('should create forbidden response with default message', async () => {
      const response = forbiddenResponse()
      
      expect(response.status).toBe(403)
      const body = await getResponseBody(response)
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('FORBIDDEN')
      expect(body.error.message).toContain('Berechtigung')
    })

    it('should create step skipping response', async () => {
      const response = stepSkippingResponse()
      
      expect(response.status).toBe(403)
      const body = await getResponseBody(response)
      expect(body.error.code).toBe('STEP_SKIPPING_PREVENTED')
    })
  })

  describe('Not Found Error Responses (404)', () => {
    it('should create not found response with resource name', async () => {
      const response = notFoundResponse('Assessment')
      
      expect(response.status).toBe(404)
      const body = await getResponseBody(response)
      expect(body.error.code).toBe('NOT_FOUND')
      expect(body.error.message).toContain('Assessment')
    })

    it('should create not found response with custom message', async () => {
      const customMessage = 'Resource does not exist'
      const response = notFoundResponse('Resource', customMessage)
      
      const body = await getResponseBody(response)
      expect(body.error.message).toBe(customMessage)
    })
  })

  describe('Validation Error Responses (400)', () => {
    it('should create validation error response', async () => {
      const response = validationErrorResponse('Validation failed')
      
      expect(response.status).toBe(400)
      const body = await getResponseBody(response)
      expect(body.error.code).toBe('VALIDATION_FAILED')
    })

    it('should create validation error with missing questions details', async () => {
      const missingQuestions = [
        { questionId: '123', questionKey: 'q1', questionLabel: 'Question 1', orderIndex: 1 },
      ]
      const response = validationErrorResponse(
        'Missing required questions',
        { missingQuestions },
      )
      
      const body = await getResponseBody(response)
      expect(body.error.details.missingQuestions).toEqual(missingQuestions)
    })

    it('should create missing fields response', async () => {
      const response = missingFieldsResponse()
      
      expect(response.status).toBe(400)
      const body = await getResponseBody(response)
      expect(body.error.code).toBe('MISSING_REQUIRED_FIELDS')
    })

    it('should create invalid input response', async () => {
      const response = invalidInputResponse('Invalid value type')
      
      expect(response.status).toBe(400)
      const body = await getResponseBody(response)
      expect(body.error.code).toBe('INVALID_INPUT')
    })

    it('should create assessment completed response', async () => {
      const response = assessmentCompletedResponse()
      
      expect(response.status).toBe(400)
      const body = await getResponseBody(response)
      expect(body.error.code).toBe('ASSESSMENT_COMPLETED')
    })
  })

  describe('State Conflict Error Responses (409)', () => {
    it('should create state conflict response with default message', async () => {
      const response = stateConflictResponse(
        'Operation conflicts with current state',
      )
      
      expect(response.status).toBe(409)
      const body = await getResponseBody(response)
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('STATE_CONFLICT')
      expect(body.error.message).toBe('Operation conflicts with current state')
    })

    it('should create state conflict response with state details', async () => {
      const details = {
        currentState: 'completed',
        requiredState: 'in_progress',
      }
      const response = stateConflictResponse(
        'Cannot modify completed resource',
        details,
      )
      
      const body = await getResponseBody(response)
      expect(body.error.details).toEqual(details)
    })

    it('should create version mismatch response', async () => {
      const details = {
        clientVersion: 'v1',
        serverVersion: 'v2',
      }
      const response = versionMismatchResponse(
        'Version conflict detected',
        details,
      )
      
      expect(response.status).toBe(409)
      const body = await getResponseBody(response)
      expect(body.error.code).toBe('VERSION_MISMATCH')
      expect(body.error.details).toEqual(details)
    })

    it('should create duplicate operation response', async () => {
      const response = duplicateOperationResponse(
        'Operation already completed',
      )
      
      expect(response.status).toBe(409)
      const body = await getResponseBody(response)
      expect(body.error.code).toBe('DUPLICATE_OPERATION')
    })
  })

  describe('Media & Payload Error Responses', () => {
    it('should create unsupported media type response (415)', async () => {
      const response = unsupportedMediaTypeResponse(
        'Expected application/json',
      )
      
      expect(response.status).toBe(415)
      const body = await getResponseBody(response)
      expect(body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE')
    })

    it('should create payload too large response (413)', async () => {
      const details = { maxSize: '10MB', actualSize: '15MB' }
      const response = payloadTooLargeResponse(
        'Request too large',
        details,
      )
      
      expect(response.status).toBe(413)
      const body = await getResponseBody(response)
      expect(body.error.code).toBe('PAYLOAD_TOO_LARGE')
      expect(body.error.details).toEqual(details)
    })
  })

  describe('Server Error Responses (500+)', () => {
    it('should create internal error response (500)', async () => {
      const response = internalErrorResponse()
      
      expect(response.status).toBe(500)
      const body = await getResponseBody(response)
      expect(body.error.code).toBe('INTERNAL_ERROR')
    })

    it('should create database error response (500)', async () => {
      const response = databaseErrorResponse()
      
      expect(response.status).toBe(500)
      const body = await getResponseBody(response)
      expect(body.error.code).toBe('DATABASE_ERROR')
    })

    it('should create configuration error response (500)', async () => {
      const response = configurationErrorResponse()
      
      expect(response.status).toBe(500)
      const body = await getResponseBody(response)
      expect(body.error.code).toBe('CONFIGURATION_ERROR')
    })

    it('should create schema not ready response (503)', async () => {
      const response = schemaNotReadyResponse()
      
      expect(response.status).toBe(503)
      const body = await getResponseBody(response)
      expect(body.error.code).toBe('SCHEMA_NOT_READY')
    })
  })

  describe('Machine-Readable Error Codes', () => {
    it('should use consistent error code format (UPPER_SNAKE_CASE)', () => {
      const errorCodes = [
        'UNAUTHORIZED',
        'FORBIDDEN',
        'NOT_FOUND',
        'VALIDATION_FAILED',
        'MISSING_REQUIRED_FIELDS',
        'INVALID_INPUT',
        'STATE_CONFLICT',
        'VERSION_MISMATCH',
        'DUPLICATE_OPERATION',
        'STEP_SKIPPING_PREVENTED',
        'ASSESSMENT_COMPLETED',
        'INTERNAL_ERROR',
        'DATABASE_ERROR',
        'CONFIGURATION_ERROR',
        'SCHEMA_NOT_READY',
        'UNSUPPORTED_MEDIA_TYPE',
        'PAYLOAD_TOO_LARGE',
      ]

      errorCodes.forEach((code) => {
        // Should be uppercase with underscores only
        expect(code).toMatch(/^[A-Z_]+$/)
        // Should not start or end with underscore
        expect(code).not.toMatch(/^_|_$/)
      })
    })

    it('should map error codes to ErrorCode enum', () => {
      expect(ErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED')
      expect(ErrorCode.FORBIDDEN).toBe('FORBIDDEN')
      expect(ErrorCode.NOT_FOUND).toBe('NOT_FOUND')
      expect(ErrorCode.VALIDATION_FAILED).toBe('VALIDATION_FAILED')
      expect(ErrorCode.STATE_CONFLICT).toBe('STATE_CONFLICT')
      expect(ErrorCode.VERSION_MISMATCH).toBe('VERSION_MISMATCH')
      expect(ErrorCode.DUPLICATE_OPERATION).toBe('DUPLICATE_OPERATION')
      expect(ErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR')
    })
  })

  describe('HTTP Status Code Consistency', () => {
    it('should use 401 for all authentication errors', () => {
      const responses = [
        unauthorizedResponse(),
        unauthorizedResponse('Custom message'),
      ]

      responses.forEach((response) => {
        expect(response.status).toBe(401)
      })
    })

    it('should use 403 for all authorization errors', () => {
      const responses = [
        forbiddenResponse(),
        stepSkippingResponse(),
      ]

      responses.forEach((response) => {
        expect(response.status).toBe(403)
      })
    })

    it('should use 404 for all not found errors', () => {
      const responses = [
        notFoundResponse('Resource'),
        notFoundResponse('Assessment', 'Custom message'),
      ]

      responses.forEach((response) => {
        expect(response.status).toBe(404)
      })
    })

    it('should use 409 for all state conflict errors', () => {
      const responses = [
        stateConflictResponse('Conflict'),
        versionMismatchResponse('Version conflict'),
        duplicateOperationResponse('Duplicate'),
      ]

      responses.forEach((response) => {
        expect(response.status).toBe(409)
      })
    })

    it('should use 400 for validation errors', () => {
      const responses = [
        validationErrorResponse('Invalid'),
        missingFieldsResponse(),
        invalidInputResponse('Bad input'),
      ]

      responses.forEach((response) => {
        expect(response.status).toBe(400)
      })
    })

    it('should use 500 for server errors', () => {
      const responses = [
        internalErrorResponse(),
        databaseErrorResponse(),
        configurationErrorResponse(),
      ]

      responses.forEach((response) => {
        expect(response.status).toBe(500)
      })
    })
  })
})
