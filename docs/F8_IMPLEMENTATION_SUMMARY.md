# F8 – Result-Bausteine dynamisch integrieren

## Übersicht

**Ziel**: Die Ergebnis-Seiten des Stress-Funnels nutzen Content-Bausteine aus der Datenbank statt hardcodiertem Text.

**Status**: ✅ Implementiert

## Akzeptanzkriterien

✅ **Textbausteine via Slug laden**  
Content-Pages werden dynamisch aus der Datenbank geladen über die `contentResolver` API.

✅ **Score-spezifische Logik bleibt im Code**  
Die Berechnung von Stress-Score, Schlaf-Score und Risiko-Einschätzung bleibt vollständig im React-Component.

✅ **Markdown sauber gerendert**  
Die `MarkdownRenderer` Komponente rendert Markdown mit ordentlicher Typografie und Styling.

## Implementierung

### 1. Neue API-Endpunkt: `/api/content-resolver`

**Datei**: `app/api/content-resolver/route.ts`

Dieser Endpunkt nutzt die bestehende `contentResolver` Utility, um Content-Pages aus der Datenbank zu laden.

**Query-Parameter**:
- `funnel` (required): Funnel slug oder UUID (z.B. `stress-assessment`)
- `category` (optional): Kategorie-Filter (z.B. `result`, `intro`, `info`)
- `slug` (optional): Spezifischer Page-Slug
- `includeDrafts` (optional): Auch Entwürfe einbeziehen (Standard: `false`)

**Beispiel-Request**:
```
GET /api/content-resolver?funnel=stress-assessment&category=result
```

**Response**: Array von Content-Pages
```json
[
  {
    "id": "uuid",
    "slug": "result-ergebnis-verstehen",
    "title": "Ihre Ergebnisse verstehen",
    "excerpt": "Was bedeuten die Zahlen?...",
    "body_markdown": "# Ihre Ergebnisse verstehen\n\n...",
    "category": "result",
    "priority": 80,
    "status": "published",
    ...
  }
]
```

### 2. Client-Integration: `StressResultClient.tsx`

**Datei**: `app/patient/stress-check/result/StressResultClient.tsx`

**Änderungen**:

1. **Neue Imports**:
   ```typescript
   import MarkdownRenderer from '@/app/components/MarkdownRenderer'
   import type { ContentPage } from '@/lib/types/content'
   ```

2. **Neuer State für Content-Pages**:
   ```typescript
   const [contentPages, setContentPages] = useState<ContentPage[]>([])
   const [contentLoading, setContentLoading] = useState(true)
   ```

3. **useEffect zum Laden der Content-Pages**:
   ```typescript
   useEffect(() => {
     const loadContentPages = async () => {
       try {
         setContentLoading(true)
         const response = await fetch(
           '/api/content-resolver?funnel=stress-assessment&category=result',
         )
         if (response.ok) {
           const data = await response.json()
           setContentPages(Array.isArray(data) ? data : data.pages || [])
         }
       } catch (error) {
         console.error('Error loading content pages:', error)
       } finally {
         setContentLoading(false)
       }
     }
     loadContentPages()
   }, [])
   ```

4. **Dynamisches Rendering der Content-Blöcke**:
   ```tsx
   {!contentLoading && contentPages.length > 0 && (
     <section className="space-y-4">
       {contentPages.map((page) => (
         <div key={page.id} className="rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
           <h2 className="text-lg font-semibold text-slate-800 mb-3">{page.title}</h2>
           {page.excerpt && (
             <p className="text-sm text-slate-600 mb-3 italic">{page.excerpt}</p>
           )}
           <MarkdownRenderer content={page.body_markdown} />
         </div>
       ))}
     </section>
   )}
   ```

### 3. Datenbank-Content: Migration

**Datei**: `supabase/migrations/20251210210000_add_f8_result_content_blocks.sql`

Diese Migration fügt zwei neue Content-Pages mit Kategorie `result` hinzu:

#### Page 1: "Ihre Ergebnisse verstehen"
- **Slug**: `result-ergebnis-verstehen`
- **Category**: `result`
- **Priority**: 80
- **Sections**: 3 Sektionen
  1. Stress-Score verstehen
  2. Schlaf-Score verstehen
  3. Risiko-Einschätzung verstehen

#### Page 2: "Selbstfürsorge-Empfehlungen"
- **Slug**: `result-selbstfuersorge`
- **Category**: `result`
- **Priority**: 70
- Praktische Übungen: Atemtechniken, Progressive Muskelentspannung, Achtsamkeit, Bewegung, etc.

## Architektur-Diagramm

```
┌─────────────────────────────────────────┐
│   StressResultClient.tsx                │
│   (React Component)                     │
│                                         │
│   [Score Logic] ────┐                   │
│   (bleibt im Code)  │                   │
│                     │                   │
│   [Dynamic Content] │                   │
│   useEffect ────────┼──────────────┐    │
└─────────────────────┼───────────────┼───┘
                      │               │
                      ▼               ▼
           ┌──────────────────────────────┐
           │  /api/content-resolver       │
           │  (API Route)                 │
           └──────────────┬───────────────┘
                          │
                          ▼
           ┌──────────────────────────────┐
           │  contentResolver.ts          │
           │  (Server Utility)            │
           └──────────────┬───────────────┘
                          │
                          ▼
           ┌──────────────────────────────┐
           │  Supabase Database           │
           │  - content_pages             │
           │  - content_page_sections     │
           └──────────────────────────────┘
```

