import { NextResponse } from 'next/server'
import { createServerSupabaseClient, hasAdminOrClinicianRole } from '@/lib/db/supabase.server'
import { successResponse } from '@/lib/api/responses'
import { getRequestId, logError, withRequestId } from '@/lib/db/errors'
import { ErrorCode } from '@/lib/api/responseTypes'

/**
 * V05-I09.1 API Endpoint: Update navigation configuration for a role
 * PUT /api/admin/navigation/[role]
 * 
 * Updates the navigation configuration for a specific role
 */

type NavigationItemUpdate = {
	navigation_item_id: string
	is_enabled: boolean
	custom_label?: string | null
	custom_icon?: string | null
	order_index: number
}

type UpdateNavigationRequest = {
	configs: NavigationItemUpdate[]
}

const VALID_ROLES = ['patient', 'clinician', 'admin', 'nurse'] as const
type UserRole = (typeof VALID_ROLES)[number]

function jsonError(status: number, code: ErrorCode, message: string, requestId: string) {
	return withRequestId(
		NextResponse.json(
			{
				success: false,
				error: {
					code,
					message,
					requestId,
				},
			},
			{ status },
		),
		requestId,
	)
}

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ role: string }> },
) {
	const requestId = getRequestId()

	try {
		const { role } = await params

		// Validate role
		if (!VALID_ROLES.includes(role as UserRole)) {
			return jsonError(400, ErrorCode.VALIDATION_FAILED, 'Ungültige Rolle', requestId)
		}

		const supabase = await createServerSupabaseClient()

		// Check authentication and authorization
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser()

		if (authError || !user) {
			return jsonError(401, ErrorCode.UNAUTHORIZED, 'Nicht authentifiziert', requestId)
		}

		const hasPermission = await hasAdminOrClinicianRole()
		if (!hasPermission) {
			return jsonError(
				403,
				ErrorCode.FORBIDDEN,
				'Keine Berechtigung für diese Aktion',
				requestId,
			)
		}

		// Parse request body
		let body: UpdateNavigationRequest
		try {
			body = await request.json()
		} catch {
			return jsonError(400, ErrorCode.VALIDATION_FAILED, 'Ungültiger Request-Body', requestId)
		}

		if (!body.configs || !Array.isArray(body.configs)) {
			return jsonError(400, ErrorCode.VALIDATION_FAILED, 'configs muss ein Array sein', requestId)
		}

		// Delete existing configs for this role
		const { error: deleteError } = await supabase
			.from('navigation_item_configs')
			.delete()
			.eq('role', role)

		if (deleteError) {
			logError({
				requestId,
				operation: 'delete_navigation_configs',
				error: deleteError,
				userId: user.id,
			})

			return jsonError(
				500,
				ErrorCode.DATABASE_ERROR,
				'Fehler beim Löschen der alten Konfiguration',
				requestId,
			)
		}

		// Insert new configs
		const configsToInsert = body.configs.map((config) => ({
			role,
			navigation_item_id: config.navigation_item_id,
			is_enabled: config.is_enabled,
			custom_label: config.custom_label || null,
			custom_icon: config.custom_icon || null,
			order_index: config.order_index,
		}))

		const { data: insertedConfigs, error: insertError } = await supabase
			.from('navigation_item_configs')
			.insert(configsToInsert)
			.select()

		if (insertError) {
			logError({
				requestId,
				operation: 'insert_navigation_configs',
				error: insertError,
				userId: user.id,
			})

			return jsonError(
				500,
				ErrorCode.DATABASE_ERROR,
				'Fehler beim Speichern der Konfiguration',
				requestId,
			)
		}

		return withRequestId(
			successResponse({
				message: 'Navigation erfolgreich aktualisiert',
				configs: insertedConfigs,
			}),
			requestId,
		)
	} catch (error) {
		logError({
			requestId,
			operation: 'update_navigation_config',
			error,
		})

		return jsonError(
			500,
			ErrorCode.INTERNAL_ERROR,
			'Interner Serverfehler',
			requestId,
		)
	}
}
