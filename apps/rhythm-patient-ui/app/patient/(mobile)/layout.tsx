import type { ReactNode } from 'react'
import { MobileShellV2 } from '../components'

/**
 * Mobile v2 Route Group Layout
 * 
 * This layout is the canonical wrapper for all Mobile UI v2 patient screens.
 * It enforces:
 * - MobileShellV2 shell with TopBar + BottomNav
 * - Design tokens from PatientDesignTokensProvider (parent layout)
 * - Full-width mobile layout (no centering containers)
 * 
 * Route Group: (mobile)
 * All patient screens that use Mobile v2 design pattern MUST be under this route group.
 * 
 * Canonical Layout Rules:
 * - Outer: min-h-[100dvh] w-full (handled by MobileShellV2)
 * - Content: w-full max-w-none flex-1 overflow-y-auto
 * - Cards: w-full (no max-w-* constraints)
 * - Padding: via tokens (px-4, px-6), NOT via mx-auto max-w-*
 * 
 * Routes under (mobile):
 * - /patient/dashboard
 * - /patient/assess
 * - /patient/dialog
 * - /patient/profile
 * - /patient/funnel/*
 * - /patient/assessments-v2
 * - /patient/assessment-flow-v2
 * - /patient/results-v2
 * - /patient/insights-v2
 * - /patient/funnels/*
 * - /patient/content/*
 * 
 * Routes NOT under (mobile) (allowlisted):
 * - /patient/onboarding/* (separate layout)
 * - /patient/documents/* (may have different layout requirements)
 */
export default function MobileLayout({ children }: { children: ReactNode }) {
  return <MobileShellV2>{children}</MobileShellV2>
}
