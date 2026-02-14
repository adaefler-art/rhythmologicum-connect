'use client'

import { DashboardCards } from '@/components/patient/DashboardCards'

export default function PatientDashboardPage() {
  return (
    <main className="min-h-screen bg-linear-to-b from-sky-50 via-slate-50 to-slate-100">
      <div className="page-container dashboard-layout">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>

        <DashboardCards />
      </div>
    </main>
  )
}
