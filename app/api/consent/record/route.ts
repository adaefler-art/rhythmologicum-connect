import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'

// PostgreSQL error codes
const PG_ERROR_UNIQUE_VIOLATION = '23505'

/**
 * Validates if a string is a valid IPv4 or IPv6 address
 */
function isValidIpAddress(ip: string): boolean {
  // IPv4 regex
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/
  // IPv6 regex (simplified)
  const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/
  
  return ipv4Pattern.test(ip) || ipv6Pattern.test(ip)
}

/**
 * POST /api/consent/record
 * Records a user's consent to a specific version of terms.
 * 
 * Request body:
 * {
 *   "consentVersion": "1.0.0"
 * }
 * 
 * Returns:
 * - 201: Consent recorded successfully
 * - 400: Missing or invalid parameters
 * - 401: Not authenticated
 * - 409: Consent already recorded for this version
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Authentication error in consent/record:', authError)
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { consentVersion } = body

    if (!consentVersion || typeof consentVersion !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid consentVersion' },
        { status: 400 },
      )
    }

    // Get client IP address for audit trail
    // Note: x-forwarded-for can be spoofed; this is for audit purposes only
    // In production, consider using a trusted proxy or additional validation
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    // Take the first IP from x-forwarded-for (client IP before proxies)
    const rawIp = forwardedFor?.split(',')[0]?.trim() || realIp
    // Validate IP address format before storing
    const ipAddress = rawIp && isValidIpAddress(rawIp) ? rawIp : null

    // Get user agent
    const userAgent = request.headers.get('user-agent') || null

    // Insert consent record
    const { data, error } = await supabase
      .from('user_consents')
      .insert({
        user_id: user.id,
        consent_version: consentVersion,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select()
      .single()

    if (error) {
      // Check if this is a duplicate consent (unique constraint violation)
      if (error.code === PG_ERROR_UNIQUE_VIOLATION) {
        console.log(
          `Consent already recorded for user ${user.id}, version ${consentVersion}`,
        )
        return NextResponse.json(
          { error: 'Consent already recorded for this version' },
          { status: 409 },
        )
      }

      console.error('Error recording consent:', error)
      return NextResponse.json(
        { error: 'Failed to record consent' },
        { status: 500 },
      )
    }

    console.log(`Consent recorded: user ${user.id}, version ${consentVersion}`)

    return NextResponse.json(
      {
        success: true,
        consent: {
          id: data.id,
          consentVersion: data.consent_version,
          consentedAt: data.consented_at,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Unexpected error in consent/record:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
