/**
 * Component & Screen Gallery - Dev Page
 * 
 * This page demonstrates the vendor rhythm_mobile_v2 components
 * integrated as the canonical UI source.
 */

import ComponentGallery from './ComponentGallery'
import ScreenGallery from './ScreenGallery'

export default function ComponentsDevPage() {
  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <div className="max-w-7xl mx-auto p-6 space-y-12">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-[#1f2937]">
            rhythm_mobile_v2 Design System
          </h1>
          <p className="text-lg text-[#6b7280]">
            Component Gallery & Screen Compositions
          </p>
        </div>

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
