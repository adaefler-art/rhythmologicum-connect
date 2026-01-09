import type { ReactNode } from 'react'

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="w-full py-8">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6">{children}</div>
    </div>
  )
}
