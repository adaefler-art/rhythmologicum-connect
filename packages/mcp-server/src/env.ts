/* eslint-disable no-restricted-syntax */
type MCPEnv = {
  PORT?: string
  MCP_SERVER_PORT?: string
  MCP_SERVER_HOST?: string
  MCP_SERVER_URL?: string
  MCP_HTTP_TIMEOUT_MS?: string
  FEATURE_MCP_STUB?: string
  ANTHROPIC_API_KEY?: string
  ANTHROPIC_KEY?: string
  ANTHROPIC_MODEL?: string
  LLM_PROVIDER?: string
}

const rawEnv: MCPEnv = {
  PORT: process.env.PORT,
  MCP_SERVER_PORT: process.env.MCP_SERVER_PORT,
  MCP_SERVER_HOST: process.env.MCP_SERVER_HOST,
  MCP_SERVER_URL: process.env.MCP_SERVER_URL,
  MCP_HTTP_TIMEOUT_MS: process.env.MCP_HTTP_TIMEOUT_MS,
  FEATURE_MCP_STUB: process.env.FEATURE_MCP_STUB,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  ANTHROPIC_KEY: process.env.ANTHROPIC_KEY,
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
  LLM_PROVIDER: process.env.LLM_PROVIDER,
}

export const env = rawEnv
