// app/api/patient-measures/history/route.ts
import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'

type PatientMeasure = {
	id: string
	patient_id: string
	report_id: string | null
	stress_score: number | null
	sleep_score: number | null
	risk_level: string | null
	created_at: string
}

type ReportRecord = {
	id: string
	created_at: string
	assessment_id: string | null
	score_numeric: number | null
	sleep_score: number | null
	risk_level: string | null
	report_text_short: string | null
}

export async function GET(req: Request) {
	// Use admin client for patient measures history (RLS bypass for clinician access)
	const supabase = createAdminSupabaseClient()

	try {
		// Get patientId from query params
		const url = new URL(req.url)
		const patientId = url.searchParams.get('patientId')

		if (!patientId) {
			return NextResponse.json(
				{ error: 'patientId fehlt in den Query-Parametern.' },
				{ status: 400 }
			)
		}

		// NOTE: Select columns that actually exist in the DB schema.
		// patient_measures in your schema has report_id (FK), not assessment_id.
		const { data: measures, error: measuresError } = await supabase
			.from('patient_measures')
			.select<
				'id, patient_id, report_id, stress_score, sleep_score, risk_level, created_at',
				PatientMeasure
			>(
				'id, patient_id, report_id, stress_score, sleep_score, risk_level, created_at'
			)
			.eq('patient_id', patientId)
			.order('created_at', { ascending: false })

		if (measuresError) {
			console.error(
				'[patient-measures/history] Fehler beim Laden der Messungen:',
				measuresError
			)
			return NextResponse.json(
				{ error: 'Fehler beim Laden der Messungen.' },
				{ status: 500 }
			)
		}

		if (!measures || measures.length === 0) {
			return NextResponse.json({
				measures: [],
				message: 'Keine Messungen gefunden.',
			})
		}

		// Wenn patient_measures.report_id verwendet wird, hole die Reports über deren id
		const reportIds = measures
			.map((m) => m.report_id)
			.filter((id): id is string => Boolean(id))
		let reports: ReportRecord[] = []
		if (reportIds.length > 0) {
			const { data: reportsData, error: reportsError } = await supabase
				.from('reports')
				.select<'*', ReportRecord>('*')
				.in('id', reportIds)

			if (reportsError) {
				console.error(
					'[patient-measures/history] Fehler beim Laden der Reports:',
					reportsError
				)
				// continue without reports
			} else {
				reports = reportsData || []
			}
		}

		// Combine measures with their reports (match by report_id -> reports.id)
		const measuresWithReports = measures.map((measure) => {
			const report = reports.find((r) => r.id === measure.report_id) || null
			return {
				...measure,
				report,
			}
		})

		return NextResponse.json({
			measures: measuresWithReports,
			message: 'Messungen erfolgreich geladen.',
		})
	} catch (err: unknown) {
		console.error('[patient-measures/history] Unerwarteter Fehler:', err)
		const error = err as { message?: string }
		return NextResponse.json(
			{
				error: 'Interner Fehler beim Laden der Messungen.',
				message: error?.message ?? String(err),
			},
			{ status: 500 }
		)
	}
}
