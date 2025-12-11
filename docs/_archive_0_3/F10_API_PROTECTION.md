# F10 – API-Schutz für Content-CRUD

## Übersicht

F10 implementiert die Absicherung der Content-CRUD-APIs mit rollenbasierter Zugriffskontrolle:

- **Write-Operations** (POST, PATCH, DELETE) nur für Admin/Clinician
- **GET-Operations** für öffentliche Endpunkte geben nur publizierte Inhalte zurück
- **Unit-Tests** für alle Rollenprüfungen

## Implementierte Endpoints

### Admin Content Pages API

Alle Endpunkte unter `/api/admin/content-pages/*` erfordern Authentifizierung mit Admin- oder Clinician-Rolle:

#### GET `/api/admin/content-pages`
- **Berechtigung**: Admin oder Clinician
- **Funktion**: Liste aller Content Pages (inkl. Drafts)
- **Response**: Array von Content Pages mit Funnel-Metadaten

#### POST `/api/admin/content-pages`
- **Berechtigung**: Admin oder Clinician
- **Funktion**: Neue Content Page erstellen
- **Body**: `{ title, slug, body_markdown, status, ... }`
- **Validierung**: 
  - Pflichtfelder (title, slug, body_markdown, status)
  - Slug-Format (nur lowercase, Zahlen, Bindestriche)
  - Status-Werte (draft, published, archived)

#### GET `/api/admin/content-pages/[id]`
- **Berechtigung**: Admin oder Clinician
- **Funktion**: Einzelne Content Page für Bearbeitung abrufen
- **Response**: Content Page mit Sections und Funnel-Daten

#### PATCH `/api/admin/content-pages/[id]`
- **Berechtigung**: Admin oder Clinician
- **Funktion**: Content Page aktualisieren
- **Body**: `{ title, slug, body_markdown, status, ... }`
- **Validierung**: Wie bei POST

#### DELETE `/api/admin/content-pages/[id]` ✨ NEU
- **Berechtigung**: Admin oder Clinician
- **Funktion**: Content Page löschen (kaskadiert zu Sections)
- **Response**: `{ success: true }`

### Content Page Sections API

#### GET `/api/admin/content-pages/[id]/sections`
- **Berechtigung**: Admin oder Clinician
- **Funktion**: Alle Sections einer Content Page abrufen

#### POST `/api/admin/content-pages/[id]/sections`
- **Berechtigung**: Admin oder Clinician
- **Funktion**: Neue Section erstellen

#### PATCH `/api/admin/content-pages/[id]/sections/[sectionId]`
- **Berechtigung**: Admin oder Clinician
- **Funktion**: Section aktualisieren

#### DELETE `/api/admin/content-pages/[id]/sections/[sectionId]`
- **Berechtigung**: Admin oder Clinician
- **Funktion**: Section löschen

### Öffentliche API

#### GET `/api/content-pages/[slug]`
- **Berechtigung**: Keine (öffentlich)
- **Einschränkung**: Gibt nur Content Pages mit `status='published'` zurück
- **Funktion**: Content Page für öffentliche Anzeige (z.B. in Funnel)

## Auth Helper Module

### Datei: `lib/api/authHelpers.ts`

Wiederverwendbare Authentifizierungs-Helfer für API-Routen:

#### `requireAuth(): Promise<AuthCheckResult>`
Prüft, ob der Benutzer authentifiziert ist.

```typescript
const { user, error } = await requireAuth()
if (error) return error
// user ist verfügbar
```

#### `requireAdminOrClinicianRole(): Promise<AuthCheckResult>`
Prüft Authentifizierung UND Admin/Clinician-Rolle.

```typescript
const { user, error } = await requireAdminOrClinicianRole()
if (error) return error
// user hat Admin- oder Clinician-Rolle
```

#### `hasRole(user: User, requiredRole: string): boolean`
Prüft, ob ein Benutzer eine bestimmte Rolle hat.

```typescript
if (hasRole(user, 'admin')) {
  // Benutzer ist Admin
}
```

#### `hasAnyRole(user: User, requiredRoles: string[]): boolean`
Prüft, ob ein Benutzer eine der angegebenen Rollen hat.

