import { fetch } from 'undici'

const url = process.env.META_SCHEMA_URL

if (!url) {
  console.log('[meta-schema] META_SCHEMA_URL not set, skipping')
  process.exit(0)
}

const response = await fetch(url, {
  headers: {
    Accept: 'application/json',
  },
})

const contentType = response.headers.get('content-type') || ''
const bodyText = await response.text()

if (!response.ok) {
  console.error(`[meta-schema] Expected 200, got ${response.status}`)
  console.error(bodyText.slice(0, 500))
  process.exit(1)
}

if (!contentType.includes('application/json')) {
  console.error(`[meta-schema] Expected JSON, got ${contentType || 'unknown'}`)
  console.error(bodyText.slice(0, 500))
  process.exit(1)
}

let payload
try {
  payload = JSON.parse(bodyText)
} catch (error) {
  console.error('[meta-schema] Response is not valid JSON')
  console.error(bodyText.slice(0, 500))
  process.exit(1)
}

if (typeof payload !== 'object' || payload === null || !('ready' in payload)) {
  console.error('[meta-schema] Missing expected "ready" field')
  console.error(JSON.stringify(payload).slice(0, 500))
  process.exit(1)
}

console.log('[meta-schema] OK')
