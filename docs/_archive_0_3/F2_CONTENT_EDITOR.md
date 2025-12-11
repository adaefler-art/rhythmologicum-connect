# F2 – Content Page Editor

## Übersicht

Das Content Page Editor Feature ermöglicht Kliniker:innen das Erstellen und Bearbeiten von Content-Pages mit vollständiger Markdown-Unterstützung und Live-Vorschau.

## Funktionen

### Felder

Der Editor unterstützt alle erforderlichen Felder:

- **Titel** (erforderlich): Seitentitel
- **Slug** (erforderlich): URL-freundlicher Identifier (nur Kleinbuchstaben, Zahlen, Bindestriche)
- **Kategorie**: Optionale Kategorisierung (z.B. Info, Tutorial, FAQ)
- **Funnel**: Zuordnung zu einem bestehenden Funnel (optional)
- **Priorität**: Numerischer Wert für Sortierung (höher = wichtiger)
- **Auszug**: Kurzbeschreibung für Übersichten
- **Inhalt**: Markdown-Editor mit voller Unterstützung für GitHub Flavored Markdown

### Markdown Editor + Live-Vorschau

Der Editor bietet eine Zwei-Spalten-Ansicht:
- **Links**: Markdown-Editor mit Syntax-Highlighting
- **Rechts**: Live-Vorschau der gerenderten Inhalte
- Toggle-Button zum Ausblenden der Vorschau für mehr Platz

### Aktionen

Drei Hauptaktionen stehen zur Verfügung:
1. **Abbrechen**: Verwirft Änderungen und kehrt zur Übersicht zurück
2. **Als Entwurf speichern**: Speichert die Seite mit Status "draft"
3. **Veröffentlichen**: Speichert die Seite mit Status "published"

### Slug-Validierung

- Automatische Generierung aus dem Titel beim Erstellen neuer Seiten
- Echtzeit-Validierung (nur a-z, 0-9, Bindestriche erlaubt)
- Prüfung auf Duplikate (409 Conflict bei bereits verwendetem Slug)
- Fehlermeldungen bei ungültiger Eingabe

## Verwendung

### Neue Seite erstellen

1. Navigiere zu `/admin/content`
2. Klicke auf "Neue Seite anlegen"
3. Fülle alle erforderlichen Felder aus (Titel, Slug, Inhalt)
4. Füge optional weitere Metadaten hinzu (Kategorie, Funnel, Priorität)
5. Klicke auf "Als Entwurf speichern" oder "Veröffentlichen"

### Seite bearbeiten

1. Navigiere zu `/admin/content`
2. Klicke auf eine beliebige Seite in der Tabelle
3. Bearbeite die Felder nach Bedarf
4. Nutze die Live-Vorschau, um Änderungen zu sehen
5. Speichere die Änderungen

## API Endpunkte

### GET /api/admin/content-pages
Ruft alle Content-Pages ab (für Übersicht)

### POST /api/admin/content-pages
Erstellt eine neue Content-Page

**Request Body:**
```json
{
  "title": "Seitentitel",
  "slug": "seiten-url",
  "body_markdown": "# Markdown-Inhalt",
  "status": "draft",
  "excerpt": "Optional",
  "category": "info",
  "priority": 10,
  "funnel_id": "uuid-oder-null",
  "layout": "default"
}
```

### GET /api/admin/content-pages/[id]
Ruft eine einzelne Content-Page ab (für Bearbeitung)

### PATCH /api/admin/content-pages/[id]
Aktualisiert eine bestehende Content-Page

**Request Body:** Gleich wie POST

## Validierung

### Server-seitig
- Erforderliche Felder: `title`, `slug`, `body_markdown`, `status`
- Slug-Format: Nur `[a-z0-9-]+`
- Slug-Eindeutigkeit: Keine Duplikate erlaubt
- HTTP 400 bei Validierungsfehlern
- HTTP 409 bei Slug-Konflikt

### Client-seitig
- Echtzeit-Validierung für Slug-Format
- Formular-Validierung vor Absenden
- Visuelle Fehlermeldungen
- Deaktivierte Buttons während des Speicherns

## Datenbank-Schema

Die Migration `20251210132500_add_content_pages_category_priority.sql` fügt hinzu:
- `category` (text, nullable)
- `priority` (integer, default 0)
- Index auf `priority` für effiziente Sortierung

## Technische Details

### Komponenten
- **ContentPageEditor**: Hauptkomponente (`app/components/ContentPageEditor.tsx`)
- **MarkdownRenderer**: Wiederverwendbare Markdown-Darstellung
- **New Page**: `/admin/content/new/page.tsx`
- **Edit Page**: `/admin/content/[id]/page.tsx`

### Dependencies
- `react-markdown`: Markdown-Rendering
- `remark-gfm`: GitHub Flavored Markdown Unterstützung
- Beide bereits im Projekt vorhanden

### Styling
- TailwindCSS für konsistentes Design
- Responsive Layout (mobile-first)
- Touch-optimierte Buttons (min-height: 44px)
- Barrierefreie Formulare

## Sicherheit

- Nur Benutzer:innen mit Rolle `clinician` haben Zugriff
- Middleware-basierte Authentifizierung für `/admin/*` Routen
- Server-seitige Validierung aller Eingaben
- Service-Role-Key für Datenbankoperationen
- Slug-Sanitization zur Vermeidung von Injection-Angriffen
