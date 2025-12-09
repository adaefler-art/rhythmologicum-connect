# B7 — Clinician Funnel Management UI

## Übersicht

B7 implementiert eine Verwaltungsoberfläche für Clinicians, um Funnel-Definitionen strukturiert zu verwalten. Die Implementierung ermöglicht es, Funnel-Konfigurationen (Required-Flags, Step-Reihenfolge, Aktivierung/Deaktivierung) direkt über die Web-UI zu bearbeiten, ohne direkten Datenbankzugriff zu benötigen.

## Funktionsumfang

### 1. Funnel-Übersicht (`/clinician/funnels`)

- **Liste aller Funnels** mit folgenden Informationen:
  - Titel, Subtitle
  - Slug
  - Status (Aktiv/Inaktiv)
  - Erstellungsdatum
- **Navigation** zum Funnel-Detail via "Details"-Button
- **Zugriffskontrolle**: Nur für Benutzer mit Rolle `clinician`

### 2. Funnel-Detailseite (`/clinician/funnels/[id]`)

- **Funnel-Metadaten**:
  - Titel, Subtitle, Slug
  - Anzahl Steps und Fragen
  - Aktivierungsstatus (Toggle-Button)

- **Step-Verwaltung**:
  - Anzeige aller Steps mit order_index
  - Reihenfolgeanpassung via Auf/Ab-Buttons
  - Step-Typ und Beschreibung
  
- **Fragen-Verwaltung**:
  - Anzeige aller Fragen pro Step
  - Question-Key, Label, Help-Text
  - Question-Type
  - Required-Status (Toggle-Button)

### 3. Bearbeitungsfunktionen

#### Funnel Aktivierung/Deaktivierung
- Toggle-Button zum Ändern des `is_active` Status
- Visuelle Statusanzeige (Grün=Aktiv, Grau=Inaktiv)
- Sofortige Aktualisierung ohne Seitenneuladung

#### Step-Reihenfolge
- Auf/Ab-Buttons zum Verschieben von Steps
- Automatisches Swapping der `order_index` Werte
- Buttons deaktiviert am Anfang/Ende der Liste
- Neuladung der Daten nach erfolgreicher Änderung

#### Question Required-Flag
- Toggle-Button für jede Frage
- Ändert `is_required` in `funnel_step_questions` Tabelle
- Visuelle Statusanzeige (Orange=Pflicht, Grau=Optional)
- Sofortige Datenbankaktualisierung

## Technische Implementierung

### Backend API Routes

#### 1. `GET /api/admin/funnels`
Liefert Liste aller Funnels für die Übersichtsseite.

**Auth**: Requires `clinician` role

