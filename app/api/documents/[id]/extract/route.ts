import { NextResponse } from 'next/server'
import { createServerSupabaseClient, getCurrentUser } from '@/lib/db/supabase.server'
import { runExtractionPipeline } from '@/lib/extraction/pipeline'
import { EXTRACTION_ERROR } from '@/lib/types/extraction'
import { logUnauthorized, logError } from '@/lib/logging/logger'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestStartTime = Date.now()
  const { id: documentId } = await params

  console.log('[extract] POST request received', { documentId })

  const user = await getCurrentUser()
  if (!user) {
    logUnauthorized({ endpoint: '/api/documents/extract', reason: 'No user' })
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 })
  }

  let forceReextract = false
  let parsedText: string | undefined
  try {
    const body = await request.json()
    forceReextract = body.force_reextract === true
    parsedText = body.parsed_text
  } catch (e) {
    console.log('[extract] No body, using defaults')
  }

  const supabase = await createServerSupabaseClient()

  const { data: document, error: docError } = await supabase
    .from('documents')
    .select('id, assessment_id, parsing_status')
    .eq('id', documentId)
    .single()

  if (docError || !document || !document.assessment_id) {
    return NextResponse.json({ success: false, error: { code: EXTRACTION_ERROR.INVALID_STATE, message: 'Document not found' } }, { status: 404 })
  }

  const { data: assessment, error: assessmentError } = await supabase
    .from('assessments')
    .select('id, patient_id')
    .eq('id', document.assessment_id)
    .single()

  if (assessmentError || !assessment) {
    return NextResponse.json({ success: false, error: { code: EXTRACTION_ERROR.INVALID_STATE, message: 'Assessment not found' } }, { status: 404 })
  }

  const { data: patientProfile, error: profileError } = await supabase
    .from('patient_profiles')
    .select('user_id')
    .eq('id', assessment.patient_id)
    .single()

  if (profileError || !patientProfile || patientProfile.user_id !== user.id) {
    logUnauthorized({ endpoint: '/api/documents/extract', userId: user.id })
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Not authorized' } }, { status: 403 })
  }

  try {
    const result = await runExtractionPipeline(supabase, {
      documentId,
      forceReextract,
      parsedText,
    })

    const duration = Date.now() - requestStartTime

    if (!result.success) {
      let statusCode = 500
      if (result.error?.code === EXTRACTION_ERROR.NOT_PARSED) statusCode = 422
      else if (result.error?.code === EXTRACTION_ERROR.INVALID_STATE) statusCode = 409

      return NextResponse.json({ success: false, error: result.error }, { status: statusCode })
    }

    console.log('[extract] Success', { documentId, duration: `${duration}ms` })

    return NextResponse.json({
      success: true,
      data: {
        document_id: documentId,
        extractor_version: result.extraction!.extractor_version,
        input_hash: result.extraction!.input_hash,
        extraction_created: true,
        extracted_data: result.extraction!.extracted_data,
        confidence: result.extraction!.confidence,
      },
    })
  } catch (error) {
    const duration = Date.now() - requestStartTime
    logError('Extraction error', { endpoint: '/api/documents/extract', duration }, error)
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Extraction failed' } }, { status: 500 })
  }
}
