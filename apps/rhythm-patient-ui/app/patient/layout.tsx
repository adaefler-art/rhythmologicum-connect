import type { ReactNode } from 'react'
import PatientLayoutClient from './PatientLayoutClient'
import PatientDesignTokensProvider from './PatientDesignTokensProvider'

export default function PatientLayout({ children }: { children: ReactNode }) {
  return (
    <PatientDesignTokensProvider>
      <PatientLayoutClient>{children}</PatientLayoutClient>
    </PatientDesignTokensProvider>
  )
}
