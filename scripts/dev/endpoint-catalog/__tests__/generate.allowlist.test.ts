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

  function snapshotOutputs(outDir: string) {
    return {
      json: fs.readFileSync(path.join(outDir, 'endpoint-catalog.json'), 'utf8'),
      mdCatalog: fs.readFileSync(path.join(outDir, 'ENDPOINT_CATALOG.md'), 'utf8'),
      mdOrphans: fs.readFileSync(path.join(outDir, 'ORPHAN_ENDPOINTS.md'), 'utf8'),
      mdUnknown: fs.readFileSync(path.join(outDir, 'UNKNOWN_CALLSITES.md'), 'utf8'),
    }
  }

  it('supports --allowlist with no value (defaults to outDir/endpoint-allowlist.json)', () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'endpoint-catalog-'))

    const args = ['--repo-root', fixtureRepoRoot, '--out-dir', outDir, '--allowlist']

    const res1 = runGenerator(args)
    expect(res1.status).toBe(0)

    expect(fs.existsSync(path.join(outDir, 'endpoint-allowlist.json'))).toBe(true)
    expect(fs.existsSync(path.join(outDir, 'endpoint-catalog.json'))).toBe(true)
    expect(fs.existsSync(path.join(outDir, 'ENDPOINT_CATALOG.md'))).toBe(true)

    const snap1 = snapshotOutputs(outDir)

    const res2 = runGenerator(args)
    expect(res2.status).toBe(0)

    const snap2 = snapshotOutputs(outDir)
    expect(snap2).toEqual(snap1)
  })

  it('supports --allowlist with explicit path', () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'endpoint-catalog-'))
    const allowlistPath = path.join(outDir, 'endpoint-allowlist.json')

    fs.writeFileSync(
      allowlistPath,
      `${JSON.stringify({ allowedOrphans: [], allowedIntents: [] }, null, 2)}\n`,
      'utf8',
    )

    const args = [
      '--repo-root',
      fixtureRepoRoot,
      '--out-dir',
      outDir,
      '--allowlist',
      allowlistPath,
    ]

    const res1 = runGenerator(args)
    expect(res1.status).toBe(0)
    expect(fs.existsSync(path.join(outDir, 'endpoint-catalog.json'))).toBe(true)
    expect(fs.existsSync(path.join(outDir, 'ENDPOINT_CATALOG.md'))).toBe(true)

    const snap1 = snapshotOutputs(outDir)

    const res2 = runGenerator(args)
    expect(res2.status).toBe(0)

    const snap2 = snapshotOutputs(outDir)
    expect(snap2).toEqual(snap1)
  })

  it('works without --allowlist flag (disabled)', () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'endpoint-catalog-'))

    const args = ['--repo-root', fixtureRepoRoot, '--out-dir', outDir]

    const res = runGenerator(args)
    expect(res.status).toBe(0)
    expect(res.stdout).toContain('Allowlist: disabled')

    // Allowlist file should not exist when disabled
    expect(fs.existsSync(path.join(outDir, 'endpoint-allowlist.json'))).toBe(false)
    expect(fs.existsSync(path.join(outDir, 'endpoint-catalog.json'))).toBe(true)
  })

  it('handles --allowlist at end of args (no next argument)', () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'endpoint-catalog-'))

    const args = [
      '--repo-root',
      fixtureRepoRoot,
      '--out-dir',
      outDir,
      '--no-fail-unknown',
      '--allowlist',
    ]

    const res = runGenerator(args)
    expect(res.status).toBe(0)
    expect(res.stdout).toContain('Allowlist: enabled')
    expect(fs.existsSync(path.join(outDir, 'endpoint-allowlist.json'))).toBe(true)
  })

  it('handles --allowlist followed by another flag', () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'endpoint-catalog-'))

    const args = [
      '--repo-root',
      fixtureRepoRoot,
      '--out-dir',
      outDir,
      '--allowlist',
      '--no-fail-orphan',
    ]

    const res = runGenerator(args)
    expect(res.status).toBe(0)
    expect(res.stdout).toContain('Allowlist: enabled')
    expect(fs.existsSync(path.join(outDir, 'endpoint-allowlist.json'))).toBe(true)
  })

  it('creates stub allowlist file when missing', () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'endpoint-catalog-'))
    const customAllowlist = path.join(outDir, 'custom-allowlist.json')

    const args = [
      '--repo-root',
      fixtureRepoRoot,
      '--out-dir',
      outDir,
      '--allowlist',
      customAllowlist,
    ]

    // File doesn't exist yet
    expect(fs.existsSync(customAllowlist)).toBe(false)

    const res = runGenerator(args)
    expect(res.status).toBe(0)

    // Stub file should be created
    expect(fs.existsSync(customAllowlist)).toBe(true)
    const content = JSON.parse(fs.readFileSync(customAllowlist, 'utf8'))
    expect(content).toEqual({ allowedOrphans: [], allowedIntents: [] })
  })
})
