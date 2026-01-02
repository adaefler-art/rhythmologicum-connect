# V05-I02.1 Visual Verification Evidence

## UI Screenshot Description

**Page:** `/patient/funnels` (Funnel Catalog)

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  ← Back         Funnel Katalog                          │
│              Rhythmologicum Connect                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Verfügbare Assessments                                 │
│  Wählen Sie ein Assessment aus, um zu starten           │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 🧘‍♀️  Stress & Belastung                        ▼  │ │
│  │     Assessments zur Erfassung von Stress...        │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌──────────────────────┐ ┌──────────────────────┐     │
│  │                      │ │                      │     │
│  │  [Heart Icon Pulse]  │ │                      │     │
│  │                      │ │                      │     │
│  │  STRESS-ASSESSMENT   │ │    [Future Funnel]   │     │
│  │                      │ │                      │     │
│  │  Stress & Resilienz  │ │                      │     │
│  │  Erfassen Sie Ihr... │ │                      │     │
│  │                      │ │                      │     │
│  │  ⏱️ ca. 10 Min.      │ │                      │     │
│  │  v1.0.0              │ │                      │     │
│  │                      │ │                      │     │
│  │  ✓ Stresslevel...    │ │                      │     │
│  │  ✓ Risikofaktoren... │ │                      │     │
│  │  ✓ Handlungsempf...  │ │                      │     │
│  │                      │ │                      │     │
│  │  Assessment starten →│ │                      │     │
│  └──────────────────────┘ └──────────────────────┘     │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 💪  Resilienz                                  ▼  │ │
│  │     Assessments zur Messung von Resilienz...       │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [Collapsed - no funnels yet]                           │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 😴  Schlaf                                     ▼  │ │
│  │     Assessments zur Schlafqualität...              │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [Collapsed - no funnels yet]                           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Visual Elements

**Header:**

- Back button (←)
- Title: "Funnel Katalog"
- Subtitle: "Rhythmologicum Connect"
- Gradient background: sky-50 → slate-50 → slate-100

**Main Content:**

- Heading: "Verfügbare Assessments" (2xl, bold)
- Subtitle: "Wählen Sie ein Assessment aus, um zu starten"

**Pillar Sections (Accordion):**

1. **Stress & Belastung** (🧘‍♀️) - EXPANDED
   - White card with border
   - Icon on left, title in center, chevron on right
   - Description below title
   - Contains 1 funnel card (Stress Assessment)

2. **Resilienz** (💪) - COLLAPSED
   - White card with border
   - No funnels visible (empty state when expanded)

3. **Schlaf** (😴) - COLLAPSED
   - White card with border
   - No funnels visible (empty state when expanded)

**Funnel Card (Stress Assessment):**

- White background with shadow
- Gradient icon container (sky-100 → sky-50)
- Pulsing heart icon (rose-600)
- Badge: "STRESS-ASSESSMENT" (sky-600, uppercase)
- Title: "Stress & Resilienz" (xl, bold)
- Description: First ~100 chars truncated
- Metadata badges:
  - "⏱️ ca. 10 Min." (slate-100 bg)
  - "v1.0.0" (slate-100 bg)
- Outcomes list (checkmarks):
  - ✓ Stresslevel ermitteln
  - ✓ Risikofaktoren identifizieren
  - ✓ Handlungsempfehlungen erhalten
- CTA: "Assessment starten →" (sky-600, bottom)

### Responsive Behavior

**Mobile (< 768px):**

- Single column layout
- Full-width funnel cards
- Pillars stack vertically
- Touch-friendly 44px minimum tap targets

**Tablet (768px - 1024px):**

- 2-column grid for funnel cards
- Pillars remain full-width accordions

**Desktop (> 1024px):**

- 3-column grid for funnel cards (if many funnels)
- Max-width container (6xl)
- Centered layout

### States

**Loading State:**

- Spinning circle (sky-500)
- Text: "Lade Assessments..."

**Error State:**

- Red banner (red-50 bg, red-200 border)
- Title: "Fehler"
- Message: "Katalog konnte nicht geladen werden."

**Empty State (per pillar):**

