'use client'

/**
 * Component & Screen Gallery - Dev Page
 * 
 * This page demonstrates the vendor rhythm_mobile_v2 components
 * integrated as the canonical UI source.
 */

import ComponentGallery from './ComponentGallery'
import ScreenGallery from './ScreenGallery'
import DashboardHero from '../../dashboard/DashboardHero'
import { BottomNavV2 } from '../../BottomNavV2'
import { Card } from '@/lib/ui/mobile-v2/components/Card'

export default function ComponentsDevPage() {
  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <div className="w-full px-4 py-6 space-y-12">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-[#1f2937]">
            rhythm_mobile_v2 Design System
          </h1>
          <p className="text-lg text-[#6b7280]">
            Component Gallery & Screen Compositions
          </p>
        </div>

        {/* Dashboard Header v1 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-[#1f2937]">Dashboard Header v1</h2>
          <DashboardHero greetingName="Sarah" onChat={() => {}} />
        </section>

        {/* Navigation Preview */}
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-[#1f2937]">Navigation Preview</h2>
          <p className="text-sm text-[#6b7280]">
            BottomNavV2 is fixed to the viewport for accurate mobile behavior.
          </p>
          <Card
            padding="none"
            shadow="none"
            className="relative min-h-[120px] border border-slate-200 bg-white/70"
          />
          <BottomNavV2 />
        </section>

        {/* Component Gallery */}
        <section id="component-gallery">
          <ComponentGallery />
        </section>

        {/* Screen Gallery */}
        <section id="screen-gallery">
          <ScreenGallery />
        </section>
      </div>
    </div>
  )
}
