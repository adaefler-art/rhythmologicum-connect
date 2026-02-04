# MCP Server Runbook

**Version:** 1.0  
**Epic:** E76 — MCP Integration  
**Status:** Active  
**Last Updated:** 2026-02-04

---

## Overview

This runbook provides operational guidance for running, configuring, and troubleshooting the MCP (Model Context Protocol) Server. The MCP server is a standalone service that provides AI-powered diagnostic and patient context tools for Rhythmologicum Connect.

**Package Location:** `packages/mcp-server/`  
**API Integration:** `apps/rhythm-studio-ui/app/api/mcp/`

---

## Prerequisites

### System Requirements

- Node.js 20.x or higher
- npm 9.x or higher
- TypeScript 5.x (installed via npm)
- Network access to LLM API endpoints (when integrated)

### Environment Setup

Required environment variables:

```bash
# Server Configuration
MCP_SERVER_PORT=3001                              # Default: 3001
MCP_SERVER_HOST=0.0.0.0                           # Default: 0.0.0.0
MCP_SERVER_URL=http://localhost:3001              # Used by API proxy

# Feature Flags
NEXT_PUBLIC_FEATURE_MCP_ENABLED=false             # Default: false (gated)

# LLM Configuration (Future - when real integration added)
LLM_API_KEY=your-anthropic-api-key-here          # Will be redacted in logs
LLM_API_URL=https://api.anthropic.com/v1        # Optional override
LLM_MODEL=claude-3-opus-20240229                 # Default model

# Logging
LOG_LEVEL=info                                    # Options: debug, info, warn, error
```

### Installation

```bash
# From repository root
cd packages/mcp-server
npm install

# Verify installation
npm run build
```

---

## Running the Server

### Development Mode

```bash
# Start with auto-reload on file changes
npm run dev

# Or from repository root
npm run --workspace packages/mcp-server dev
```

**Output:**
```
MCP Server starting...
Server listening on http://0.0.0.0:3001
Health endpoint: http://localhost:3001/health
```

### Production Mode

```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm start

# Or use process manager (recommended)
pm2 start dist/server.js --name mcp-server
```

### Verification

```bash
# Check health endpoint
curl http://localhost:3001/health

# Expected response:
{
  "status": "ok",
  "version": {
    "mcp_server_version": "0.1.0",
    "run_version": "run_1234567890_abc123",
    "prompt_version": "v1",
    "timestamp": "2026-02-04T19:00:00.000Z"
  },
  "uptime_seconds": 123.456
}
```

---

## Configuration

### Port Configuration

**Change Default Port:**

```bash
# Option 1: Environment variable
export MCP_SERVER_PORT=8080
npm start

# Option 2: .env file
echo "MCP_SERVER_PORT=8080" >> .env
```

**Port Conflicts:**

If port 3001 is already in use:
```bash
# Find process using port
lsof -i :3001

# Kill process (if safe)
kill -9 <PID>

# Or use different port
MCP_SERVER_PORT=3002 npm start
```

### Logging Configuration

**Change Log Level:**

```bash
# Debug mode (verbose logging)
LOG_LEVEL=debug npm run dev

# Production mode (errors only)
LOG_LEVEL=error npm start
```

**Log Format:**

Logs are JSON-structured:
```json
{
  "level": "info",
  "message": "Tool execution started",
  "tool": "get_patient_context",
  "run_id": "abc123",
  "timestamp": "2026-02-04T19:00:00.000Z"
}
```

**Secret Redaction:**

Sensitive data is automatically redacted:
```json
{
  "level": "debug",
  "message": "LLM API call",
  "api_key": "[REDACTED]",
  "model": "claude-3-opus"
}
```

---

## API Usage

### Health Check

**Endpoint:** `GET /health`

```bash
curl http://localhost:3001/health
```

**Response:**
```json
{
  "status": "ok",
  "version": { ... },
  "uptime_seconds": 123.456
}
```

**Status Codes:**
- `200` - Server is healthy
- `500` - Server error (check logs)

---

### Execute Tool

**Endpoint:** `POST /tools`

