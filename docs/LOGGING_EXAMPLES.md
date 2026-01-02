# Logging Output Examples

This document shows example output from the new logging functions implemented for monitoring hooks.

## Assessment Started Event

```json
{
  "timestamp": "2024-12-13T17:30:45.123Z",
  "level": "info",
  "message": "Assessment started",
  "context": {
    "userId": "user-123",
    "assessmentId": "assessment-abc",
    "endpoint": "/api/funnels/stress/assessments",
    "funnel": "stress",
    "type": "assessment_started"
  }
}
```

## Assessment Completed Event

```json
{
  "timestamp": "2024-12-13T17:45:23.456Z",
  "level": "info",
  "message": "Assessment completed",
  "context": {
    "userId": "user-123",
    "assessmentId": "assessment-abc",
    "endpoint": "/api/funnels/stress/assessments/abc/complete",
    "funnel": "stress",
    "type": "assessment_completed"
  }
}
```

## Clinician Flow Error

```json
{
  "timestamp": "2024-12-13T18:10:12.789Z",
  "level": "error",
  "message": "Clinician flow error",
  "context": {
    "userId": "clinician-456",
    "endpoint": "/api/admin/funnels",
    "area": "clinician"
  },
  "error": {
    "message": "Failed to fetch funnels",
    "stack": "Error: Failed to fetch funnels\n    at GET (/app/api/admin/funnels/route.ts:68:15)\n    ...",
    "name": "Error"
  }
}
```

## Patient Flow Error

```json
{
  "timestamp": "2024-12-13T18:25:34.012Z",
  "level": "error",
  "message": "Patient flow error",
  "context": {
    "userId": "patient-789",
    "endpoint": "/api/amy/stress-report",
    "assessmentId": "assessment-xyz",
    "duration": 5432,
    "area": "patient"
  },
  "error": {
    "message": "AMY API request failed",
    "stack": "Error: AMY API request failed\n    at createAmySummary (/app/api/amy/stress-report/route.ts:206:15)\n    ...",
    "name": "Error"
  }
}
```

## Benefits of Structured Logging

### Easy Parsing

All logs are valid JSON and can be parsed programmatically:

```javascript
const logEntry = JSON.parse(logLine)
console.log(`User ${logEntry.context.userId} completed assessment ${logEntry.context.assessmentId}`)
```

### Searchable Context

Each log includes rich context that can be used for filtering:

- Filter by `userId` to see all actions by a specific user
- Filter by `assessmentId` to trace an assessment lifecycle
- Filter by `endpoint` to see all requests to a specific API route
- Filter by `area` to separate clinician vs patient errors

### Monitoring Integration

The structured format makes it easy to send logs to monitoring services:

```typescript
// Future integration example
if (entry.level === 'error' && process.env.NODE_ENV === 'production') {
  Sentry.captureException(entry.error, {
    tags: {
      endpoint: entry.context.endpoint,
      area: entry.context.area,
    },
    user: {
      id: entry.context.userId,
    },
  })
}
```

### Time-Series Analysis

ISO 8601 timestamps enable time-based queries:

```sql
-- Example log aggregation query
SELECT
  DATE(timestamp) as date,
  COUNT(*) as assessment_count
FROM logs
WHERE message = 'Assessment started'
GROUP BY DATE(timestamp)
ORDER BY date DESC
```

## Console Output in Development

When running the application in development mode, you'll see structured logs in your terminal:

```
{"timestamp":"2024-12-13T17:30:45.123Z","level":"info","message":"Assessment started","context":{"userId":"user-123","assessmentId":"assessment-abc","endpoint":"/api/funnels/stress/assessments","funnel":"stress","type":"assessment_started"}}

{"timestamp":"2024-12-13T17:45:23.456Z","level":"info","message":"Assessment completed","context":{"userId":"user-123","assessmentId":"assessment-abc","endpoint":"/api/funnels/stress/assessments/abc/complete","funnel":"stress","type":"assessment_completed"}}
```

## Next Steps

To view and analyze these logs in production:

1. **Development**: View in terminal/console
2. **Staging/Production**:
   - Send to Sentry for error tracking
   - Send to LogRocket for session replay
   - Send to DataDog for APM and dashboards

See [MONITORING_INTEGRATION.md](./MONITORING_INTEGRATION.md) for detailed integration instructions.
