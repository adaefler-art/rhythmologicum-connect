# Monitoring Integration Guide

This document provides guidance for integrating production monitoring and error tracking services like Sentry, DataDog, or LogRocket into Rhythmologicum Connect.

## Overview

The application currently uses structured console logging for all events and errors. This document outlines the integration points for future production monitoring services.

## Current Logging Infrastructure

### Server-Side Logging
- **Location**: `lib/logging/logger.ts`
- **Output**: Structured JSON to console (stdout/stderr)
- **Key Events**:
  - Authentication events (login, unauthorized, forbidden)
  - Assessment lifecycle (start, complete, errors)
  - Database errors
  - API request/response metrics
  - Validation failures

### Client-Side Logging
- **Location**: `lib/logging/clientLogger.ts`
- **Output**: Structured JSON to browser console
- **Key Events**:
  - Assessment lifecycle (start, resume, complete)
  - Navigation events
  - User interactions (button clicks, form submissions)
  - UI errors
  - Loading states

### API Performance Monitoring
- **Location**: `lib/monitoring/apiWrapper.ts`
- **Wrapper Function**: `withMonitoring(handler, endpointName)`
- **Metrics Collected**:
  - Response time
  - Status codes
  - Success/failure rates
  - Error codes

## Integration Points for Monitoring Services

### 1. Server-Side Error Tracking (Sentry/Rollbar/Bugsnag)

#### Integration Location
Add monitoring initialization in `lib/logging/logger.ts`:

```typescript
// TODO: Initialize Sentry or similar service
// import * as Sentry from '@sentry/nextjs'
// 
// if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
//   Sentry.init({
//     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
//     environment: process.env.NODE_ENV,
//     tracesSampleRate: 1.0,
//   })
// }
```

#### Key Functions to Modify

**`logError()` function** - Send errors to monitoring service:
```typescript
export function logError(message: string, context?: LogContext, error?: unknown): void {
  log(LogLevel.ERROR, message, context, error)
  
  // TODO: Send to Sentry
  // if (process.env.NODE_ENV === 'production' && error) {
  //   Sentry.captureException(error, {
  //     tags: {
  //       endpoint: context?.endpoint,
  //       userId: context?.userId,
  //     },
  //     contexts: {
  //       custom: context,
  //     },
  //   })
  // }
}
```

**`logAssessmentError()` function** - Track assessment-specific errors:
```typescript
export function logAssessmentError(context: LogContext, error: unknown): void {
  logError('Assessment error', context, error)
  
  // TODO: Add custom tracking for assessment errors
  // Sentry.captureException(error, {
  //   fingerprint: ['assessment-error', context.assessmentId || 'unknown'],
  //   tags: {
  //     assessmentId: context.assessmentId,
  //     funnel: context.funnel,
  //   },
  // })
}
```

### 2. Client-Side Session Recording (LogRocket/FullStory/Hotjar)

#### Integration Location
Add initialization in `lib/logging/clientLogger.ts`:

```typescript
// TODO: Initialize LogRocket or similar service
// import LogRocket from 'logrocket'
//
// if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_LOGROCKET_ID) {
//   LogRocket.init(process.env.NEXT_PUBLIC_LOGROCKET_ID)
// }
```

#### Key Functions to Modify

**`logClientEvent()` function** - Send events to analytics:
```typescript
export function logClientEvent(
  eventType: ClientEventType,
  context: ClientEventContext,
  message?: string
): void {
  const entry: ClientLogEntry = {
    timestamp: new Date().toISOString(),
    eventType,
    context: {
      ...context,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      screenSize: typeof window !== 'undefined' 
        ? `${window.innerWidth}x${window.innerHeight}` 
        : 'unknown',
    },
    message,
  }

  // Output to console with structured formatting
  const logOutput = JSON.stringify(entry, null, 2)
  console.log(`[CLIENT EVENT] ${eventType}`, logOutput)

  // TODO: Send to monitoring service in production
  // if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  //   LogRocket.track(eventType, entry.context)
  // }
}
```

### 3. API Performance Monitoring (DataDog/New Relic/Prometheus)

#### Integration Location
Add metrics collection in `lib/monitoring/apiWrapper.ts`:

```typescript
/**
 * Placeholder for future metrics collection service
 */
async function sendMetrics(metrics: ApiMetrics): Promise<void> {
  // TODO: Implement actual metrics collection when ready.
  // Example with DataDog:
  // 
  // import { StatsD } from 'node-dogstatsd'
  // const statsd = new StatsD()
  //
  // statsd.increment('api.request', 1, [`endpoint:${metrics.endpoint}`])
  // statsd.histogram('api.response_time', metrics.responseTime, [`endpoint:${metrics.endpoint}`])
  // if (!metrics.success) {
  //   statsd.increment('api.error', 1, [
  //     `endpoint:${metrics.endpoint}`,
  //     `error_code:${metrics.errorCode}`,
  //   ])
  // }
}
```

### 4. User Session Identification

When a user is authenticated, identify them in monitoring services:

