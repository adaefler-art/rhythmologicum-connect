'use client'

import { DesktopLayout } from '@/lib/ui'
import { Card, Badge } from '@/lib/ui'

export default function LayoutDemoPage() {
  const navItems = [
    { href: '/layout-demo', label: 'Dashboard', active: true },
    { href: '/layout-demo/funnels', label: 'Funnels', active: false },
    { href: '/layout-demo/content', label: 'Content', active: false },
  ]

  return (
    <DesktopLayout
      appTitle="Rhythmologicum Connect"
      userEmail="demo@example.com"
      onSignOut={() => alert('Sign out clicked')}
      navItems={navItems}
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard Demo</h1>
          <p className="text-slate-600">Demo der neuen Desktop-Layout Implementierung mit Sidebar und Topbar.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card padding="lg" shadow="md">
            <p className="text-sm text-slate-500 mb-1">Aktive Patient:innen</p>
            <p className="text-3xl font-bold text-slate-900">247</p>
          </Card>
          <Card padding="lg" shadow="md">
            <p className="text-sm text-slate-500 mb-1">Messungen (24h)</p>
            <p className="text-3xl font-bold text-slate-900">32</p>
            <Badge variant="info" size="sm" className="mt-2">Heute</Badge>
          </Card>
          <Card padding="lg" shadow="md">
            <p className="text-sm text-slate-500 mb-1">Erhöhtes Risiko</p>
            <p className="text-3xl font-bold text-slate-900">18</p>
            <Badge variant="warning" size="sm" className="mt-2">Achtung</Badge>
          </Card>
          <Card padding="lg" shadow="md">
            <p className="text-sm text-slate-500 mb-1">Hohes Risiko</p>
            <p className="text-3xl font-bold text-slate-900">3</p>
            <Badge variant="danger" size="sm" className="mt-2">Dringend</Badge>
          </Card>
        </div>
        <Card padding="lg">
          <h2 className="text-xl font-semibold mb-4">Layout Features</h2>
          <ul className="space-y-2 text-slate-700">
            <li>✓ Collapsible sidebar with expand/collapse button</li>
            <li>✓ Navigation with icons and active states</li>
            <li>✓ Topbar with page title and user menu</li>
            <li>✓ Responsive design (mobile menu + desktop sidebar)</li>
            <li>✓ User section with avatar and sign out button</li>
            <li>✓ Smooth transitions and hover effects</li>
          </ul>
        </Card>
      </div>
    </DesktopLayout>
  )
}
