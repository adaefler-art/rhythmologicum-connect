export type PatientDisplayInput = {
  id?: string | null
  full_name?: string | null
  first_name?: string | null
  last_name?: string | null
  email?: string | null
}

export type PatientDisplayResult = {
  displayName: string
  secondaryLabel?: string
  isFallback: boolean
}

const normalizeValue = (value?: string | null) => value?.trim() || ''
const isLikelyEmail = (value: string) => value.includes('@') && !value.includes(' ')

export function resolvePatientDisplayName(
  profile: PatientDisplayInput,
): PatientDisplayResult {
  const fullName = normalizeValue(profile.full_name)
  if (fullName && !isLikelyEmail(fullName)) {
    return { displayName: fullName, isFallback: false }
  }

  const firstName = normalizeValue(profile.first_name)
  const lastName = normalizeValue(profile.last_name)
  const joinedName = [firstName, lastName].filter(Boolean).join(' ').trim()
  if (joinedName) {
    return { displayName: joinedName, isFallback: false }
  }

  const shortId = normalizeValue(profile.id).slice(0, 8)
  if (shortId) {
    return {
      displayName: `Patient:in ${shortId}`,
      secondaryLabel: `ID: ${shortId}`,
      isFallback: true,
    }
  }

  return { displayName: 'Patient:in', isFallback: true }
}
