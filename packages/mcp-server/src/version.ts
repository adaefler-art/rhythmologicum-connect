/**
 * E76.1: MCP Server Version Metadata
 * 
 * Provides version tracking for:
 * - mcp_server_version: Server package version
 * - run_version: Individual execution run ID
 * - prompt_version: Prompt template version for LLM interactions
 */

export const MCP_SERVER_VERSION = '0.1.0'
export const PROMPT_VERSION = 'v1.0.0'

export interface VersionMetadata {
  mcp_server_version: string
  run_version: string
  prompt_version: string
  timestamp: string
}

export function generateRunVersion(): string {
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

export function getVersionMetadata(runId?: string): VersionMetadata {
  return {
    mcp_server_version: MCP_SERVER_VERSION,
    run_version: runId || generateRunVersion(),
    prompt_version: PROMPT_VERSION,
    timestamp: new Date().toISOString(),
  }
}
