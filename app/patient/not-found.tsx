export default function PatientNotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 text-center">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Patient routing unavailable</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Patient routing is temporarily unavailable because PATIENT_BASE_URL is not configured.
        </p>
      </div>
    </div>
  )
}
