/**
 * Tests for useDashboardData Hook - E6.5.9
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useDashboardData } from '../useDashboardData'

// Mock fetch
global.fetch = jest.fn()

const mockDashboardData = {
  onboardingStatus: 'completed',
  nextStep: {
    type: 'funnel',
    target: '/patient/funnel/stress',
    label: 'Continue Assessment',
  },
  funnelSummaries: [],
  workupSummary: {
    state: 'no_data',
    counts: {
      needsMoreData: 0,
      readyForReview: 0,
      total: 0,
    },
  },
  contentTiles: [],
  meta: {
    version: 1,
    correlationId: '123e4567-e89b-12d3-a456-426614174000',
    generatedAt: '2026-01-15T10:30:00Z',
  },
}

describe('useDashboardData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockDashboardData }),
    })
  })

  it('should fetch dashboard data on mount when autoFetch is true', async () => {
    const { result } = renderHook(() => useDashboardData())

    expect(result.current.state).toBe('loading')
    expect(result.current.data).toBeNull()

    await waitFor(() => {
      expect(result.current.state).toBe('idle')
    })

    expect(result.current.data).toEqual(mockDashboardData)
    expect(result.current.error).toBeNull()
    expect(global.fetch).toHaveBeenCalledWith('/api/patient/dashboard', {
      credentials: 'include',
      signal: expect.any(AbortSignal),
    })
  })

  it('should not fetch on mount when autoFetch is false', async () => {
    const { result } = renderHook(() => useDashboardData(false))

    expect(result.current.state).toBe('idle')
    expect(result.current.data).toBeNull()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('should handle fetch errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: { message: 'Test error' } }),
    })

    const { result } = renderHook(() => useDashboardData())

    await waitFor(() => {
      expect(result.current.state).toBe('error')
    })

    expect(result.current.data).toBeNull()
    expect(result.current.error).toBe('Failed to load dashboard data')
  })

  it('should handle network errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useDashboardData())

    await waitFor(() => {
      expect(result.current.state).toBe('error')
    })

    expect(result.current.data).toBeNull()
    expect(result.current.error).toBe('Network error')
  })

  it('should support refresh with stale-while-revalidate pattern', async () => {
    const { result } = renderHook(() => useDashboardData())

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.state).toBe('idle')
    })

    expect(result.current.data).toEqual(mockDashboardData)

    // Mock updated data for refresh
    const updatedData = { ...mockDashboardData, onboardingStatus: 'in_progress' }
    
    // Clear previous mock calls and set new implementation
    ;(global.fetch as jest.Mock).mockClear()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: updatedData }),
    })

    // Trigger refresh and wait for completion
    const refreshPromise = result.current.refresh()
    await refreshPromise

    await waitFor(() => {
      expect(result.current.state).toBe('idle')
      expect(result.current.data).toEqual(updatedData)
    })

    expect(result.current.isStale).toBe(false)
  })

  it('should keep stale data visible during revalidation', async () => {
    const { result } = renderHook(() => useDashboardData())

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.state).toBe('idle')
    })

    const initialData = result.current.data

    // Mock a slow refresh
    ;(global.fetch as jest.Mock).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ success: true, data: mockDashboardData }),
            })
          }, 100)
        }),
    )

    // Start refresh
    result.current.refresh()

    // During revalidation, old data should still be visible
    await waitFor(() => {
      expect(result.current.state).toBe('revalidating')
    })

    expect(result.current.data).toEqual(initialData)
    expect(result.current.isStale).toBe(true)

    // Wait for revalidation to complete
    await waitFor(() => {
      expect(result.current.state).toBe('idle')
    })

    expect(result.current.isStale).toBe(false)
  })

  it('should support retry after error', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useDashboardData())

    // Wait for error
    await waitFor(() => {
      expect(result.current.state).toBe('error')
    })

    expect(result.current.error).toBe('Network error')

    // Mock successful retry
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockDashboardData }),
    })

    // Retry
    await result.current.retry()

    await waitFor(() => {
      expect(result.current.state).toBe('idle')
    })

    expect(result.current.data).toEqual(mockDashboardData)
    expect(result.current.error).toBeNull()
  })

  it('should prevent concurrent fetches', async () => {
    const { result } = renderHook(() => useDashboardData())

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.state).toBe('idle')
    })

    // Clear mock calls
    ;(global.fetch as jest.Mock).mockClear()

    // Start multiple concurrent refreshes
    result.current.refresh()
    result.current.refresh()
    result.current.refresh()

    await waitFor(() => {
      expect(result.current.state).toBe('idle')
    })

    // Should only fetch once
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('should abort pending request on unmount', async () => {
    const abortSpy = jest.fn()
    const mockAbortController = {
      signal: {} as AbortSignal,
      abort: abortSpy,
    }

    // Mock AbortController
    global.AbortController = jest.fn(() => mockAbortController) as any

    const { unmount } = renderHook(() => useDashboardData())

    unmount()

    expect(abortSpy).toHaveBeenCalled()
  })

  it('should handle AbortError gracefully', async () => {
    const abortError = new Error('Aborted')
    abortError.name = 'AbortError'

    ;(global.fetch as jest.Mock).mockRejectedValueOnce(abortError)

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    const { result } = renderHook(() => useDashboardData())

    // AbortError is thrown during initial load, so state stays loading
    // since we don't set error state for aborted requests
    await waitFor(
      () => {
        // The hook should stay in loading state since fetch was aborted
        expect(result.current.state).toBe('loading')
      },
      { timeout: 1000 },
    )

    expect(result.current.error).toBeNull()

    consoleErrorSpy.mockRestore()
  })
})
