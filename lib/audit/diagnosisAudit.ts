/**
 * E76.7: Diagnosis Audit Logging
 *
 * Audit logging for diagnosis run and artifact events (no PHI, correlation IDs only)
 */

import { logAuditEvent } from '@/lib/audit/log'
import { AUDIT_ACTION, AUDIT_ENTITY_TYPE, AUDIT_SOURCE } from '@/lib/contracts/registry'
import type { UserRole } from '@/lib/contracts/registry'

/**
 * Log diagnosis run created event
 *
 * @param runId - Diagnosis run ID (entity)
 * @param patientId - Patient ID (metadata, not PHI)
 * @param clinicianId - Clinician who initiated the run (actor)
 * @param inputsHash - Inputs hash for idempotency tracking
 */
export async function logDiagnosisRunCreated(
  runId: string,
  patientId: string,
  clinicianId: string,
  inputsHash: string,
) {
  return await logAuditEvent({
    entity_type: AUDIT_ENTITY_TYPE.DIAGNOSIS_RUN,
    entity_id: runId,
    action: AUDIT_ACTION.CREATE,
    source: AUDIT_SOURCE.API,
    actor_user_id: clinicianId,
    metadata: {
      patient_id: patientId,
      inputs_hash: inputsHash,
      status: 'queued',
    },
  })
}

/**
 * Log diagnosis run status changed event
 *
 * @param runId - Diagnosis run ID (entity)
 * @param statusFrom - Previous status
 * @param statusTo - New status
 * @param processingTimeMs - Processing time in milliseconds
 * @param actorUserId - User who triggered the change (optional, system if worker)
 */
export async function logDiagnosisRunStatusChanged(
  runId: string,
  statusFrom: string,
  statusTo: string,
  processingTimeMs?: number,
  actorUserId?: string,
) {
  return await logAuditEvent({
    entity_type: AUDIT_ENTITY_TYPE.DIAGNOSIS_RUN,
    entity_id: runId,
    action: 'status_changed' as any, // Custom action for diagnosis
    source: AUDIT_SOURCE.SYSTEM,
    actor_user_id: actorUserId,
    metadata: {
      status_from: statusFrom,
      status_to: statusTo,
      processing_time_ms: processingTimeMs,
    },
  })
}

/**
 * Log diagnosis run failed event
 *
 * @param runId - Diagnosis run ID (entity)
 * @param errorCode - Error code (e.g., VALIDATION_ERROR, LLM_ERROR)
 * @param retryCount - Current retry count
 * @param actorUserId - User who triggered the run (optional)
 */
export async function logDiagnosisRunFailed(
  runId: string,
  errorCode: string,
  retryCount: number,
  actorUserId?: string,
) {
  return await logAuditEvent({
    entity_type: AUDIT_ENTITY_TYPE.DIAGNOSIS_RUN,
    entity_id: runId,
    action: 'failed' as any, // Custom action for diagnosis
    source: AUDIT_SOURCE.SYSTEM,
    actor_user_id: actorUserId,
    metadata: {
      error_code: errorCode,
      retry_count: retryCount,
    },
  })
}

/**
 * Log diagnosis artifact created event
 *
 * @param artifactId - Artifact ID (entity)
 * @param runId - Associated run ID
 * @param artifactType - Type of artifact (diagnosis_json, context_pack, mcp_response)
 * @param riskLevel - Extracted risk level (low, medium, high, critical)
 * @param confidenceScore - Confidence score (0.0 to 1.0)
 * @param createdBy - User who created the artifact (clinician)
 */
export async function logDiagnosisArtifactCreated(
  artifactId: string,
  runId: string,
  artifactType: string,
  riskLevel?: string,
  confidenceScore?: number,
  createdBy?: string,
) {
  return await logAuditEvent({
    entity_type: AUDIT_ENTITY_TYPE.DIAGNOSIS_ARTIFACT,
    entity_id: artifactId,
    action: AUDIT_ACTION.CREATE,
    source: AUDIT_SOURCE.SYSTEM,
    actor_user_id: createdBy,
    metadata: {
      run_id: runId,
      artifact_type: artifactType,
      risk_level: riskLevel,
      confidence_score: confidenceScore,
    },
  })
}

/**
 * Log diagnosis artifact viewed event
 *
 * @param artifactId - Artifact ID (entity)
 * @param userId - User who viewed the artifact
 * @param userRole - User's role (clinician, patient, admin)
 */
export async function logDiagnosisArtifactViewed(
  artifactId: string,
  userId: string,
  userRole: UserRole,
) {
  return await logAuditEvent({
    entity_type: AUDIT_ENTITY_TYPE.DIAGNOSIS_ARTIFACT,
    entity_id: artifactId,
    action: 'viewed' as any, // Custom action for diagnosis
    source: AUDIT_SOURCE.API,
    actor_user_id: userId,
    actor_role: userRole,
    metadata: {},
  })
}

/**
 * Log diagnosis artifact downloaded event
 *
 * @param artifactId - Artifact ID (entity)
 * @param userId - User who downloaded the artifact
 * @param userRole - User's role (clinician, patient, admin)
 */
export async function logDiagnosisArtifactDownloaded(
  artifactId: string,
  userId: string,
  userRole: UserRole,
) {
  return await logAuditEvent({
    entity_type: AUDIT_ENTITY_TYPE.DIAGNOSIS_ARTIFACT,
    entity_id: artifactId,
    action: 'downloaded' as any, // Custom action for diagnosis
    source: AUDIT_SOURCE.API,
    actor_user_id: userId,
    actor_role: userRole,
    metadata: {},
  })
}
