import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { isSessionExpired } from '@/lib/api/authHelpers'
export type ResolvedUserRole = 'patient' | 'clinician' | 'nurse' | 'admin'

type ApiResponse<T> = {
	success: boolean
	data?: T
	error?: { code: string; message: string }
}

type ResolveRoleData = {
	role: ResolvedUserRole
	requiresOnboarding: boolean
	reason?: 'DEFAULT_PATIENT_ROLE'
}

const VALID_ROLES: ResolvedUserRole[] = ['admin', 'clinician', 'nurse', 'patient']

function normalizeRole(value: unknown): ResolvedUserRole | null {
	if (typeof value !== 'string') return null
	const trimmed = value.trim()
	if (!trimmed) return null
	return (VALID_ROLES as string[]).includes(trimmed) ? (trimmed as ResolvedUserRole) : null
}

function ok(data: ResolveRoleData) {
	return NextResponse.json({ success: true, data } satisfies ApiResponse<ResolveRoleData>)
}

function fail(code: string, message: string, status: number) {
	return NextResponse.json(
		{ success: false, error: { code, message } } satisfies ApiResponse<never>,
		{ status },
	)
}

export async function GET() {
	const supabase = await createServerSupabaseClient()
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser()

	// E6.2.6: 401-first with SESSION_EXPIRED detection
	if (userError) {
		// Check for session expiry
		if (isSessionExpired(userError)) {
			return fail('SESSION_EXPIRED', 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.', 401)
		}
    
		return fail('AUTH_REQUIRED', 'Authentication required', 401)
	}

	if (!user) {
		return fail('AUTH_REQUIRED', 'Authentication required', 401)
	}

	// Role resolution must be metadata-only to avoid DB/RLS dependencies.
	// Staff roles are provisioned server-side into raw_app_meta_data (surfaced as app_metadata).
	const rawRole = user.app_metadata?.role ?? user.user_metadata?.role
	const metadataRole = normalizeRole(rawRole)
	if (metadataRole) {
		return ok({ role: metadataRole, requiresOnboarding: false })
	}

	// Missing/empty/unknown role: default to patient onboarding entry.
	return ok({ role: 'patient', requiresOnboarding: true, reason: 'DEFAULT_PATIENT_ROLE' })
}
