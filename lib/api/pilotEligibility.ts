import { User } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { env } from '@/lib/env'
import { flagEnabled } from '@/lib/env/flags'

/**
 * E6.4.1: Pilot Eligibility Checking
 * 
 * Provides utilities to check if a user is eligible for v0.6 pilot features.
 * Implements fail-closed access control with allowlists for organizations and users.
 */

/**
 * Environment-based pilot configuration
 * Functions read from env dynamically to support testing
 */

/**
 * Get pilot organization allowlist
 */
function getPilotOrgAllowlist(): string[] {
  const allowlistEnv = env.PILOT_ORG_ALLOWLIST || ''
  return allowlistEnv.split(',').filter(Boolean)
}

/**
 * Get pilot user allowlist
 */
function getPilotUserAllowlist(): string[] {
  const allowlistEnv = env.PILOT_USER_ALLOWLIST || ''
  return allowlistEnv.split(',').filter(Boolean)
}

/**
 * Check if pilot features are enabled globally
 */
export function isPilotEnabled(): boolean {
  return flagEnabled(env.NEXT_PUBLIC_PILOT_ENABLED)
}

/**
 * Check if user is in pilot user allowlist
 */
export function isUserInAllowlist(user: User): boolean {
  if (!isPilotEnabled()) return false
  
  const allowlist = getPilotUserAllowlist()
  
  // Check by email
  if (user.email && allowlist.includes(user.email)) {
    return true
  }
  
  // Check by user ID
  if (allowlist.includes(user.id)) {
    return true
  }
  
  return false
}

/**
 * Check if organization is in pilot organization allowlist
 */
export function isOrgInAllowlist(orgId: string): boolean {
  if (!isPilotEnabled()) return false
  const allowlist = getPilotOrgAllowlist()
  return allowlist.includes(orgId)
}

/**
 * Check if user is eligible for pilot based on database flags
 * This checks user_profiles.pilot_enabled or similar DB flags
 */
export async function checkUserPilotFlag(userId: string): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check if user has pilot_enabled flag in user_profiles
    const { data, error } = await supabase
      .from('user_profiles')
      .select('metadata')
      .eq('user_id', userId)
      .single()
    
    if (error || !data) {
      return false
    }
    
    // Check for pilot_enabled in metadata JSONB field
    const metadata = data.metadata as Record<string, unknown> | null
    return metadata?.pilot_enabled === true
  } catch (error) {
    console.error('Error checking user pilot flag:', error)
    return false
  }
}

/**
 * Check if user's organization has pilot enabled
 */
export async function checkOrgPilotFlag(userId: string): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get user's organization memberships
    const { data: memberships, error: memberError } = await supabase
      .from('user_org_membership')
      .select('organization_id, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
    
    if (memberError || !memberships || memberships.length === 0) {
      return false
    }
    
    // Check if any of the user's organizations has pilot enabled
    const orgIds = memberships.map((m) => m.organization_id)
    
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, settings')
      .in('id', orgIds)
    
    if (orgError || !orgs) {
      return false
    }
    
    // Check if any organization has pilot_enabled in settings
    return orgs.some((org) => {
      const settings = org.settings as Record<string, unknown> | null
      return settings?.pilot_enabled === true
    })
  } catch (error) {
    console.error('Error checking org pilot flag:', error)
    return false
  }
}

/**
 * Comprehensive eligibility check for pilot features
 * Returns true if user is eligible for pilot access
 * 
 * Checks in order:
 * 1. Global pilot enabled flag
 * 2. User allowlist (email or ID)
 * 3. User DB flag (metadata.pilot_enabled)
 * 4. Organization allowlist
 * 5. Organization DB flag (settings.pilot_enabled)
 */
export async function isPilotEligible(user: User): Promise<boolean> {
  // If pilot is globally disabled, no one is eligible
  if (!isPilotEnabled()) {
    return false
  }
  
  // Check user allowlist first (fastest check)
  if (isUserInAllowlist(user)) {
    return true
  }
  
  // Check user DB flag
  const userPilotFlag = await checkUserPilotFlag(user.id)
  if (userPilotFlag) {
    return true
  }
  
  // Check organization allowlist and DB flags
  const orgPilotFlag = await checkOrgPilotFlag(user.id)
  if (orgPilotFlag) {
    return true
  }
  
  // Fail-closed: deny if none of the checks passed
  return false
}

/**
 * Check if specific environment is allowed for pilot
 * Optional additional gate for staging-only pilots
 */
export function isPilotEnvironment(): boolean {
  const pilotEnv = env.NEXT_PUBLIC_PILOT_ENV || 'production'
  const nodeEnv = env.NODE_ENV
  
  if (pilotEnv === 'all') return true
  if (pilotEnv === 'staging' && nodeEnv !== 'production') return true
  if (pilotEnv === 'production') return true
  return false
}

/**
 * Full eligibility check including environment gate
 */
export async function isPilotEligibleFull(user: User): Promise<boolean> {
  if (!isPilotEnvironment()) {
    return false
  }
  
  return isPilotEligible(user)
}
