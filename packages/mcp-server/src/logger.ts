/**
 * E76.1: MCP Server Logging Utility
 * 
 * Provides structured logging with correlation ID (run_id) tracking.
 * Ensures no leakage of secrets (LLM API keys) in logs.
 */

export interface LogContext {
  run_id: string
  timestamp?: string
  level?: 'info' | 'warn' | 'error' | 'debug'
  [key: string]: unknown
}

const REDACTED_KEYS = ['api_key', 'apiKey', 'token', 'secret', 'password', 'llm_api_key']

function redactSensitiveData(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(redactSensitiveData)
  }

  const redacted: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (REDACTED_KEYS.some((k) => key.toLowerCase().includes(k.toLowerCase()))) {
      redacted[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitiveData(value)
    } else {
      redacted[key] = value
    }
  }
  return redacted
}

export class Logger {
  constructor(private defaultContext: Partial<LogContext> = {}) {}

  private log(level: string, message: string, context: Partial<LogContext> = {}) {
    const fullContext = {
      ...this.defaultContext,
      ...context,
      timestamp: new Date().toISOString(),
      level,
    }

    const safeContext = redactSensitiveData(fullContext) as Record<string, unknown>

    const logEntry = {
      message,
      ...safeContext,
    }

    console.log(JSON.stringify(logEntry))
  }

  info(message: string, context: Partial<LogContext> = {}) {
    this.log('info', message, context)
  }

  warn(message: string, context: Partial<LogContext> = {}) {
    this.log('warn', message, context)
  }

  error(message: string, context: Partial<LogContext> = {}) {
    this.log('error', message, context)
  }

  debug(message: string, context: Partial<LogContext> = {}) {
    this.log('debug', message, context)
  }

  withRunId(runId: string): Logger {
    return new Logger({ ...this.defaultContext, run_id: runId })
  }
}

export const logger = new Logger()
