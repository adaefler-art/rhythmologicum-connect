'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Badge, Input, Select } from '@/lib/ui'
import { useActiveNavLabel } from '@/lib/contexts/NavigationContext'

export const dynamic = 'force-dynamic'

type Funnel = {
  id: string
  title: string
  slug: string
}

type ContentPage = {
  id: string
  slug: string
  title: string
  status: string
  layout: string
  category: string | null
  priority: number
  funnel_id: string | null
  updated_at: string
  created_at: string
  deleted_at: string | null
  funnels: Funnel | null
}

type SortField = 'title' | 'slug' | 'funnel' | 'layout' | 'status' | 'updated_at'
type SortDirection = 'asc' | 'desc'

const ITEMS_PER_PAGE = 10

export default function AdminContentDashboard() {
  const router = useRouter()
  const navLabel = useActiveNavLabel('Inhalte')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contentPages, setContentPages] = useState<ContentPage[]>([])
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [filterFunnel, setFilterFunnel] = useState<string>('all')
  const [filterLayout, setFilterLayout] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  
  // Sort states
  const [sortField, setSortField] = useState<SortField>('updated_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  useEffect(() => {
    const loadContentPages = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/admin/content-pages')
        
        if (!response.ok) {
          throw new Error('Fehler beim Laden der Content-Pages')
        }

        const data = await response.json()
        setContentPages(data.contentPages || [])
      } catch (e: unknown) {
        console.error(e)
        const errorMessage = e instanceof Error ? e.message : 'Fehler beim Laden der Content-Pages.'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadContentPages()
  }, [])

  // Get unique values for filters
  const uniqueFunnels = useMemo(() => {
    const funnels = contentPages
      .map((page) => page.funnels)
      .filter((funnel): funnel is Funnel => funnel !== null)
    const uniqueMap = new Map(funnels.map((f) => [f.id, f]))
    return Array.from(uniqueMap.values())
  }, [contentPages])

  const uniqueLayouts = useMemo(() => {
    return Array.from(new Set(contentPages.map((page) => page.layout).filter(Boolean)))
  }, [contentPages])

  const uniqueStatuses = useMemo(() => {
    return Array.from(new Set(contentPages.map((page) => page.status).filter(Boolean)))
  }, [contentPages])

  // Filter and search content pages
  const filteredPages = useMemo(() => {
    let filtered = [...contentPages]

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (page) =>
          page.title.toLowerCase().includes(search) || page.slug.toLowerCase().includes(search)
      )
    }

    // Apply funnel filter
    if (filterFunnel !== 'all') {
      filtered = filtered.filter((page) => page.funnel_id === filterFunnel)
    }

    // Apply layout filter
    if (filterLayout !== 'all') {
      filtered = filtered.filter((page) => page.layout === filterLayout)
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((page) => page.status === filterStatus)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'slug':
          comparison = a.slug.localeCompare(b.slug)
          break
        case 'funnel':
          comparison = (a.funnels?.title || '').localeCompare(b.funnels?.title || '')
          break
        case 'layout':
          comparison = (a.layout || '').localeCompare(b.layout || '')
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'updated_at':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [contentPages, searchTerm, filterFunnel, filterLayout, filterStatus, sortField, sortDirection])

  // Paginate filtered results
  const totalPages = Math.ceil(filteredPages.length / ITEMS_PER_PAGE)
  const paginatedPages = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredPages.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredPages, currentPage])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterFunnel, filterLayout, filterStatus])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handlePageClick = (page: ContentPage) => {
    const key = (page.slug ?? page.id).trim()
    router.push(`/admin/content/${encodeURIComponent(key)}`)
  }

  const handleNewPage = () => {
    // Placeholder for creating new page
    router.push('/admin/content/new')
  }

  const formatDateTime = (isoString: string): string => {
    try {
      return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(isoString))
    } catch {
      return 'Datum unbekannt'
    }
  }

  const getStatusBadgeVariant = (status: string): 'success' | 'secondary' | 'warning' | 'default' => {
    switch (status) {
      case 'published':
        return 'success'
      case 'draft':
        return 'secondary'
      case 'archived':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'published':
        return 'Veröffentlicht'
      case 'draft':
        return 'Entwurf'
      case 'archived':
        return 'Archiviert'
      default:
        return status
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg
          className="w-4 h-4 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      )
    }
    return sortDirection === 'asc' ? (
      <svg
        className="w-4 h-4 text-sky-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg
        className="w-4 h-4 text-sky-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Content-Pages werden geladen…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-md">
          <p className="text-red-500 mb-4">{error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Neu laden
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-[center] sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {navLabel ?? 'Inhalte'}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Verwaltung aller Content-Pages mit Filter- und Suchfunktionen
            </p>
          </div>
          <Button
            onClick={handleNewPage}
            variant="primary"
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            }
          >
            Neue Seite anlegen
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="bg-card rounded-lg border border-border p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-foreground mb-2">
                Suche
              </label>
              <Input
                id="search"
                type="text"
                placeholder="Titel oder Slug suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                inputSize="sm"
              />
            </div>

            {/* Funnel Filter */}
            <div>
              <label htmlFor="funnel" className="block text-sm font-medium text-foreground mb-2">
                Funnel
              </label>
              <Select
                id="funnel"
                value={filterFunnel}
                onChange={(e) => setFilterFunnel(e.target.value)}
                selectSize="sm"
              >
                <option value="all">Alle Funnels</option>
                {uniqueFunnels.map((funnel) => (
                  <option key={funnel.id} value={funnel.id}>
                    {funnel.title}
                  </option>
                ))}
              </Select>
            </div>

            {/* Layout/Category Filter */}
            <div>
              <label htmlFor="layout" className="block text-sm font-medium text-foreground mb-2">
                Kategorie
              </label>
              <Select
                id="layout"
                value={filterLayout}
                onChange={(e) => setFilterLayout(e.target.value)}
                selectSize="sm"
              >
                <option value="all">Alle Kategorien</option>
                {uniqueLayouts.map((layout) => (
                  <option key={layout} value={layout}>
                    {layout}
                  </option>
                ))}
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-foreground mb-2">
                Status
              </label>
              <Select
                id="status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                selectSize="sm"
              >
                <option value="all">Alle Status</option>
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>
                    {getStatusLabel(status)}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-4 text-sm text-muted-foreground">
        {filteredPages.length === contentPages.length ? (
          <span>
            {filteredPages.length} {filteredPages.length === 1 ? 'Seite' : 'Seiten'} gesamt
          </span>
        ) : (
          <span>
            {filteredPages.length} von {contentPages.length}{' '}
            {contentPages.length === 1 ? 'Seite' : 'Seiten'} (gefiltert)
          </span>
        )}
      </div>

      {filteredPages.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
          <div className="max-w-md">
            <p className="text-4xl mb-4" aria-label="Kein Inhalt Symbol">
              📄
            </p>
            <h2 className="text-lg font-semibold text-foreground">
              {contentPages.length === 0 ? 'Noch keine Seiten vorhanden' : 'Keine Ergebnisse'}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {contentPages.length === 0
                ? 'Erstellen Sie Ihre erste Content-Page.'
                : 'Keine Seiten entsprechen Ihren Filterkriterien.'}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto border rounded-xl bg-card shadow-sm mb-4">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th
                    className="text-left px-4 py-4 font-semibold text-muted-foreground cursor-pointer hover:bg-muted/20 transition touch-manipulation"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-[center] gap-2">
                      <span>Titel</span>
                      <SortIcon field="title" />
                    </div>
                  </th>
                  <th
                    className="text-left px-4 py-4 font-semibold text-muted-foreground cursor-pointer hover:bg-muted/20 transition touch-manipulation"
                    onClick={() => handleSort('slug')}
                  >
                    <div className="flex items-[center] gap-2">
                      <span>Slug</span>
                      <SortIcon field="slug" />
                    </div>
                  </th>
                  <th
                    className="text-left px-4 py-4 font-semibold text-muted-foreground cursor-pointer hover:bg-muted/20 transition touch-manipulation"
                    onClick={() => handleSort('funnel')}
                  >
                    <div className="flex items-[center] gap-2">
                      <span>Funnel</span>
                      <SortIcon field="funnel" />
                    </div>
                  </th>
                  <th
                    className="text-left px-4 py-4 font-semibold text-muted-foreground cursor-pointer hover:bg-muted/20 transition touch-manipulation"
                    onClick={() => handleSort('layout')}
                  >
                    <div className="flex items-[center] gap-2">
                      <span>Kategorie</span>
                      <SortIcon field="layout" />
                    </div>
                  </th>
                  <th
                    className="text-left px-4 py-4 font-semibold text-muted-foreground cursor-pointer hover:bg-muted/20 transition touch-manipulation"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-[center] gap-2">
                      <span>Status</span>
                      <SortIcon field="status" />
                    </div>
                  </th>
                  <th
                    className="text-left px-4 py-4 font-semibold text-muted-foreground cursor-pointer hover:bg-muted/20 transition touch-manipulation"
                    onClick={() => handleSort('updated_at')}
                  >
                    <div className="flex items-[center] gap-2">
                      <span>Aktualisiert</span>
                      <SortIcon field="updated_at" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedPages.map((page, index) => (
                  <tr
                    key={page.id}
                    className={`hover:bg-muted/20 transition cursor-pointer touch-manipulation ${
                      index !== paginatedPages.length - 1 ? 'border-b border-border' : ''
                    }`}
                    onClick={() => handlePageClick(page)}
                  >
                    <td className="px-4 py-4">
                      <span className="font-medium text-foreground">{page.title}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-muted-foreground font-mono text-xs">{page.slug}</span>
                    </td>
                    <td className="px-4 py-4">
                      {page.funnels ? (
                        <span className="text-foreground">{page.funnels.title}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-foreground">{page.layout || '—'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={getStatusBadgeVariant(page.status)} size="sm">
                        {getStatusLabel(page.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-foreground whitespace-nowrap">
                      {formatDateTime(page.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-[center] justify-[center] gap-2">
              <Button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                variant="secondary"
                size="sm"
              >
                Zurück
              </Button>
              <span className="text-sm text-muted-foreground">
                Seite {currentPage} von {totalPages}
              </span>
              <Button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                variant="secondary"
                size="sm"
              >
                Weiter
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
