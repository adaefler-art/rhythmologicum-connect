import LoadingSpinner from '@/lib/ui/LoadingSpinner'

/**
 * Loading state for admin routes
 * 
 * This component is displayed while admin pages are loading.
 * Part of V0.4-E6 Technical Cleanup & Stability Layer.
 */
export default function AdminLoading() {
  return (
    <div className="p-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <LoadingSpinner size="lg" text="Laden..." />
      </div>
    </div>
  )
}
