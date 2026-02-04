import { requireAuth } from '@/lib/api/authHelpers'
import { versionedSuccessResponse, internalErrorResponse } from '@/lib/api/responses'
import { randomUUID } from 'crypto'
import {
	PATIENT_DASHBOARD_SCHEMA_VERSION,
	createEmptyDashboardViewModel,
	type DashboardViewModelV1,
	WORKUP_STATE,
	type OnboardingStatusValue,
	type ContentTile,
} from '@/lib/api/contracts/patient/dashboard'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { resolveNextStep, type NextStepResolverInput } from '@/lib/nextStep/resolver'

/**
 * E6.5.3: Patient Dashboard API - Enhanced with RLS and Bounded IO
 * E6.5.5: Integrated with Next Step Resolver v1
 * 
 * Returns dashboard view model with stable, versioned schema.
 * Enforces 401-first auth ordering.
 * 
 * E6.5.3 AC1: Unauthenticated → 401 (401-first, no DB calls)
 * E6.5.3 AC3: Authenticated patient sees only own data (RLS)
 * E6.5.3 AC4: Payload bounded (tiles max N, funnels max 2-5 summaries)
 * E6.5.2 AC1: Contract as Zod schema with runtime check
 * E6.5.2 AC2: Response envelope + error semantics standardized
 * E6.5.2 AC3: Version marker (dashboardVersion: 1) present
 * E6.5.5 AC1: Same inputs → same nextStep (deterministic resolver)
 * 
 * Note: Pilot eligibility gate removed to allow all authenticated users access.
 * Re-enable requirePilotEligibility when pilot rollout is configured.
 */

export const dynamic = 'force-dynamic'
export const revalidate = 0

// E6.5.3 AC4: Bounded result sizes
// These constants will be used when fetching real data in future iterations
// Currently documented for future implementation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MAX_FUNNEL_SUMMARIES = 5
 
const MAX_CONTENT_TILES = 10

type ContentTileRow = {
	id: string
	slug: string | null
	title: string | null
	excerpt: string | null
	category: string | null
	priority: number | null
	created_at: string
}

const DEFAULT_CONTENT_TILES: ContentTile[] = [
	{
		id: 'default-content-tile',
		type: 'info',
		title: 'Willkommen',
		description: 'Starten Sie mit Ihrem ersten Assessment oder entdecken Sie Inhalte.',
		actionLabel: null,
		actionTarget: '/patient/assess',
		priority: 0,
	},
]

function mapCategoryToTileType(category: string | null): ContentTile['type'] {
	switch (category) {
		case 'action':
			return 'action'
		case 'promotion':
			return 'promotion'
		case 'info':
		default:
			return 'info'
	}
}

async function fetchContentTilesFromDb(
	supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
	maxTiles: number,
): Promise<ContentTile[]> {
	try {
		const { data, error } = await supabase
			.from('content_pages')
			.select('id, slug, title, excerpt, category, priority, created_at')
			.eq('status', 'published')
			.is('deleted_at', null)
			.is('funnel_id', null)
			.order('priority', { ascending: false })
			.order('created_at', { ascending: false })
			.limit(maxTiles)

		if (error) {
			console.error('[DASHBOARD_API] STEP=fetchContentTiles success=false', {
				errorCode: error.code,
				errorMessage: error.message,
			})
			return DEFAULT_CONTENT_TILES
		}

		const tiles = (data as ContentTileRow[])
			.filter((row) => !!row.slug)
			.map((row) => ({
				id: row.id,
				type: mapCategoryToTileType(row.category),
				title: row.title ?? 'Inhalt',
				description: row.excerpt ?? '',
				actionLabel: null,
				actionTarget: `/patient/content/${row.slug}`,
				priority: row.priority ?? 0,
			}))

		return tiles.length > 0 ? tiles : DEFAULT_CONTENT_TILES
	} catch (error) {
		console.error('[DASHBOARD_API] STEP=fetchContentTiles exception', {
			errorType: error instanceof Error ? error.name : 'unknown',
			errorMessage: error instanceof Error ? error.message : String(error),
		})
		return DEFAULT_CONTENT_TILES
	}
}