**Add to authentication callback** (`app/api/auth/callback/route.ts` or similar):
```typescript
// After successful authentication
const user = await supabase.auth.getUser()

// TODO: Identify user in monitoring services
// if (user.data.user) {
//   // Server-side (Sentry)
//   Sentry.setUser({
//     id: user.data.user.id,
//     email: user.data.user.email,
//   })
//   
//   // Client-side (LogRocket)
//   LogRocket.identify(user.data.user.id, {
//     email: user.data.user.email,
//     role: user.data.user.app_metadata?.role,
//   })
// }
```

## Environment Variables

Add these environment variables for production monitoring:

```bash
# Server-side error tracking (Sentry)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx

# Client-side session recording (LogRocket)
NEXT_PUBLIC_LOGROCKET_ID=xxx/rhythmologicum-connect

# API monitoring (DataDog)
DD_API_KEY=xxx
DD_SITE=datadoghq.eu

# Feature flags
ENABLE_MONITORING=true
```

## Recommended Services

### Error Tracking & Monitoring
1. **Sentry** (Recommended)
   - Excellent Next.js integration
   - Source map support
   - Performance monitoring
   - Session replay
   - Cost: Free tier available, paid plans from $26/month

2. **Rollbar**
   - Good error grouping
   - Real-time alerts
   - Cost: Free tier available, paid plans from $12.50/month

### Session Recording
1. **LogRocket** (Recommended for healthcare)
   - Session replay with privacy controls
   - Performance monitoring
   - Redux/state logging
   - HIPAA compliance available
   - Cost: Paid plans from $99/month

2. **FullStory**
   - Powerful search and segmentation
   - Frustration signals
   - Cost: Custom pricing

### APM (Application Performance Monitoring)
1. **DataDog**
   - Comprehensive monitoring
   - Log aggregation
   - APM traces
   - Cost: Custom pricing

2. **New Relic**
   - Full-stack observability
   - AI-powered insights
   - Cost: Free tier available

## Privacy & GDPR Considerations

### PHI/Personal Data
⚠️ **IMPORTANT**: Never log or send to monitoring services:
- Full names
- Email addresses (use hashed IDs instead)
- Assessment answers
- Health information
- Authentication tokens
- Passwords

### Data Minimization
- Use user IDs instead of email addresses
- Redact sensitive fields in error contexts
- Configure monitoring services to respect privacy:
  - Enable IP anonymization
  - Disable session recording on sensitive pages
  - Set appropriate data retention policies

### Example: Sanitizing Context
```typescript
function sanitizeContext(context: LogContext): LogContext {
  const sanitized = { ...context }
  
  // Remove sensitive fields
  delete sanitized.email
  delete sanitized.fullName
  delete sanitized.answerValue
  
  return sanitized
}
```

## Implementation Checklist

### Phase 1: Basic Error Tracking
- [ ] Choose and set up Sentry account
- [ ] Add Sentry SDK to dependencies
- [ ] Configure Sentry in `next.config.ts`
- [ ] Initialize Sentry in server-side logger
- [ ] Test error capture in development
- [ ] Set up source maps for production
- [ ] Configure error alerts

### Phase 2: Client-Side Monitoring
- [ ] Choose session recording service (LogRocket)
- [ ] Add SDK to dependencies
- [ ] Initialize in client logger
- [ ] Configure privacy settings
- [ ] Test in development
- [ ] Set up user identification
- [ ] Configure session replay filters

### Phase 3: Performance Monitoring
- [ ] Choose APM service (DataDog/New Relic)
- [ ] Set up account and API keys
- [ ] Install monitoring agent
- [ ] Configure metrics collection
- [ ] Set up dashboards
- [ ] Configure performance alerts

### Phase 4: Production Deployment
- [ ] Add environment variables to production
- [ ] Enable monitoring in production only
- [ ] Test all monitoring integrations
- [ ] Document runbooks for common alerts
- [ ] Set up team notifications
- [ ] Review and adjust alert thresholds

## Testing Monitoring Integration

### Test Error Capture
```typescript
// Add to a test route: /api/test-monitoring
export async function GET() {
  logError('Test error', { endpoint: '/api/test-monitoring' }, new Error('Test error'))
  return NextResponse.json({ message: 'Check monitoring service for error' })
}
```

### Test Client Event
```typescript
// Add to a test page
useEffect(() => {
  logClientEvent(
    ClientEventType.PAGE_VIEW,
    { currentPath: '/test-monitoring' },
    'Test page view'
  )
}, [])
```

## Monitoring Best Practices

1. **Start Simple**: Begin with error tracking, then add performance monitoring
2. **Set Budgets**: Configure alerts for error rates, not individual errors
3. **Use Tags**: Tag errors by area (patient, clinician, assessment)
4. **Review Regularly**: Schedule weekly monitoring reviews
5. **Document Runbooks**: Create response procedures for common alerts
6. **Test in Staging**: Always test monitoring in staging environment first

## Support & Resources

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [LogRocket React Integration](https://docs.logrocket.com/docs/react)
- [DataDog Node.js APM](https://docs.datadoghq.com/tracing/setup_overview/setup/nodejs/)
- Internal: [Logging Patterns](./LOGGING_PATTERNS.md)

## Questions & Feedback

For questions about monitoring integration, contact the development team or create an issue in the repository.

---

**Last Updated**: December 2024  
**Owner**: Engineering Team  
**Status**: Ready for Implementation
