import assert from 'node:assert/strict'

test('canary uses LLM and returns v2 output', async () => {
  process.env.MCP_USE_FAKE_LLM = 'true'
  process.env.LLM_PROVIDER = 'fake'
  process.env.FEATURE_MCP_STUB = 'false'

  const { handleRunDiagnosis } = await import('./handlers.js')

  const result = await handleRunDiagnosis(
    {
      patient_id: '00000000-0000-4000-8000-000000000001',
      options: { include_history: true, canary: true },
    },
    '00000000-0000-4000-8000-000000000002',
  )

  const output = result.data

  assert.equal(output.provenance.result_source, 'llm')
  assert.equal(output.provenance.llm_used, true)
  assert.ok(output.provenance.llm_model)
  assert.ok(output.provenance.llm_latency_ms !== null)
  assert.ok(output.provenance.llm_tokens_in !== null)
  assert.ok(output.provenance.llm_tokens_out !== null)
  assert.equal(output.diagnosis_result.output_version, 'v2')
  assert.ok(output.diagnosis_result.summary_for_clinician.includes('CANARY_LLM_WAS_USED'))
})
