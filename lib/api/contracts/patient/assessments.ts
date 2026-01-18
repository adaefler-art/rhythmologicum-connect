export * from 'rhythm-core/contracts/patient/assessments'

/**
 * Safely validates save answer request
 */
export function safeValidateSaveAnswerRequest(
  data: unknown,
): SaveAnswerRequest | null {
  const result = SaveAnswerRequestSchema.safeParse(data)
  return result.success ? result.data : null
}

/**
 * Validates save answer response
 */
export function validateSaveAnswerResponse(
  data: unknown,
): SaveAnswerResponse {
  return SaveAnswerResponseSchema.parse(data)
}

/**
 * Safely validates save answer response
 */
export function safeValidateSaveAnswerResponse(
  data: unknown,
): SaveAnswerResponse | null {
  const result = SaveAnswerResponseSchema.safeParse(data)
  return result.success ? result.data : null
}

/**
 * Validates complete assessment response
 */
export function validateCompleteAssessmentResponse(
  data: unknown,
): CompleteAssessmentResponse {
  return CompleteAssessmentResponseSchema.parse(data)
}

/**
 * Safely validates complete assessment response
 */
export function safeValidateCompleteAssessmentResponse(
  data: unknown,
): CompleteAssessmentResponse | null {
  const result = CompleteAssessmentResponseSchema.safeParse(data)
  return result.success ? result.data : null
}

/**
 * Validates get result response
 */
export function validateGetResultResponse(
  data: unknown,
): GetResultResponse {
  return GetResultResponseSchema.parse(data)
}

/**
 * Safely validates get result response
 */
export function safeValidateGetResultResponse(
  data: unknown,
): GetResultResponse | null {
  const result = GetResultResponseSchema.safeParse(data)
  return result.success ? result.data : null
}
