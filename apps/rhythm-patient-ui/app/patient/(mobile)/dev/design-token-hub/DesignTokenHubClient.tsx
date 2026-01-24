'use client'

import { type CSSProperties, useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

export type TokenEntry = {
  name: string
  value: string
  darkValue?: string | null
}

export type TokenGroup = {
  key: string
  label: string
  tokens: TokenEntry[]
}

export type AssetItem = {
  source: 'patient' | 'studio'
  path: string
  url: string
  type: string
}

type Props = {
  tokenGroups: TokenGroup[]
  assets: AssetItem[]
  lucideIcons: string[]
}

function normalize(value: string) {
  return value.toLowerCase()
}

export default function DesignTokenHubClient({ tokenGroups, assets, lucideIcons }: Props) {
  const [query, setQuery] = useState('')
  const normalized = normalize(query.trim())

  const filteredGroups = useMemo(() => {
    if (!normalized) return tokenGroups

    return tokenGroups
      .map((group) => ({
        ...group,
        tokens: group.tokens.filter((token) => {
          const haystack = `${token.name} ${token.value} ${token.darkValue ?? ''}`
          return normalize(haystack).includes(normalized)
        }),
      }))
      .filter((group) => group.tokens.length > 0)
  }, [tokenGroups, normalized])

  const filteredAssets = useMemo(() => {
    if (!normalized) return assets
    return assets.filter((asset) => normalize(asset.path).includes(normalized))
  }, [assets, normalized])

  const filteredIcons = useMemo(() => {
    if (!normalized) return lucideIcons
    return lucideIcons.filter((icon) => normalize(icon).includes(normalized))
  }, [lucideIcons, normalized])

  const renderTokenPreview = (groupKey: string, token: TokenEntry) => {
    if (groupKey === 'color') {
      return (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded border border-slate-200" style={{ background: token.value }} />
          {token.darkValue ? (
            <div className="h-10 w-10 rounded border border-slate-200" style={{ background: token.darkValue }} />
          ) : null}
        </div>
      )
    }

    if (groupKey === 'spacing') {
      return (
        <div className="flex items-center gap-3">
          <div
            className="rounded bg-slate-200"
            style={{ width: token.value, height: token.value, minWidth: '0.75rem' }}
          />
        </div>
      )
    }

    if (groupKey === 'radius') {
      return (
        <div
          className="h-10 w-16 border border-slate-200 bg-white"
          style={{ borderRadius: token.value }}
        />
      )
    }

    if (groupKey === 'shadow') {
      return (
        <div
          className="h-12 w-28 rounded border border-slate-200 bg-white"
          style={{ boxShadow: token.value }}
        />
      )
    }

    if (groupKey === 'font') {
      const style: CSSProperties = {}
      if (token.name.startsWith('font-size-')) {
        style.fontSize = token.value
      }
      if (token.name.startsWith('font-weight-')) {
        style.fontWeight = Number.isNaN(Number(token.value)) ? undefined : Number(token.value)
      }
      if (token.name.startsWith('line-height-')) {
        style.lineHeight = token.value
      }

      return (
        <span className="text-sm text-slate-700" style={style}>
          Beispieltext
        </span>
      )
    }

    if (groupKey === 'layout') {
      return (
        <div className="h-10 w-full rounded border border-dashed border-slate-300">
          <div className="h-full rounded bg-slate-100" style={{ width: token.value }} />
        </div>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="flex w-full flex-col gap-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">Design Token Hub</h1>
          <p className="text-sm text-slate-600">
            Übersicht der Design Tokens, Assets und verwendeten Icons. Nur per Direktlink erreichbar.
          </p>
          <div className="w-full">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Suchen nach Token, Wert oder Asset…"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>
        </header>

        <section className="space-y-6">
          {filteredGroups.map((group) => (
            <div key={group.key} className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">{group.label}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.tokens.map((token) => (
                  <div
                    key={token.name}
                    className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold text-slate-500">--{token.name}</div>
                        <div className="text-sm text-slate-900">{token.value}</div>
                        {token.darkValue ? (
                          <div className="text-xs text-slate-500">Dark: {token.darkValue}</div>
                        ) : null}
                      </div>
                      <div>{renderTokenPreview(group.key, token)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Grafiken</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAssets.map((asset) => (
              <div
                key={`${asset.source}:${asset.path}`}
                className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 overflow-hidden rounded border border-slate-100 bg-slate-50">
                    <img src={asset.url} alt={asset.path} className="h-full w-full object-contain" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs uppercase text-slate-500">{asset.source}</div>
                    <div className="truncate text-sm text-slate-900">{asset.path}</div>
                    <div className="text-xs text-slate-500">{asset.type}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Lucide Icons (Patient UI)</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {filteredIcons.map((iconName) => {
              const IconComponent = (LucideIcons as Record<string, unknown>)[iconName]
              const Icon =
                typeof IconComponent === 'function'
                  ? (IconComponent as LucideIcon)
                  : null
              return (
                <div
                  key={iconName}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                >
                  {Icon ? <Icon className="h-5 w-5 text-slate-700" /> : null}
                  <span className="text-sm text-slate-900">{iconName}</span>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
