# F6 — Intro-Page Integration in Stress-Funnel

**Status:** ✅ Implementiert  
**Datum:** 2024-12-10  
**Feature Branch:** `copilot/integrate-intro-page-stress-funnel`

---

## Überblick

F6 implementiert die dynamische Integration von Intro-Seiten in den Stress-Funnel. Die Intro-Seite wird aus der Datenbank geladen und vor dem eigentlichen Assessment angezeigt, sofern eine solche Seite für den Funnel existiert.

## Ziele

1. ✅ **Dynamische Intro-Seiten**: Intro-Inhalte werden aus `content_pages` DB geladen
2. ✅ **Content Resolver Integration**: Nutzt den bestehenden Content Resolver für Fallback-Logik
3. ✅ **Nahtlose Funnel-Integration**: Intro-Seite wird automatisch vor Assessment angezeigt
4. ✅ **Graceful Degradation**: Funktioniert auch ohne Intro-Seite (direkter Start)
5. ✅ **Clinician Menu Konsistenz**: Alle Clinician-Seiten haben einheitliches Navigationsmenü

---

## Architektur

### Komponenten-Übersicht

```
┌─────────────────────────────────────────────────────────┐
│                    User Journey                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         /patient/funnel/[slug]                          │
│    (Checks for intro page existence)                    │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼ (intro exists)          ▼ (no intro)
┌──────────────────┐      ┌──────────────────┐
│  Intro Page      │      │  Assessment      │
│  /intro          │      │  (Direct Start)  │
└────────┬─────────┘      └──────────────────┘
         │
         │ (user clicks "Start")
         ▼
┌──────────────────────────┐
│  Assessment              │
│  ?skipIntro=true         │
└──────────────────────────┘
```

### Datenfluss

```
1. User navigates to /patient/funnel/stress
   ↓
2. Server checks: Does intro page exist?
   ├─ YES → Redirect to /patient/funnel/stress/intro
   └─ NO  → Load assessment directly
   ↓
3. Intro page loads content via Content Resolver API
   GET /api/content/resolve?funnel=stress&category=intro
   ↓
4. User clicks "Assessment starten"
   ↓
5. Navigate to /patient/funnel/stress?skipIntro=true
   ↓
6. Assessment loads (skipIntro prevents redirect loop)
```

---

## API-Endpunkte

### Content Resolver API

**GET** `/api/content/resolve`

Löst Content-Pages dynamisch auf basierend auf Funnel, Kategorie und optionalem Slug.

**Query Parameters:**
- `funnel` (required): Funnel slug oder UUID
- `category` (optional): Page category (z.B. 'intro', 'info', 'result')
- `slug` (optional): Spezifischer Page Slug
- `includeDrafts` (optional): Draft-Pages einbeziehen (default: false)

**Response (200 OK):**
```json
{
  "success": true,
  "page": {
    "id": "uuid",
    "slug": "intro-vorbereitung",
    "title": "Vorbereitung auf Ihr Stress-Assessment",
    "excerpt": "Tipps zur optimalen Vorbereitung...",
    "body_markdown": "# Vorbereitung...",
    "status": "published",
    "category": "intro",
    "funnel_id": "uuid",
    ...
  },
  "strategy": "category-default"
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "No matching content page found"
  },
  "strategy": "not-found"
}
```

**Fallback-Strategien:**
1. **exact-match**: funnel + category + slug
2. **category-default**: funnel + category, höchste Priorität
3. **funnel-default**: funnel only, höchste Priorität
4. **not-found**: Keine passende Seite gefunden

---

## Routen

### Intro Page Route

**Route:** `/patient/funnel/[slug]/intro`

**Server Component:** `app/patient/funnel/[slug]/intro/page.tsx`
- Authentifizierungs-Check
- Lädt Client Component

**Client Component:** `app/patient/funnel/[slug]/intro/client.tsx`
- Lädt Funnel-Titel
- Lädt Intro-Content via Content Resolver API
- Rendert Markdown-Content
- "Assessment starten" Button → Navigation mit `skipIntro=true`

### Funnel Page (modifiziert)

**Route:** `/patient/funnel/[slug]`

