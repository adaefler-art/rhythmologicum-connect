#!/usr/bin/env node

/**
 * Generate version.json for engine, patient, and studio surfaces.
 */

import { execSync } from 'child_process'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

const targets = [
  {
    app: 'rhythm-engine',
    outDir: join(ROOT, 'public'),
    version: 'v0.8',
  },
  {
    app: 'rhythm-patient-ui',
    outDir: join(ROOT, 'apps', 'rhythm-patient-ui', 'public'),
    version: 'v0.8',
  },
  {
    app: 'rhythm-studio-ui',
    outDir: join(ROOT, 'apps', 'rhythm-studio-ui', 'public'),
    version: 'v0.8',
  },
]

for (const target of targets) {
  const cmd = [
    'node',
    join(ROOT, 'scripts', 'generate-version.js'),
    '--out-dir',
    target.outDir,
    '--app',
    target.app,
    '--version',
    target.version,
  ]

  execSync(cmd.join(' '), { stdio: 'inherit' })
}
