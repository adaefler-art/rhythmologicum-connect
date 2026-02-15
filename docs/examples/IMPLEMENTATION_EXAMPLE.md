# Mobile Funnel Selector - Implementation Example

## Code Structure Overview

This document provides concrete code examples showing how the mobile funnel selector is implemented.

## 1. API Response Example

When a patient visits `/patient/assessment`, the page calls `/api/funnels/active`:

```javascript
// Request
GET /api/funnels/active
Authorization: Bearer {user-token}

// Response
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "slug": "stress-assessment",
      "title": "Stress & Resilienz",
      "subtitle": "Stress-Assessment",
      "description": "Erfassen Sie Ihr aktuelles Stresslevel und entdecken Sie Ihre Resilienzfaktoren.",
      "default_theme": null
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "slug": "sleep-assessment",
      "title": "Schlaf & Erholung",
      "subtitle": "Schlaf-Assessment",
      "description": "Analysieren Sie Ihre Schlafqualität und Erholungsmuster.",
      "default_theme": null
    }
  ]
}
```

## 2. Component Usage Example

### Basic FunnelCard Usage

```tsx
import FunnelCard from '@/app/components/FunnelCard'

// Simple usage
;<FunnelCard
  slug="stress-assessment"
  title="Stress & Resilienz"
  subtitle="Stress-Assessment"
  description="Erfassen Sie Ihr aktuelles Stresslevel und entdecken Sie Ihre Resilienzfaktoren."
  icon="🧘‍♀️"
  onClick={() => router.push('/patient/funnel/stress-assessment/intro')}
/>
```

### Minimal FunnelCard (only required props)

```tsx
<FunnelCard
  slug="longevity"
  title="Longevity Assessment"
  onClick={() => handleClick('longevity')}
/>
```

### FunnelCard with all props

```tsx
<FunnelCard
  slug="nutrition"
  title="Ernährung & Stoffwechsel"
  subtitle="Ernährungs-Assessment"
  description="Bewerten Sie Ihre Ernährungsgewohnheiten und erhalten Sie personalisierte Empfehlungen."
  icon="🥗"
  theme="green"
  onClick={() => navigateToFunnel('nutrition')}
/>
```

## 3. Page Component Structure

### Server Component (page.tsx)

```tsx
// app/patient/assessment/page.tsx
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import FunnelSelectorClient from './client'

export default async function FunnelSelectorPage() {
  // Server-side authentication check
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect unauthenticated users to login
  if (!user) {
    redirect('/login')
  }

  // Render client component for authenticated users
  return <FunnelSelectorClient />
}
```

### Client Component (client.tsx)

```tsx
// app/patient/assessment/client.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import MobileHeader from '@/app/components/MobileHeader'
import FunnelCard from '@/app/components/FunnelCard'
import { spacing, typography, colors, radii } from '@/lib/design-tokens'

type FunnelData = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  default_theme: string | null
}

export default function FunnelSelectorClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [funnels, setFunnels] = useState<FunnelData[]>([])

  // Load funnels on mount
  useEffect(() => {
    const loadActiveFunnels = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/funnels/active')
        if (!response.ok) throw new Error('Failed to load funnels')

        const data = await response.json()
        if (data.success && Array.isArray(data.data)) {
          setFunnels(data.data)
        } else {
          throw new Error('Invalid response format')
        }
      } catch (err) {
        console.error('Error loading funnels:', err)
        setError('Funnels konnten nicht geladen werden.')
      } finally {
        setLoading(false)
      }
    }

    loadActiveFunnels()
  }, [])

  // Handle funnel card click
  const handleFunnelClick = (slug: string) => {
    router.push(`/patient/funnel/${slug}/intro`)
  }

  // Map slugs to icons
  const getFunnelIcon = (slug: string): string => {
    const iconMap: Record<string, string> = {
      'stress-assessment': '🧘‍♀️',
      'sleep-assessment': '😴',
      nutrition: '🥗',
      af: '❤️',
      longevity: '🌱',
      recovery: '💪',
    }
    return iconMap[slug] || '📋'
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '...' }}>
      <MobileHeader
        variant="with-title"
        title="Assessment auswählen"
        subtitle="Rhythmologicum Connect"
        showBack={true}
      />

      <main className="flex-1 overflow-y-auto" style={{ padding: spacing.lg }}>
        {/* Loading, Error, Empty, and Content states... */}

        {!loading && !error && funnels.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {funnels.map((funnel) => (
              <FunnelCard
                key={funnel.id}
                slug={funnel.slug}
                title={funnel.title}
                subtitle={funnel.subtitle}
                description={funnel.description}
                icon={getFunnelIcon(funnel.slug)}
                theme={funnel.default_theme}
                onClick={() => handleFunnelClick(funnel.slug)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
```

