import type { StructuredIntakeData, SafetyTriggeredRule } from '@/lib/types/clinicalIntake'

export type VisitPreparationSummary = {
  chiefComplaint: string | null
  course: string[]
  redFlags: string[]
  medication: string[]
}

const NONE_MEDICATION_VALUES = new Set(['none', 'none_reported', 'keine', 'nein'])

function toNonEmptyStrings(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return []
  }

  return values
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}

function buildCourse(data: StructuredIntakeData): string[] {
  const history = data.history_of_present_illness
  if (!history) {
    return []
  }

  const course: string[] = []

  if (history.onset) {
    course.push(`Beginn: ${history.onset}`)
  }

  if (history.duration) {
    course.push(`Dauer: ${history.duration}`)
  }

  if (history.course) {
    course.push(`Verlauf: ${history.course}`)
  }

  if (history.trigger) {
    course.push(`Auslöser: ${history.trigger}`)
  }

  if (history.frequency) {
    course.push(`Häufigkeit: ${history.frequency}`)
  }

  return course
}

function buildRedFlags(data: StructuredIntakeData): string[] {
  const directRedFlags = toNonEmptyStrings(data.red_flags)
  const triggeredRuleReasons = (data.safety?.triggered_rules ?? [])
    .map((rule: SafetyTriggeredRule) => rule.short_reason?.trim())
    .filter((value): value is string => Boolean(value))

  return [...new Set([...directRedFlags, ...triggeredRuleReasons])]
}

function buildMedication(data: StructuredIntakeData): string[] {
  const medicationEntries = (data.medication_entries ?? [])
    .map((entry) => {
      const name = entry.name?.trim()
      const dosage = entry.dosage?.trim()
      const intakeFrequency = entry.intake_frequency?.trim()

      if (!name) {
        return null
      }

      const details = [dosage, intakeFrequency].filter((value): value is string => Boolean(value))
      return details.length > 0 ? `${name} (${details.join(', ')})` : name
    })
    .filter((value): value is string => Boolean(value))

  if (medicationEntries.length > 0) {
    return medicationEntries
  }

  return toNonEmptyStrings(data.medication).filter(
    (entry) => !NONE_MEDICATION_VALUES.has(entry.toLowerCase()),
  )
}

export function buildVisitPreparationSummary(
  structuredData: StructuredIntakeData | null | undefined,
): VisitPreparationSummary {
  if (!structuredData) {
    return {
      chiefComplaint: null,
      course: [],
      redFlags: [],
      medication: [],
    }
  }

  const chiefComplaint = structuredData.chief_complaint?.trim() || null

  return {
    chiefComplaint,
    course: buildCourse(structuredData),
    redFlags: buildRedFlags(structuredData),
    medication: buildMedication(structuredData),
  }
}