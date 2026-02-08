const DEFAULT_ATTEMPTS = 12
const DEFAULT_WAIT_MS = 5000

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

function parseNumber(value, fallback) {
  if (!value) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function getSetCookieHeaders(response) {
  if (typeof response.headers.getSetCookie === 'function') {
    return response.headers.getSetCookie()
  }
  const single = response.headers.get('set-cookie')
  return single ? [single] : []
}

function buildCookieHeader(setCookieHeaders) {
  const pairs = setCookieHeaders
    .map((header) => header.split(';')[0])
    .filter(Boolean)

  return pairs.join('; ')
}

function readRequestId(response) {
  return (
    response.headers.get('x-request-id') ||
    response.headers.get('x-correlation-id') ||
    response.headers.get('x-requestid') ||
    null
  )
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  const studioBaseUrl = requireEnv('STUDIO_BASE_URL')
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const supabaseAnonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  const email = requireEnv('DIAGNOSIS_SMOKE_EMAIL')
  const password = requireEnv('DIAGNOSIS_SMOKE_PASSWORD')
  const patientId = requireEnv('DIAGNOSIS_SMOKE_PATIENT_ID')

  const maxAttempts = parseNumber(process.env.DIAGNOSIS_SMOKE_MAX_ATTEMPTS, DEFAULT_ATTEMPTS)
  const waitMs = parseNumber(process.env.DIAGNOSIS_SMOKE_WAIT_MS, DEFAULT_WAIT_MS)

  const tokenResponse = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    },
  )

  const tokenPayload = await tokenResponse.json().catch(() => null)

  if (!tokenResponse.ok || !tokenPayload?.access_token) {
    const message = tokenPayload?.error_description || tokenPayload?.error || 'no access token'
    throw new Error(`Diagnosis smoke login failed: ${message}`)
  }

  const expiresAt = Math.floor(Date.now() / 1000) + (tokenPayload.expires_in || 3600)
  const session = {
    access_token: tokenPayload.access_token,
    refresh_token: tokenPayload.refresh_token,
    token_type: tokenPayload.token_type || 'bearer',
    expires_in: tokenPayload.expires_in,
    expires_at: expiresAt,
    user: tokenPayload.user,
  }

  const callbackResponse = await fetch(`${studioBaseUrl}/api/auth/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: 'SIGNED_IN', session }),
  })

  if (!callbackResponse.ok) {
    throw new Error(`Auth callback failed with status ${callbackResponse.status}`)
  }

  const cookieHeader = buildCookieHeader(getSetCookieHeaders(callbackResponse))
  if (!cookieHeader) {
    throw new Error('Auth callback did not return session cookies')
  }

  const queueResponse = await fetch(`${studioBaseUrl}/api/studio/diagnosis/queue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ patient_id: patientId }),
  })

  const queueRequestId = readRequestId(queueResponse)
  const queuePayload = await queueResponse.json().catch(() => null)

  if (!queueResponse.ok || !queuePayload?.success) {
    const message = queuePayload?.error?.message || 'Unknown error while queuing diagnosis'
    throw new Error(
      `Queue failed (${queueResponse.status}). requestId=${queueRequestId || 'n/a'} message=${message}`,
    )
  }

  const runId = queuePayload?.data?.run_id || queuePayload?.data?.runId
  if (!runId) {
    throw new Error('Queue response missing run_id')
  }

  const detailUrl = `${studioBaseUrl}/api/studio/diagnosis/runs/${runId}`

  let lastStatus = null
  let lastErrorCode = null
  let lastRequestId = null
  let traceId = null

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const detailResponse = await fetch(detailUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Cookie: cookieHeader,
      },
    })

    lastRequestId = readRequestId(detailResponse)
    const detailPayload = await detailResponse.json().catch(() => null)

    if (!detailResponse.ok || !detailPayload?.success) {
      const message = detailPayload?.error?.message || 'Unknown error while fetching detail'
      lastErrorCode = detailPayload?.error?.code || null
      throw new Error(
        `Detail failed (${detailResponse.status}). requestId=${lastRequestId || 'n/a'} code=${
          lastErrorCode || 'n/a'
        } message=${message}`,
      )
    }

    const run = detailPayload?.data?.run || null
    const result = detailPayload?.data?.result || null
    const artifact = detailPayload?.data?.artifact || null

    lastStatus = run?.status || null
    lastErrorCode = run?.error_code || null
    traceId =
      artifact?.artifact_data?.metadata?.trace_id ||
      artifact?.artifact_data?.metadata?.traceId ||
      null

    const hasResult = Boolean(result || artifact)

    if (lastStatus === 'completed' && hasResult) {
      console.log('Diagnosis smoke succeeded', {
        run_id: runId,
        status: lastStatus,
        requestId: lastRequestId,
        trace_id: traceId,
      })
      return
    }

    if (lastStatus === 'failed') {
      throw new Error(
        `Diagnosis run failed. run_id=${runId} requestId=${lastRequestId || 'n/a'} ` +
          `trace_id=${traceId || 'n/a'} error_code=${lastErrorCode || 'n/a'}`,
      )
    }

    if (attempt < maxAttempts) {
      await sleep(waitMs)
    }
  }

  throw new Error(
    `Diagnosis smoke timeout. run_id=${runId} status=${lastStatus || 'n/a'} requestId=${
      lastRequestId || 'n/a'
    } trace_id=${traceId || 'n/a'} error_code=${lastErrorCode || 'n/a'}`,
  )
}

main().catch((error) => {
  console.error('Diagnosis smoke failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