## 4. Database Query Example

The API endpoint queries the database like this:

```typescript
// In app/api/funnels/active/route.ts
const { data: funnels, error: funnelsError } = await supabase
  .from('funnels')
  .select('id, slug, title, subtitle, description, default_theme')
  .eq('is_active', true)
  .order('created_at', { ascending: true })
```

This returns only funnels where `is_active = true`, ordered by creation date.

## 5. Styling with Design Tokens Example

### Before (Incorrect - using Tailwind classes)

```tsx
<div className="bg-primary-100 border border-primary-200 rounded-xl p-6">{content}</div>
```

### After (Correct - using design tokens)

```tsx
import { spacing, colors, radii } from '@/lib/design-tokens'

;<div
  className="border"
  style={{
    background: colors.primary[100],
    borderColor: colors.primary[200],
    borderRadius: radii.xl,
    padding: spacing.lg,
  }}
>
  {content}
</div>
```

## 6. Navigation Flow Example

```
User Journey:
1. User navigates to /patient
   ↓
2. Server redirects to /patient/assessment
   ↓
3. Page loads with authentication check
   ↓
4. API call fetches active funnels
   ↓
5. FunnelCards render in grid
   ↓
6. User taps "Stress & Resilienz" card
   ↓
7. onClick handler executes
   ↓
8. Router navigates to /patient/funnel/stress-assessment/intro
   ↓
9. Intro page loads (existing functionality)
   ↓
10. User starts assessment
```

## 7. Adding a New Funnel Type

To add a new funnel to the system:

### Step 1: Add to database

```sql
INSERT INTO funnels (slug, title, subtitle, description, is_active)
VALUES (
  'recovery-assessment',
  'Recovery & Regeneration',
  'Recovery-Assessment',
  'Bewerten Sie Ihre Erholungsfähigkeit und Regenerationsprozesse.',
  true
);
```

### Step 2: (Optional) Add icon mapping

```typescript
// In app/patient/assessment/client.tsx
const getFunnelIcon = (slug: string): string => {
  const iconMap: Record<string, string> = {
    'stress-assessment': '🧘‍♀️',
    'sleep-assessment': '😴',
    'recovery-assessment': '💪', // Add new icon here
    // ...
  }
  return iconMap[slug] || '📋'
}
```

### Step 3: Create intro content (optional)

Add a content page for `/patient/funnel/recovery-assessment/intro` if needed.

### Step 4: That's it!

The funnel automatically appears in the selector because it queries `is_active = true`.

## 8. Responsive Behavior Example

### Mobile (360px)

```
┌─────────────────┐
│                 │
│  [Card 1]       │
│  Full width     │
│                 │
├─────────────────┤
│                 │
│  [Card 2]       │
│  Full width     │
│                 │
└─────────────────┘
```

### Mobile Large (430px)

```
┌───────────────────┐
│                   │
│  [Card 1]         │
│  Full width       │
│  Max 448px        │
│                   │
├───────────────────┤
│                   │
│  [Card 2]         │
│  Full width       │
│  Max 448px        │
│                   │
└───────────────────┘
```

## 9. Error Handling Example

```typescript
// In client.tsx
try {
  const response = await fetch('/api/funnels/active')

  if (!response.ok) {
    throw new Error('Failed to load funnels')
  }

  const data = await response.json()

  if (!data.success || !Array.isArray(data.data)) {
    throw new Error('Invalid response format')
  }

  setFunnels(data.data)
} catch (err) {
  console.error('Error loading funnels:', err)
  setError('Funnels konnten nicht geladen werden.')
}
```

### Error displayed to user:

```
┌─────────────────────────┐
│                         │
│         Fehler          │
│                         │
│ Funnels konnten nicht   │
│    geladen werden.      │
│                         │
└─────────────────────────┘
```

## 10. Testing Scenarios

### Scenario 1: Authenticated user with active funnels

- **Expected:** Funnel selector displays all active funnels as cards
- **Actual:** ✅ Works as expected

### Scenario 2: Authenticated user with no active funnels

- **Expected:** Empty state message displayed
- **Actual:** ✅ Shows "Keine Assessments verfügbar"

### Scenario 3: Unauthenticated user

- **Expected:** Redirect to /login
- **Actual:** ✅ Server-side redirect to login page

### Scenario 4: API error

- **Expected:** Error state with message
- **Actual:** ✅ Shows "Fehler" message in red box

### Scenario 5: Clicking a funnel card

- **Expected:** Navigate to /patient/funnel/{slug}/intro
- **Actual:** ✅ Navigates correctly

## Conclusion

This implementation provides a clean, maintainable, and extensible way for patients to select between different assessment types. The code is well-structured, follows existing patterns, and is fully consistent with the v0.4 design system.
