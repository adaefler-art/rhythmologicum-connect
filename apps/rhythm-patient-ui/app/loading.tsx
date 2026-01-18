import LoadingSpinner from '@/lib/ui/LoadingSpinner'

/**
 * Root-level loading state
 * 
 * This component is displayed while the root page is loading.
 * Part of V0.4 Error Handling & Stability Layer.
 */
export default function RootLoading() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
      <LoadingSpinner size="lg" text="Laden..." centered />
    </div>
  )
}
