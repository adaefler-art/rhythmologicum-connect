'use client'

import { Card } from '@/lib/ui'
import type { ContentTile } from '@/lib/api/contracts/patient/dashboard'

export interface ContentTilesGridProps {
  /** Array of content tiles from dashboard API */
  tiles: ContentTile[]
  /** Callback when a tile is clicked */
  onTileClick?: (tile: ContentTile) => void
}

/**
 * Content Tiles Grid Component
 * 
 * Displays a grid of content tiles for the patient.
 * Part of E6.5.4 implementation.
 * 
 * Features:
 * - Responsive grid layout
 * - Empty state handling
 * - Interactive tiles with hover effects
 * - Dark mode support
 * - Sorted by priority
 * 
 * @example
 * <ContentTilesGrid
 *   tiles={[
 *     { id: '1', type: 'info', title: 'Health Tips', ... }
 *   ]}
 *   onTileClick={handleTileClick}
 * />
 */
export function ContentTilesGrid({ tiles, onTileClick }: ContentTilesGridProps) {
  // Sort tiles by priority (higher priority first)
  const sortedTiles = [...tiles].sort((a, b) => b.priority - a.priority)

  // Icon mapping based on tile type
  const iconMap = {
    info: '💡',
    action: '⚡',
    promotion: '🎁',
  }

  // Empty state
  if (tiles.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">📚</div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
          Noch keine Inhalte verfügbar
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Neue Inhalte werden bald hinzugefügt.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Empfohlene Inhalte
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedTiles.map((tile) => (
          <Card
            key={tile.id}
            padding="md"
            radius="lg"
            interactive={!!tile.actionTarget}
            onClick={() => {
              if (tile.actionTarget && onTileClick) {
                onTileClick(tile)
              }
            }}
          >
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0" role="img" aria-label={tile.type}>
                  {iconMap[tile.type]}
                </span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1 truncate">
                    {tile.title}
                  </h4>
                  {tile.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {tile.description}
                    </p>
                  )}
                </div>
              </div>
              {tile.actionLabel && tile.actionTarget && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-sm text-sky-600 dark:text-sky-400 font-medium">
                    {tile.actionLabel} →
                  </span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default ContentTilesGrid
