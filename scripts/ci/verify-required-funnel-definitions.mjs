#!/usr/bin/env node
/**
 * Guardrail: Required funnel definitions must be seeded via migrations.
 *
 * This check prevents missing slugs (e.g. sleep-quality) from reaching prod.
 */

import { readdirSync, readFileSync } from 'fs'
import { resolve, join } from 'path'

const REQUIRED_FUNNEL_SLUGS = [
  'stress-assessment',
  'cardiovascular-age',
  'sleep-quality',
]

const migrationsDir = resolve(process.cwd(), 'supabase', 'migrations')
const migrationFiles = readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .map((file) => join(migrationsDir, file))

const catalogInsertRegex = /INSERT INTO\s+public\.funnels_catalog/i
const versionInsertRegex = /INSERT INTO\s+public\.funnel_versions|INSERT INTO\s+funnel_versions/i

const slugPresence = new Map()
const versionPresence = new Map()

for (const slug of REQUIRED_FUNNEL_SLUGS) {
  slugPresence.set(slug, false)
  versionPresence.set(slug, false)
}

for (const filePath of migrationFiles) {
  const content = readFileSync(filePath, 'utf8')

  for (const slug of REQUIRED_FUNNEL_SLUGS) {
    const slugRegex = new RegExp(`['\"]${slug}['\"]`, 'i')

    if (!slugRegex.test(content)) {
      continue
    }

    if (catalogInsertRegex.test(content)) {
      slugPresence.set(slug, true)
    }

    if (versionInsertRegex.test(content)) {
      versionPresence.set(slug, true)
    }
  }
}

const missingCatalog = REQUIRED_FUNNEL_SLUGS.filter((slug) => !slugPresence.get(slug))
const missingVersions = REQUIRED_FUNNEL_SLUGS.filter((slug) => !versionPresence.get(slug))

if (missingCatalog.length === 0 && missingVersions.length === 0) {
  console.log('✅ Required funnel definitions are seeded by migrations.')
  process.exit(0)
}

console.error('❌ Required funnel definition guardrail failed.')

if (missingCatalog.length > 0) {
  console.error('Missing funnels_catalog seed(s):')
  missingCatalog.forEach((slug) => console.error(`  - ${slug}`))
}

if (missingVersions.length > 0) {
  console.error('Missing funnel_versions seed(s):')
  missingVersions.forEach((slug) => console.error(`  - ${slug}`))
}

console.error('Fix: add or update migrations to seed required funnel definitions.')
process.exit(1)
