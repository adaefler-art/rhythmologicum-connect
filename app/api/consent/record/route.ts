import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          },
        },
      },
    )

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
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0] || realIp || null

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
      if (error.code === '23505') {
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