- Gray text: "Keine Assessments in dieser Kategorie verfügbar"
- Centered in pillar section

**Empty State (all):**

- Centered message: "Derzeit sind keine Assessments verfügbar"

### Interactions

1. **Click Pillar Header:**
   - Toggles accordion open/closed
   - Chevron rotates 180°
   - Smooth height transition

2. **Click Funnel Card:**
   - Navigates to `/patient/funnel/stress-assessment/intro`
   - Card scales to 0.98 on active press
   - Smooth shadow transition on hover

3. **Hover Funnel Card:**
   - Border changes to sky-400
   - Shadow increases (xl)
   - Smooth 150ms transition

### Dark Mode

All elements support dark mode:

- Background: slate-800 → slate-900 → slate-950
- Cards: slate-800 with slate-700 borders
- Text: slate-100 (headings), slate-300/400 (body)
- Icons maintain their colors (rose-500, sky-400)
- Badges: slate-700 bg with slate-300 text

---

## API Response Example

### GET /api/funnels/catalog

```json
{
  "success": true,
  "data": {
    "pillars": [
      {
        "pillar": {
          "id": "uuid-stress",
          "key": "stress",
          "title": "Stress & Belastung",
          "description": "Assessments zur Erfassung von Stress und psychischer Belastung",
          "sort_order": 1
        },
        "funnels": [
          {
            "id": "uuid-funnel-stress",
            "slug": "stress-assessment",
            "title": "Stress Assessment",
            "subtitle": "Erfassen Sie Ihr aktuelles Stresslevel",
            "description": "Ein wissenschaftlich validiertes Assessment zur Messung von Stress und psychischer Belastung",
            "pillar_id": "uuid-stress",
            "est_duration_min": 10,
            "outcomes": [
              "Stresslevel ermitteln",
              "Risikofaktoren identifizieren",
              "Handlungsempfehlungen erhalten"
            ],
            "is_active": true,
            "default_version_id": "uuid-version-1.0.0",
            "default_version": "1.0.0"
          }
        ]
      },
      {
        "pillar": {
          "id": "uuid-resilience",
          "key": "resilience",
          "title": "Resilienz",
          "description": "Assessments zur Messung von Resilienz und Bewältigungsstrategien",
          "sort_order": 2
        },
        "funnels": []
      },
      {
        "pillar": {
          "id": "uuid-sleep",
          "key": "sleep",
          "title": "Schlaf",
          "description": "Assessments zur Schlafqualität und Schlafstörungen",
          "sort_order": 3
        },
        "funnels": []
      }
    ],
    "uncategorized_funnels": []
  }
}
```

---

## Manual Testing Checklist

- [ ] Navigate to `/patient/funnels` while authenticated
- [ ] Verify page loads without errors
- [ ] Check that "Stress & Belastung" pillar is auto-expanded
- [ ] Click pillar header to collapse/expand
- [ ] Verify chevron icon rotates
- [ ] Hover over funnel card
- [ ] Verify hover states (border color, shadow)
- [ ] Click funnel card
- [ ] Verify navigation to `/patient/funnel/stress-assessment/intro`
- [ ] Test on mobile viewport (< 768px)
- [ ] Test on tablet viewport (768px - 1024px)
- [ ] Test on desktop viewport (> 1024px)
- [ ] Toggle dark mode
- [ ] Verify all colors/styles work in dark mode
- [ ] Test with network offline (error state)
- [ ] Test with empty catalog (empty state)

---

## Evidence Files

- **Implementation:** All code committed to branch `copilot/implement-funnel-catalog-ui-api`
- **Tests:** `app/api/funnels/catalog/__tests__/catalog.test.ts` (6 passing)
- **Documentation:** `docs/V05_I02_1_CATALOG_IMPLEMENTATION.md`
- **Migration:** `supabase/migrations/20251231142000_create_funnel_catalog.sql`

---

## Status

✅ **Implementation Complete**
✅ **Tests Passing**
✅ **Build Successful**
✅ **Documentation Complete**

⚠️ **Manual UI Testing Required:** Screenshot pending local dev environment
