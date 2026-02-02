/**
 * E76.1: MCP Tool Handlers (Stubbed)
 *
 * Implements stubbed handlers for MCP tools.
 * Handlers validate input/output against schemas and return deterministic responses.
 */
import type { GetPatientContextInput, GetPatientContextOutput, RunDiagnosisInput, RunDiagnosisOutput } from './tools.js';
export declare function handleGetPatientContext(input: GetPatientContextInput, runId: string): Promise<GetPatientContextOutput>;
export declare function handleRunDiagnosis(input: RunDiagnosisInput, runId: string): Promise<RunDiagnosisOutput>;
//# sourceMappingURL=handlers.d.ts.map