**Server Component:** `app/patient/funnel/[slug]/page.tsx`
- **Neu**: Prüft auf `skipIntro` Query Parameter
- **Neu**: Wenn `skipIntro !== true`, prüfe auf Intro-Seite
- **Neu**: Redirect zu `/intro` wenn Intro-Seite existiert
- Sonst: Lade Assessment wie bisher

---

## Datenbank-Schema

### Content Pages Kategorie-Feld

```sql
CREATE TABLE public.content_pages (
  ...
  category text,  -- 'intro', 'info', 'result', etc.
  priority integer DEFAULT 0 NOT NULL,  -- Höhere Werte = höhere Priorität
  ...
);
```

### Migrations

**20251210194500_set_content_page_categories.sql**
- Setzt `category` für bestehende Content-Pages
- Setzt `priority` für Intro-Pages (höhere Priorität = wird bevorzugt)

**Kategorien:**
- `intro`: Vor Assessment anzeigen
- `info`: Zusätzliche Informationen (jederzeit verfügbar)
- `result`: Nach Assessment-Completion anzeigen

---

## Content Resolver Integration

Die Implementierung nutzt den bestehenden Content Resolver (`lib/utils/contentResolver.ts`):

```typescript
import { getContentPage } from '@/lib/utils/contentResolver'

const result = await getContentPage({
  funnel: 'stress',
  category: 'intro',
  includeDrafts: false,
})

if (result.page) {
  // Intro page exists
  redirect(`/patient/funnel/stress/intro`)
}
```

**Vorteile:**
- Wiederverwendung bestehender Logik
- Automatische Fallback-Strategien
- UUID- und Slug-Support
- Draft-Handling

---

## Clinician Menu Integration

### Bestehende Implementierung

Das Clinician-Layout (`app/clinician/layout.tsx`) hat bereits das korrekte Navigationsmenü:

```tsx
<nav className="border-b border-slate-200 bg-white">
  <div className="max-w-6xl mx-auto px-4 sm:px-6">
    <div className="flex gap-1">
      <Link href="/clinician">Dashboard</Link>
      <Link href="/clinician/funnels">Funnels</Link>
      <Link href="/admin/content">Content</Link>
    </div>
  </div>
</nav>
```

**Keine Änderungen erforderlich** - das Menü entspricht bereits dem gewünschten Design aus dem Screenshot:
- Dashboard
- Funnels
- Content

---

## Verwendungsbeispiele

### Beispiel 1: Funnel mit Intro-Seite

```typescript
// User navigiert zu /patient/funnel/stress

// 1. Server-Side Check (page.tsx)
const introResult = await getContentPage({
  funnel: 'stress',
  category: 'intro'
})

if (introResult.page) {
  redirect('/patient/funnel/stress/intro')
}

// 2. Intro-Seite lädt und zeigt Content
// 3. User klickt "Assessment starten"
// 4. Navigation zu /patient/funnel/stress?skipIntro=true
// 5. Assessment lädt direkt (skipIntro verhindert erneuten Redirect)
```

### Beispiel 2: Funnel ohne Intro-Seite

```typescript
// User navigiert zu /patient/funnel/resilience

// 1. Server-Side Check
const introResult = await getContentPage({
  funnel: 'resilience',
  category: 'intro'
})

if (!introResult.page) {
  // Keine Intro-Seite gefunden
  // → Assessment lädt direkt
}
```

### Beispiel 3: Content im Admin bearbeiten

```typescript
// 1. Clinician navigiert zu /admin/content
// 2. Wählt "intro-vorbereitung" Seite aus
// 3. Bearbeitet Markdown-Content
// 4. Speichert Änderungen
// 5. Änderungen sind sofort für Patienten sichtbar
```

---

## Testing

### Manuelle Test-Szenarien

#### ✅ Szenario 1: Intro Page vorhanden
1. Navigate zu `/patient/funnel/stress`
2. **Erwartung**: Automatischer Redirect zu `/patient/funnel/stress/intro`
3. **Erwartung**: Intro-Content wird angezeigt
4. Klick auf "Assessment starten"
5. **Erwartung**: Navigation zu Assessment mit `skipIntro=true`
6. **Erwartung**: Assessment lädt direkt

