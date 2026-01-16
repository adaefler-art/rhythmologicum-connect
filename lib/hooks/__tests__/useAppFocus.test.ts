/**
 * Tests for useAppFocus Hook - E6.5.9
 */

import { renderHook } from '@testing-library/react'
import { useAppFocus } from '../useAppFocus'

describe('useAppFocus', () => {
  let mockCallback: jest.Mock

  beforeEach(() => {
    mockCallback = jest.fn()
    
    // Mock document.hidden
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should call callback when page becomes visible (visibilitychange)', () => {
    renderHook(() => useAppFocus(mockCallback))

    // Simulate page becoming hidden
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true,
    })
    document.dispatchEvent(new Event('visibilitychange'))

    expect(mockCallback).not.toHaveBeenCalled()

    // Simulate page becoming visible again
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    })
    document.dispatchEvent(new Event('visibilitychange'))

    expect(mockCallback).toHaveBeenCalledTimes(1)
  })

  it('should call callback on window focus when document is visible', () => {
    renderHook(() => useAppFocus(mockCallback))

    window.dispatchEvent(new Event('focus'))

    expect(mockCallback).toHaveBeenCalledTimes(1)
  })

  it('should not call callback on window focus when document is hidden', () => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true,
    })

    renderHook(() => useAppFocus(mockCallback))

    window.dispatchEvent(new Event('focus'))

    expect(mockCallback).not.toHaveBeenCalled()
  })

  it('should not call callback when disabled', () => {
    renderHook(() => useAppFocus(mockCallback, false))

    // Try visibility change
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true,
    })
    document.dispatchEvent(new Event('visibilitychange'))

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    })
    document.dispatchEvent(new Event('visibilitychange'))

    // Try window focus
    window.dispatchEvent(new Event('focus'))

    expect(mockCallback).not.toHaveBeenCalled()
  })

  it('should cleanup event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')
    const windowRemoveSpy = jest.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useAppFocus(mockCallback))

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function),
    )
    expect(windowRemoveSpy).toHaveBeenCalledWith('focus', expect.any(Function))
  })

  it('should use latest callback on each invocation', () => {
    const firstCallback = jest.fn()
    const secondCallback = jest.fn()

    const { rerender } = renderHook(({ callback }) => useAppFocus(callback), {
      initialProps: { callback: firstCallback },
    })

    // First focus
    window.dispatchEvent(new Event('focus'))
    expect(firstCallback).toHaveBeenCalledTimes(1)
    expect(secondCallback).not.toHaveBeenCalled()

    // Update callback
    rerender({ callback: secondCallback })

    // Second focus should use new callback
    window.dispatchEvent(new Event('focus'))
    expect(firstCallback).toHaveBeenCalledTimes(1)
    expect(secondCallback).toHaveBeenCalledTimes(1)
  })

  it('should not call callback multiple times for rapid visibility changes', () => {
    renderHook(() => useAppFocus(mockCallback))

    // Simulate rapid visibility changes (tab switching)
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true,
    })
    document.dispatchEvent(new Event('visibilitychange'))

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    })
    document.dispatchEvent(new Event('visibilitychange'))

    // Callback should only be called once for becoming visible
    expect(mockCallback).toHaveBeenCalledTimes(1)
  })
})
