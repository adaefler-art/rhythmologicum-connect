import type { StructuredIntakeData } from '@/lib/types/clinicalIntake'

const asNonEmptyString = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : ''

const asStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    : []

const asObjectArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter(
        (entry): entry is Record<string, unknown> =>
          typeof entry === 'object' && entry !== null && !Array.isArray(entry),
      )
    : []

const hasMedicationDetails = (structuredData: StructuredIntakeData) => {
  const entries = asObjectArray(structuredData.medication_entries)

  return entries.some((entry) => {
    const name = asNonEmptyString(entry.name)
    const dosage = asNonEmptyString(entry.dosage)
    const intakeFrequency = asNonEmptyString(entry.intake_frequency)
    return Boolean(name && dosage && intakeFrequency)
  })
}

const hasMedicationPhotoUpload = (structuredData: StructuredIntakeData) => {
  const documents = asObjectArray(structuredData.medication_documents)
  return documents.length > 0
}

const hasPriorFindingsUpload = (structuredData: StructuredIntakeData) => {
  const documents = asObjectArray(structuredData.prior_findings_documents)
  return documents.length > 0
}

const hasTrigger = (structuredData: StructuredIntakeData) => {
  const hpi = structuredData.history_of_present_illness
  if (!hpi) return false

  if (asNonEmptyString(hpi.trigger)) return true

  const aggravating = asStringArray(hpi.aggravating_factors)
  const relieving = asStringArray(hpi.relieving_factors)

  return aggravating.length > 0 || relieving.length > 0
}

const hasFrequency = (structuredData: StructuredIntakeData) => {
  const hpi = structuredData.history_of_present_illness
  if (hpi && asNonEmptyString(hpi.frequency)) return true

  const timingFromOpqrst = asNonEmptyString(structuredData.opqrst?.timing?.value)
  return Boolean(timingFromOpqrst)
}

const hasMedicationContext = (structuredData: StructuredIntakeData) => {
  const medication = asStringArray(structuredData.medication)
  if (medication.length === 0) {
    return {
      hasAny: false,
      noneReported: false,
    }
  }

  const noneReported = medication.some((entry) => /none_reported|keine\s+medik|nehme\s+nichts/i.test(entry))

  return {
    hasAny: true,
    noneReported,
  }
}

export const getUc1MissingRequiredFields = (structuredData: StructuredIntakeData): string[] => {
  const missing: string[] = []

  if (!asNonEmptyString(structuredData.chief_complaint)) {
    missing.push('chief_complaint')
  }

  if (!asNonEmptyString(structuredData.history_of_present_illness?.onset)) {
    missing.push('history_of_present_illness.onset')
  }

  if (!asNonEmptyString(structuredData.history_of_present_illness?.course)) {
    missing.push('history_of_present_illness.course')
  }

  if (!asNonEmptyString(structuredData.history_of_present_illness?.duration)) {
    missing.push('history_of_present_illness.duration')
  }

  if (!hasTrigger(structuredData)) {
    missing.push('history_of_present_illness.trigger')
  }

  if (!hasFrequency(structuredData)) {
    missing.push('history_of_present_illness.frequency')
  }

  const medicationContext = hasMedicationContext(structuredData)

  if (!medicationContext.hasAny) {
    missing.push('medication')
  }

  if (medicationContext.hasAny && !medicationContext.noneReported) {
    if (!hasMedicationDetails(structuredData)) {
      missing.push('medication.details')
    }

    if (!hasMedicationPhotoUpload(structuredData)) {
      missing.push('medication.photo_upload')
    }
  }

  if (asStringArray(structuredData.past_medical_history).length === 0) {
    missing.push('past_medical_history')
  }

  if (!hasPriorFindingsUpload(structuredData)) {
    missing.push('prior_findings_documents')
  }

  return missing
}