```bash
curl -X POST http://localhost:3001/tools \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "get_patient_context",
    "input": {
      "patient_id": "123e4567-e89b-12d3-a456-426614174000"
    },
    "run_id": "my-correlation-id"
  }'
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "patient_id": "123e4567-e89b-12d3-a456-426614174000",
    "demographics": { ... },
    "recent_assessments": [ ... ],
    "active_diagnoses": [ ... ],
    "metadata": { ... }
  },
  "version": { ... }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid patient_id format",
    "details": { ... }
  }
}
```

**Available Tools:**
- `get_patient_context` - Fetch patient data
- `run_diagnosis` - Execute AI diagnostic analysis

---

## Integration with Main Application

### Feature Flag

The MCP server is gated behind a feature flag. To enable:

```bash
# In main application .env.local
NEXT_PUBLIC_FEATURE_MCP_ENABLED=true
```

### API Proxy

The main application proxies requests to MCP server:

**Route:** `apps/rhythm-studio-ui/app/api/mcp/route.ts`

```typescript
// Literal callsite exists at:
// apps/rhythm-studio-ui/app/admin/diagnostics/mcp-test/page.tsx

fetch('/api/mcp', {
  method: 'POST',
  body: JSON.stringify({
    tool: 'get_patient_context',
    input: { patient_id: '...' }
  })
})
```

### Startup Sequence

For local development:

```bash
# Terminal 1: Start MCP server
cd packages/mcp-server
npm run dev

# Terminal 2: Start main application
cd apps/rhythm-studio-ui
npm run dev

# Access test page
# http://localhost:3000/admin/diagnostics/mcp-test
```

---

## Troubleshooting

### Issue: Server Won't Start

**Symptoms:**
- Error: "EADDRINUSE: address already in use :::3001"

**Solution:**
```bash
# Check what's using the port
lsof -i :3001

# Use different port
MCP_SERVER_PORT=3002 npm start
```

---

### Issue: Connection Refused from Main App

**Symptoms:**
- Error: "ECONNREFUSED" when accessing `/api/mcp`

**Checklist:**
1. MCP server is running: `curl http://localhost:3001/health`
2. Port matches environment variable: `echo $MCP_SERVER_URL`
3. Feature flag enabled: `NEXT_PUBLIC_FEATURE_MCP_ENABLED=true`
4. No firewall blocking localhost connections

**Solution:**
```bash
# Verify MCP_SERVER_URL in main app
grep MCP_SERVER_URL apps/rhythm-studio-ui/.env.local

# Should be: MCP_SERVER_URL=http://localhost:3001
```

---

### Issue: Tool Returns Empty Data

**Symptoms:**
- Health endpoint works
- Tool endpoint returns success but empty `data`

**Cause:**
- Current implementation uses stubbed responses (E76.1 baseline)
- Real database integration not yet implemented

**Expected Behavior:**
```json
{
  "success": true,
  "data": {
    "patient_id": "...",
    "demographics": {},      // Empty in stub
    "recent_assessments": [], // Empty in stub
    "active_diagnoses": [],   // Empty in stub
    "metadata": { "retrieved_at": "...", "context_version": "stub" }
  }
}
```

**Future:**
- E76.x will add real database connectivity
- Stub responses will be replaced with actual data

---

### Issue: Secrets Appearing in Logs

**Symptoms:**
- `LLM_API_KEY` visible in console output

**Cause:**
- Logger redaction not working
- Using `console.log` instead of structured logger

**Solution:**
```bash
# Verify logger.ts has redaction
grep -i redact packages/mcp-server/src/logger.ts

# Use logger, not console.log
import { logger } from './logger'
logger.info({ api_key: process.env.LLM_API_KEY })  // Will show [REDACTED]
```

---

### Issue: Version Mismatch

**Symptoms:**
- API returns old version metadata
- Build artifacts out of sync

**Solution:**
```bash
# Rebuild MCP server
cd packages/mcp-server
rm -rf dist/
npm run build

# Restart server
npm start

# Verify version
curl http://localhost:3001/health | jq '.version'
```

