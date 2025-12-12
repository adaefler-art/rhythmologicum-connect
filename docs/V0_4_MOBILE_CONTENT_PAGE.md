# V0.4 Mobile Content Page Implementation

> Issue #8: Patient Mobile – Content Page  
> Date: 2025-12-12  
> Status: Completed

## Overview

Mobile-first content page component for displaying markdown content with a consistent v0.4 design system. Provides optimal reading experience on mobile devices while maintaining desktop compatibility.

## Key Features

### 1. **Sticky Header with Title**
- Fixed header that remains visible during scroll
- Page title with clear typography hierarchy
- Optional subtitle/category badge
- Gradient background for visual appeal
- Consistent with v0.4 design tokens

### 2. **Scrollable Content Area**
- Clean, card-based content display
- Markdown rendering with GitHub Flavored Markdown support
- Proper spacing and typography
- Maximum width constraint for optimal readability
- Support for sections (F3 feature)

### 3. **Sticky Bottom CTA**
- Fixed footer navigation
- Primary CTA button (customizable label)
- Optional secondary action (text link)
- Loading state support with spinner
- Touch-optimized (56px minimum height)
- Gradient background when active
- Tap animation feedback

### 4. **Design System Integration**
- Full v0.4 design tokens implementation
- Consistent spacing, typography, and colors
- Shadows and border radius from design system
- Motion/animation timing from tokens
- Component tokens for standardized styling

### 5. **Responsive Behavior**
- Mobile-first layout (min-h-screen, flex column)
- Automatically used on mobile devices (<640px)
- Desktop fallback to original layout
- Proper viewport handling
- SSR-safe mobile detection

## Architecture

### Component Hierarchy

```
ContentPageClient (detects mobile)
  ├── Mobile (<640px)
  │     └── MobileContentPage
  │           ├── Header (sticky)
  │           │     ├── Subtitle Badge
  │           │     └── Title
  │           ├── Main Content (scrollable)
  │           │     ├── Excerpt (optional)
  │           │     ├── MarkdownRenderer
  │           │     └── Sections (optional)
  │           └── Footer (sticky)
  │                 ├── Secondary Action Link
  │                 └── Primary CTA Button
  └── Desktop (≥640px)
        └── Original Desktop Layout
```

### Responsive Detection

The system uses `useIsMobile()` hook to switch between layouts:

- **Mobile (<640px)**: Uses `MobileContentPage` component
- **Desktop (≥640px)**: Uses original card-based layout
- **Detection**: Uses `window.matchMedia` for efficient detection
- **SSR-Safe**: Returns false on server-side

## Design System Integration

All styling uses v0.4 design tokens:

### Design Tokens Used

```typescript
import { 
  spacing,              // Spacing scale
  typography,           // Font sizes and weights
  radii,               // Border radius
  shadows,             // Box shadows
  colors,              // Theme colors
  componentTokens,     // Pre-configured component patterns
} from '@/lib/design-tokens'
```

### Component Tokens

- `componentTokens.navigationButton` - CTA button styling
- Manual configuration for content card and header
- Consistent with other mobile components

### Colors

- Primary (Sky Blue): `colors.primary[*]` for accents
- Neutral (Slate): `colors.neutral[*]` for text and backgrounds
- Background: `colors.background.light`
- Semantic: Success, warning, error states

### Typography

- Title: `typography.fontSize['3xl']` with tight line height
- Content: Prose classes for markdown rendering
- Labels: `typography.fontSize.xs` for badges

### Spacing

- Header: `spacing.lg` padding
- Content: `spacing.xl` padding for main area
- Footer: `spacing.lg` padding
- Card: `spacing.lg` and `spacing.xl` for content padding

## Component API

### MobileContentPage

```typescript
type MobileContentPageProps = {
  /** Page title displayed at the top */
  title: string
  /** Main scrollable content (typically MarkdownRenderer) */
  children: ReactNode
  /** CTA button label */
  ctaLabel?: string
  /** CTA button click handler */
  onCtaClick?: () => void
  /** Optional secondary action label (shown as text link) */
  secondaryLabel?: string
  /** Optional secondary action handler */
  onSecondaryClick?: () => void
  /** Loading state for CTA button */
  isLoading?: boolean
  /** Optional subtitle or category label */
  subtitle?: string
}
```

## Usage Examples

### Basic Usage

```tsx
import { MobileContentPage } from '@/app/components/mobile'
import MarkdownRenderer from '@/app/components/MarkdownRenderer'

<MobileContentPage
  title="Datenschutz"
  ctaLabel="Zurück"
  onCtaClick={() => router.back()}
>
  <MarkdownRenderer content={markdownContent} />
</MobileContentPage>
```

### With Subtitle and Secondary Action

```tsx
<MobileContentPage
  title="Stress Assessment Info"
  subtitle="Wichtige Information"
  ctaLabel="Weiter zum Assessment"
  onCtaClick={handleContinue}
  secondaryLabel="Abbrechen"
  onSecondaryClick={handleCancel}
  isLoading={isProcessing}
>
  <MarkdownRenderer content={content} />
</MobileContentPage>
```

### Content Page Integration

The component is automatically used in content pages on mobile:

```tsx
// app/patient/funnel/[slug]/content/[pageSlug]/client.tsx
const isMobile = useIsMobile()

if (isMobile) {
  return (
    <MobileContentPage
      title={contentPage.title}
      subtitle={contentPage.funnel?.title}
      ctaLabel="Zurück zum Fragebogen"
      onCtaClick={handleBack}
    >
      {contentPage.excerpt && <ExcerptSection />}
      <MarkdownRenderer content={contentPage.body_markdown} />
      {contentPage.sections && <SectionsRenderer />}
    </MobileContentPage>
  )
}
```

## Accessibility

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Proper tab order maintained
- Focus indicators clearly visible

### Screen Readers

- Proper semantic HTML structure (`header`, `main`, `footer`)
- Button has clear accessible labels
- Loading state announced

### Touch Optimization

- **Minimum 56px touch target** for primary CTA (WCAG 2.1 Level AAA)
- Adequate spacing between interactive elements
- Visual feedback on tap

### Color Contrast

- Text colors meet WCAG AA standards
- 4.5:1 contrast ratio for normal text
- Clear visual hierarchy

## Performance Optimizations

### Lazy Loading

- MarkdownRenderer is lazy-loaded in parent component
- Suspense boundaries for loading states

### Memoization

- Consider memoizing for complex content
- Efficient re-render strategy

### Animation Performance

- CSS transitions for smooth animations
- Transform and opacity for GPU acceleration
- No layout thrashing

## Implementation Details

### Layout Structure

```tsx
<div className="min-h-screen flex flex-col" style={{ background: gradient }}>
  {/* Header - Sticky */}
  <header className="shrink-0 bg-white border-b" style={{ padding, boxShadow }}>
    {subtitle && <SubtitleBadge />}
    <h1>{title}</h1>
  </header>

  {/* Main - Scrollable */}
  <main className="flex-1 overflow-y-auto" style={{ padding }}>
    <div className="bg-white border" style={{ padding, borderRadius, boxShadow }}>
      {children}
    </div>
  </main>

  {/* Footer - Sticky */}
  <footer className="shrink-0 bg-white border-t" style={{ padding, boxShadow }}>
    {secondaryLabel && <SecondaryButton />}
    <PrimaryCTAButton />
  </footer>
</div>
```

### Key CSS Classes

- `min-h-screen` - Full viewport height
- `flex flex-col` - Column layout
- `flex-1` - Main content fills available space
- `overflow-y-auto` - Scrollable content area
- `shrink-0` - Header and footer don't shrink

## Testing Checklist

- [x] Mobile rendering (390x844)
- [x] Desktop rendering (1280x720)
- [x] Markdown content renders correctly
- [x] Sticky header remains visible on scroll
- [x] Sticky footer remains visible on scroll
- [x] CTA button works
- [x] Loading state displays
- [x] Secondary action works
- [x] Typography is consistent
- [x] Spacing is consistent
- [x] Touch targets meet 56px minimum
- [x] Component builds without errors
- [x] No linting errors
- [ ] Screen reader testing
- [ ] Keyboard navigation testing
- [ ] Actual mobile device testing

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Mobile**: iOS Safari 14+, Chrome Android 90+
- **Features Used**:
  - CSS Grid and Flexbox
  - CSS Custom Properties (via design tokens)
  - ES2020+ JavaScript
  - Native scrolling

## Files Changed

### New Files

- `app/components/MobileContentPage.tsx` - Main mobile content page component
- `app/demo/mobile-content/page.tsx` - Demo page for testing
- `docs/V0_4_MOBILE_CONTENT_PAGE.md` - This documentation

### Modified Files

- `app/components/mobile.ts` - Added export for MobileContentPage
- `app/patient/funnel/[slug]/content/[pageSlug]/client.tsx` - Integrated mobile layout

## Migration from v0.3

No breaking changes to existing content page API. The mobile layout is automatically used when:

- Device width < 640px (mobile)
- `useIsMobile()` hook returns true

Desktop users continue to use the existing card-based layout.

## Comparison to Existing Patterns

### Similar to MobileWelcomeScreen

- Same layout structure (header, scrollable main, sticky footer)
- Same design token usage
- Same CTA button styling
- Same mobile-first approach

### Key Differences

- Content-focused (markdown) vs welcome screen (structured content)
- Simpler header (no illustration placeholder)
- Content card with white background
- Optional secondary action in footer
- Excerpt support

## Future Enhancements

Potential improvements for future versions:

1. **Back Button in Header**
   - Add optional back navigation in header
   - Consistent with mobile navigation patterns

2. **Progress Indicator**
   - Add optional progress indicator for multi-page flows
   - Show current page / total pages

3. **Table of Contents**
   - Auto-generated TOC for long content
   - Sticky navigation for sections

4. **Share Actions**
   - Share button in header
   - Export to PDF functionality

5. **Print Optimization**
   - Print-friendly styles
   - Remove sticky elements for print

6. **Dark Mode**
   - Support for dark theme variant
   - User preference detection

## References

- Design System: `/docs/V0_4_DESIGN_SYSTEM.md`
- Design Tokens: `/lib/design-tokens.ts`
- Mobile Components: `/app/components/mobile.ts`
- Content Types: `/lib/types/content.ts`
- Mobile Question Screen: `/docs/V0_4_MOBILE_QUESTION_SCREEN.md`

---

**Implementation Date**: 2025-12-12  
**Issue**: #8 - Patient Mobile – Content Page  
**Labels**: `frontend`, `mobile`, `content`, `v0.4`