export async function GET() {
	// V061-I04: Generate correlation ID early for consistent logging
	const correlationId = randomUUID()
  
	// E6.5.3 AC1: Auth check FIRST, before any DB/IO operations
	// This enforces 401-first ordering
	// V061-I04: Wrap in try-catch to prevent auth check crashes
	let authResult
	try {
		authResult = await requireAuth()
	} catch (authError) {
		console.error('[DASHBOARD_API] STEP=requireAuth success=false', {
			correlationId,
			errorType: authError instanceof Error ? authError.name : 'unknown',
			errorMessage: authError instanceof Error ? authError.message : String(authError),
		})
		return internalErrorResponse('Authentication check failed', correlationId)
	}
  
	if (authResult.error) {
		// Returns 401 for unauthenticated/session expired
		console.log('[DASHBOARD_API] STEP=requireAuth success=false reason=unauthorized', {
			correlationId,
		})
		return authResult.error
	}
  
	const user = authResult.user!
	console.log('[DASHBOARD_API] STEP=requireAuth success=true', {
		correlationId,
		hasUser: !!user,
	})
  
	// E6.5.3 AC3: RLS-safe data fetch
	// All queries use user.id to ensure patient sees only own data
	// V061-I04: Enhanced error handling with empty state fallbacks
	try {
		let supabase
		try {
			supabase = await createServerSupabaseClient()
			console.log('[DASHBOARD_API] STEP=createSupabaseClient success=true', {
				correlationId,
			})
		} catch (supabaseError) {
			console.error('[DASHBOARD_API] STEP=createSupabaseClient success=false', {
				correlationId,
				errorType: supabaseError instanceof Error ? supabaseError.name : 'unknown',
				errorMessage: supabaseError instanceof Error ? supabaseError.message : String(supabaseError),
			})
			// V061-I04: Fail gracefully with empty state instead of crash
			const dashboardData: DashboardViewModelV1 = createEmptyDashboardViewModel(correlationId)
			return versionedSuccessResponse(
				dashboardData,
				PATIENT_DASHBOARD_SCHEMA_VERSION,
				200,
				correlationId,
			)
		}
    
		// V061-I04: Guard against null supabase client
		if (!supabase) {
			console.log('[DASHBOARD_API] STEP=checkSupabaseClient success=false reason=nullClient', {
				correlationId,
			})
			const dashboardData: DashboardViewModelV1 = createEmptyDashboardViewModel(correlationId)
			return versionedSuccessResponse(
				dashboardData,
				PATIENT_DASHBOARD_SCHEMA_VERSION,
				200,
				correlationId,
			)
		}
    
		// E6.5.5: Query data needed for Next Step Resolver
		// V061-I04: Add error handling for each query with empty state fallbacks
    
		// Get patient profile for onboarding status
		let patientProfile: { id: string; onboarding_status: string } | null = null
		try {
			const { data, error } = await supabase
				.from('patient_profiles')
				.select('id, onboarding_status')
				.eq('user_id', user.id)
				.single()
      
			if (error) {
				console.error('[DASHBOARD_API] STEP=fetchPatientProfile success=false', {
					correlationId,
					errorCode: error.code,
					errorMessage: error.message,
				})
			} else {
				patientProfile = data
				console.log('[DASHBOARD_API] STEP=fetchPatientProfile success=true', {
					correlationId,
					hasProfile: !!data,
				})
			}
		} catch (profileError) {
			console.error('[DASHBOARD_API] STEP=fetchPatientProfile exception', {
				correlationId,
				errorType: profileError instanceof Error ? profileError.name : 'unknown',
				errorMessage: profileError instanceof Error ? profileError.message : String(profileError),
			})
			// Continue with null profile - will use empty state
		}
    
		// E6.5.6: Fetch content tiles from published content pages
		// V061-I04: Fetch tiles BEFORE patient profile check since they're non-patient-specific
		let contentTiles: ContentTile[] = []
		try {
			contentTiles = await fetchContentTilesFromDb(supabase, MAX_CONTENT_TILES)
			console.log('[DASHBOARD_API] STEP=fetchContentTiles success=true', {
				correlationId,
				tileCount: contentTiles.length,
			})
		} catch (tilesError) {
			console.error('[DASHBOARD_API] STEP=fetchContentTiles exception', {
				correlationId,
				errorType: tilesError instanceof Error ? tilesError.name : 'unknown',
			})
			// Fallback to empty tiles array
			contentTiles = []
		}
    
		// V061-I04: If no patient profile, return empty state with static content tiles
		if (!patientProfile) {
			console.log('[DASHBOARD_API] STEP=buildDashboard reason=noPatientProfile', {
				correlationId,
			})
			const dashboardData: DashboardViewModelV1 = {
				...createEmptyDashboardViewModel(correlationId),
				contentTiles, // Include static content tiles even without patient profile
			}
			return versionedSuccessResponse(
				dashboardData,
				PATIENT_DASHBOARD_SCHEMA_VERSION,
				200,
				correlationId,
			)
		}

		// Get in-progress assessments
		let inProgressAssessments: Array<{ id: string; funnel_id: string | null; funnels_catalog: unknown }> | null = null
		try {
			const { data, error } = await supabase
				.from('assessments')
				.select('id, funnel_id, funnels_catalog(slug)')
				.eq('patient_id', patientProfile.id)
				.eq('status', 'in_progress')
				.order('started_at', { ascending: false })
				.limit(1)
      
			if (error) {
				console.error('[DASHBOARD_API] STEP=fetchInProgressAssessments success=false', {
					correlationId,
					errorCode: error.code,
				})
			} else {
				inProgressAssessments = data
			}
		} catch (assessmentError) {
			console.error('[DASHBOARD_API] STEP=fetchInProgressAssessments exception', {
				correlationId,
				errorType: assessmentError instanceof Error ? assessmentError.name : 'unknown',
			})
			// Continue with empty array
		}

		// Get all assessments to check if any started
		let allAssessments: Array<{ id: string }> | null = null
		try {
			const { data, error } = await supabase
				.from('assessments')
				.select('id')
				.eq('patient_id', patientProfile.id)
				.limit(1)
      
			if (error) {
				console.error('[DASHBOARD_API] STEP=fetchAllAssessments success=false', {
					correlationId,
					errorCode: error.code,
				})
			} else {
				allAssessments = data
			}
		} catch (assessmentError) {
			console.error('[DASHBOARD_API] STEP=fetchAllAssessments exception', {
				correlationId,
				errorType: assessmentError instanceof Error ? assessmentError.name : 'unknown',
			})
			// Continue with empty array
		}

		// Get workup status for completed assessments
		let workupAssessments: Array<{ workup_status: string | null }> | null = null
		try {
			const { data, error } = await supabase
				.from('assessments')
				.select('workup_status')
				.eq('patient_id', patientProfile.id)
				.eq('status', 'completed')
				.not('workup_status', 'is', null)
      
			if (error) {
				console.error('[DASHBOARD_API] STEP=fetchWorkupAssessments success=false', {
					correlationId,
					errorCode: error.code,
				})
			} else {
				workupAssessments = data
			}
		} catch (workupError) {
			console.error('[DASHBOARD_API] STEP=fetchWorkupAssessments exception', {
				correlationId,
				errorType: workupError instanceof Error ? workupError.name : 'unknown',
			})
			// Continue with empty array
		}

		// Get red flags from reports (high risk level)
		// V061-I04: Only query if we have assessments to check
		let highRiskReports: Array<{ id: string; assessment_id: string; risk_level: string | null }> | null = null
		if (allAssessments && allAssessments.length > 0) {
			try {
				const { data, error } = await supabase
					.from('reports')
					.select('id, assessment_id, risk_level')
					.eq('risk_level', 'high')
					.in(
						'assessment_id',
						allAssessments.map((a) => a.id),
					)
					.limit(1)
        
				if (error) {
					console.error('[DASHBOARD_API] STEP=fetchHighRiskReports success=false', {
						correlationId,
						errorCode: error.code,
					})
				} else {
					highRiskReports = data
				}
			} catch (reportsError) {
				console.error('[DASHBOARD_API] STEP=fetchHighRiskReports exception', {
					correlationId,
					errorType: reportsError instanceof Error ? reportsError.name : 'unknown',
				})
				// Continue with empty array
			}
		}

		// E6.5.5: Build resolver input from queried data
		// V061-I04: Use null-safe access with fallbacks
		const hasInProgressFunnel = Boolean(inProgressAssessments && inProgressAssessments.length > 0)
		const inProgressFunnel = inProgressAssessments && inProgressAssessments.length > 0 ? inProgressAssessments[0] : null
    
		// Extract funnel slug safely from joined data
		let funnelSlug: string | null = null
		if (inProgressFunnel?.funnels_catalog && typeof inProgressFunnel.funnels_catalog === 'object') {
			const catalog = inProgressFunnel.funnels_catalog as Record<string, unknown>
			funnelSlug = typeof catalog.slug === 'string' ? catalog.slug : null
		}

		const workupNeedsMoreDataCount =
			workupAssessments?.filter((a) => a.workup_status === 'needs_more_data').length || 0
		const workupReadyForReviewCount =
			workupAssessments?.filter((a) => a.workup_status === 'ready_for_review').length || 0

		let workupState: NextStepResolverInput['workupState'] = WORKUP_STATE.NO_DATA
		if (workupNeedsMoreDataCount > 0) {
			workupState = WORKUP_STATE.NEEDS_MORE_DATA
		} else if (workupReadyForReviewCount > 0) {
			workupState = WORKUP_STATE.READY_FOR_REVIEW
		}

		const hasRedFlags = Boolean(highRiskReports && highRiskReports.length > 0)
		const redFlagAssessmentId = highRiskReports?.[0]?.assessment_id || null

		const resolverInput: NextStepResolverInput = {
			onboardingStatus: (patientProfile.onboarding_status || 'not_started') as OnboardingStatusValue,
			workupState,
			workupNeedsMoreDataCount,
			hasInProgressFunnel,
			inProgressFunnelSlug: funnelSlug,
			hasStartedAnyFunnel: Boolean(allAssessments && allAssessments.length > 0),
			hasRedFlags,
			redFlagAssessmentId,
		}

		// E6.5.5 AC1: Resolve next step deterministically
		// V061-I04: Wrap in try-catch to prevent resolver crashes
		let resolution
		try {
			resolution = resolveNextStep(resolverInput)
			console.log('[DASHBOARD_API] STEP=resolveNextStep success=true', {
				correlationId,
				nextStepType: resolution.nextStep.type,
			})
		} catch (resolverError) {
			console.error('[DASHBOARD_API] STEP=resolveNextStep exception', {
				correlationId,
				errorType: resolverError instanceof Error ? resolverError.name : 'unknown',
				errorMessage: resolverError instanceof Error ? resolverError.message : String(resolverError),
			})
			// V061-I04: Fallback to empty state with default next step and content tiles
			const dashboardData: DashboardViewModelV1 = {
				...createEmptyDashboardViewModel(correlationId),
				contentTiles, // Include content tiles even on resolver failure
			}
			return versionedSuccessResponse(
				dashboardData,
				PATIENT_DASHBOARD_SCHEMA_VERSION,
				200,
				correlationId,
			)
		}

		// E6.5.2: Build Dashboard View Model V1
		// For now, return mostly empty state with resolved nextStep
		const dashboardData: DashboardViewModelV1 = {
			...createEmptyDashboardViewModel(correlationId),
			onboardingStatus: resolverInput.onboardingStatus,
			nextStep: resolution.nextStep,
			workupSummary: {
				state: workupState,
				counts: {
					needsMoreData: workupNeedsMoreDataCount,
					readyForReview: workupReadyForReviewCount,
					total: (workupAssessments?.length || 0),
				},
			},
			contentTiles,
		}
    
		console.log('[DASHBOARD_API] STEP=buildDashboard success=true', {
			correlationId,
		})
    
		// E6.5.2 AC2: Versioned success response with schemaVersion
		return versionedSuccessResponse(
			dashboardData,
			PATIENT_DASHBOARD_SCHEMA_VERSION,
			200,
			correlationId,
		)
	} catch (error) {
		console.error('[DASHBOARD_API] STEP=buildDashboard exception', {
			correlationId,
			errorType: error instanceof Error ? error.name : 'unknown',
			errorMessage: error instanceof Error ? error.message : String(error),
		})
		return internalErrorResponse('Failed to build dashboard', correlationId)
	}
}
