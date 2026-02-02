/**
 * E76.1: MCP Server Package Exports
 *
 * Public API for the MCP server package.
 */
export { createServer, startServer } from './server.js';
export { getVersionMetadata, generateRunVersion } from './version.js';
export { logger } from './logger.js';
export { MCP_TOOLS } from './tools.js';
export { handleGetPatientContext, handleRunDiagnosis } from './handlers.js';
//# sourceMappingURL=index.js.map