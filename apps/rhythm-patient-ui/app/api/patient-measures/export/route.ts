// app/api/patient-measures/export/route.ts
import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'

type PatientMeasure = {
	id: string
	patient_id: string
	created_at: string
	report_id: string | null
	stress_score: number | null
	sleep_score: number | null
	risk_level: string | null
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

type ConsentRecord = {
	id: string
	consent_version: string
	consented_at: string
	ip_address: string | null
	user_agent: string | null
}

type ConsentExport = Omit<ConsentRecord, 'id'> & {
	consent_id: string
}

/**
 * Fetches user consents from the database
 */
async function fetchUserConsents(
	supabase: ReturnType<typeof createAdminSupabaseClient>,
	userId: string
): Promise<ConsentRecord[]> {
	const { data: consents, error: consentsError } = await supabase
		.from('user_consents')
		.select<'id, consent_version, consented_at, ip_address, user_agent', ConsentRecord>(
			'id, consent_version, consented_at, ip_address, user_agent'
		)
		.eq('user_id', userId)
		.order('consented_at', { ascending: false })

	if (consentsError) {
		console.error(
			'[patient-measures/export] Fehler beim Laden der Einwilligungen:',
			consentsError
		)
		return []
	}

	return consents || []
}

/**
 * Transforms consent records for export
 */
function transformConsentsForExport(consents: ConsentRecord[]): ConsentExport[] {
	return consents.map(({ id, ...rest }) => ({
		consent_id: id,
		...rest,
	}))
}

export async function GET(req: Request) {
	// Use admin client for patient measures export (RLS bypass for clinician access)
	const supabase = createAdminSupabaseClient()

	try {
		// 1. Get authenticated user from request
		const authHeader = req.headers.get('authorization')
		if (!authHeader) {
			return NextResponse.json(
				{ error: 'Nicht authentifiziert. Bitte melden Sie sich an.' },
				{ status: 401 }
			)
		}

		// Verify the user with the token
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

		if (authError || !user) {
			console.error('[patient-measures/export] Auth-Fehler:', authError)
			return NextResponse.json(
				{ error: 'Nicht authentifiziert. Bitte melden Sie sich an.' },
				{ status: 401 }
			)
		}

		// 2. Get patient profile for the authenticated user
		const { data: profileData, error: profileError } = await supabase
			.from('patient_profiles')
			.select('id')
			.eq('user_id', user.id)
			.single()

		if (profileError || !profileData) {
			console.error(
				'[patient-measures/export] Fehler beim Laden des Patientenprofils:',
				profileError
			)
			return NextResponse.json(
				{ error: 'Ihr Profil konnte nicht geladen werden.' },
				{ status: 403 }
			)
		}

		const patientId = profileData.id

		// 3. Fetch patient measures with related reports
		const { data: measures, error: measuresError } = await supabase
			.from('patient_measures')
			.select<
				'id, patient_id, created_at, report_id, stress_score, sleep_score, risk_level',
				PatientMeasure
			>('id, patient_id, created_at, report_id, stress_score, sleep_score, risk_level')
			.eq('patient_id', patientId)
			.order('created_at', { ascending: false })

		if (measuresError) {
			console.error(
				'[patient-measures/export] Fehler beim Laden der Messungen:',
				measuresError
			)
			return NextResponse.json(
				{ error: 'Fehler beim Laden der Messungen.' },
				{ status: 500 }
			)
		}

		if (!measures || measures.length === 0) {
			// Even if no measures, export consent data
			const consents = await fetchUserConsents(supabase, user.id)
			const consentData = transformConsentsForExport(consents)

			const exportResponse = {
				export_date: new Date().toISOString(),
				patient_id: patientId,
				user_id: user.id,
				measures: [],
				total_count: 0,
				consents: consentData,
				consents_count: consentData.length,
				message: 'Keine Messungen gefunden.',
			}

			// Format date for filename (YYYY-MM-DD)
			const dateStr = new Date().toISOString().split('T')[0]
			const filename = `patient-export-${dateStr}.json`

			return NextResponse.json(exportResponse, {
				status: 200,
				headers: {
					'Content-Type': 'application/json; charset=utf-8',
					'Content-Disposition': `attachment; filename="${filename}"`,
				},
			})
		}

		// 4. Fetch reports referenced by the measures
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
					'[patient-measures/export] Fehler beim Laden der Reports:',
					reportsError
				)
				// Continue without reports rather than failing completely
				// Measures will be exported with null values for report-related fields
			} else {
				reports = reportsData || []
			}
		}

		// 5. Fetch user consents
		const consents = await fetchUserConsents(supabase, user.id)

		// 6. Combine measures with their reports and prepare export data
		const exportData = measures.map((measure) => {
			const report = reports?.find((r) => r.id === measure.report_id)
			const measuredAt = report?.created_at ?? measure.created_at
			return {
				measure_id: measure.id,
				patient_id: measure.patient_id,
				measured_at: measuredAt,
				stress_score: measure.stress_score ?? report?.score_numeric ?? null,
				sleep_score: measure.sleep_score ?? report?.sleep_score ?? null,
				risk_level: measure.risk_level ?? report?.risk_level ?? null,
				report_id: report?.id ?? measure.report_id,
				scores: {
					stress_score: measure.stress_score ?? report?.score_numeric ?? null,
					sleep_score: measure.sleep_score ?? report?.sleep_score ?? null,
				},
				report_assessment_id: report?.assessment_id ?? null,
				amy_interpretation: report?.report_text_short ?? null,
				report_created_at: report?.created_at ?? null,
			}
		})

		// 7. Prepare consent data for export
		const consentData = transformConsentsForExport(consents)

		// 8. Return the complete export with proper headers
		const exportResponse = {
			export_date: new Date().toISOString(),
			patient_id: patientId,
			user_id: user.id,
			measures: exportData,
			total_count: exportData.length,
			consents: consentData,
			consents_count: consentData.length,
		}

		// Format date for filename (YYYY-MM-DD)
		const dateStr = new Date().toISOString().split('T')[0]
		const filename = `patient-export-${dateStr}.json`

		return NextResponse.json(exportResponse, {
			status: 200,
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
				'Content-Disposition': `attachment; filename="${filename}"`,
			},
		})
	} catch (err: unknown) {
		console.error('[patient-measures/export] Unerwarteter Fehler:', err)
		const error = err as { message?: string }
		return NextResponse.json(
			{
				error: 'Interner Fehler beim Exportieren der Messungen.',
				message: error?.message ?? String(err),
			},
			{ status: 500 }
		)
	}
}
