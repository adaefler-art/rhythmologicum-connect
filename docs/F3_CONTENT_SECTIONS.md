# F3 – Content Sections (mehrteilige Seiten)

## Übersicht

Das Content Sections Feature erweitert Content-Pages um die Möglichkeit, mehrere Sections pro Seite zu verwalten. Kliniker:innen können 0-n Sections hinzufügen, bearbeiten, löschen und neu anordnen.

## Funktionen

### Section-Verwaltung

Jede Content-Page kann nun beliebig viele Sections enthalten:

- **Section hinzufügen**: Neue Section mit Titel und Markdown-Inhalt erstellen
- **Section bearbeiten**: Titel und Inhalt einer bestehenden Section ändern
- **Section löschen**: Section entfernen (mit Bestätigungsdialog)
- **Section verschieben**: Reihenfolge per Up/Down-Buttons ändern

### Section-Eigenschaften

Jede Section hat folgende Eigenschaften:
- **Titel** (erforderlich): Überschrift der Section
- **Markdown-Inhalt** (erforderlich): Inhalt der Section in Markdown
- **Reihenfolge**: Automatisch verwaltet über `order_index` (0-basiert)

### Editor-Integration

Der Section-Editor ist nahtlos in den Content Page Editor integriert:
- Erscheint nur im **Bearbeitungsmodus** (nicht beim Erstellen neuer Seiten)
- Zeigt Anzahl der vorhandenen Sections
- Inline-Bearbeitung mit Vorschau-Toggle
- Visuelle Indikatoren für Section-Nummer und Position

## Verwendung

### Section hinzufügen

1. Öffne eine bestehende Content-Page im Bearbeitungsmodus
2. Scrolle zum Abschnitt "Sections"
3. Klicke auf "+ Section hinzufügen"
4. Eine neue Section mit Standard-Titel und -Inhalt wird erstellt
5. Bearbeite die Section sofort oder später

### Section bearbeiten

1. In der Section-Liste, klicke auf das Stift-Symbol
2. Der Inline-Editor wird geöffnet
3. Bearbeite Titel und Markdown-Inhalt
4. Nutze den Preview-Toggle für Live-Vorschau
5. Klicke auf "Speichern" zum Übernehmen oder "Abbrechen" zum Verwerfen

### Section neu anordnen

1. Nutze die Pfeil-nach-oben/unten Buttons neben jeder Section
2. Die erste Section kann nicht weiter nach oben
3. Die letzte Section kann nicht weiter nach unten
4. Änderungen werden sofort gespeichert

### Section löschen

1. Klicke auf das Papierkorb-Symbol neben der Section
2. Bestätige die Löschung im Dialog
3. Die Section wird entfernt und nachfolgende Sections werden automatisch neu nummeriert

## Frontend-Darstellung

### Rendering-Reihenfolge

Sections werden auf der Content-Page in korrekter Reihenfolge dargestellt:
1. Haupt-Markdown-Inhalt der Page (aus `body_markdown`)
2. Sections in aufsteigender Reihenfolge nach `order_index`
3. Jede Section zeigt ihren Titel als H2 und den Markdown-Inhalt

### Layout

- Sections erscheinen unterhalb des Haupt-Inhalts
- Jede Section ist durch einen horizontalen Trennstrich getrennt
- Section-Titel werden als große Überschriften (H2) dargestellt
- Markdown-Rendering mit allen Features (Listen, Code, Links, etc.)

## API Endpunkte

### POST /api/admin/content-pages/[id]/sections
Erstellt eine neue Section für eine Content-Page

**Request Body:**
```json
{
  "title": "Section-Titel",
  "body_markdown": "Section-Inhalt in Markdown"
}
```

**Response:**
```json
{
  "section": {
    "id": "uuid",
    "content_page_id": "uuid",
    "title": "Section-Titel",
    "body_markdown": "Section-Inhalt",
    "order_index": 0,
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

### PATCH /api/admin/content-pages/[id]/sections/[sectionId]
Aktualisiert eine bestehende Section

**Request Body:**
```json
{
  "title": "Neuer Titel",
  "body_markdown": "Neuer Inhalt"
}
```

### DELETE /api/admin/content-pages/[id]/sections/[sectionId]
Löscht eine Section und ordnet verbleibende Sections neu

**Response:**
```json
{
  "success": true
}
```

### POST /api/admin/content-pages/[id]/sections/reorder
Verschiebt eine Section nach oben oder unten

**Request Body:**
```json
{
  "sectionId": "uuid",
  "direction": "up" | "down"
}
```

**Response:**
```json
{
  "sections": [
    // Array aller Sections in neuer Reihenfolge
  ]
}
```

### GET /api/admin/content-pages/[id]
Erweitert um Sections im Response

**Response:**
```json
{
  "contentPage": {
    "id": "uuid",
    "title": "Page Title",
    "sections": [
      {
        "id": "uuid",
        "title": "Section 1",
        "body_markdown": "Content",
        "order_index": 0
      }
    ]
  }
}
```

### GET /api/content-pages/[slug]
Public endpoint, erweitert um Sections

**Response:** Gleiche Struktur wie Admin-Endpoint

## Datenbank-Schema

### Tabelle: content_page_sections

```sql
CREATE TABLE public.content_page_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_page_id uuid NOT NULL REFERENCES public.content_pages(id) ON DELETE CASCADE,
  title text NOT NULL,
  body_markdown text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### Indizes