## Vorteile dieser Implementierung

### 1. Trennung von Concerns
- **Presentation Logic** (Scores, Risk Level) → React Component
- **Content Management** → Datenbank
- Dies ermöglicht:
  - Änderung von Texten ohne Code-Deployment
  - A/B-Testing von Content-Varianten
  - Personalisierung basierend auf Nutzer-Eigenschaften (zukünftig)

### 2. Wiederverwendbarkeit
- Die `contentResolver` API kann für andere Seiten/Funnels verwendet werden
- Markdown-Rendering ist konsistent über die gesamte Anwendung
- Content-Sections können wiederverwendet werden

### 3. Skalierbarkeit
- Neue Content-Blöcke können ohne Code-Änderungen hinzugefügt werden
- Priority-Sortierung ermöglicht flexible Content-Reihenfolge
- Sections ermöglichen strukturierte, umfangreiche Inhalte

## Testing

### Manueller Test (lokal mit Datenbank)

1. **Migration ausführen**:
   ```bash
   supabase db reset
   # oder
   supabase migration up
   ```

2. **Dev-Server starten**:
   ```bash
   npm run dev
   ```

3. **Assessment abschließen**:
   - Navigiere zu `/patient/stress-check`
   - Fülle das Assessment aus
   - Schließe ab und öffne die Result-Seite

4. **Erwartetes Verhalten**:
   - AMY-Text wird wie bisher angezeigt
   - Darunter erscheinen 2 neue Content-Blöcke:
     - "Ihre Ergebnisse verstehen" (mit 3 Sections)
     - "Selbstfürsorge-Empfehlungen"
   - Markdown ist sauber formatiert
   - Navigation-Buttons funktionieren

### API-Test (ohne UI)

```bash
# Test content-resolver endpoint
curl "http://localhost:3000/api/content-resolver?funnel=stress-assessment&category=result"

# Erwartete Response: JSON-Array mit 2-3 Content-Pages
```

### TypeScript-Check

```bash
npx tsc --noEmit
# Sollte keine Fehler zeigen
```

### Build-Test

```bash
npm run build
# Sollte erfolgreich durchlaufen
```

## Troubleshooting

### Problem: Content-Pages werden nicht angezeigt

**Mögliche Ursachen**:
1. Migration nicht ausgeführt → `supabase migration up`
2. Content-Pages haben `status = 'draft'` → In DB auf `published` setzen
3. Falsche Kategorie → Content-Pages sollten `category = 'result'` haben
4. Supabase-Verbindung fehlt → `.env.local` prüfen

### Problem: Markdown wird nicht korrekt gerendert

**Lösung**: 
- `MarkdownRenderer` verwendet `react-markdown` mit `remark-gfm`
- Prüfen, ob `react-markdown` installiert ist: `npm list react-markdown`
- Bei Problemen: `npm install react-markdown remark-gfm`

### Problem: API-Endpoint gibt 500 zurück

**Debugging**:
```javascript
// In /api/content-resolver/route.ts
console.log('Funnel:', funnel)
console.log('Category:', category)
console.log('Pages found:', pages.length)
```

**Logs prüfen**:
```bash
# Terminal mit dev server
# Fehler sollten im Terminal sichtbar sein
```

## Zukünftige Erweiterungen

### 1. Personalisierte Content-Blöcke
Zeige unterschiedliche Content-Bausteine basierend auf:
- Risk Level (high/moderate/low)
- Stress-Score Bereich
- Schlaf-Score
- Demografische Daten

**Implementierung**: Erweitere `contentResolver` um Kontext-Parameter

### 2. Content-Versioning
Tracking von Änderungen an Content-Pages:
- Historie anzeigen
- A/B-Test-Varianten verwalten
- Rollback bei Problemen

### 3. Rich Media Support
Über Markdown hinaus:
- Eingebettete Videos
- Interaktive Übungen
- Audio-Anleitungen (z.B. für Atemübungen)

### 4. Analytics
Tracking von Content-Interaktionen:
- Welche Blöcke werden gelesen?
- Wie lange verweilen Nutzer?
- Welche Inhalte führen zu Follow-up-Aktionen?

## Verwandte Dokumentation

- [F5: Content Resolver](./F5_CONTENT_RESOLVER.md) - Utility-Dokumentation
- [D2: Content Integration](./D2_CONTENT_INTEGRATION.md) - Funnel-Context-Integration
- [F6: Content Page Categories](./F6_IMPLEMENTATION_SUMMARY.md) - Kategorie-System
- [F7: Content Page Renderer](./F7_IMPLEMENTATION_SUMMARY.md) - Standalone Content-Pages

## Changelog

### v1.0.0 (2024-12-10)
- ✨ Initial Implementation von F8
- ✅ API-Endpoint `/api/content-resolver` erstellt
- ✅ `StressResultClient` um dynamisches Content-Laden erweitert
- ✅ Migration mit 2 Result-Content-Pages und Sections erstellt
- ✅ Alle Akzeptanzkriterien erfüllt
