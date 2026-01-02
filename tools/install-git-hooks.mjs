import { execFileSync } from 'node:child_process'

function runGit(args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: 'inherit' })
}

try {
  runGit(['config', 'core.hooksPath', '.githooks'])
  console.log('Installed git hooks: core.hooksPath = .githooks')
} catch (error) {
  console.error('Failed to install git hooks. Is git available on PATH?')
  console.error(String(error))
  process.exit(1)
}
