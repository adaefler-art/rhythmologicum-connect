import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { parseEnvBoolean } from '@/lib/featureFlags'

// Check if clinician dashboard feature is enabled
function isClinicianDashboardEnabled(): boolean {
  return parseEnvBoolean(process.env.NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED, true)
}

// Log unauthorized access attempts
async function logUnauthorizedAccess(path: string, userId?: string, reason?: string) {
  console.warn('[AUTH] Unauthorized access attempt:', {
    path,
    userId: userId || 'anonymous',
    reason: reason || 'unknown',
    timestamp: new Date().toISOString(),
  })
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect /clinician and /admin routes
  if (!pathname.startsWith('/clinician') && !pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // Check if clinician dashboard feature is enabled
  if (!isClinicianDashboardEnabled()) {
    console.log('[AUTH] Clinician dashboard feature is disabled')

    const redirectUrl = new URL('/', request.url)
    redirectUrl.searchParams.set('error', 'feature_disabled')
    redirectUrl.searchParams.set('message', 'Das Kliniker-Dashboard ist derzeit nicht verfügbar.')
    return NextResponse.redirect(redirectUrl)
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // User is not authenticated
  if (!user) {
    await logUnauthorizedAccess(pathname, undefined, 'not_authenticated')

    const redirectUrl = new URL('/', request.url)
    redirectUrl.searchParams.set('error', 'authentication_required')
    redirectUrl.searchParams.set('message', 'Bitte melden Sie sich an, um fortzufahren.')
    return NextResponse.redirect(redirectUrl)
  }

  const role = user.app_metadata?.role || user.user_metadata?.role

  if (role !== 'clinician') {
    await logUnauthorizedAccess(pathname, user.id, 'insufficient_permissions')

    const redirectUrl = new URL('/', request.url)
    redirectUrl.searchParams.set('error', 'access_denied')
    redirectUrl.searchParams.set(
      'message',
      'Sie haben keine Berechtigung, auf diesen Bereich zuzugreifen.',
    )
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: ['/clinician/:path*', '/admin/:path*'],
}
