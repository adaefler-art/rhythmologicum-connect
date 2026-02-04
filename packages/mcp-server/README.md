# MCP Server

MCP (Model Context Protocol) Server for Rhythmologicum Connect - provides AI-powered diagnostic and patient context tools.

## Overview

The MCP server is a standalone service that provides deterministic, schema-validated tools for:
- **Patient Context Retrieval** (`get_patient_context`): Fetches comprehensive patient data
- **Diagnostic Analysis** (`run_diagnosis`): Runs AI-powered diagnostic analysis

## Features

- **Health Endpoint**: `/health` - Server status and version info
- **Tool API**: `/tools` - POST endpoint for executing MCP tools
- **Zod Schemas**: Type-safe input/output validation
- **Versioning**: Tracks `mcp_server_version`, `run_version`, `prompt_version`
- **Logging**: Structured JSON logs with correlation IDs (`run_id`)
- **Secret Protection**: Automatic redaction of sensitive data in logs

## Installation

```bash
npm install
```

## Development

```bash
# Start dev server with auto-reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start
```

## Configuration

Environment variables:

```bash
# Server configuration
MCP_SERVER_PORT=3001          # Server port (default: 3001)
MCP_SERVER_HOST=0.0.0.0       # Server host (default: 0.0.0.0)
MCP_SERVER_URL=http://localhost:3001  # For API proxy

# LLM configuration
ANTHROPIC_API_KEY=your-key-here     # Preferred Anthropic key (redacted in logs)
ANTHROPIC_API_TOKEN=your-key-here   # Legacy fallback key
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929

# MCP behavior
FEATURE_MCP_STUB=false              # true -> deterministic stub responses for run_diagnosis
```

## API Endpoints

### Health Check

```bash
GET /health

Response:
{
  "status": "ok",
  "version": {
    "mcp_server_version": "0.1.0",
    "run_version": "run_1234567890_abc123",
    "prompt_version": "v1",
    "timestamp": "2026-02-02T12:00:00.000Z"
  },
  "uptime_seconds": 123.456
}
```

### Execute Tool

```bash
POST /tools
Content-Type: application/json

{
  "tool": "get_patient_context",
  "input": {
    "patient_id": "123e4567-e89b-12d3-a456-426614174000"
  },
  "run_id": "optional-correlation-id"
}

Response:
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

## Available Tools

### get_patient_context

Retrieves comprehensive patient context.

**Input Schema:**
```typescript
{
  patient_id: string (UUID)
}
```

**Output Schema:**
```typescript
{
  patient_id: string
  demographics: {
    age?: number
    gender?: string
  }
  recent_assessments: Array<{
    assessment_id: string
    funnel_slug: string
    completed_at: string
    status: string
  }>
  active_diagnoses: string[]
  metadata: {
    retrieved_at: string
    context_version: string
  }
}
```

### run_diagnosis

Executes diagnostic analysis for a patient.

**Input Schema:**
```typescript
{
  patient_id: string (UUID)
  options?: {
    assessment_id?: string
    include_history?: boolean
    max_history_depth?: number
  }
}
```

**Output Schema:**
```typescript
{
  run_id: string
  patient_id: string
  diagnosis_result: {
    primary_findings: string[]
    risk_level: 'low' | 'medium' | 'high' | 'critical'
    recommendations: string[]
    confidence_score: number
  }
  metadata: {
    run_version: string
    prompt_version: string
    executed_at: string
    processing_time_ms: number
  }
}
```

## Integration

The MCP server is integrated with the main Rhythmologicum Connect application via:

- **API Proxy**: `apps/rhythm-studio-ui/app/api/mcp/route.ts`
- **Feature Flag**: `NEXT_PUBLIC_FEATURE_MCP_ENABLED` (default: false)
- **Test Page**: `apps/rhythm-studio-ui/app/admin/diagnostics/mcp-test`

## Testing

Run verification script to ensure all components are working:

```bash
npm run verify:e76-1
```

This validates:
- Package structure
- Tool schemas
- Version metadata
- Logging with correlation IDs
- Secret redaction
- API route existence
- Feature flag presence

## Architecture

```
packages/mcp-server/
├── src/
│   ├── version.ts      # Version metadata
│   ├── logger.ts       # Structured logging with redaction
│   ├── tools.ts        # Zod schemas for MCP tools
│   ├── handlers.ts     # Tool execution logic (stubbed)
│   ├── server.ts       # HTTP server
│   └── index.ts        # Public API exports
├── package.json
└── tsconfig.json
```

## Current Status (E76.1)

✅ Server skeleton complete with stubbed responses
✅ Schema validation with Zod
✅ Version tracking
✅ Logging with correlation IDs
✅ Secret redaction
✅ Health endpoint
✅ Tool execution endpoint
🔜 Real LLM integration (future epic)
🔜 Database connectivity (future epic)
🔜 Production deployment config (future epic)

## License

Private - Rhythmologicum Connect
