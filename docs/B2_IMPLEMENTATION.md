# B2 Save-Logic für neue Messungen - Implementation Details

## Zusammenfassung

Implementierung der automatischen Speicherung von Messungen beim Abschluss eines Assessments mit idempotenter Logik.

## Implementierte Änderungen

### 1. Datenbank-Migration: `patient_measures` Tabelle

**Datei:** `supabase/migrations/20241204210000_create_patient_measures_table.sql`

Erstellt eine neue Tabelle zur Verfolgung abgeschlossener Messungen:

- `id`: UUID Primary Key
- `assessment_id`: UUID UNIQUE (verhindert Duplikate)
- `patient_id`: UUID (für Abfragen nach Patient)
- `measurement_type`: TEXT (z.B. 'stress', 'sleep')
- `status`: TEXT ('completed', 'in_progress', 'failed')
- `completed_at`: TIMESTAMPTZ
- `created_at`, `updated_at`: TIMESTAMPTZ mit Auto-Update Trigger

**Wichtig:** Der UNIQUE Constraint auf `assessment_id` ist der Kern der Idempotenz-Logik.

### 2. API-Endpunkt: `/api/patient-measures/save`

**Datei:** `app/api/patient-measures/save/route.ts`

Neue POST-API mit folgender Logik:

```typescript
1. Prüfen ob Messung bereits existiert (SELECT mit assessment_id)
   → Wenn ja: Existierenden Eintrag zurückgeben (isNew: false)
   
2. Assessment-Daten laden (patient_id, funnel)
   → Wenn nicht gefunden: 404 Error
   
3. Neuen Eintrag erstellen (INSERT)
   → Bei Unique Constraint Violation (Code 23505):
     - Race Condition behandeln
     - Existierenden Eintrag erneut laden und zurückgeben
   → Bei anderen Fehlern: 500 Error mit Logging
```

**Error Handling:**
- Alle Fehler werden in die Console geloggt
- Sinnvolle Fehlermeldungen für verschiedene Szenarien
- Race Conditions werden abgefangen

### 3. Frontend-Integration

**Datei:** `app/patient/stress-check/result/StressResultClient.tsx`

Automatischer Aufruf beim Laden der Ergebnis-Seite:

```typescript
1. Patient-Messung speichern (/api/patient-measures/save)
   → Fehler werden geloggt, blockieren aber nicht die UX
   
2. Stress-Report generieren (/api/amy/stress-report)
   → Wie bisher
```

**Design-Entscheidung:** 
- Fehler beim Speichern der Messung werden nur geloggt
- Die UX wird nicht blockiert, falls das Speichern fehlschlägt
- Report-Generierung läuft trotzdem

### 4. Dokumentation

**Datei:** `supabase/README.md`

Erweitert um:
- Schema der `patient_measures` Tabelle
- Verwendungsbeispiele
- Erklärung der Idempotenz-Logik

## Akzeptanzkriterien - Erfüllung

✅ **Eine abgeschlossene Messung wird genau einmal gespeichert**
- UNIQUE Constraint auf `assessment_id` verhindert Duplikate auf DB-Ebene

✅ **Idempotente Logik**
- API prüft vor INSERT, ob bereits ein Eintrag existiert
- Bei Duplicate Key Error (23505) wird existierender Eintrag zurückgegeben
- Race Conditions werden behandelt

✅ **Fehler werden geloggt und ans Frontend gemeldet**
- Alle Fehler werden mit `console.error()` geloggt
- API gibt strukturierte JSON-Fehler zurück
- Frontend loggt Fehler in Console (blockiert aber nicht die UX)

## Testen

### Voraussetzungen

1. Migration anwenden:
   ```bash
   # Im Supabase Dashboard SQL ausführen:
   # Inhalt von supabase/migrations/20241204210000_create_patient_measures_table.sql
   ```

### Test-Szenarien

#### 1. Normaler Flow - Erstes Speichern

```
1. Fragebogen ausfüllen und abschicken
2. Zur Ergebnis-Seite weitergeleitet werden
3. In Console prüfen: "Patient measure saved: { ... isNew: true }"
4. In Supabase prüfen: Eintrag in patient_measures vorhanden
```

#### 2. Idempotenz - Seite neu laden

```
1. Ergebnis-Seite neu laden (F5)
2. In Console prüfen: "Patient measure saved: { ... isNew: false }"
3. In Supabase prüfen: Immer noch nur 1 Eintrag für diese assessment_id
```

#### 3. Race Condition - Parallel Requests

```javascript
// In Browser Console auf Ergebnis-Seite:
const assessmentId = new URLSearchParams(window.location.search).get('assessmentId')

// Mehrere Requests parallel senden
Promise.all([
  fetch('/api/patient-measures/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assessmentId })
  }),
  fetch('/api/patient-measures/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assessmentId })
  }),
  fetch('/api/patient-measures/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assessmentId })
  })
]).then(responses => Promise.all(responses.map(r => r.json())))
  .then(console.log)

// Erwartet: Alle 3 Responses erfolgreich
// Einer hat isNew: true, zwei haben isNew: false
// In Supabase: Nur 1 Eintrag
```

#### 4. Fehlerfall - Ungültige Assessment-ID

```javascript
fetch('/api/patient-measures/save', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ assessmentId: 'invalid-uuid' })
}).then(r => r.json()).then(console.log)

// Erwartet: 404 mit "Assessment nicht gefunden"
```

### Manuelle DB-Prüfung

```sql
-- Alle Messungen anzeigen
SELECT * FROM patient_measures 
ORDER BY completed_at DESC;

-- Messungen mit Assessment-Details
SELECT 
  pm.*,
  a.funnel,
  a.created_at as assessment_created
FROM patient_measures pm
JOIN assessments a ON a.id = pm.assessment_id
ORDER BY pm.completed_at DESC;

-- Prüfen ob Duplikate existieren (sollte leer sein)
SELECT assessment_id, COUNT(*) as count
FROM patient_measures
GROUP BY assessment_id
HAVING COUNT(*) > 1;
```

## Sicherheit

- ✅ Keine SQL-Injection (Supabase Client verwendet Prepared Statements)
- ✅ UNIQUE Constraint verhindert Duplikate auf DB-Ebene
- ✅ Foreign Key Constraint zu `assessments` mit CASCADE
- ✅ Alle Fehler werden geloggt, sensible Daten nicht exponiert
- ✅ Service Role Key wird nur serverseitig verwendet

## Offene Punkte

1. **Migration muss angewendet werden:** SQL-Datei im Supabase Dashboard ausführen
2. **RLS Policies:** Row Level Security für `patient_measures` Tabelle konfigurieren
3. **Monitoring:** Produktions-Logs überwachen für Fehler beim Speichern

## Dateien

| Datei | Zweck |
|-------|-------|
| `supabase/migrations/20241204210000_create_patient_measures_table.sql` | DB-Migration |
| `app/api/patient-measures/save/route.ts` | Save-API Endpunkt |
| `app/patient/stress-check/result/StressResultClient.tsx` | Frontend Integration |
| `supabase/README.md` | Dokumentation |
| `docs/B2_IMPLEMENTATION.md` | Diese Datei |

---

**Erstellt am:** 2024-12-04  
**Issue:** B2 Save-Logic für neue Messungen  
**Status:** Implementiert, Tests ausstehend
