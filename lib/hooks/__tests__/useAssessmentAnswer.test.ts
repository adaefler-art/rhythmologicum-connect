/**
 * I71.4: Tests for useAssessmentAnswer Hook with Idempotency
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { useAssessmentAnswer } from '../useAssessmentAnswer'

// Mock fetch
global.fetch = jest.fn()

describe('useAssessmentAnswer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should save answer successfully', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: new Headers(),
      json: async () => ({
        success: true,
        data: {
          id: 'answer-id',
          assessment_id: 'assessment-123',
          question_id: 'stress_level',
          answer_value: 7,
        },
      }),
    })

    const { result } = renderHook(() => useAssessmentAnswer())

    let saveResult: any

    await act(async () => {
      saveResult = await result.current.saveAnswer({
        assessmentId: 'assessment-123',
        questionId: 'stress_level',
        answerValue: 7,
      })
    })

    expect(saveResult.success).toBe(true)
    expect(result.current.saveState).toBe('saved')
    expect(result.current.lastError).toBeNull()

    // Should transition to idle after timeout
    await waitFor(
      () => {
        expect(result.current.saveState).toBe('idle')
      },
      { timeout: 2000 },
    )
  })

  it('should include clientMutationId in request', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: new Headers(),
      json: async () => ({
        success: true,
        data: {
          id: 'answer-id',
          assessment_id: 'assessment-123',
          question_id: 'stress_level',
          answer_value: 7,
        },
      }),
    })

    const { result } = renderHook(() => useAssessmentAnswer())

    await act(async () => {
      await result.current.saveAnswer({
        assessmentId: 'assessment-123',
        questionId: 'stress_level',
        answerValue: 7,
      })
    })

    // Verify fetch was called with clientMutationId
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/assessment-answers/save',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('clientMutationId'),
      }),
    )
  })

  it('should detect cached responses from idempotency', async () => {
    const cachedHeaders = new Headers()
    cachedHeaders.set('X-Idempotency-Cached', 'true')

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: cachedHeaders,
      json: async () => ({
        success: true,
        data: {
          id: 'answer-id',
          assessment_id: 'assessment-123',
          question_id: 'stress_level',
          answer_value: 7,
        },
      }),
    })

    const { result } = renderHook(() => useAssessmentAnswer())

    let saveResult: any

    await act(async () => {
      saveResult = await result.current.saveAnswer({
        assessmentId: 'assessment-123',
        questionId: 'stress_level',
        answerValue: 7,
      })
    })

    expect(saveResult.success).toBe(true)
    expect(saveResult.cached).toBe(true)
  })

  it('should handle save errors', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      headers: new Headers(),
      json: async () => ({
        success: false,
        error: 'Database error',
      }),
    })

    const { result } = renderHook(() => useAssessmentAnswer())

    let saveResult: any

    await act(async () => {
      saveResult = await result.current.saveAnswer({
        assessmentId: 'assessment-123',
        questionId: 'stress_level',
        answerValue: 7,
      })
    })

    expect(saveResult.success).toBe(false)
    expect(saveResult.error).toBe('Database error')
    expect(result.current.saveState).toBe('error')
    expect(result.current.lastError).toBe('Database error')
  })

  it('should handle network errors', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'))

    const { result } = renderHook(() => useAssessmentAnswer())

    let saveResult: any

    await act(async () => {
      saveResult = await result.current.saveAnswer({
        assessmentId: 'assessment-123',
        questionId: 'stress_level',
        answerValue: 7,
      })
    })

    expect(saveResult.success).toBe(false)
    expect(saveResult.error).toContain('Netzwerkfehler')
    expect(result.current.saveState).toBe('error')
  })

  it('should support retry functionality', async () => {
    // First call fails
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'))

    const { result } = renderHook(() => useAssessmentAnswer())

    await act(async () => {
      await result.current.saveAnswer({
        assessmentId: 'assessment-123',
        questionId: 'stress_level',
        answerValue: 7,
      })
    })

    expect(result.current.saveState).toBe('error')

    // Retry succeeds
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: new Headers(),
      json: async () => ({
        success: true,
        data: {
          id: 'answer-id',
          assessment_id: 'assessment-123',
          question_id: 'stress_level',
          answer_value: 7,
        },
      }),
    })

    let retryResult: any

    await act(async () => {
      retryResult = await result.current.retry()
    })

    expect(retryResult?.success).toBe(true)
    expect(result.current.saveState).toBe('saved')
  })

  it('should use custom clientMutationId if provided', async () => {
    const customMutationId = 'custom-mutation-123'

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: new Headers(),
      json: async () => ({
        success: true,
        data: {
          id: 'answer-id',
          assessment_id: 'assessment-123',
          question_id: 'stress_level',
          answer_value: 7,
        },
      }),
    })

    const { result } = renderHook(() => useAssessmentAnswer())

    await act(async () => {
      await result.current.saveAnswer({
        assessmentId: 'assessment-123',
        questionId: 'stress_level',
        answerValue: 7,
        clientMutationId: customMutationId,
      })
    })

    // Verify the custom mutation ID was used
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
    const requestBody = JSON.parse(fetchCall[1].body)
    expect(requestBody.clientMutationId).toBe(customMutationId)
  })
})
