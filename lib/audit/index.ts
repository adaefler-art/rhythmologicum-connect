/**
 * Audit Module
 * 
 * Provides comprehensive audit logging for decision-relevant events.
 * 
 * @module lib/audit
 */

export {
  logAuditEvent,
  logReportGenerated,
  logReportFlagged,
  logReportReviewed,
  logTaskEvent,
  logFunnelConfigChange,
  logFunnelVersionRollout,
  logConsentChange,
  type AuditEvent,
  type AuditMetadata,
  type AuditDiff,
  type AuditLogResult,
} from './log'

// Export redaction function for testing
export { redactPHI } from './log'
