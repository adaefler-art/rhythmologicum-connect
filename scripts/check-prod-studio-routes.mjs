#!/usr/bin/env node

const BASE_URL = 'https://rhythm-studio.vercel.app'

const fetchText = async (url) => {
  const response = await fetch(url, { redirect: 'follow' })
  const text = await response.text().catch(() => '')
  return { response, text }
}

const assertBuildStamp = (html) => {
  const regex = /<meta[^>]+name=["']x-studio-app-root["'][^>]+content=["']apps\/rhythm-studio-ui["'][^>]*>/i
  return regex.test(html)
}

const run = async () => {
  const home = await fetchText(`${BASE_URL}/`)

  if (!home.response.ok) {
    console.error(`❌ GET / failed with status ${home.response.status}`)
    process.exit(1)
  }

  if (!assertBuildStamp(home.text)) {
    console.error('❌ Missing build stamp meta for x-studio-app-root in HTML.')
    console.error('Prod is not serving the Studio Next app routes; likely wrong artifact or /api rewrite.')
    process.exit(1)
  }

  const ping = await fetchText(`${BASE_URL}/api/_meta/ping`)

  if (ping.response.status === 404 || ping.response.status !== 200) {
    console.error(`❌ GET /api/_meta/ping returned ${ping.response.status}`)
    console.error('Prod is not serving the Studio Next app routes; likely wrong artifact or /api rewrite.')
    process.exit(1)
  }

  console.log('✅ Studio prod route guardrail passed.')
}

run().catch((error) => {
  console.error('❌ Guardrail failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
