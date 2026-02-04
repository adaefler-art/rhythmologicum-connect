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

		// Verify ownership/access for all users
		if (userRole === 'patient') {
			const { data: patientProfile } = await supabase
				.from('patient_profiles')
				.select('id')
				.eq('user_id', user.id)
				.single()

			if (!patientProfile) {
				logForbidden(
					{ userId: user.id, jobId, endpoint: `/api/processing/jobs/${jobId}/download` },
					'Patient profile not found',
				)
				return notFoundResponse('Processing Job')
			}

			const { data: assessment } = await supabase
				.from('assessments')
				.select('patient_id')
				.eq('id', job.assessment_id)
				.single()

			if (!assessment || assessment.patient_id !== patientProfile.id) {
				logForbidden(
					{ userId: user.id, jobId, endpoint: `/api/processing/jobs/${jobId}/download` },
					'Patient does not own assessment',
				)
				return notFoundResponse('Processing Job')
			}
		} else if (userRole === 'clinician') {
			const { data: assessment } = await supabase
				.from('assessments')
				.select('patient_id')
				.eq('id', job.assessment_id)
				.single()

			if (!assessment) return notFoundResponse('Processing Job')

			const { data: assignment } = await supabase
				.from('clinician_patient_assignments')
				.select('id')
				.eq('clinician_user_id', user.id)
				.eq('patient_id', assessment.patient_id)
				.single()

			if (!assignment) {
				logForbidden(
					{ userId: user.id, jobId, endpoint: `/api/processing/jobs/${jobId}/download` },
					'Clinician not assigned to patient',
				)
				return notFoundResponse('Processing Job')
			}
		}

		if (!job.pdf_path) {
			return notFoundResponse('PDF')
		}

		const expiresIn = 3600
		const urlResult = await generateSignedUrl(job.pdf_path, expiresIn)
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
