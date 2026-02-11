/**
 * Issue 10: Clinical Intake Projection
 *
 * Projects clinical_intakes output into anamnesis_entries + versions.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/types/supabase'
import { getPatientOrganizationId, getPatientProfileId } from '@/lib/api/anamnesis/helpers'
import { validateIntakeQuality } from '@/lib/clinicalIntake/validation'
import type { StructuredIntakeData } from '@/lib/types/clinicalIntake'

type SupabaseClientType = SupabaseClient<Database>

type ProjectionInput = {
  userId: string
  intakeId: string
  structuredData: StructuredIntakeData
  clinicalSummary: string | null
  promptVersion?: string | null
  lastUpdatedFromMessages?: string[] | null
}

type ProjectionResult = {
  success: boolean
  entryId?: string
  isNew?: boolean
  error?: string
  errorCode?: string
}

const buildProjectionContent = (input: ProjectionInput): Record<string, unknown> => {
  const summary =
    typeof input.clinicalSummary === 'string' && input.clinicalSummary.trim()
      ? input.clinicalSummary.trim()
      : null
  const quality = validateIntakeQuality(input.structuredData, summary ?? '')

  return {
    status: 'draft',
    clinical_intake_id: input.intakeId,
    clinical_summary: summary,
    structured_data: input.structuredData,
    structured_intake_data: input.structuredData,
    quality: {
      isValid: quality.isValid,
      errors: quality.errors,
      warnings: quality.warnings,
    },
    source: {
      kind: 'clinical_intakes',
      prompt_version: input.promptVersion ?? null,
      last_updated_from_messages: input.lastUpdatedFromMessages ?? [],
    },
  }
}

export async function projectClinicalIntakeToAnamnesis(
  supabase: SupabaseClientType,
  input: ProjectionInput,
): Promise<ProjectionResult> {
  try {
    const patientId = await getPatientProfileId(supabase, input.userId)

    if (!patientId) {
      return {
        success: false,
        error: 'Patient profile not found',
        errorCode: 'PATIENT_NOT_FOUND',
      }
    }

    const organizationId = await getPatientOrganizationId(supabase, patientId)

    if (!organizationId) {
      return {
        success: false,
        error: 'Patient organization not found',
        errorCode: 'ORGANIZATION_NOT_FOUND',
      }
    }

    const content = buildProjectionContent(input)

    const { data: existingEntry, error: existingError } = await supabase
      .from('anamnesis_entries')
      .select('id, tags')
      .eq('patient_id', patientId)
      .eq('entry_type', 'intake')
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingError) {
      return {
        success: false,
        error: existingError.message,
        errorCode: 'LOOKUP_FAILED',
      }
    }

    if (existingEntry?.id) {
      const { data: updatedEntry, error: updateError } = await supabase
        .from('anamnesis_entries')
        .update({
          title: 'Intake',
          content: content as Json,
          entry_type: 'intake',
          tags: existingEntry.tags ?? [],
          updated_by: input.userId,
        })
        .eq('id', existingEntry.id)
        .select('id')
        .single()

      if (updateError) {
        return {
          success: false,
          error: updateError.message,
          errorCode: 'UPDATE_FAILED',
        }
      }

      return {
        success: true,
        entryId: updatedEntry?.id ?? existingEntry.id,
        isNew: false,
      }
    }

    const { data: insertedEntry, error: insertError } = await supabase
      .from('anamnesis_entries')
      .insert({
        patient_id: patientId,
        organization_id: organizationId,
        title: 'Intake',
        content: content as Json,
        entry_type: 'intake',
        tags: [],
        created_by: input.userId,
        updated_by: input.userId,
      })
      .select('id')
      .single()

    if (insertError) {
      return {
        success: false,
        error: insertError.message,
        errorCode: 'CREATE_FAILED',
      }
    }

    return {
      success: true,
      entryId: insertedEntry?.id,
      isNew: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: 'UNEXPECTED_ERROR',
    }
  }
}
