'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from '@/lib/ui/mobile-v2/icons'
import { PATIENT_MOBILE_MENU_ITEMS } from '../(mobile)/navigation/menuConfig'

interface HamburgerMenuProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * HamburgerMenu Component (Issue 2 - Chat-First Dashboard)
 * 
 * Slide-out navigation menu for mobile patient portal.
 * Replaces the bottom navigation as the primary navigation method.
 * 
 * Features:
 * - Configurable menu items from menuConfig.ts
 * - Slide-in animation from left
 * - Backdrop overlay
 * - Active route highlighting
 * - Touch-friendly tap targets
 * - Safe area padding
 */
export function HamburgerMenu({ isOpen, onClose }: HamburgerMenuProps) {
  const pathname = usePathname()

  // Close menu on route change
  useEffect(() => {
    onClose()
  }, [pathname, onClose])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const menuItems = [...PATIENT_MOBILE_MENU_ITEMS].sort((a, b) => a.order - b.order)

  const isActive = (href: string) => {
    if (href.includes('/dashboard')) {
      return pathname === href || pathname === '/patient'
    }
    return pathname?.startsWith(href) ?? false
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <nav
        className={`fixed inset-0 z-50 flex h-[100dvh] w-screen max-w-none flex-col bg-white shadow-2xl transition-transform duration-300 ease-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        aria-label="Hauptnavigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Navigation</h2>
            <p className="text-xs text-slate-600">Rhythmologicum Connect</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Menü schließen"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => {
              const active = isActive(item.href)
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      active
                        ? 'bg-sky-50 text-sky-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span className="text-base">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4">
          <p className="text-xs text-slate-500">
            Rhythm v1 - AI-first Patient Portal
          </p>
        </div>
      </nav>
    </>
  )
}
