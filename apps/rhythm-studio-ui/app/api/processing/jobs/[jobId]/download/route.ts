import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import {
	successResponse,
	unauthorizedResponse,
	notFoundResponse,
	internalErrorResponse,
} from '@/lib/api/responses'
import { logDatabaseError, logUnauthorized, logForbidden } from '@/lib/logging/logger'
import { generateSignedUrl } from '@/lib/pdf/storage'

type ProcessingJobRow = {
	id: string
	assessment_id: string | null
	pdf_path: string | null
}

type AssessmentRow = {
	patient_id: string | null
}

type PatientProfileRow = {
	id: string
}

/**
 * V06: Processing Job PDF Download (Signed URL)
 * 
 * GET /api/processing/jobs/[jobId]/download
 * 
 * Returns a short-lived signed URL for the job's generated PDF (if available).
 * 
 * Auth:
 * - patient: must own the underlying assessment
 * - clinician: must be assigned to the patient
 * - admin: unrestricted
 */
export async function GET(
	request: NextRequest,
	context: { params: Promise<{ jobId: string }> },
) {
	try {
		const { jobId } = await context.params

		const supabase = await createServerSupabaseClient()
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser()

		if (authError || !user) {
			logUnauthorized({ endpoint: `/api/processing/jobs/${jobId}/download` })
			return unauthorizedResponse()
		}

		if (!jobId) {
			return notFoundResponse('Job ID fehlt.')
		}

		const userRole = user.app_metadata?.role || 'patient'
		const serviceClient = createAdminSupabaseClient()

		const { data: job, error: jobError } = await serviceClient
			.from('processing_jobs')
			.select('id, assessment_id, pdf_path')
			.eq('id', jobId)
			.single()

		if (jobError || !job) {
			logDatabaseError(
				{ userId: user.id, jobId, endpoint: `/api/processing/jobs/${jobId}/download` },
				jobError,
			)
			return notFoundResponse('Processing Job')
		}

		const jobRow = job as ProcessingJobRow

		// Verify ownership/access for all users
		if (userRole === 'patient') {
			if (!jobRow.assessment_id) {
				return notFoundResponse('Processing Job')
			}

			const { data: patientProfile } = await supabase
				.from('patient_profiles')
				.select('id')
				.eq('user_id', user.id)
				.single()

			const patientProfileRow = patientProfile as PatientProfileRow | null
			if (!patientProfileRow) {
				logForbidden(
					{ userId: user.id, jobId, endpoint: `/api/processing/jobs/${jobId}/download` },
					'Patient profile not found',
				)
				return notFoundResponse('Processing Job')
			}

			const { data: assessment } = await supabase
				.from('assessments')
				.select('patient_id')
				.eq('id', jobRow.assessment_id)
				.single()

			const assessmentRow = assessment as AssessmentRow | null
			if (!assessmentRow || assessmentRow.patient_id !== patientProfileRow.id) {
				logForbidden(
					{ userId: user.id, jobId, endpoint: `/api/processing/jobs/${jobId}/download` },
					'Patient does not own assessment',
				)
				return notFoundResponse('Processing Job')
			}
		} else if (userRole === 'clinician') {
			if (!jobRow.assessment_id) return notFoundResponse('Processing Job')

			const { data: assessment } = await supabase
				.from('assessments')
				.select('patient_id')
				.eq('id', jobRow.assessment_id)
				.single()

			const assessmentRow = assessment as AssessmentRow | null
			if (!assessmentRow) return notFoundResponse('Processing Job')
			if (!assessmentRow.patient_id) return notFoundResponse('Processing Job')

			const { data: assignment } = await supabase
				.from('clinician_patient_assignments')
				.select('id')
				.eq('clinician_user_id', user.id)
				.eq('patient_id', assessmentRow.patient_id)
				.single()

			if (!assignment) {
				logForbidden(
					{ userId: user.id, jobId, endpoint: `/api/processing/jobs/${jobId}/download` },
					'Clinician not assigned to patient',
				)
				return notFoundResponse('Processing Job')
			}
		}

		if (!jobRow.pdf_path) {
			return notFoundResponse('PDF')
		}

		const expiresIn = 3600
		const urlResult = await generateSignedUrl(jobRow.pdf_path, expiresIn)
		if (!urlResult.success || !urlResult.url) {
			return internalErrorResponse('Signed URL generation failed')
		}

		return successResponse({
			signedUrl: urlResult.url,
			expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
		})
	} catch (error) {
		logDatabaseError(
			{
				endpoint: 'GET /api/processing/jobs/[jobId]/download',
			},
			error,
		)
		return internalErrorResponse()
	}
}
