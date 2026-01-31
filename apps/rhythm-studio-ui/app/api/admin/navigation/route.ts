import { NextResponse } from 'next/server'
import { createServerSupabaseClient, hasAdminOrClinicianRole } from '@/lib/db/supabase.server'
import { successResponse } from '@/lib/api/responses'
import { getRequestId, logError, withRequestId, classifySupabaseError } from '@/lib/db/errors'
import { ErrorCode } from '@/lib/api/responseTypes'

/**
 * V05-I09.1 API Endpoint: Get navigation configuration
 * GET /api/admin/navigation
 * 
 * Returns all navigation items and their role-specific configurations
 */

type NavigationItem = {
	id: string
	route: string
	default_label: string
	default_icon: string | null
	default_order: number
	is_system: boolean
	description: string | null
}

type NavigationItemConfig = {
	id: string
	role: string
	navigation_item_id: string
	is_enabled: boolean
	custom_label: string | null
	custom_icon: string | null
	order_index: number
}

type NavigationConfigResponse = {
	items: NavigationItem[]
	configs: NavigationItemConfig[]
}

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

export async function GET() {
	const requestId = getRequestId()

	try {
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

		// Fetch all navigation items
		const { data: items, error: itemsError } = await supabase
			.from('navigation_items')
			.select('*')
			.order('default_order', { ascending: true })

		if (itemsError) {
			const classified = classifySupabaseError(itemsError)
			logError({
				requestId,
				operation: 'fetch_navigation_items',
				error: itemsError,
				userId: user.id,
			})

			if (classified.kind === 'SCHEMA_NOT_READY') {
				return jsonError(
					503,
					ErrorCode.SCHEMA_NOT_READY,
					'Navigation-Schema ist noch nicht bereit',
					requestId,
				)
			}

			return jsonError(
				500,
				ErrorCode.DATABASE_ERROR,
				'Fehler beim Laden der Navigation',
				requestId,
			)
		}

		// Fetch all navigation item configs
		const { data: configs, error: configsError } = await supabase
			.from('navigation_item_configs')
			.select('*')
			.order('role', { ascending: true })
			.order('order_index', { ascending: true })

		if (configsError) {
			logError({
				requestId,
				operation: 'fetch_navigation_configs',
				error: configsError,
				userId: user.id,
			})

			return jsonError(
				500,
				ErrorCode.DATABASE_ERROR,
				'Fehler beim Laden der Konfiguration',
				requestId,
			)
		}

		const response: NavigationConfigResponse = {
			items: (items as unknown as NavigationItem[]) || [],
			configs: (configs as unknown as NavigationItemConfig[]) || [],
		}

		return withRequestId(successResponse(response), requestId)
	} catch (error) {
		logError({
			requestId,
			operation: 'get_navigation_config',
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
