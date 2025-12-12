/**
 * Tabs Component
 * 
 * A tabbed navigation component for organizing content into separate views.
 * Part of the V0.4 Design System.
 * 
 * @example
 * ```tsx
 * <Tabs defaultTab="overview">
 *   <TabsList>
 *     <TabTrigger value="overview">Overview</TabTrigger>
 *     <TabTrigger value="history">History</TabTrigger>
 *   </TabsList>
 *   <TabContent value="overview">
 *     <p>Overview content</p>
 *   </TabContent>
 *   <TabContent value="history">
 *     <p>History content</p>
 *   </TabContent>
 * </Tabs>
 * ```
 */

import { createContext, useContext, useState, type ReactNode } from 'react'

type TabsContextType = {
  activeTab: string
  setActiveTab: (value: string) => void
}

const TabsContext = createContext<TabsContextType | undefined>(undefined)

function useTabsContext() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider')
  }
  return context
}

export interface TabsProps {
  /** Default active tab value */
  defaultTab: string
  /** Children components (TabsList, TabContent) */
  children: ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * Tabs container component
 */
export function Tabs({ defaultTab, children, className = '' }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={`w-full ${className}`}>{children}</div>
    </TabsContext.Provider>
  )
}

export interface TabsListProps {
  /** Tab trigger buttons */
  children: ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * Container for tab trigger buttons
 */
export function TabsList({ children, className = '' }: TabsListProps) {
  return (
    <div
      className={`flex border-b border-slate-200 gap-1 overflow-x-auto ${className}`}
      role="tablist"
    >
      {children}
    </div>
  )
}

export interface TabTriggerProps {
  /** Tab identifier (must match TabContent value) */
  value: string
  /** Tab label text */
  children: ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * Individual tab trigger button
 */
export function TabTrigger({ value, children, className = '' }: TabTriggerProps) {
  const { activeTab, setActiveTab } = useTabsContext()
  const isActive = activeTab === value

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => setActiveTab(value)}
      className={`
        px-4 py-3 text-sm md:text-base font-medium
        border-b-2 transition-all duration-200
        whitespace-nowrap touch-manipulation min-h-[44px]
        ${
          isActive
            ? 'border-sky-600 text-sky-600'
            : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
        }
        focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2
        ${className}
      `}
    >
      {children}
    </button>
  )
}

export interface TabContentProps {
  /** Tab identifier (must match TabTrigger value) */
  value: string
  /** Content to display when tab is active */
  children: ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * Tab content panel
 */
export function TabContent({ value, children, className = '' }: TabContentProps) {
  const { activeTab } = useTabsContext()

  if (activeTab !== value) {
    return null
  }

  return (
    <div role="tabpanel" className={`py-6 ${className}`}>
      {children}
    </div>
  )
}
