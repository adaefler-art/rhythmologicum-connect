/** @jest-environment node */

/**
 * Tests for environment variable validation and parsing
 * 
 * Note: These tests manipulate process.env which requires careful cleanup
 * to avoid affecting other tests
 */

describe('Environment schema', () => {
  const originalEnv = process.env
  const originalNextPhase = process.env.NEXT_PHASE
  const originalWindow = (global as any).window

  beforeEach(() => {
    // Reset modules to clear cached env module
    jest.resetModules()
    // Reset environment to original state
    process.env = { ...originalEnv }

    // Default to server runtime for tests unless explicitly overridden
    ;(global as any).window = undefined
  })

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv
    ;(global as any).window = originalWindow
  })

  describe('Legacy variable name support', () => {
    it('uses SUPABASE_URL as fallback for NEXT_PUBLIC_SUPABASE_URL', () => {
      // Clear primary vars
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      delete process.env.SUPABASE_SERVICE_ROLE_KEY

      // Set legacy vars
      process.env.SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
      process.env.SUPABASE_SERVICE_KEY = 'test-service-key'
      process.env.NODE_ENV = 'development'

      // Require env module fresh
      const { env } = require('../env')

      expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://test.supabase.co')
      expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe('test-service-key')
    })

    it('prefers primary variable names over legacy ones', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://primary.supabase.co'
      process.env.SUPABASE_URL = 'https://legacy.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'primary-anon'
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'primary-service'
      process.env.SUPABASE_SERVICE_KEY = 'legacy-service'
      process.env.NODE_ENV = 'development'

      const { env } = require('../env')

      expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://primary.supabase.co')
      expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe('primary-service')
    })

    it('uses ANTHROPIC_API_TOKEN as fallback for ANTHROPIC_API_KEY', () => {
      delete process.env.ANTHROPIC_API_KEY
      process.env.ANTHROPIC_API_TOKEN = 'test-token'
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon'
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service'
      process.env.NODE_ENV = 'development'

      const { env } = require('../env')

      expect(env.ANTHROPIC_API_KEY).toBe('test-token')
    })
  })

  describe('Build-time behavior', () => {
    it('allows missing required vars during build phase', () => {
      process.env.NEXT_PHASE = 'phase-production-build'
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      delete process.env.SUPABASE_SERVICE_ROLE_KEY

      // Should not throw during build
      expect(() => {
        const { env } = require('../env')
        expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('')
      }).not.toThrow()
    })
  })

  describe('Development behavior', () => {
    it('allows missing vars in development with defaults', () => {
      process.env.NODE_ENV = 'development'
      delete process.env.NEXT_PHASE
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      delete process.env.SUPABASE_SERVICE_ROLE_KEY

      // Should not throw in development
      expect(() => {
        const { env } = require('../env')
        expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('')
      }).not.toThrow()
    })
  })

  describe('Production behavior', () => {
    it('fails fast with missing required vars in production', () => {
      process.env.NODE_ENV = 'production'
      delete process.env.NEXT_PHASE
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      delete process.env.SUPABASE_SERVICE_ROLE_KEY

      // Mock console.error to suppress output during test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      expect(() => {
        const { getEngineEnv } = require('../env')
        getEngineEnv()
      }).toThrow('Missing env')

      consoleErrorSpy.mockRestore()
    })

    it('does not throw in the browser runtime (even if server-only vars are missing)', () => {
      process.env.NODE_ENV = 'production'
      delete process.env.NEXT_PHASE
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      delete process.env.SUPABASE_SERVICE_ROLE_KEY

      // Simulate browser runtime
      ;(global as any).window = {}

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      expect(() => {
        const { env } = require('../env')
        expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe('')
      }).not.toThrow()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Helper functions', () => {
    beforeEach(() => {
      // Set up valid env for helpers to work
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon'
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service'
    })

    it('isProduction returns true when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production'
      const { isProduction } = require('../env')
      expect(isProduction()).toBe(true)
    })

    it('isProduction returns false when NODE_ENV is not production', () => {
      process.env.NODE_ENV = 'development'
      const { isProduction } = require('../env')
      expect(isProduction()).toBe(false)
    })

    it('isDevelopment returns true when NODE_ENV is development', () => {
      process.env.NODE_ENV = 'development'
      const { isDevelopment } = require('../env')
      expect(isDevelopment()).toBe(true)
    })

    it('isDevelopment returns true when NODE_ENV is not set', () => {
      delete process.env.NODE_ENV
      const { isDevelopment } = require('../env')
      expect(isDevelopment()).toBe(true)
    })

    it('isTest returns true when NODE_ENV is test', () => {
      process.env.NODE_ENV = 'test'
      const { isTest } = require('../env')
      expect(isTest()).toBe(true)
    })
  })

  describe('Type safety', () => {
    it('env object has correct type structure', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon'
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service'
      process.env.NODE_ENV = 'development'

      const { env } = require('../env')

      // Required fields should be strings
      expect(typeof env.NEXT_PUBLIC_SUPABASE_URL).toBe('string')
      expect(typeof env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('string')
      expect(typeof env.SUPABASE_SERVICE_ROLE_KEY).toBe('string')

      // Optional fields can be undefined
      expect(env.ANTHROPIC_API_KEY === undefined || typeof env.ANTHROPIC_API_KEY === 'string').toBe(true)
    })
  })
})
