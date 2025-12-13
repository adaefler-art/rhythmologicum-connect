import LoadingSpinner from '@/lib/ui/LoadingSpinner'

/**
 * Loading state for clinician routes
 * 
 * This component is displayed while clinician pages are loading.
 * Part of V0.4-E6 Technical Cleanup & Stability Layer.
 */
export default function ClinicianLoading() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
      <LoadingSpinner size="lg" text="Laden..." centered />
    </div>
  )
}
