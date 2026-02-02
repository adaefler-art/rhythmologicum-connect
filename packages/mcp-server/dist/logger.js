/**
 * E76.1: MCP Server Logging Utility
 *
 * Provides structured logging with correlation ID (run_id) tracking.
 * Ensures no leakage of secrets (LLM API keys) in logs.
 */
const REDACTED_KEYS = ['api_key', 'apiKey', 'token', 'secret', 'password', 'llm_api_key'];
function redactSensitiveData(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(redactSensitiveData);
    }
    const redacted = {};
    for (const [key, value] of Object.entries(obj)) {
        if (REDACTED_KEYS.some((k) => key.toLowerCase().includes(k.toLowerCase()))) {
            redacted[key] = '[REDACTED]';
        }
        else if (typeof value === 'object' && value !== null) {
            redacted[key] = redactSensitiveData(value);
        }
        else {
            redacted[key] = value;
        }
    }
    return redacted;
}
export class Logger {
    defaultContext;
    constructor(defaultContext = {}) {
        this.defaultContext = defaultContext;
    }
    log(level, message, context = {}) {
        const fullContext = {
            ...this.defaultContext,
            ...context,
            timestamp: new Date().toISOString(),
            level,
        };
        const safeContext = redactSensitiveData(fullContext);
        const logEntry = {
            message,
            ...safeContext,
        };
        console.log(JSON.stringify(logEntry));
    }
    info(message, context = {}) {
        this.log('info', message, context);
    }
    warn(message, context = {}) {
        this.log('warn', message, context);
    }
    error(message, context = {}) {
        this.log('error', message, context);
    }
    debug(message, context = {}) {
        this.log('debug', message, context);
    }
    withRunId(runId) {
        return new Logger({ ...this.defaultContext, run_id: runId });
    }
}
export const logger = new Logger();
//# sourceMappingURL=logger.js.map