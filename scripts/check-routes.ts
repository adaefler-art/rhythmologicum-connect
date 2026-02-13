import fs from 'fs'
import path from 'path'

const expectedRoute = '/api/admin/safety-rules/[ruleId]'

const candidateManifestPaths = [
  path.join(process.cwd(), '.next/server/app-path-routes-manifest.json'),
  path.join(process.cwd(), '.next/app-path-routes-manifest.json'),
  path.join(process.cwd(), 'apps/rhythm-studio-ui/.next/server/app-path-routes-manifest.json'),
  path.join(process.cwd(), 'apps/rhythm-studio-ui/.next/app-path-routes-manifest.json'),
]

const existingManifestPath = candidateManifestPaths.find((manifestPath) => fs.existsSync(manifestPath))

if (!existingManifestPath) {
  console.error('[check-routes] Studio app-path-routes-manifest.json not found in expected locations.')
  process.exit(1)
}

let manifest: Record<string, string>

try {
  const raw = fs.readFileSync(existingManifestPath, 'utf8')
  manifest = JSON.parse(raw) as Record<string, string>
} catch (error) {
  console.error('[check-routes] Failed to read/parse manifest:', existingManifestPath)
  console.error(error)
  process.exit(1)
}

const hasExpectedRoute = Object.values(manifest).includes(expectedRoute)

if (!hasExpectedRoute) {
  console.error(
    `[check-routes] Missing expected route ${expectedRoute} in ${existingManifestPath}. Build is not safe to deploy.`,
  )
  process.exit(1)
}

console.log(`[check-routes] OK: found ${expectedRoute} in ${existingManifestPath}`)
