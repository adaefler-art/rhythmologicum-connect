/**
 * Review Details API - V05-I07.3
 * 
 * Get detailed review data including validation and safety check results
 * Auth: clinician/admin/nurse only
 * 
 * GET /api/review/[id]/details - Get comprehensive QA data for review
 * 
 * HTTP Semantics:
 * - 401: Not authenticated
 * - 403: Authenticated but insufficient role
 * - 404: Review not found
 * - 422: Invalid UUID format
 * - 200: Success
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { loadReviewRecordById } from '@/lib/review/persistence'

// UUID validation (no external dependency)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUuid(value: string): boolean {
	return UUID_REGEX.test(value.trim())
}

type RouteContext = {
	params: Promise<{ id: string }>
}

// Schema version for API response
const API_VERSION = 'v1'

export async function GET(request: NextRequest, context: RouteContext) {
	try {
		// Auth check
		const supabase = await createServerSupabaseClient()
    
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser()
    
		if (authError || !user) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: 'AUTHENTICATION_REQUIRED',
						message: 'User must be authenticated',
					},
				},
				{ status: 401 }
			)
		}

		// Role check: only clinician/admin/nurse can view review details
		const userRole = user.app_metadata?.role
    
		if (!userRole || !['clinician', 'admin', 'nurse'].includes(userRole)) {
			// Return 403 for insufficient permissions (authenticated but wrong role)
			return NextResponse.json(
				{
					success: false,
					error: {
						code: 'FORBIDDEN',
						message: 'Insufficient permissions',
					},
				},
				{ status: 403 }
			)
		}
    
		// Get review ID from params
		const { id: reviewId } = await context.params
    
		if (!reviewId) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: 'VALIDATION_ERROR',
						message: 'Review ID is required',
					},
				},
				{ status: 422 }
			)
		}
    
		// Validate UUID format
		if (!isUuid(reviewId)) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: 'VALIDATION_ERROR',
						message: 'Invalid review ID format',
					},
				},
				{ status: 422 }
			)
		}
    
		// Load review record
		const reviewResult = await loadReviewRecordById(supabase, reviewId)
    
		if (!reviewResult.success) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: 'NOT_FOUND',
						message: 'Review record not found',
					},
				},
				{ status: 404 }
			)
		}
    
		const review = reviewResult.data
    
		// Load validation results (Layer 1)
		let validationData = null
		if (review.validationResultId) {
			const { data: validation, error: validationError } = await supabase
				.from('medical_validation_results')
				.select('*')
				.eq('id', review.validationResultId)
				.single()
      
			if (!validationError && validation) {
				validationData = {
					id: validation.id,
					overallStatus: validation.overall_status,
					overallPassed: validation.overall_passed,
					flagsRaisedCount: validation.flags_raised_count,
					criticalFlagsCount: validation.critical_flags_count,
					warningFlagsCount: validation.warning_flags_count,
					infoFlagsCount: validation.info_flags_count,
					rulesEvaluatedCount: validation.rules_evaluated_count,
					validationData: validation.validation_data,
					validatedAt: validation.validated_at,
				}
			}
		}
    
		// Load safety check results (Layer 2)
		let safetyData = null
		if (review.safetyCheckId) {
			const { data: safety, error: safetyError } = await supabase
				.from('safety_check_results')
				.select('*')
				.eq('id', review.safetyCheckId)
				.single()
      
			if (!safetyError && safety) {
				safetyData = {
					id: safety.id,
					overallAction: safety.overall_action,
					safetyScore: safety.safety_score,
					overallSeverity: safety.overall_severity,
					findingsCount: safety.findings_count,
					criticalFindingsCount: safety.critical_findings_count,
					highFindingsCount: safety.high_findings_count,
					mediumFindingsCount: safety.medium_findings_count,
					lowFindingsCount: safety.low_findings_count,
					checkData: safety.check_data,
					evaluatedAt: safety.evaluated_at,
				}
			}
		}
    
		// Return comprehensive QA data (PHI-free, schema-versioned)
		return NextResponse.json(
			{
				success: true,
				version: API_VERSION,
				data: {
					review: {
						id: review.id,
						jobId: review.jobId,
						status: review.status,
						queueReasons: review.queueReasons,
						isSampled: review.isSampled,
						reviewIteration: review.reviewIteration,
						createdAt: review.createdAt,
						updatedAt: review.updatedAt,
					},
					validation: validationData,
					safety: safetyData,
					decision: review.reviewerUserId ? {
						reviewerRole: review.reviewerRole,
						reasonCode: review.decisionReasonCode,
						notes: review.decisionNotes,
						decidedAt: review.decidedAt,
					} : null,
				},
			},
			{ status: 200 }
		)
	} catch (err) {
		console.error('[review/[id]/details] Unexpected error:', err)
		return NextResponse.json(
			{
				success: false,
				error: {
					code: 'INTERNAL_ERROR',
					message: 'An unexpected error occurred',
				},
			},
			{ status: 500 }
		)
	}
}
