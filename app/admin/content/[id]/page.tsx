'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ContentPageEditor, { ContentPageEditorData } from '@/app/components/ContentPageEditor'

export const dynamic = 'force-dynamic'

export default function EditContentPage() {
  const params = useParams()
  const router = useRouter()
  const pageId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageData, setPageData] = useState<Partial<ContentPageEditorData> | null>(null)

  useEffect(() => {
    const loadPage = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/admin/content-pages/${pageId}`)
        
        if (!response.ok) {
          throw new Error('Fehler beim Laden der Content-Page')
        }

        const data = await response.json()
        setPageData(data.contentPage)
      } catch (e) {
        console.error(e)
        setError(e instanceof Error ? e.message : 'Fehler beim Laden')
      } finally {
        setLoading(false)
      }
    }

    if (pageId) {
      loadPage()
    }
  }, [pageId])

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Content-Page wird geladen...</p>
      </main>
    )
  }

  if (error || !pageData) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="max-w-md text-center">
          <p className="text-red-500 mb-4">{error || 'Content-Page nicht gefunden'}</p>
          <button
            onClick={() => router.push('/admin/content')}
            className="px-6 py-3 min-h-[44px] rounded-lg bg-sky-600 text-white text-sm md:text-base font-medium hover:bg-sky-700 transition touch-manipulation"
          >
            Zurück zur Übersicht
          </button>
        </div>
      </main>
    )
  }

  return <ContentPageEditor mode="edit" pageId={pageId} initialData={pageData} />
}
