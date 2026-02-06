const normalize = (value: string) => value.replace(/^\/+/, '')

export const patientResultsUrl = (patientId: string) =>
  `/api/clinician/patient/${patientId}/${normalize('results')}`

export const patientAnamnesisUrl = (patientId: string) =>
  `/api/clinician/patient/${patientId}/${normalize('anamnesis')}`

export const patientDiagnosisRunsUrl = (patientId: string) =>
  `/api/clinician/patient/${patientId}/${normalize('diagnosis/runs')}`

export const patientAmyInsightsUrl = (patientId: string) =>
  `/api/clinician/patient/${patientId}/${normalize('amy-insights')}`

export const assessmentDetailsUrl = (assessmentId: string) =>
  `/api/clinician/assessments/${assessmentId}/${normalize('details')}`
