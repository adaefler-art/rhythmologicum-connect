-- Add LLM provenance fields to diagnosis artifacts

ALTER TABLE public.diagnosis_artifacts
  ADD COLUMN IF NOT EXISTS result_source text,
  ADD COLUMN IF NOT EXISTS llm_used boolean,
  ADD COLUMN IF NOT EXISTS llm_provider text,
  ADD COLUMN IF NOT EXISTS llm_model text,
  ADD COLUMN IF NOT EXISTS llm_prompt_version text,
  ADD COLUMN IF NOT EXISTS llm_request_id text,
  ADD COLUMN IF NOT EXISTS llm_latency_ms integer,
  ADD COLUMN IF NOT EXISTS llm_tokens_in integer,
  ADD COLUMN IF NOT EXISTS llm_tokens_out integer,
  ADD COLUMN IF NOT EXISTS llm_tokens_total integer,
  ADD COLUMN IF NOT EXISTS llm_error text,
  ADD COLUMN IF NOT EXISTS llm_raw_response text;

COMMENT ON COLUMN public.diagnosis_artifacts.result_source IS 'LLM provenance result source (llm|fallback|cached|rule_based)';
COMMENT ON COLUMN public.diagnosis_artifacts.llm_used IS 'Whether a structured LLM output was successfully parsed';
COMMENT ON COLUMN public.diagnosis_artifacts.llm_provider IS 'LLM provider identifier (e.g., anthropic, openai)';
COMMENT ON COLUMN public.diagnosis_artifacts.llm_model IS 'LLM model name used for the run';
COMMENT ON COLUMN public.diagnosis_artifacts.llm_prompt_version IS 'Prompt version used for the LLM call';
COMMENT ON COLUMN public.diagnosis_artifacts.llm_request_id IS 'Provider request or response id for the LLM call';
COMMENT ON COLUMN public.diagnosis_artifacts.llm_latency_ms IS 'Measured latency of the LLM call in milliseconds';
COMMENT ON COLUMN public.diagnosis_artifacts.llm_tokens_in IS 'Input tokens for the LLM call';
COMMENT ON COLUMN public.diagnosis_artifacts.llm_tokens_out IS 'Output tokens for the LLM call';
COMMENT ON COLUMN public.diagnosis_artifacts.llm_tokens_total IS 'Total tokens for the LLM call';
COMMENT ON COLUMN public.diagnosis_artifacts.llm_error IS 'LLM error or fallback reason if structured output failed';
COMMENT ON COLUMN public.diagnosis_artifacts.llm_raw_response IS 'Optional raw LLM response (truncated)';
