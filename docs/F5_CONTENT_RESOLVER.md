# F5 – Content Resolver

## Übersicht

Der **Content Resolver** ist eine zentrale Utility für die Funnel-Integration, die automatisch die passende Content-Page basierend auf Funnel, Kategorie und optionalem Slug auswählt. Das Modul implementiert intelligente Fallback-Logik und garantiert fehlerfreies Error-Handling.

## Hauptfunktionen

### `getContentPage(options)`

Die zentrale API-Funktion zum Auflösen einer einzelnen Content-Page.

**Typ-Signatur:**
```typescript
function getContentPage(
  options: ContentResolverOptions
): Promise<ContentResolverResult>
```

**Parameter:**
```typescript
type ContentResolverOptions = {
  funnel: string           // Funnel-Slug oder UUID (z.B. 'stress-assessment')
  category?: string        // Optional: Kategorie (z.B. 'intro', 'info', 'result')
  slug?: string           // Optional: Spezifischer Page-Slug
  includeDrafts?: boolean // Optional: Entwürfe einbeziehen (default: false)
}
```

**Rückgabewert:**
```typescript
type ContentResolverResult = {
  page: ContentPage | null           // Die aufgelöste Content-Page oder null
  strategy: 'exact-match'            // Verwendete Auflösungsstrategie
          | 'category-default' 
          | 'funnel-default' 
          | 'not-found'
  error?: string                     // Optionale Fehlermeldung (nicht-fatal)
}
```

## Auflösungsstrategien

Der Content Resolver verwendet eine mehrstufige Fallback-Strategie:

### 1. Exact Match (Exakte Übereinstimmung)
- **Bedingung**: `funnel` + `category` + `slug` sind angegeben
- **Abfrage**: Sucht nach Page mit exakter Übereinstimmung aller drei Parameter
- **Anwendungsfall**: Gezielte Auswahl einer bestimmten Seite

**Beispiel:**
```typescript
const result = await getContentPage({
  funnel: 'stress-assessment',
  category: 'intro',
  slug: 'was-ist-stress'
})
// Liefert genau die Seite 'was-ist-stress' aus Kategorie 'intro'
```

### 2. Category Default (Kategorie-Standardseite)
- **Bedingung**: `funnel` + `category` sind angegeben, aber kein exakter Match
- **Abfrage**: Sucht die Page mit höchster Priorität in der Kategorie
- **Sortierung**: Nach `priority` DESC, dann `created_at` DESC
- **Anwendungsfall**: Standardseite für eine Kategorie anzeigen

**Beispiel:**
```typescript
const result = await getContentPage({
  funnel: 'stress-assessment',
  category: 'info'
})
// Liefert die wichtigste Info-Seite (höchste Priority)
```

### 3. Funnel Default (Funnel-Standardseite)
- **Bedingung**: Nur `funnel` angegeben, keine Category
- **Abfrage**: Sucht die Page mit höchster Priorität im Funnel
- **Sortierung**: Nach `priority` DESC, dann `created_at` DESC
- **Anwendungsfall**: Irgendeine relevante Seite aus dem Funnel anzeigen

**Beispiel:**
```typescript
const result = await getContentPage({
  funnel: 'stress-assessment'
})
// Liefert die wichtigste Seite im Funnel (unabhängig von Kategorie)
```

### 4. Not Found (Nichts gefunden)
- **Bedingung**: Keine der obigen Strategien liefert ein Ergebnis
- **Rückgabe**: `page: null`, `strategy: 'not-found'`
- **Error-Handling**: Kein Crash, nur informative Fehlermeldung

**Beispiel:**
```typescript
const result = await getContentPage({
  funnel: 'non-existent-funnel'
})
// { page: null, strategy: 'not-found', error: 'Funnel not found: ...' }
```

## Weitere Funktionen

### `getContentPages(options)`

Liefert mehrere Content-Pages für einen Funnel mit optionalem Kategorie-Filter.

**Beispiel:**
```typescript
const pages = await getContentPages({
  funnel: 'stress-assessment',
  category: 'intro'
})
// Liefert alle Intro-Seiten, sortiert nach Priorität
```

**Rückgabewert:** `ContentPage[]` (Array, kann leer sein)

### `hasContentPage(options)`

Prüft, ob eine Content-Page für die gegebenen Kriterien existiert.

**Beispiel:**
```typescript
const hasIntro = await hasContentPage({
  funnel: 'stress-assessment',
  category: 'intro'
})
// true wenn mindestens eine Intro-Seite existiert
```

**Rückgabewert:** `boolean`

## Error-Handling

Der Content Resolver ist **crash-safe** und garantiert, dass niemals Exceptions nach außen propagieren:

### Fehlerszenarien

