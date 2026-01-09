import type { ReactNode } from 'react'

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="w-full py-8">
      <div
        className="w-full mx-auto px-4 sm:px-6"
        style={{ maxWidth: '48rem' }}
        data-layout="onboarding-container"
      >
        {children}
      </div>
    </div>
  )
}
