import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const promptPath = path.join(root, 'lib', 'llm', 'prompts.ts')
const docPath = path.join(root, 'docs', 'llm', 'CONVERSATION_MODES.md')

const requiredFunctions = ['getPatientConsultPrompt', 'getClinicianColleaguePrompt']
const requiredKeys = ['kind', 'summary', 'redFlags', 'missingData', 'nextSteps']
const escalationMarkers = ['Notfall', '112', 'Notarzt', 'Red Flags']

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

const promptSource = fs.readFileSync(promptPath, 'utf8')
const docSource = fs.readFileSync(docPath, 'utf8')

for (const fn of requiredFunctions) {
  assert(promptSource.includes(`function ${fn}`), `Missing prompt function: ${fn}`)
}

const hasEscalation = escalationMarkers.some((token) => promptSource.includes(token))
assert(hasEscalation, 'Red-flag escalation clause missing in prompts')

for (const key of requiredKeys) {
  assert(docSource.includes(`- ${key}`), `Missing output contract key in docs: ${key}`)
}

console.log('verify-llm-modes: OK')
