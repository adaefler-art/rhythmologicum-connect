import { NextRequest } from 'next/server'
import { getCurrentUser, hasClinicianRole } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import {
	successResponse,
	unauthorizedResponse,
	internalErrorResponse,
	validationErrorResponse,
	notFoundResponse,
} from '@/lib/api/responses'
import { logError } from '@/lib/logging/logger'

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params
	const user = await getCurrentUser()
	if (!user || !(await hasClinicianRole())) {
		return unauthorizedResponse('Zugriff verweigert.')
	}

	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
	if (!uuidRegex.test(id)) {
		return validationErrorResponse('Ungültige ID.')
	}

	try {
		const body = await request.json()
		const supabase = createAdminSupabaseClient()

		const { data: existing } = await supabase
			.from('kpi_thresholds' as any)
			.select('*')
			.eq('id', id)
			.single()

		if (!existing) {
			return notFoundResponse('KPI-Schwellenwert nicht gefunden.')
		}

		const updateData: any = { updated_by: user.id }
		if (body.name !== undefined) updateData.name = body.name
		if (body.description !== undefined) updateData.description = body.description
		if (body.metric_type !== undefined) updateData.metric_type = body.metric_type
		if (body.warning_threshold !== undefined) updateData.warning_threshold = body.warning_threshold
		if (body.critical_threshold !== undefined) updateData.critical_threshold = body.critical_threshold
		if (body.target_threshold !== undefined) updateData.target_threshold = body.target_threshold
		if (body.unit !== undefined) updateData.unit = body.unit
		if (body.evaluation_period_days !== undefined) updateData.evaluation_period_days = body.evaluation_period_days
		if (body.is_active !== undefined) updateData.is_active = body.is_active
		if (body.notify_on_breach !== undefined) updateData.notify_on_breach = body.notify_on_breach

		const { data: threshold, error } = await supabase
			.from('kpi_thresholds' as any)
			.update(updateData)
			.eq('id', id)
			.select()
			.single()

		if (error) {
			logError('Error updating KPI threshold', { userId: user.id, id }, error)
			return internalErrorResponse('Fehler beim Aktualisieren des KPI-Schwellenwerts.')
		}

		return successResponse({ threshold })
	} catch (error) {
		logError('Unexpected error in PUT', { userId: user.id, id }, error)
		return internalErrorResponse()
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params
	const user = await getCurrentUser()
	if (!user || !(await hasClinicianRole())) {
		return unauthorizedResponse('Zugriff verweigert.')
	}

	try {
		const supabase = createAdminSupabaseClient()
		const { error } = await supabase.from('kpi_thresholds' as any).delete().eq('id', id)

		if (error) {
			logError('Error deleting KPI threshold', { userId: user.id, id }, error)
			return internalErrorResponse('Fehler beim Löschen des KPI-Schwellenwerts.')
		}

		return successResponse({ message: 'KPI-Schwellenwert erfolgreich gelöscht.' })
	} catch (error) {
		logError('Unexpected error in DELETE', { userId: user.id, id }, error)
		return internalErrorResponse()
	}
}
