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
			.from('reassessment_rules' as any)
			.select('*')
			.eq('id', id)
			.single()

		if (!existing) {
			return notFoundResponse('Regel nicht gefunden.')
		}

		const updateData: any = { updated_by: user.id }
		if (body.rule_name !== undefined) updateData.rule_name = body.rule_name
		if (body.description !== undefined) updateData.description = body.description
		if (body.funnel_id !== undefined) updateData.funnel_id = body.funnel_id
		if (body.trigger_condition !== undefined) updateData.trigger_condition = body.trigger_condition
		if (body.schedule_interval_days !== undefined) updateData.schedule_interval_days = body.schedule_interval_days
		if (body.schedule_cron !== undefined) updateData.schedule_cron = body.schedule_cron
		if (body.priority !== undefined) updateData.priority = body.priority
		if (body.is_active !== undefined) updateData.is_active = body.is_active

		const { data: rule, error } = await supabase
			.from('reassessment_rules' as any)
			.update(updateData)
			.eq('id', id)
			.select()
			.single()

		if (error) {
			logError('Error updating reassessment rule', { userId: user.id, id }, error)
			return internalErrorResponse('Fehler beim Aktualisieren der Regel.')
		}

		return successResponse({ rule })
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
		const { error } = await supabase.from('reassessment_rules' as any).delete().eq('id', id)

		if (error) {
			logError('Error deleting reassessment rule', { userId: user.id, id }, error)
			return internalErrorResponse('Fehler beim Löschen der Regel.')
		}

		return successResponse({ message: 'Regel erfolgreich gelöscht.' })
	} catch (error) {
		logError('Unexpected error in DELETE', { userId: user.id, id }, error)
		return internalErrorResponse()
	}
}
