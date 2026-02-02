/**
 * E76.1: MCP Server Logging Utility
 *
 * Provides structured logging with correlation ID (run_id) tracking.
 * Ensures no leakage of secrets (LLM API keys) in logs.
 */
export interface LogContext {
    run_id: string;
    timestamp?: string;
    level?: 'info' | 'warn' | 'error' | 'debug';
    [key: string]: unknown;
}
export declare class Logger {
    private defaultContext;
    constructor(defaultContext?: Partial<LogContext>);
    private log;
    info(message: string, context?: Partial<LogContext>): void;
    warn(message: string, context?: Partial<LogContext>): void;
    error(message: string, context?: Partial<LogContext>): void;
    debug(message: string, context?: Partial<LogContext>): void;
    withRunId(runId: string): Logger;
}
export declare const logger: Logger;
//# sourceMappingURL=logger.d.ts.map