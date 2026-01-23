import { DesktopLayout } from '@rhythm/ui'
import React from 'react'
import { usePathname } from 'next/navigation'

const navItems = [
  { label: 'Dashboard', href: '/admin/__layout-smoke?tab=dashboard' },
  { label: 'Funnels', href: '/admin/__layout-smoke?tab=funnels' },
  { label: 'Content', href: '/admin/__layout-smoke?tab=content' },
  { label: 'Navigation', href: '/admin/__layout-smoke?tab=navigation' },
  { label: 'Design System', href: '/admin/__layout-smoke?tab=design' },
]

function DummyContent() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Layout Smoke Test</h1>
      <div className="bg-white rounded shadow p-6 mb-8">Dies ist eine Card mit etwas Dummy-Text.</div>
      <div className="overflow-x-auto">
        <table className="min-w-[600px] w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">#</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Beschreibung</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 30 }).map((_, i) => (
              <tr key={i} className={i % 2 ? 'bg-gray-50' : ''}>
                <td className="p-2 border">{i + 1}</td>
                <td className="p-2 border">Eintrag {i + 1}</td>
                <td className="p-2 border">Dies ist eine Dummy-Beschreibung für Zeile {i + 1}.</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function LayoutSmokePage() {
  const pathname = usePathname()
  return (
    <DesktopLayout
      appTitle="Rhythmologicum Connect"
      userEmail="dev@example.com"
      navItems={navItems.map(item => ({
        ...item,
        active: pathname?.includes(item.href.split('?tab=')[1] || '')
      }))}
      onSignOut={() => {}}
    >
      <DummyContent />
    </DesktopLayout>
  )
}
