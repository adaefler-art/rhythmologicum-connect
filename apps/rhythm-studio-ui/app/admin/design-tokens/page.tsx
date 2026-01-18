'use client'

/**
 * Design Tokens Admin Page
 * 
 * V05-I09.2: Admin interface for managing organization-specific design token overrides.
 */

import { useState, useEffect } from 'react'
import { Card } from '@/lib/ui/Card'
import { Button } from '@/lib/ui/Button'
import { LoadingSpinner } from '@/lib/ui/LoadingSpinner'
import { ErrorState } from '@/lib/ui/ErrorState'
import { Palette, Save, RotateCcw, Eye, EyeOff } from 'lucide-react'

type TokenOverride = {
  id: string
  token_category: string
  token_key: string
  token_value: any
  organization_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string | null
}

type TokensByCategory = Record<string, Record<string, TokenOverride>>

export default function DesignTokensPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tokens, setTokens] = useState<TokensByCategory>({})
  const [organizationId, setOrganizationId] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('colors')

  const categories = ['spacing', 'typography', 'radii', 'shadows', 'motion', 'colors', 'componentTokens', 'layout']

  useEffect(() => {
    loadTokens()
  }, [organizationId])

  async function loadTokens() {
    setLoading(true)
    setError(null)

    try {
      const url = organizationId
        ? `/api/admin/design-tokens?organization_id=${organizationId}`
        : '/api/admin/design-tokens'

      const response = await fetch(url)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to load tokens')
      }

      setTokens(data.data.tokens || {})
    } catch (err) {
      console.error('Error loading tokens:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function saveToken(category: string, key: string, value: any) {
    try {
      const response = await fetch('/api/admin/design-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId || null,
          token_category: category,
          token_key: key,
          token_value: value,
          is_active: true,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to save token')
      }

      await loadTokens()
    } catch (err) {
      console.error('Error saving token:', err)
      alert('Failed to save token: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <ErrorState
          title="Fehler beim Laden"
          message={error}
          onRetry={loadTokens}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Palette className="h-8 w-8 text-sky-600" />
            <h1 className="text-3xl font-bold text-slate-900">Design Tokens</h1>
          </div>
          <p className="text-slate-600">
            Verwalten Sie organisationsspezifische Design-Token-Überschreibungen
          </p>
        </div>

        {/* Organization Filter */}
        <Card className="mb-6 p-4">
          <label className="block mb-2 text-sm font-medium text-slate-700">
            Organisation ID (optional)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              placeholder="Leer lassen für globale Tokens"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-md"
            />
            <Button onClick={loadTokens} variant="secondary">
              <RotateCcw className="h-4 w-4 mr-2" />
              Neu laden
            </Button>
          </div>
        </Card>

        {/* Category Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-sky-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Token List */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            {selectedCategory} Tokens
          </h2>

          {tokens[selectedCategory] && Object.keys(tokens[selectedCategory]).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(tokens[selectedCategory]).map(([key, token]) => (
                <div
                  key={key}
                  className="border border-slate-200 rounded-lg p-4 bg-slate-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-mono text-sm font-medium text-slate-900">
                        {selectedCategory}.{key}
                      </p>
                      {token.organization_id && (
                        <p className="text-xs text-slate-500 mt-1">
                          Org: {token.organization_id}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {token.is_active ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  </div>
                  <pre className="bg-white p-2 rounded border border-slate-200 text-xs overflow-auto">
                    {JSON.stringify(token.token_value, null, 2)}
                  </pre>
                  <p className="text-xs text-slate-500 mt-2">
                    Erstellt: {new Date(token.created_at).toLocaleString('de-DE')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <p>Keine Token-Überschreibungen für {selectedCategory} gefunden</p>
              <p className="text-sm mt-2">
                Verwenden Sie die API, um neue Überschreibungen zu erstellen
              </p>
            </div>
          )}
        </Card>

        {/* Info Box */}
        <Card className="mt-6 p-4 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Hinweis</h3>
          <p className="text-sm text-blue-800">
            Verwenden Sie die API-Endpunkte unter <code>/api/admin/design-tokens</code>,
            um Token-Überschreibungen zu erstellen oder zu aktualisieren. Details finden Sie
            in der Dokumentation unter <code>docs/DESIGN_TOKEN_OVERRIDE_GUIDE.md</code>.
          </p>
        </Card>
      </div>
    </div>
  )
}
