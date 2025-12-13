# Logging Patterns

This document outlines the logging patterns used in Rhythmologicum Connect as part of the V0.4-E6 Technical Cleanup & Stability Layer.

## Overview

The application uses structured logging on both server-side and client-side to track events, errors, and user behavior. This helps with debugging, monitoring, and improving the user experience.

## Server-Side Logging

Located in `lib/logging/logger.ts`

### Usage

```typescript
import { logInfo, logWarn, logError, logUnauthorized } from '@/lib/logging/logger'

// Info logging
logInfo('User logged in', { userId: '123', type: 'auth' })

// Warning logging
logWarn('Rate limit approaching', { userId: '123', requests: 95 })

// Error logging
logError('Database connection failed', { endpoint: '/api/users' }, error)

// Specialized logging
logUnauthorized({ endpoint: '/api/admin/users', userId: '123' })
```

### Output Format

All logs are output as structured JSON:

```json
{
  "timestamp": "2025-12-13T15:30:00.000Z",
  "level": "info",
  "message": "User logged in",
  "context": {
    "userId": "123",
    "type": "auth"
  }
}
```

### Specialized Functions

- `logUnauthorized(context)` - Log unauthorized access attempts
- `logForbidden(context, reason)` - Log forbidden access with reason
- `logStepSkipping(context, attemptedStepId)` - Log step-skipping attempts
- `logValidationFailure(context, missingQuestions)` - Log validation failures
- `logDatabaseError(context, error)` - Log database errors
- `logApiRequest(endpoint, method, context)` - Log API requests

## Client-Side Logging

Located in `lib/logging/clientLogger.ts`

### Usage

```typescript
import {
  logAssessmentStarted,
  logAssessmentCompleted,
  logStepNavigated,
  logErrorDisplayed
} from '@/lib/logging/clientLogger'

// Assessment lifecycle
logAssessmentStarted(assessmentId, funnelSlug)
logAssessmentResumed(assessmentId, funnelSlug, answeredCount)
logAssessmentCompleted(assessmentId, funnelSlug)

// Navigation
logStepNavigated(assessmentId, stepId, 'next')

// Validation
logValidationError(assessmentId, stepId, missingCount)

// Errors
logErrorDisplayed(errorMessage, 'funnel_client', { funnelSlug: slug })
```

### Event Types

Available event types in `ClientEventType` enum:

- `ASSESSMENT_STARTED` - Assessment started
- `ASSESSMENT_RESUMED` - Assessment resumed with existing answers
- `ASSESSMENT_COMPLETED` - Assessment completed
- `STEP_NAVIGATED` - User navigated between steps
- `STEP_VALIDATED` - Step validation performed
- `ANSWER_SAVED` - Answer saved to database
- `ANSWER_CHANGED` - Answer changed by user
- `PAGE_VIEW` - Page viewed
- `ERROR_DISPLAYED` - Error displayed to user
- `LOADING_STARTED` - Loading state started
- `LOADING_COMPLETED` - Loading state completed
- `BUTTON_CLICKED` - Button clicked
- `LINK_CLICKED` - Link clicked
- `FORM_SUBMITTED` - Form submitted
- `CONTENT_PAGE_VIEWED` - Content page viewed
- `DATA_EXPORTED` - Data exported

### Output Format

Client events are output as structured JSON to the console:

```json
{
  "timestamp": "2025-12-13T15:30:00.000Z",
  "eventType": "assessment_started",
  "context": {
    "assessmentId": "abc-123",
    "funnelSlug": "stress",
    "userAgent": "Mozilla/5.0...",
    "screenSize": "1920x1080"
  },
  "message": "Assessment started: stress"
}
```

## API Monitoring

Located in `lib/monitoring/apiWrapper.ts`

### Usage

Wrap API route handlers with monitoring:

```typescript
import { withMonitoring } from '@/lib/monitoring/apiWrapper'

export const GET = withMonitoring(
  async (request, context) => {
    // Your handler code
    return NextResponse.json({ data: '...' })
  },
  'GET /api/funnels/[slug]/assessments'
)
```

### Metrics Collected

- Endpoint name
- HTTP method
- Response time (milliseconds)
- Status code
- Success/failure
- Error code (if applicable)
- Timestamp

## When to Log

### Always Log

- User authentication events (login, logout, unauthorized access)
- Assessment lifecycle events (start, resume, complete)
- API errors and database errors
- Security events (forbidden access, step-skipping attempts)
- Data export events

### Consider Logging

- Navigation between major sections
- Form submissions
- Validation failures
- User action patterns (for UX analysis)

### Don't Log

- Sensitive user data (passwords, tokens, personal health information)
- Every keystroke or minor UI interaction
- Redundant information already captured elsewhere

## Future Enhancements

### Production Monitoring

In production, logs should be sent to a monitoring service:

- **Server-side**: CloudWatch, DataDog, or custom logging service
- **Client-side**: LogRocket, Sentry, PostHog, or custom analytics

### Placeholder Functions

Both `logger.ts` and `clientLogger.ts` include placeholder functions (`sendMetrics`, `sendToMonitoringService`) for future integration.

### Example Integration

```typescript
// In clientLogger.ts
async function sendToMonitoringService(entry: ClientLogEntry): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    await fetch('https://analytics.example.com/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    })
  }
}
```

## Best Practices

1. **Use structured logging** - Always include context with your logs
2. **Be consistent** - Use the provided helper functions
3. **Don't log secrets** - Never log passwords, tokens, or PHI
4. **Log at appropriate levels** - Info for normal operations, warn for issues, error for failures
5. **Include context** - userId, assessmentId, endpoint, etc.
6. **Keep messages concise** - Use context for details
7. **Test your logs** - Verify logs output correctly in development

## Examples

### Server-Side API Route

```typescript
import { logInfo, logError, logUnauthorized } from '@/lib/logging/logger'

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request)
    
    if (!user) {
      logUnauthorized({ endpoint: '/api/data' })
      return unauthorizedResponse()
    }
    
    logInfo('Data fetched', { userId: user.id, endpoint: '/api/data' })
    return successResponse(data)
  } catch (error) {
    logError('Failed to fetch data', { endpoint: '/api/data' }, error)
    return internalErrorResponse()
  }
}
```

### Client-Side Component

```typescript
import { logAssessmentStarted, logErrorDisplayed } from '@/lib/logging/clientLogger'

export default function AssessmentClient() {
  useEffect(() => {
    const startAssessment = async () => {
      try {
        const response = await fetch('/api/assessments')
        const { data } = await response.json()
        
        // Log successful start
        logAssessmentStarted(data.assessmentId, data.funnelSlug)
      } catch (error) {
        // Log error
        logErrorDisplayed(
          error instanceof Error ? error.message : 'Unknown error',
          'assessment_start'
        )
      }
    }
    
    startAssessment()
  }, [])
}
```

## Debugging

To view logs in development:

1. **Server logs**: Check the Next.js dev server console
2. **Client logs**: Open browser DevTools console
3. **Search for structured logs**: Filter by `[CLIENT EVENT]` or log level

## Contributing

When adding new features:

1. Add appropriate logging at key points
2. Use existing log functions where possible
3. Create new specialized functions if needed
4. Update this documentation
5. Test logs in development
