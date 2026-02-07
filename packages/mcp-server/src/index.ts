/**
 * E76.1: MCP Server Package Exports
 * 
 * Public API for the MCP server package.
 */

export { createServer, startServer } from './server.js'
export { getVersionMetadata, generateRunVersion } from './version.js'
export { logger } from './logger.js'
export { MCP_TOOLS } from './tools.js'
export type { GetPatientContextInput, GetPatientContextOutput, RunDiagnosisInput, RunDiagnosisOutput } from './tools.js'
export {
	handleGetPatientContext,
	handleRunDiagnosis,
	type TraceTimelineEntry,
	type TraceTimelineSummary,
	type TraceTelemetry,
	type ToolResult,
} from './handlers.js'
