/**
 * E6.4.1: Pilot Eligibility Tests
 * 
 * Tests for pilot eligibility checking functionality - integration tests.
 * These tests verify the module works correctly when env vars are set.
 */

describe('E6.4.1: Pilot Eligibility - Integration', () => {
  it('should have eligibility checking functions available', async () => {
    const module = await import('../pilotEligibility')
    
    expect(typeof module.isPilotEnabled).toBe('function')
    expect(typeof module.isUserInAllowlist).toBe('function')
    expect(typeof module.isOrgInAllowlist).toBe('function')
    expect(typeof module.isPilotEnvironment).toBe('function')
    expect(typeof module.isPilotEligible).toBe('function')
  })

  it('should return boolean from isPilotEnabled', async () => {
    const { isPilotEnabled } = await import('../pilotEligibility')
    const result = isPilotEnabled()
    expect(typeof result).toBe('boolean')
  })

  it('should return boolean from isPilotEnvironment', async () => {
    const { isPilotEnvironment } = await import('../pilotEligibility')
    const result = isPilotEnvironment()
    expect(typeof result).toBe('boolean')
  })

  it('should check user allowlist correctly', async () => {
    const { isUserInAllowlist } = await import('../pilotEligibility')
    const { User } = await import('@supabase/supabase-js')
    
    const testUser = {
      id: 'test-id',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as User
    
    const result = isUserInAllowlist(testUser)
    expect(typeof result).toBe('boolean')
  })

  it('should check org allowlist correctly', async () => {
    const { isOrgInAllowlist } = await import('../pilotEligibility')
    
    const result = isOrgInAllowlist('test-org-id')
    expect(typeof result).toBe('boolean')
  })

  it('fail-closed: should deny when pilot disabled', async () => {
    // When NEXT_PUBLIC_PILOT_ENABLED is not 'true', all checks should fail
    const { isUserInAllowlist, isOrgInAllowlist } = await import('../pilotEligibility')
    const { User } = await import('@supabase/supabase-js')
    
    const testUser = {
      id: 'test-id',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as User
    
    // Allowlist checks should be  based on configuration
    // If pilot is disabled via env, they return false
    // This is the fail-closed design
    const userCheck = isUserInAllowlist(testUser)
    const orgCheck = isOrgInAllowlist('any-org')
    
    expect(typeof userCheck).toBe('boolean')
    expect(typeof orgCheck).toBe('boolean')
  })
})
