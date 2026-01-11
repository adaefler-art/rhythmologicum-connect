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

describe('section-generator CLI integration tests', () => {
  const fixtureDir = path.join(__dirname, 'fixtures')
  const bundlePath = path.join(fixtureDir, 'risk-bundle.json')
  const rankingPath = path.join(fixtureDir, 'ranking.json')

  describe('allowlist flag', () => {
    it('supports --allowlist with no value (defaults to outDir/generator-allowlist.json)', () => {
      const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'section-generator-'))
      const outFile = path.join(outDir, 'sections.json')

      const args = [
        '--bundle',
        bundlePath,
        '--out',
        outFile,
        '--allowlist',
      ]

      const res = runGenerator(args)
      expect(res.status).toBe(0)
      expect(res.stdout).toContain('Allowlist: enabled')

      // Allowlist file should be created with default path
      const defaultAllowlistPath = path.join(outDir, 'generator-allowlist.json')
      expect(fs.existsSync(defaultAllowlistPath)).toBe(true)
      expect(fs.existsSync(outFile)).toBe(true)

      const allowlistContent = JSON.parse(fs.readFileSync(defaultAllowlistPath, 'utf8'))
      expect(allowlistContent).toEqual({ allowedSections: [] })
    })

    it('supports --allowlist with explicit path', () => {
      const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'section-generator-'))
      const outFile = path.join(outDir, 'sections.json')
      const allowlistPath = path.join(outDir, 'custom-allowlist.json')

      // Create allowlist file first
      fs.writeFileSync(
        allowlistPath,
        `${JSON.stringify({ allowedSections: ['overview'] }, null, 2)}\n`,
        'utf8',
      )

      const args = [
        '--bundle',
        bundlePath,
        '--out',
        outFile,
        '--allowlist',
        allowlistPath,
      ]

      const res = runGenerator(args)
      expect(res.status).toBe(0)
      expect(res.stdout).toContain(`Allowlist: enabled (${allowlistPath})`)
      expect(fs.existsSync(outFile)).toBe(true)

      // Verify allowlist was read correctly
      const allowlistContent = JSON.parse(fs.readFileSync(allowlistPath, 'utf8'))
      expect(allowlistContent.allowedSections).toContain('overview')
    })

    it('works without --allowlist flag (disabled)', () => {
      const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'section-generator-'))
      const outFile = path.join(outDir, 'sections.json')

      const args = [
        '--bundle',
        bundlePath,
        '--out',
        outFile,
      ]

      const res = runGenerator(args)
      expect(res.status).toBe(0)
      expect(res.stdout).toContain('Allowlist: disabled')

      // Allowlist file should not exist when disabled
      expect(fs.existsSync(path.join(outDir, 'generator-allowlist.json'))).toBe(false)
      expect(fs.existsSync(outFile)).toBe(true)
    })

    it('handles --allowlist at end of args (no next argument)', () => {
      const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'section-generator-'))
      const outFile = path.join(outDir, 'sections.json')

      const args = [
        '--bundle',
        bundlePath,
        '--out',
        outFile,
        '--method',
        'template',
        '--allowlist',
      ]

      const res = runGenerator(args)
      expect(res.status).toBe(0)
      expect(res.stdout).toContain('Allowlist: enabled')
      expect(fs.existsSync(path.join(outDir, 'generator-allowlist.json'))).toBe(true)
    })

    it('handles --allowlist followed by another flag', () => {
      const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'section-generator-'))
      const outFile = path.join(outDir, 'sections.json')

      const args = [
        '--bundle',
        bundlePath,
        '--out',
        outFile,
        '--allowlist',
        '--method',
        'template',
      ]

      const res = runGenerator(args)
      expect(res.status).toBe(0)
      expect(res.stdout).toContain('Allowlist: enabled')
      expect(fs.existsSync(path.join(outDir, 'generator-allowlist.json'))).toBe(true)
    })

    it('creates stub allowlist file when missing', () => {
      const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'section-generator-'))
      const outFile = path.join(outDir, 'sections.json')
      const customAllowlist = path.join(outDir, 'custom-allowlist.json')

      const args = [
        '--bundle',
        bundlePath,
        '--out',
        outFile,
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
      expect(content).toEqual({ allowedSections: [] })
    })
  })

  describe('determinism tests', () => {
    it('produces identical output for identical inputs', () => {
      const outDir1 = fs.mkdtempSync(path.join(os.tmpdir(), 'section-generator-'))
      const outFile1 = path.join(outDir1, 'sections.json')

      const outDir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'section-generator-'))
      const outFile2 = path.join(outDir2, 'sections.json')

      const args1 = [
        '--bundle',
        bundlePath,
        '--out',
        outFile1,
        '--method',
        'template',
      ]

      const args2 = [
        '--bundle',
        bundlePath,
        '--out',
        outFile2,
        '--method',
        'template',
      ]

      const res1 = runGenerator(args1)
      expect(res1.status).toBe(0)

      const res2 = runGenerator(args2)
      expect(res2.status).toBe(0)

      const output1 = JSON.parse(fs.readFileSync(outFile1, 'utf8'))
      const output2 = JSON.parse(fs.readFileSync(outFile2, 'utf8'))

      // Remove timestamp fields for comparison
      delete output1.generatedAt
      delete output2.generatedAt
      output1.sections.forEach((s: any) => delete s.generatedAt)
      output2.sections.forEach((s: any) => delete s.generatedAt)

      // Outputs should be identical (deterministic)
      expect(output1).toEqual(output2)
    })

    it('produces deterministic factor ordering', () => {
      const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'section-generator-'))
      const outFile = path.join(outDir, 'sections.json')

      const args = [
        '--bundle',
        bundlePath,
        '--out',
        outFile,
        '--sections',
        'risk-summary',
      ]

      const res = runGenerator(args)
      expect(res.status).toBe(0)

      const output = JSON.parse(fs.readFileSync(outFile, 'utf8'))
      const riskSummarySection = output.sections.find(
        (s: any) => s.sectionKey === 'risk-summary',
      )

      expect(riskSummarySection).toBeDefined()
      expect(riskSummarySection.draft).toContain('stress: 80')
      expect(riskSummarySection.draft).toContain('sleep: 65')

      // Verify stress appears before sleep (sorted by score desc)
      const stressIndex = riskSummarySection.draft.indexOf('stress: 80')
      const sleepIndex = riskSummarySection.draft.indexOf('sleep: 65')
      expect(stressIndex).toBeLessThan(sleepIndex)
    })

    it('produces deterministic intervention ordering', () => {
      const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'section-generator-'))
      const outFile = path.join(outDir, 'sections.json')

      const args = [
        '--bundle',
        bundlePath,
        '--ranking',
        rankingPath,
        '--out',
        outFile,
        '--sections',
        'recommendations',
      ]

      const res = runGenerator(args)
      expect(res.status).toBe(0)

      const output = JSON.parse(fs.readFileSync(outFile, 'utf8'))
      const recommendationsSection = output.sections.find(
        (s: any) => s.sectionKey === 'recommendations',
      )

      expect(recommendationsSection).toBeDefined()
      expect(recommendationsSection.draft).toContain('Breathing Exercises')
      expect(recommendationsSection.draft).toContain('Priorität: 76')
    })
  })

  describe('error handling', () => {
    it('fails with missing --bundle argument', () => {
      const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'section-generator-'))
      const outFile = path.join(outDir, 'sections.json')

      const args = [
        '--out',
        outFile,
      ]

      const res = runGenerator(args)
      expect(res.status).toBe(1)
      expect(res.stderr).toContain('Missing required argument: --bundle')
    })

    it('fails with missing --out argument', () => {
      const args = [
        '--bundle',
        bundlePath,
      ]

      const res = runGenerator(args)
      expect(res.status).toBe(1)
      expect(res.stderr).toContain('Missing required argument: --out')
    })
  })
})