**Response**:
```json
{
  "funnels": [
    {
      "id": "uuid",
      "slug": "stress",
      "title": "Stress Assessment",
      "subtitle": "...",
      "description": "...",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### 2. `GET /api/admin/funnels/[id]`
Liefert vollständige Funnel-Details mit Steps und Questions.

**Auth**: Requires `clinician` role

**Response**:
```json
{
  "funnel": { /* Funnel object */ },
  "steps": [
    {
      "id": "uuid",
      "funnel_id": "uuid",
      "order_index": 0,
      "title": "Step 1",
      "description": "...",
      "type": "question_step",
      "questions": [
        {
          "id": "uuid",
          "key": "q1_stress_level",
          "label": "Wie gestresst fühlen Sie sich?",
          "help_text": "...",
          "question_type": "scale",
          "funnel_step_question_id": "uuid",
          "is_required": true,
          "order_index": 0
        }
      ]
    }
  ]
}
```

#### 3. `PATCH /api/admin/funnels/[id]`
Aktualisiert Funnel-Eigenschaften (derzeit nur `is_active`).

**Auth**: Requires `clinician` role

**Request Body**:
```json
{
  "is_active": true
}
```

**Response**:
```json
{
  "funnel": { /* Updated funnel object */ }
}
```

#### 4. `PATCH /api/admin/funnel-steps/[id]`
Aktualisiert Step-Reihenfolge.

**Auth**: Requires `clinician` role

**Request Body**:
```json
{
  "order_index": 2
}
```

**Response**:
```json
{
  "step": { /* Updated step object */ }
}
```

#### 5. `PATCH /api/admin/funnel-step-questions/[id]`
Aktualisiert Question Required-Status.

**Auth**: Requires `clinician` role

**Request Body**:
```json
{
  "is_required": false
}
```

**Response**:
```json
{
  "question": { /* Updated funnel_step_question object */ }
}
```

### Frontend-Komponenten

#### `/app/clinician/funnels/page.tsx`
- Client Component mit `force-dynamic` rendering
- Lädt Funnel-Liste via `/api/admin/funnels`
- Zeigt Status-Badges (Aktiv/Inaktiv)
- Navigation zu Detail-Seiten

#### `/app/clinician/funnels/[id]/page.tsx`
- Client Component mit `force-dynamic` rendering
- Lädt Funnel-Details via `/api/admin/funnels/[id]`
- Implementiert alle Bearbeitungsfunktionen:
  - `toggleFunnelActive()` - Funnel aktivieren/deaktivieren
  - `toggleQuestionRequired()` - Required-Status ändern
  - `moveStep()` - Step-Reihenfolge ändern
- Optimistische UI mit Loading-States
- Error-Handling mit Alert-Dialogen

### Navigation

Navigation-Link wurde im Clinician Layout ergänzt:
- Dashboard (bestehend)
- **Funnels (neu)**

## Sicherheit

### Authentifizierung & Autorisierung

1. **Middleware-Protection**: Alle `/clinician/*` Routes sind durch `middleware.ts` geschützt
2. **API-Level Auth**: Jeder API-Endpoint prüft:
   - User-Authentifizierung via `supabase.auth.getUser()`
   - Clinician-Rolle via `user.app_metadata.role === 'clinician'`
3. **Service Role**: API-Endpunkte verwenden Supabase Service Role Key für Admin-Operationen

### Error-Handling

- 401 Unauthorized: Bei fehlender Authentifizierung
- 403 Forbidden: Bei fehlender Clinician-Rolle
- 404 Not Found: Bei nicht existierenden Funnels
- 500 Server Error: Bei Datenbankfehlern
- Detailliertes Logging aller Fehler

## Datenbankzugriff

Die Implementierung nutzt folgende Tabellen:

- **`funnels`**: Funnel-Metadaten (title, slug, is_active)
- **`funnel_steps`**: Step-Definitionen (order_index, title, type)
- **`funnel_step_questions`**: Question-Assignment (is_required, order_index)
- **`questions`**: Question-Definitionen (label, key, question_type)

## Verwendung

### Als Clinician

1. **Anmelden** als Benutzer mit Rolle `clinician`
2. **Navigation** zu "Funnels" im Dashboard
3. **Funnel auswählen** via "Details"-Button
4. **Bearbeitungen durchführen**:
   - Funnel aktivieren/deaktivieren
   - Step-Reihenfolge anpassen
   - Required-Status von Fragen ändern
5. Änderungen werden **automatisch gespeichert**

### Beispiel-Workflow: Step-Reihenfolge ändern

1. Funnel-Detailseite öffnen
2. Step identifizieren, der verschoben werden soll
3. Auf "↑" oder "↓" Button klicken
4. System tauscht `order_index` mit dem darüber/darunter liegenden Step
5. Seite aktualisiert sich automatisch

## Einschränkungen & Zukünftige Erweiterungen

### Aktuelle Einschränkungen

- **Nur Bearbeitung**: Keine Funktion zum Erstellen oder Löschen von Funnels
- **Keine Question-Bearbeitung**: Labels und Texte können nicht geändert werden
- **Keine Step-Bearbeitung**: Titel und Beschreibungen nicht änderbar
- **Einfache Reordering-Logic**: Nur Auf/Ab, kein Drag & Drop

### Mögliche Erweiterungen (außerhalb B7-Scope)

- Funnel erstellen/löschen
- Question-Texte inline editieren
- Step-Details bearbeiten
- Drag & Drop für Reordering
- Bulk-Operations (mehrere Fragen auf einmal ändern)
- Vorschau-Funktion für Änderungen
- Änderungshistorie / Audit Log
- Export/Import von Funnel-Definitionen

## Testing

### Manuelle Tests

1. **Zugriffskontrolle**:
   - [ ] Als nicht-authentifizierter User → Redirect zu Login
   - [ ] Als Patient → Redirect mit Access Denied
   - [ ] Als Clinician → Zugriff gewährt

2. **Funnel-Liste**:
   - [ ] Alle Funnels werden angezeigt
   - [ ] Status-Badges korrekt (Aktiv/Inaktiv)
   - [ ] Details-Button navigiert korrekt

3. **Funnel-Detail**:
   - [ ] Metadaten korrekt angezeigt
   - [ ] Alle Steps in richtiger Reihenfolge
   - [ ] Alle Questions pro Step angezeigt

4. **Is_Active Toggle**:
   - [ ] Button zeigt aktuellen Status
   - [ ] Toggle funktioniert
   - [ ] Status wird persistiert
   - [ ] UI aktualisiert sich

5. **Step Reordering**:
   - [ ] Auf-Button verschiebt Step nach oben
   - [ ] Ab-Button verschiebt Step nach unten
   - [ ] Buttons am Anfang/Ende deaktiviert
   - [ ] Änderungen werden persistiert

6. **Question Required Toggle**:
   - [ ] Button zeigt aktuellen Status
   - [ ] Toggle funktioniert
   - [ ] Änderung wird persistiert
   - [ ] UI aktualisiert sich

### API-Tests

```bash
# Als Clinician authentifiziert:

# Funnel-Liste abrufen
curl -X GET http://localhost:3000/api/admin/funnels \
  -H "Cookie: sb-access-token=..."

# Funnel-Details abrufen
curl -X GET http://localhost:3000/api/admin/funnels/[funnel-id] \
  -H "Cookie: sb-access-token=..."

# Funnel aktivieren
curl -X PATCH http://localhost:3000/api/admin/funnels/[funnel-id] \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{"is_active": true}'

# Step-Reihenfolge ändern
curl -X PATCH http://localhost:3000/api/admin/funnel-steps/[step-id] \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{"order_index": 2}'

# Question Required ändern
curl -X PATCH http://localhost:3000/api/admin/funnel-step-questions/[question-id] \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{"is_required": false}'
```

## Fehlerbehebung

### Build-Fehler: "supabaseUrl is required"

**Problem**: Client Components werden während Build prerendered.

**Lösung**: `export const dynamic = 'force-dynamic'` zu Client Components hinzufügen.

### 401 Unauthorized bei API-Aufrufen

**Problem**: Session-Cookie nicht gesetzt oder abgelaufen.

**Lösung**: 
- Erneut anmelden
- Cookie-Einstellungen im Browser prüfen
- Supabase Auth-Setup verifizieren

### 403 Forbidden trotz Login

**Problem**: User hat nicht die Rolle `clinician`.

**Lösung**: Rolle in Supabase Auth zuweisen (siehe `docs/CLINICIAN_AUTH.md`).

### Step-Reordering funktioniert nicht

**Problem**: Datenbankkonflikt oder Race Condition.

**Lösung**:
- Seite neu laden
- Logs in Browser DevTools prüfen
- Datenbankverbindung verifizieren

## Architektur-Entscheidungen

### Warum Service Role Key für Admin-Operationen?

Funnel-Management ist eine Admin-Funktion, die Row Level Security (RLS) umgehen muss. Die API-Endpunkte prüfen die Berechtigung manuell und verwenden dann den Service Role Key für Datenbankoperationen.

### Warum Client Components?

Die Management-UI erfordert intensive Interaktivität (Toggles, Reordering). Client Components ermöglichen optimistische Updates und bessere UX ohne Full-Page-Reloads.

### Warum separate API-Endpunkte für Steps und Questions?

Granulare API-Endpunkte ermöglichen:
- Klare Verantwortlichkeiten
- Besseres Error-Handling
- Einfachere Berechtigungsprüfung
- Potenzielle zukünftige Erweiterungen

## Verwandte Dokumentation

- **B1_IMPLEMENTATION.md**: Funnel Definition API
- **CLINICIAN_AUTH.md**: Clinician Role Setup
- **AUTH_FLOW.md**: Authentifizierungsfluss
- **FEATURE_FLAGS.md**: Feature Flag Konfiguration

## Changelog

### Version 1.0 (B7 Initial Release)
- Funnel-Übersicht für Clinicians
- Funnel-Detailseite mit Steps und Questions
- Is_Active Toggle für Funnels
- Step-Reordering (Auf/Ab)
- Question Required Toggle
- Vollständige Authentifizierung und Autorisierung
- API-Endpunkte für alle CRUD-Operationen