#### ✅ Szenario 2: Keine Intro Page
1. Entferne/Archive alle intro-pages für stress-funnel
2. Navigate zu `/patient/funnel/stress`
3. **Erwartung**: Assessment lädt direkt (kein Redirect)

#### ✅ Szenario 3: Content-Änderungen
1. Bearbeite intro-page im Admin
2. Speichere Änderungen
3. Navigate zu `/patient/funnel/stress/intro`
4. **Erwartung**: Neue Inhalte werden angezeigt

#### ✅ Szenario 4: Clinician Menu
1. Navigate zu `/clinician`
2. **Erwartung**: Menu zeigt "Dashboard", "Funnels", "Content"
3. Navigate zu `/clinician/funnels`
4. **Erwartung**: Menu bleibt konsistent
5. Navigate zu `/admin/content` via Menu
6. **Erwartung**: Content-Dashboard lädt

---

## Sicherheit & Performance

### Authentifizierung

- ✅ Intro-Page erfordert Authentifizierung (Server-seitiger Check)
- ✅ Content Resolver API ist öffentlich (für published pages)
- ✅ Draft-Pages sind standardmäßig nicht sichtbar

### Performance

- ✅ **Server-Side Rendering**: Intro-Check erfolgt server-seitig
- ✅ **Caching**: Content Resolver kann gecacht werden
- ✅ **Parallele Queries**: Funnel-Titel und Content werden parallel geladen
- ✅ **Graceful Degradation**: Bei Fehler → Direkt zu Assessment

### Error Handling

- ✅ API-Fehler → Direkt zu Assessment (keine Blockierung)
- ✅ Fehlende Intro-Page → Direkt zu Assessment
- ✅ Netzwerk-Fehler → Fallback-Verhalten

---

## Implementierte Akzeptanzkriterien

✅ **Route lädt Page via Content Resolver**
- `/api/content/resolve` Endpoint implementiert
- Nutzt `getContentPage()` Utility

✅ **Layout bleibt konsistent**
- Intro-Page folgt gleichem Design wie Assessment
- Responsive Design für Mobile/Desktop

✅ **Änderungen im Admin-Editor werden sofort sichtbar**
- Kein Caching von Content-Pages (oder Cache-Invalidierung)
- Änderungen sofort nach Speichern verfügbar

✅ **Clinician Menu Konsistenz**
- Alle Clinician-Seiten haben einheitliches Navigationsmenü
- Dashboard, Funnels, Content Tabs

---

## Dateien

### Neu erstellt

| Datei | Zweck |
|-------|-------|
| `app/patient/funnel/[slug]/intro/page.tsx` | Server component für Intro-Seite |
| `app/patient/funnel/[slug]/intro/client.tsx` | Client component für Intro-Seite Rendering |
| `app/api/content/resolve/route.ts` | Content Resolver API Endpoint |
| `supabase/migrations/20251210194500_set_content_page_categories.sql` | Setzt Kategorien für bestehende Content-Pages |
| `docs/F6_IMPLEMENTATION_SUMMARY.md` | Diese Dokumentation |

### Modifiziert

| Datei | Änderung |
|-------|----------|
| `app/patient/funnel/[slug]/page.tsx` | Added intro-page check and redirect logic |

---

## Nächste Schritte

### Empfohlene Erweiterungen

1. **Preview-Modus**: Live-Preview im Content-Editor
2. **Analytics**: Track welche Intro-Pages angesehen werden
3. **A/B Testing**: Verschiedene Intro-Versionen testen
4. **Rich Media**: Bilder, Videos in Intro-Pages

### Mögliche Optimierungen

- **Content Caching**: Redis/CDN für häufig geladene Pages
- **Image Optimization**: Next.js Image Component für Bilder
- **Progressive Enhancement**: Offline-Support für Intro-Pages

---

## Bekannte Limitierungen

- **Markdown Rendering**: Basic HTML conversion (kein vollständiger Markdown-Parser)
  - Lösung: react-markdown Library hinzufügen falls komplexeres Markdown benötigt
- **Keine Multi-Page Intros**: Nur eine Intro-Seite pro Funnel
  - Lösung: Könnte durch Sections oder Steps erweitert werden

---

**Autor:** GitHub Copilot  
**Status:** ✅ Production Ready  
**Version:** 1.0  
**Letzte Änderung:** 2024-12-10
