/**
 * E76.1: MCP Server Version Metadata
 *
 * Provides version tracking for:
 * - mcp_server_version: Server package version
 * - run_version: Individual execution run ID
 * - prompt_version: Prompt template version for LLM interactions
 */
export declare const MCP_SERVER_VERSION = "0.1.0";
export declare const PROMPT_VERSION = "v1";
export interface VersionMetadata {
    mcp_server_version: string;
    run_version: string;
    prompt_version: string;
    timestamp: string;
}
export declare function generateRunVersion(): string;
export declare function getVersionMetadata(runId?: string): VersionMetadata;
//# sourceMappingURL=version.d.ts.map