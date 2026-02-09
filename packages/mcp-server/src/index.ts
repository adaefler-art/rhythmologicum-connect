/**
 * E76.1: MCP Server Package Exports
 * 
 * Public API for the MCP server package.
 */

export { createServer, startServer } from './server'
export { getVersionMetadata, generateRunVersion } from './version'
export { logger } from './logger'
export { MCP_TOOLS } from './tools'
export type { GetPatientContextInput, GetPatientContextOutput, RunDiagnosisInput, RunDiagnosisOutput } from './tools'
export {
	handleGetPatientContext,
	handleRunDiagnosis,
	type TraceTimelineEntry,
	type TraceTimelineSummary,
	type TraceTelemetry,
	type ToolResult,
} from './handlers'
