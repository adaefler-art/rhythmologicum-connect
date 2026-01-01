import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'

/**
 * GET /api/consent/status?version=1.0.0
 * Checks if the current user has consented to a specific version.
 * 
 * Query parameters:
 * - version: The consent version to check (required)
 * 
 * Returns:
 * - 200: { hasConsent: boolean, consent?: object }
 * - 400: Missing version parameter
 * - 401: Not authenticated
 * - 500: Server error
 */
export async function GET(request: NextRequest) {
  try {
        const supabase = await createServerSupabaseClient(
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
      console.error('Authentication error in consent/status:', authError)
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get version from query params
    const searchParams = request.nextUrl.searchParams
    const version = searchParams.get('version')

    if (!version) {
      return NextResponse.json(
        { error: 'Missing version parameter' },
        { status: 400 },
      )
    }

    // Check if consent exists for this user and version
    const { data, error } = await supabase
      .from('user_consents')
      .select('id, consent_version, consented_at')
      .eq('user_id', user.id)
      .eq('consent_version', version)
      .maybeSingle()

    if (error) {
      console.error('Error checking consent status:', error)
      return NextResponse.json(
        { error: 'Failed to check consent status' },
        { status: 500 },
      )
    }

    if (data) {
      return NextResponse.json({
        hasConsent: true,
        consent: {
          id: data.id,
          consentVersion: data.consent_version,
          consentedAt: data.consented_at,
        },
      })
    }

    return NextResponse.json({
      hasConsent: false,
    })
  } catch (error) {
    console.error('Unexpected error in consent/status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