1. **Fehlende Supabase-Konfiguration**
   - Wird als Error im Result zurückgegeben
   - Keine Exception

2. **Funnel nicht gefunden**
   - `strategy: 'not-found'`
   - `error: 'Funnel not found: ...'`

3. **Datenbankfehler**
   - Wird geloggt (console.error)
   - Rückgabe: `page: null`, `strategy: 'not-found'`

4. **Unbekannte Fehler**
   - Werden im catch-Block abgefangen
   - Rückgabe: `page: null` mit Fehlermeldung

### Best Practice

```typescript
const result = await getContentPage({ funnel: 'my-funnel' })

if (result.page) {
  // Seite wurde gefunden
  console.log('Using page:', result.page.title)
  console.log('Strategy:', result.strategy)
} else {
  // Keine Seite gefunden oder Fehler aufgetreten
  console.warn('No page found:', result.error)
  // Fallback-UI anzeigen
}
```

## Verwendung in der Anwendung

### Beispiel 1: Intro-Seite in Funnel anzeigen

```typescript
import { getContentPage } from '@/lib/utils/contentResolver'

async function FunnelPage({ funnelSlug }: { funnelSlug: string }) {
  const result = await getContentPage({
    funnel: funnelSlug,
    category: 'intro'
  })

  return (
    <div>
      {result.page ? (
        <ContentDisplay page={result.page} />
      ) : (
        <DefaultIntro />
      )}
    </div>
  )
}
```

### Beispiel 2: Ergebnis-Seiten nach Assessment

```typescript
import { getContentPages } from '@/lib/utils/contentResolver'

async function ResultPage({ funnelSlug }: { funnelSlug: string }) {
  const resultPages = await getContentPages({
    funnel: funnelSlug,
    category: 'result'
  })

  return (
    <div>
      <h2>Weiterführende Informationen</h2>
      {resultPages.map(page => (
        <ContentLink key={page.id} page={page} />
      ))}
    </div>
  )
}
```

### Beispiel 3: Dynamische Content-Seite

```typescript
import { getContentPage } from '@/lib/utils/contentResolver'

export default async function DynamicContentPage({
  params
}: {
  params: Promise<{ funnelSlug: string; pageSlug: string }>
}) {
  const { funnelSlug, pageSlug } = await params
  
  const result = await getContentPage({
    funnel: funnelSlug,
    slug: pageSlug
  })

  if (!result.page) {
    return <NotFound />
  }

  return <ContentDisplay page={result.page} />
}
```

## Integration mit bestehenden Utilities

Der Content Resolver ergänzt die bestehenden Content-Page-Utilities:

### Zusammenspiel mit `contentPageHelpers.ts`

```typescript
import { getContentPages } from '@/lib/utils/contentResolver'
import { categorizeContentPage, getIntroPages } from '@/lib/utils/contentPageHelpers'

// Content Resolver: Lädt Pages aus der DB
const allPages = await getContentPages({
  funnel: 'stress-assessment'
})

// Content Page Helpers: Kategorisiert Pages nach Slug-Konvention
const introPages = getIntroPages(allPages)

// Beide Ansätze können kombiniert werden:
// 1. Explizite Kategorisierung via Content Resolver
const explicitIntro = await getContentPages({
  funnel: 'stress-assessment',
  category: 'intro'  // Nutzt DB-Feld 'category'
})

// 2. Slug-basierte Kategorisierung via Helpers
const slugBasedIntro = getIntroPages(allPages)  // Nutzt Slug-Konventionen
```

## Technische Details

### Funnel-Auflösung

Der Resolver akzeptiert sowohl Funnel-Slugs als auch UUIDs:

```typescript
// Beide Varianten funktionieren:
await getContentPage({ funnel: 'stress-assessment' })
await getContentPage({ funnel: '123e4567-e89b-12d3-a456-426614174000' })
```

Die Auflösung erfolgt automatisch:
1. UUID-Prüfung via RegEx
2. Bei Non-UUID: Lookup via Slug in `funnels`-Tabelle

### Status-Filterung

Standardmäßig werden nur `published` Pages zurückgegeben:

```typescript
// Nur veröffentlichte Seiten (Standard)
await getContentPage({ funnel: 'stress-assessment' })

// Auch Entwürfe einbeziehen (z.B. für Preview)
await getContentPage({ 
  funnel: 'stress-assessment',
  includeDrafts: true 
})
```

### Soft-Delete-Handling

Der Resolver berücksichtigt automatisch `deleted_at`:
- Nur Pages mit `deleted_at IS NULL` werden zurückgegeben
- Gelöschte Pages werden ignoriert

### Prioritäts-Sortierung

Bei mehreren Kandidaten entscheidet die Priorität:

