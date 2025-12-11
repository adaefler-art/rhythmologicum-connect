import { type ReactNode, type HTMLAttributes } from 'react'
import { radii, shadows } from '@/lib/design-tokens'

export interface TableColumn<T = unknown> {
  /** Column header text */
  header: string
  /** Accessor function to get cell value */
  accessor: (row: T) => ReactNode
  /** Optional custom width */
  width?: string
  /** Whether column is sortable */
  sortable?: boolean
  /** Alignment */
  align?: 'left' | 'center' | 'right'
}

export interface TableProps<T = unknown> extends HTMLAttributes<HTMLDivElement> {
  /** Table columns configuration */
  columns: TableColumn<T>[]
  /** Data rows */
  data: T[]
  /** Optional key extractor */
  keyExtractor?: (row: T, index: number) => string | number
  /** Whether to show borders */
  bordered?: boolean
  /** Whether to show hover effect on rows */
  hoverable?: boolean
  /** Whether to show striped rows */
  striped?: boolean
  /** Optional empty state message */
  emptyMessage?: string
  /** Optional loading state */
  loading?: boolean
  /** Optional row click handler */
  onRowClick?: (row: T, index: number) => void
}

/**
 * Table Component
 * 
 * A flexible, accessible table component with sorting and interaction support.
 * Part of the V0.4 Design System.
 * 
 * Features:
 * - Configurable columns with custom accessors
 * - Sortable columns (when sorting logic provided)
 * - Row click handlers
 * - Hover and striped variants
 * - Loading and empty states
 * - Responsive with horizontal scroll
 * - Accessible with proper ARIA attributes
 * 
 * @example
 * const columns = [
 *   { header: 'Name', accessor: (row) => row.name },
 *   { header: 'Email', accessor: (row) => row.email },
 *   { header: 'Status', accessor: (row) => <Badge>{row.status}</Badge> },
 * ]
 * 
 * <Table
 *   columns={columns}
 *   data={users}
 *   hoverable
 *   onRowClick={(user) => navigate(`/users/${user.id}`)}
 * />
 */
export function Table<T = unknown>({
  columns,
  data,
  keyExtractor = (_, index) => index,
  bordered = true,
  hoverable = true,
  striped = false,
  emptyMessage = 'Keine Daten vorhanden',
  loading = false,
  onRowClick,
  className = '',
  ...props
}: TableProps<T>) {
  const containerClasses = `overflow-x-auto bg-white ${bordered ? 'border rounded-xl' : ''}`

  return (
    <div
      className={`${containerClasses} ${className}`}
      style={{
        borderRadius: bordered ? radii.xl : undefined,
        boxShadow: bordered ? shadows.sm : undefined,
      }}
      {...props}
    >
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className={`px-4 py-4 font-semibold text-slate-700 ${
                  column.align === 'center'
                    ? 'text-center'
                    : column.align === 'right'
                    ? 'text-right'
                    : 'text-left'
                }`}
                style={{ width: column.width }}
              >
                <div className="flex items-center gap-2">
                  <span>{column.header}</span>
                  {column.sortable && (
                    <svg
                      className="w-4 h-4 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                      />
                    </svg>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500">
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5 text-sky-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Laden...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={keyExtractor(row, rowIndex)}
                className={`
                  ${striped && rowIndex % 2 === 1 ? 'bg-slate-50' : ''}
                  ${hoverable ? 'hover:bg-slate-50 transition' : ''}
                  ${onRowClick ? 'cursor-pointer' : ''}
                  ${rowIndex !== data.length - 1 ? 'border-b border-slate-100' : ''}
                `}
                onClick={() => onRowClick?.(row, rowIndex)}
                role={onRowClick ? 'button' : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onRowClick(row, rowIndex)
                        }
                      }
                    : undefined
                }
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={`px-4 py-4 ${
                      column.align === 'center'
                        ? 'text-center'
                        : column.align === 'right'
                        ? 'text-right'
                        : 'text-left'
                    }`}
                  >
                    {column.accessor(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default Table
