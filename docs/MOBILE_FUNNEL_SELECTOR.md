# Mobile Funnel Selector Implementation

## Overview

This document describes the implementation of the mobile funnel selector feature (v0.4.1), which allows patients to choose between different assessment types before starting their journey.

## Component Architecture

### 1. API Endpoint: `/api/funnels/active`

**Location:** `app/api/funnels/active/route.ts`

**Purpose:** Returns all active funnels from the database for the patient selection screen.

**Authentication:** Requires authenticated user (patient, clinician, or admin)

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "slug": "stress-assessment",
      "title": "Stress & Resilienz",
      "subtitle": "Stress-Assessment",
      "description": "Erfassen Sie Ihr aktuelles Stresslevel und entdecken Sie Ihre Resilienzfaktoren.",
      "default_theme": null
    }
  ]
}
```

### 2. FunnelCard Component

**Location:** `app/components/FunnelCard.tsx`

**Purpose:** Reusable card component for displaying individual funnel options.

**Props:**
- `slug`: Funnel slug for routing
- `title`: Display name (e.g., "Stress & Resilienz")
- `subtitle`: Short tagline (optional)
- `description`: Brief description (optional)
- `icon`: Emoji or icon (default: 📋)
- `theme`: Theme color for future use (optional)
- `onClick`: Click handler function

**Features:**
- Touch-friendly design optimized for 360-430px viewports
- Hover and active states using v0.4 design tokens
- Accessible with ARIA labels and keyboard navigation
- Icon/emoji display with gradient background
- Subtitle badge with brand colors
- Clear call-to-action arrow

**Design Tokens Used:**
- `spacing.*` for consistent padding and margins
- `typography.*` for font sizes and line heights
- `radii.*` for border radius
- `shadows.*` for elevation
- `colors.*` for theme colors
- `motion.*` for smooth transitions

### 3. Mobile Funnel Selector Page

**Location:** `app/patient/assessment/`

**Server Component:** `page.tsx` - Handles authentication
**Client Component:** `client.tsx` - Handles UI and API calls

**Route:** `/patient/assessment`

**Features:**
- Authentication check (redirects to `/login` if not authenticated)
- Fetches active funnels via API endpoint
- Loading state with spinner
- Error state with error message
- Empty state when no funnels available
- Grid layout for funnel cards (single column on mobile)
- Responsive design using v0.4 design system

**User Flow:**
1. Patient lands on `/patient` → redirects to `/patient/assessment`
2. Selector page loads active funnels from database
3. Patient sees available assessment options as cards
4. Patient taps a funnel card
5. Navigates to `/patient/funnel/{slug}/intro`
6. From intro, continues to actual assessment

## Icon Mapping

The selector automatically maps funnel slugs to appropriate emojis:

- `stress-assessment` / `stress` → 🧘‍♀️
- `sleep-assessment` / `sleep` → 😴
- `nutrition` → 🥗
- `af` → ❤️
- `longevity` → 🌱
- `recovery` → 💪
- Default → 📋

## Mobile-First Design

All components are optimized for mobile viewports (360-430px):
- Single-column grid layout
- Large touch targets (minimum 44px height)
- Clear visual hierarchy
- Consistent spacing and typography
- Smooth animations and transitions
- Accessible color contrast ratios

## Integration Points

### Patient Homepage
**Location:** `app/patient/page.tsx`

**Change:** Updated redirect from `/patient/funnel/stress-assessment` to `/patient/assessment`

This ensures patients always see the funnel selector first, unless they directly navigate to a specific funnel URL.

### Database Schema
The implementation relies on the existing `funnels` table:
```sql
CREATE TABLE public.funnels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    subtitle text,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    default_theme text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
```

Only funnels with `is_active = true` are shown in the selector.

## Acceptance Criteria ✅

- [x] Mobile Funnel Selector is a standalone page at `/patient/assessment`
- [x] Fully consistent with v0.4 design system (design tokens, spacing, typography)
- [x] Each Funnel Card is dynamically configurable via props
- [x] Page is SEO-neutral (server-side authentication, client-side rendering)
- [x] Responsive layout optimized for 360-430px mobile viewports
- [x] Grid/List layout with funnel cards displaying:
  - [x] Funnel icon/emoji
  - [x] Funnel name
  - [x] Short description
  - [x] OnClick → navigates to `/patient/funnel/{slug}/intro`

## Testing Checklist

### Manual Testing
- [ ] Navigate to `/patient` → should redirect to `/patient/assessment`
- [ ] Verify authentication: Unauthenticated users → `/login`
- [ ] Loading state displays while fetching funnels
- [ ] Active funnels display as cards with correct data
- [ ] Clicking a funnel card navigates to intro page
- [ ] Empty state shows when no active funnels exist
- [ ] Error state displays on API failure
- [ ] Responsive design works on 360px, 390px, 430px widths
- [ ] Hover states work on desktop
- [ ] Touch interactions feel responsive on mobile
- [ ] Back button in header navigates correctly

### Integration Testing
- [ ] API endpoint returns correct funnel data
- [ ] Authentication properly enforced at API level
- [ ] Database query correctly filters `is_active = true`
- [ ] Icon mapping works for all funnel types
- [ ] Navigation flow: `/patient` → `/patient/assessment` → `/patient/funnel/{slug}/intro`

## Future Enhancements

Potential improvements for future versions:
- Add funnel categories or tags
- Display estimated completion time per funnel
- Show progress indicators for partially completed assessments
- Add search/filter functionality for many funnels
- Implement theme-based card colors
- Add animations when cards appear
- Support for featured/recommended funnels
- Multi-language support for titles and descriptions

## Files Changed

### New Files
- `app/api/funnels/active/route.ts` - API endpoint for active funnels
- `app/components/FunnelCard.tsx` - Reusable funnel card component
- `app/patient/assessment/page.tsx` - Server component for authentication
- `app/patient/assessment/client.tsx` - Client component for UI

### Modified Files
- `app/patient/page.tsx` - Updated redirect to point to `/patient/assessment`

## Dependencies

No new dependencies were added. The implementation uses:
- Next.js 16 App Router
- React 19
- Supabase (existing)
- Design tokens from `@/lib/design-tokens`
- Existing components (`MobileHeader`)

## Conclusion

The mobile funnel selector provides a clean, user-friendly way for patients to discover and choose between different assessment types. It follows the v0.4 design system, uses proper authentication, and maintains consistency with the existing codebase patterns.