```typescript
if (hasAnyRole(user, ['admin', 'clinician'])) {
  // Benutzer hat Schreibrechte
}
```

## Unit Tests

### Datei: `lib/api/__tests__/authHelpers.test.ts`

**17 Tests** decken alle Szenarien ab:

#### hasRole Tests
- ✅ Admin-Rolle in app_metadata
- ✅ Clinician-Rolle korrekt
- ✅ Patient-Rolle korrekt
- ✅ Keine Rolle gesetzt

#### hasAnyRole Tests
- ✅ Admin in Liste von erlaubten Rollen
- ✅ Clinician in Liste
- ✅ Patient nicht in Liste
- ✅ Leeres Rollen-Array
- ✅ Einzelne Rolle

#### Content CRUD Szenarien
- ✅ Admin hat Zugriff
- ✅ Clinician hat Zugriff
- ✅ Patient hat KEINEN Zugriff
- ✅ Unauthentifizierter Benutzer hat KEINEN Zugriff

#### Edge Cases
- ✅ Rolle in user_metadata als Fallback
- ✅ app_metadata hat Vorrang vor user_metadata

### Tests ausführen

```bash
# Alle Tests
npm test

# Tests im Watch-Modus
npm run test:watch

# Mit Coverage
npm run test:coverage
```

## Sicherheitsaspekte

### Authentifizierung
- Alle Admin-Endpunkte prüfen Supabase Auth Session
- Session wird aus HTTP-Only Cookies gelesen
- Fehlende Auth → 401 Unauthorized

### Autorisierung
- Rolle wird aus `user.app_metadata.role` gelesen (Fallback: `user.user_metadata.role`)
- Nur `admin` und `clinician` Rollen haben Schreibzugriff
- `patient` Rolle hat nur Lesezugriff auf publizierte Inhalte
- Fehlende Berechtigung → 403 Forbidden

### Datenintegrität
- Slug-Validierung verhindert Injektion
- Status-Validierung beschränkt auf erlaubte Werte
- Foreign Key Constraints in DB verhindern Dateninkonsistenz
- Soft-Delete Support mit `deleted_at` Feld

### Server-Side Prüfung
- **Wichtig**: Auth-Prüfung erfolgt ausschließlich server-side
- Client-Side Role Checks sind nur für UX, nicht für Sicherheit
- Service Role Key für Admin-Operationen (nicht im Client verfügbar)

## Verwendungsbeispiel

### In einer API-Route

```typescript
import { requireAdminOrClinicianRole } from '@/lib/api/authHelpers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Prüfe Auth + Rolle
  const { user, error } = await requireAdminOrClinicianRole()
  if (error) return error

  // User ist authentifiziert und hat Clinician/Admin-Rolle
  const body = await request.json()
  
  // ... Business Logic
  
  return NextResponse.json({ success: true })
}
```

### Mit hasAnyRole für flexible Berechtigungen

```typescript
import { requireAuth, hasAnyRole } from '@/lib/api/authHelpers'

const { user, error } = await requireAuth()
if (error) return error

if (!hasAnyRole(user, ['admin', 'clinician'])) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

## Error Responses

Alle Endpunkte folgen der gleichen Error-Response-Struktur:

```typescript
{
  "error": "Unauthorized" | "Forbidden" | "Server configuration error" | ...,
  "status": 401 | 403 | 500 | ...
}
```

## Akzeptanzkriterien

✅ **POST/PATCH/DELETE** → nur mit gültiger Rolle (Admin/Clinician)
✅ **GET** → Patienten erhalten nur publizierte Inhalte
✅ **Unit-Tests** für Rollenprüfung (17 passing tests)

## Weitere Dokumentation

- [F2: Content Editor](F2_CONTENT_EDITOR.md) - Content Management UI
- [D1: Content Pages](D1_CONTENT_PAGES.md) - Content Rendering System
- [Auth Flow](AUTH_FLOW.md) - Authentifizierungs-Ablauf
- [Clinician Auth](CLINICIAN_AUTH.md) - Clinician Setup
