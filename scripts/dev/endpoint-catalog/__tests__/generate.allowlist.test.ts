/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path')
const os = require('os')
const fs = require('fs')
const { spawnSync } = require('child_process')

function findRepoRoot(startDir: string) {
  let current = startDir
  for (let i = 0; i < 20; i += 1) {
    if (fs.existsSync(path.join(current, 'package.json'))) return current
    const parent = path.dirname(current)
    if (parent === current) break
    current = parent
  }
  throw new Error(`Could not find repo root from: ${startDir}`)
}

function runGenerate(args: string[], cwd: string) {
  const result = spawnSync(process.execPath, args, {
    cwd,
    encoding: 'utf8',
  })

  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  }
}

describe('endpoint-catalog generate.js --allowlist parsing', () => {
  it('treats --allowlist (no value) as outDir/endpoint-allowlist.json', () => {
    const repoRoot = findRepoRoot(__dirname)
    const scriptPath = path.join(repoRoot, 'scripts', 'dev', 'endpoint-catalog', 'generate.js')

    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'endpoint-catalog-'))

    const res = runGenerate(
      [
        scriptPath,
        '--repo-root',
        '.',
        '--out-dir',
        outDir,
        '--allowlist',
        '--no-fail-unknown',
        '--no-fail-orphan',
      ],
      repoRoot,
    )

    expect(res.status).toBe(0)

    expect(fs.existsSync(path.join(outDir, 'endpoint-catalog.json'))).toBe(true)
    expect(fs.existsSync(path.join(outDir, 'endpoint-allowlist.json'))).toBe(true)
  })

  it('treats --allowlist <path> as an explicit allowlist path', () => {
    const repoRoot = findRepoRoot(__dirname)
    const scriptPath = path.join(repoRoot, 'scripts', 'dev', 'endpoint-catalog', 'generate.js')

    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'endpoint-catalog-'))
    const allowlistPath = path.join(outDir, 'my-allowlist.json')

    const res = runGenerate(
      [
        scriptPath,
        '--repo-root',
        '.',
        '--out-dir',
        outDir,
        '--allowlist',
        allowlistPath,
        '--no-fail-unknown',
        '--no-fail-orphan',
      ],
      repoRoot,
    )

    expect(res.status).toBe(0)

    expect(fs.existsSync(path.join(outDir, 'endpoint-catalog.json'))).toBe(true)
    expect(fs.existsSync(allowlistPath)).toBe(true)
  })
})