---

## Monitoring

### Health Checks

**Kubernetes/Docker:**
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3001
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /health
    port: 3001
  initialDelaySeconds: 5
  periodSeconds: 10
```

**Uptime Monitoring:**
```bash
# Simple uptime check
while true; do
  curl -s http://localhost:3001/health | jq '.uptime_seconds'
  sleep 60
done
```

---

### Metrics

**Future Enhancements:**
- Prometheus metrics endpoint (`/metrics`)
- Request duration histogram
- Tool execution success/failure counts
- Active connection count
- LLM API latency (when integrated)

---

## Performance

### Expected Latency

**Stub Responses (Current E76.1):**
- Health check: < 10ms
- Tool execution: < 50ms (no real LLM call)

**Real Responses (Future):**
- `get_patient_context`: 100-500ms (database query)
- `run_diagnosis`: 2-10s (LLM API call + processing)

### Rate Limiting

**Not Currently Implemented**

Recommended for production:
- Rate limit per user/IP
- Concurrent request limits
- Queue long-running diagnosis requests
- Circuit breaker for LLM API failures

---

## Security

### API Key Management

**Never commit secrets:**
```bash
# Add to .gitignore
.env
.env.local
*.key
```

**Rotate keys regularly:**
1. Generate new LLM API key
2. Update `LLM_API_KEY` environment variable
3. Restart server
4. Verify logs show `[REDACTED]`
5. Revoke old key

### Network Security

**Production Deployment:**
- Do NOT expose MCP server directly to internet
- Use API proxy in main application
- Require authentication at API gateway
- Use HTTPS for all external traffic
- Restrict server to localhost or internal network

**Firewall Rules:**
```bash
# Allow only from main app server
iptables -A INPUT -p tcp --dport 3001 -s 10.0.0.0/24 -j ACCEPT
iptables -A INPUT -p tcp --dport 3001 -j DROP
```

---

## Maintenance

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update to latest compatible versions
npm update

# Update to latest (including breaking changes)
npm install <package>@latest

# Rebuild and test
npm run build
npm test
```

### Version Upgrades

When upgrading version metadata:

1. Update `packages/mcp-server/src/version.ts`:
```typescript
export const VERSION_METADATA = {
  mcp_server_version: '0.2.0',  // Bump version
  run_version: `run_${Date.now()}_${generateShortHash()}`,
  prompt_version: 'v2',  // If prompt changed
  timestamp: new Date().toISOString(),
}
```

2. Update `packages/mcp-server/package.json`:
```json
{
  "version": "0.2.0"
}
```

3. Run verification:
```bash
npm run verify:e76-1
```

---

## Verification Script

**Script:** `scripts/ci/verify-e76-1-mcp-server.mjs`

**Runs:**
- Package structure validation
- Tool schema validation
- Version metadata checks
- Logging verification
- API route existence
- Literal callsite verification
- Feature flag verification

**Execute:**
```bash
npm run verify:e76-1
```

**Expected Output:**
```
✅ All E76.1 guardrails satisfied

Verified 8 rules:
  ✓ R-E76.1-001: MCP server package must exist
  ✓ R-E76.1-002: MCP tools must have Zod schemas
  ✓ R-E76.1-003: Version metadata must exist
  ✓ R-E76.1-004: Logging must include correlation ID
  ✓ R-E76.1-005: Secrets must not leak in logs
  ✓ R-E76.1-006: API route must exist
  ✓ R-E76.1-007: Literal callsite must exist
  ✓ R-E76.1-008: Feature flag must exist
```

---

## References

- **Package README:** `packages/mcp-server/README.md`
- **API Documentation:** See ARTIFACT_SCHEMA_V1.md
- **Security Model:** See SECURITY_MODEL.md
- **Troubleshooting:** See TROUBLESHOOTING.md
- **Rules Matrix:** `docs/guardrails/RULES_VS_CHECKS_MATRIX_E76_9.md`

---

**Runbook Version:** 1.0  
**Author:** GitHub Copilot  
**Epic:** E76.9 — Docs & Developer Runbook
