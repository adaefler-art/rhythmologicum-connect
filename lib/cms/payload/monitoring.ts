import 'server-only'

import { getStatusCodeBucket, recordUsage } from '@/lib/monitoring/usageTracker'

export type CmsPayloadMonitoringEvent = {
  routeKey: string
  statusCode: number
  phase: 'auth' | 'sync' | 'webhook' | 'preview'
  errorCode?: string
}

export async function observeCmsPayloadEvent(event: CmsPayloadMonitoringEvent): Promise<void> {
  const statusCodeBucket = getStatusCodeBucket(event.statusCode)

  await recordUsage({
    routeKey: event.routeKey,
    statusCodeBucket,
  })

  if (statusCodeBucket === '5xx') {
    console.error('[cms/payload][alert] route failure', {
      routeKey: event.routeKey,
      phase: event.phase,
      statusCode: event.statusCode,
      errorCode: event.errorCode,
    })
  }
}
