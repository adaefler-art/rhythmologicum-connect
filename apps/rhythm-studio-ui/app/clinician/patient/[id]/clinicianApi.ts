export const getClinicianApiUrl = (patientId: string, endpoint: string) => {
  const normalized = endpoint.replace(/^\/+/, '')
  if (normalized.startsWith('assessments/')) {
    return `/api/clinician/${normalized}`
  }
  return `/api/clinician/patient/${patientId}/${normalized}`
}