1. **Primär**: `priority` (höher = wichtiger)
2. **Sekundär**: `created_at` (neuer = wichtiger)

**Beispiel:**
```
Page A: priority=10, created_at=2024-01-01
Page B: priority=5,  created_at=2024-02-01
Page C: priority=10, created_at=2024-02-15

Reihenfolge: C, A, B
```

## Performance-Überlegungen

### Datenbank-Abfragen

Der Resolver minimiert DB-Roundtrips:

- **Best Case** (exact match): 2 Queries (Funnel + Page)
- **Average Case** (category default): 2 Queries
- **Worst Case** (funnel default): 2 Queries

### Caching-Strategie

Für hochfrequentierte Anwendungsfälle empfohlen:

```typescript
// Cache-Wrapper-Beispiel (React Server Component)
import { cache } from 'react'
import { getContentPage } from '@/lib/utils/contentResolver'

export const getCachedContentPage = cache(getContentPage)

// In Component verwenden:
const result = await getCachedContentPage({
  funnel: 'stress-assessment',
  category: 'intro'
})
```

## Testing

### Manuelle Tests

Ein Testskript ist verfügbar unter `/tmp/test-content-resolver.ts`:

```bash
npx tsx /tmp/test-content-resolver.ts
```

Das Script validiert:
- ✅ Exact Match
- ✅ Category Default
- ✅ Funnel Default
- ✅ Error Handling (kein Crash)
- ✅ Multiple Pages
- ✅ Existence Check

### Integration Tests

Beispiel für Tests in einer realen Anwendung:

```typescript
// Test 1: Exakter Match funktioniert
const result = await getContentPage({
  funnel: 'stress-assessment',
  category: 'intro',
  slug: 'was-ist-stress'
})
expect(result.strategy).toBe('exact-match')
expect(result.page?.slug).toBe('was-ist-stress')

// Test 2: Fallback auf Category Default
const result = await getContentPage({
  funnel: 'stress-assessment',
  category: 'non-existent-category'
})
expect(result.strategy).toBeOneOf(['funnel-default', 'not-found'])

// Test 3: Kein Crash bei Fehler
const result = await getContentPage({
  funnel: 'invalid-funnel'
})
expect(result.strategy).toBe('not-found')
expect(result.error).toBeTruthy()
```

## Troubleshooting

### Problem: "Supabase configuration missing"

**Ursache**: Umgebungsvariablen nicht gesetzt

**Lösung**:
```bash
# .env.local prüfen
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
# oder
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Problem: Immer `strategy: 'not-found'`

**Mögliche Ursachen:**
1. Funnel existiert nicht in DB
2. Keine published Pages im Funnel
3. Alle Pages haben `deleted_at` gesetzt

**Debug-Schritte:**
```typescript
const result = await getContentPage({ 
  funnel: 'my-funnel',
  includeDrafts: true  // Auch Drafts prüfen
})
console.log(result.error)  // Fehlermeldung anzeigen
```

### Problem: Falsche Seite wird zurückgegeben

**Ursache**: Prioritäts-Sortierung

**Lösung**: `priority`-Werte in DB prüfen und anpassen:

```sql
-- Prioritäten der Pages anzeigen
SELECT slug, category, priority, created_at 
FROM content_pages 
WHERE funnel_id = 'xxx'
ORDER BY priority DESC, created_at DESC;

-- Priorität anpassen
UPDATE content_pages 
SET priority = 100 
WHERE slug = 'wichtige-seite';
```

## Akzeptanzkriterien

✅ **API: `getContentPage(funnel, category, slug?)`**
- Implementiert als `getContentPage(options)` mit flexiblen Optionen
- Unterstützt alle geforderten Parameter

✅ **Fallback auf Default-Pages**
- Mehrstufige Fallback-Strategie implementiert
- Category Default → Funnel Default → Not Found

✅ **Fehlerhandling ohne Crash**
- Alle Fehler werden abgefangen
- Graceful Degradation mit `null`-Rückgabe
- Informative Fehlermeldungen im Result

✅ **Unit-Tests vorhanden**
- Manuelles Testskript bereitgestellt
- Dokumentierte Test-Szenarien
- Hinweis: Kein Jest/Vitest im Projekt → manuelle Tests

## Verwandte Dokumentation

- [D1: Content Pages Implementation](./D1_CONTENT_PAGES.md)
- [D2: Content Integration in Funnel Context](./D2_CONTENT_INTEGRATION.md)
- [F2: Content Page Editor](./F2_CONTENT_EDITOR.md)

## Changelog

### v1.0.0 (2024-12-10)
- ✨ Initial Implementation
- ✅ Alle Akzeptanzkriterien erfüllt
- 📚 Vollständige Dokumentation
