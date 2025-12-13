import LoadingSpinner from '@/lib/ui/LoadingSpinner'

/**
 * Loading state for patient routes
 * 
 * This component is displayed while patient pages are loading.
 * Part of V0.4-E6 Technical Cleanup & Stability Layer.
 */
export default function PatientLoading() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-white">
      <LoadingSpinner size="lg" text="Laden..." centered />
    </div>
  )
}
