import fs from 'fs'
import os from 'os'
import path from 'path'
import { spawnSync } from 'child_process'

function runGenerator(args: string[]) {
  const scriptPath = path.join(__dirname, '..', 'generate.js')
  const res = spawnSync(process.execPath, [scriptPath, ...args], {
    encoding: 'utf8',
  })

  return {
    status: res.status,
    stdout: res.stdout ?? '',
    stderr: res.stderr ?? '',
  }
}

describe('endpoint-catalog generator allowlist flag', () => {
  const fixtureRepoRoot = path.join(__dirname, 'fixtures', 'simple-repo')

  it('supports --allowlist with no value (defaults to outDir/endpoint-allowlist.json)', () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'endpoint-catalog-'))

    const res = runGenerator(['--repo-root', fixtureRepoRoot, '--out-dir', outDir, '--allowlist'])
    expect(res.status).toBe(0)

    expect(fs.existsSync(path.join(outDir, 'endpoint-catalog.json'))).toBe(true)
    expect(fs.existsSync(path.join(outDir, 'ENDPOINT_CATALOG.md'))).toBe(true)
  })

  it('supports --allowlist with explicit path', () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'endpoint-catalog-'))
    const allowlistPath = path.join(outDir, 'endpoint-allowlist.json')

    fs.writeFileSync(
      allowlistPath,
      `${JSON.stringify({ allowedOrphans: [], allowedIntents: [] }, null, 2)}\n`,
      'utf8',
    )

    const res = runGenerator([
      '--repo-root',
      fixtureRepoRoot,
      '--out-dir',
      outDir,
      '--allowlist',
      allowlistPath,
    ])

    expect(res.status).toBe(0)
    expect(fs.existsSync(path.join(outDir, 'endpoint-catalog.json'))).toBe(true)
    expect(fs.existsSync(path.join(outDir, 'ENDPOINT_CATALOG.md'))).toBe(true)
  })
})