```sql
-- Effiziente Abfrage nach Page + Sortierung
CREATE INDEX idx_content_page_sections_page_id_order 
  ON content_page_sections (content_page_id, order_index);

-- Eindeutigkeit: Kein doppelter order_index pro Page
CREATE UNIQUE INDEX idx_content_page_sections_unique_order 
  ON content_page_sections (content_page_id, order_index);
```

### Foreign Key Constraints

- `content_page_id` → `content_pages(id)` mit `ON DELETE CASCADE`
- Beim Löschen einer Content-Page werden alle zugehörigen Sections automatisch gelöscht

### Row Level Security (RLS)

Policies für verschiedene Benutzertypen:

1. **Read (Published)**: Authentifizierte Benutzer können Sections von veröffentlichten Pages lesen
2. **Read (All)**: Clinicians können alle Sections lesen (inkl. Drafts)
3. **Insert**: Nur Clinicians können Sections erstellen
4. **Update**: Nur Clinicians können Sections bearbeiten
5. **Delete**: Nur Clinicians können Sections löschen

## TypeScript Types

```typescript
// lib/types/content.ts

export type ContentPageSection = {
  id: string
  content_page_id: string
  title: string
  body_markdown: string
  order_index: number
  created_at: string
  updated_at: string
}

export type ContentPageWithSections = ContentPage & {
  sections?: ContentPageSection[]
}

export type ContentPageWithFunnelAndSections = ContentPageWithFunnel & {
  sections?: ContentPageSection[]
}
```

## Technische Details

### Komponenten

- **ContentPageEditor**: Erweitert um Section-Management (`app/components/ContentPageEditor.tsx`)
- **SectionEditor**: Neue Inline-Komponente für Section-Bearbeitung
- **ContentPageClient**: Erweitert um Section-Rendering (`app/patient/funnel/[slug]/content/[pageSlug]/client.tsx`)

### Reordering-Logik

Die Neuordnung erfolgt durch Tauschen der `order_index`-Werte:

1. Temporärer Index (-1) verhindert Unique-Constraint-Verletzung
2. Target-Section erhält old index der Current-Section
3. Current-Section erhält target index
4. Transaktionssicher durch sequenzielle Updates

### Lösch-Logik

Beim Löschen einer Section:

1. Section wird aus Datenbank entfernt
2. Alle Sections mit höherem `order_index` werden dekrementiert
3. Fallback auf manuelle Updates, falls RPC nicht verfügbar

## Sicherheit

- Nur Benutzer:innen mit Rolle `clinician` können Sections verwalten
- Server-seitige Validierung aller Eingaben
- RLS-Policies schützen Daten auf Datenbankebene
- Cascade Delete verhindert verwaiste Sections
- Bestätigungsdialog vor Löschung

## Migration

Migration: `20251210135300_create_content_page_sections.sql`

- Erstellt `content_page_sections` Tabelle
- Fügt Indizes und Constraints hinzu
- Konfiguriert RLS-Policies
- Vollständig rückwärts-kompatibel (Content-Pages ohne Sections funktionieren weiterhin)

## Limitierungen

- Sections können nur zu **bestehenden** Content-Pages hinzugefügt werden (nicht während Erstellung)
- Grund: Page-ID wird benötigt für Section-Creation
- Workaround: Page zuerst als Draft speichern, dann Sections hinzufügen

## Workflow-Beispiel

Typischer Workflow für mehrteilige Content-Page:

1. Neue Content-Page erstellen mit Titel und Haupt-Inhalt → Als Draft speichern
2. Page öffnen im Bearbeitungsmodus
3. "+ Section hinzufügen" klicken für jede gewünschte Section
4. Sections einzeln bearbeiten mit Titel und Inhalt
5. Sections bei Bedarf neu anordnen mit Up/Down-Buttons
6. Page als "Published" markieren wenn fertig
7. Sections erscheinen automatisch auf der öffentlichen Seite in korrekter Reihenfolge

## Zukünftige Erweiterungen

Mögliche Verbesserungen:
- Drag-and-Drop für Section-Reordering
- Bulk-Actions (mehrere Sections gleichzeitig löschen/verschieben)
- Section-Templates
- Section-Duplikation
- Collapse/Expand für lange Section-Listen im Editor
