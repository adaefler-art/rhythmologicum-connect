# Zusammenfassung der Änderungen - A3 Speicherung von AMY-Reports in Supabase

## Was wurde geändert?

Diese Implementierung erfüllt alle Anforderungen aus Issue A3 zur Speicherung von AMY-Reports in Supabase.

### 1. Hauptänderungen im Code

#### a) API-Route `/api/amy/stress-report/route.ts`
**Geändert:**
- Tabellenname von `stress_reports` → `reports` (3 Stellen)
- `sleep_score` Feld hinzugefügt bei INSERT und UPDATE Operationen

**Details:**
```typescript
// Vorher: .from('stress_reports')
// Jetzt:  .from('reports')

// INSERT Operation - neu mit sleep_score:
.insert({
  assessment_id: assessmentId,
  score_numeric: stressScore ?? null,
  sleep_score: sleepScore ?? null,  // ← NEU
  risk_level: riskLevel ?? null,
  report_text_short: reportTextShort,
})

// UPDATE Operation - neu mit sleep_score:
.update({
  score_numeric: stressScore ?? existing.score_numeric,
  sleep_score: sleepScore ?? existing.sleep_score,  // ← NEU
  risk_level: riskLevel ?? existing.risk_level,
  report_text_short: reportTextShort,
})
```

#### b) TypeScript Typ-Definition `StressResultClient.tsx`
**Geändert:**
```typescript
type Report = {
  id: string
  assessment_id: string
  score_numeric: number | null
  sleep_score: number | null  // ← NEU
  risk_level: RiskLevel
  report_text_short: string | null
  created_at: string
  updated_at: string
}
```

#### c) Clinician Detail View `/clinician/report/[id]/page.tsx`
**Geändert:**
- Anzeige des Schlaf-Scores ergänzt
- Labels präzisiert ("Score" → "Stress-Score")

```tsx
<div>
  <p className="text-sm text-slate-500">Stress-Score</p>
  <p className="text-xl font-bold">{report.score_numeric ?? 'N/A'}</p>
</div>

<div>
  <p className="text-sm text-slate-500">Schlaf-Score</p>  // ← NEU
  <p className="text-xl font-bold">{report.sleep_score ?? 'N/A'}</p>  // ← NEU
</div>
```

### 2. Neue Dateien

#### a) Datenbank-Migration: `supabase/migrations/20241204120000_create_reports_table.sql`

Vollständige SQL-Migration zur Erstellung der `reports` Tabelle mit:
- Alle erforderlichen Felder
- Foreign Key Constraint zu `assessments`
- Indizes für Performance
- Trigger für automatisches `updated_at` Update
- Kommentare zur Dokumentation

#### b) Dokumentation: `supabase/README.md`

Umfassende Dokumentation mit:
- Tabellen-Schema
- Verwendungsbeispiele
- Beziehungen und Constraints
- Migration-Anweisungen

### 3. Erfüllte Akzeptanzkriterien

✅ **Tabelle `reports` enthält:**
- `id` (UUID, Primary Key, auto-generated)
- `assessment_id` (UUID, Foreign Key zu assessments)
- `score_numeric` (INTEGER, Stress-Score 0-100)
- `sleep_score` (INTEGER, Schlaf-Score 0-100) ← **Optional implementiert**
- `risk_level` (TEXT mit CHECK constraint: 'low', 'moderate', 'high')
- `report_text_short` (TEXT, AMY-generierter Bericht)
- `created_at` (TIMESTAMPTZ, automatisch)
- `updated_at` (TIMESTAMPTZ, automatisch via Trigger)

✅ **Jede neue Auswertung:**
- Erstellt einen neuen Datensatz (INSERT)
- ODER aktualisiert einen bestehenden (UPDATE), falls für die `assessment_id` bereits ein Report existiert

✅ **Daten sind verknüpft:**
- Foreign Key: `assessment_id` → `assessments(id)`
- CASCADE beim Löschen: Reports werden automatisch gelöscht, wenn das zugehörige Assessment gelöscht wird

## Wie kann das geprüft werden?

### Voraussetzungen
1. Supabase-Datenbank muss die Migration anwenden:
   ```bash
   # SQL aus supabase/migrations/20241204120000_create_reports_table.sql
   # im Supabase Dashboard ausführen
   ```

### Test-Schritte

#### 1. Assessment durchführen und Report erstellen
```
1. Navigiere zu: http://localhost:3000/patient/stress-check
2. Fülle alle Fragen aus
3. Klicke auf "Antworten speichern & weiter"
4. Prüfe die Weiterleitung zu: /patient/stress-check/result?assessmentId=<uuid>
```

**Erwartetes Ergebnis:**
- Stress-Score wird angezeigt (0-100)
- Schlaf-Score wird angezeigt (0-100)
- Risiko-Einschätzung wird angezeigt
- AMY-generierter Text wird angezeigt

#### 2. Daten in Supabase prüfen
```sql
-- Neuesten Report anzeigen
SELECT * FROM reports 
ORDER BY created_at DESC 
LIMIT 1;
```

**Erwartete Felder:**
- Alle 8 Felder sind befüllt
- `sleep_score` ist vorhanden (nicht NULL, wenn Fragen beantwortet wurden)
- `assessment_id` entspricht der ID aus der URL

#### 3. Clinician View testen
```
1. Navigiere zu: http://localhost:3000/clinician
2. Prüfe dass Reports in der Tabelle erscheinen
3. Klicke auf "ansehen" bei einem Report
```

**Erwartetes Ergebnis:**
- Detail-Seite zeigt Stress-Score UND Schlaf-Score
- AMY-Text wird vollständig angezeigt
- Alle Meta-Daten (Datum, Patient, Risk-Level) sind sichtbar

#### 4. API direkt testen
```bash
# Report für existierendes Assessment abrufen/aktualisieren
curl -X POST http://localhost:3000/api/amy/stress-report \
  -H "Content-Type: application/json" \
  -d '{"assessmentId": "<uuid-des-assessments>"}'
```

**Erwartete Response:**
```json
{
  "report": {
    "id": "...",
    "assessment_id": "...",
    "score_numeric": 75,
    "sleep_score": 60,
    "risk_level": "moderate",
    "report_text_short": "...",
    "created_at": "...",
    "updated_at": "..."
  },
  "scores": {
    "stressScore": 75,
    "sleepScore": 60,
    "riskLevel": "moderate"
  }
}
```

### Validierung der Datenbankstruktur

```sql
-- 1. Schema prüfen
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'reports'
ORDER BY ordinal_position;

-- 2. Foreign Key prüfen
SELECT
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'reports'
  AND tc.constraint_type = 'FOREIGN KEY';

-- 3. Trigger prüfen
SELECT trigger_name, event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'reports';
```

## Technische Details

### Warum `reports` statt `stress_reports`?

Die Clinician-Pages (`/clinician` und `/clinician/report/[id]`) verwenden bereits die Tabelle `reports`. Die API-Route hatte noch den alten Namen `stress_reports` verwendet. Diese Inkonsistenz wurde behoben.

### Warum INSERT oder UPDATE?

Die API prüft, ob bereits ein Report für die `assessment_id` existiert:
- **Existiert nicht:** Neuer Report wird erstellt (INSERT)
- **Existiert bereits:** Bestehender Report wird aktualisiert (UPDATE)

Dies ermöglicht es, dass Reports bei Bedarf neu generiert werden können (z.B. wenn AMY verbessert wird).

### Automatisches updated_at

Ein Datenbank-Trigger aktualisiert automatisch das `updated_at` Feld bei jedem UPDATE:
```sql
CREATE TRIGGER trigger_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_reports_updated_at();
```

## Sicherheit

- ✅ Keine SQL-Injection möglich (Supabase Client verwendet Prepared Statements)
- ✅ Foreign Key Constraint verhindert inkonsistente Daten
- ✅ Keine sensiblen Daten werden zusätzlich gespeichert
- ✅ CASCADE Regel stellt sicher, dass keine verwaisten Reports existieren

## Zusammenfassung der Dateien

| Datei | Änderung | Grund |
|-------|----------|-------|
| `app/api/amy/stress-report/route.ts` | Tabellenname + sleep_score | Hauptänderung für Reports |
| `app/patient/stress-check/result/StressResultClient.tsx` | Type Definition | TypeScript Typen aktualisieren |
| `app/clinician/report/[id]/page.tsx` | UI Anzeige | Schlaf-Score anzeigen |
| `supabase/migrations/20241204120000_create_reports_table.sql` | Neu | Datenbank-Schema |
| `supabase/README.md` | Neu | Dokumentation |

## Offene Punkte / Hinweise

1. **Migration muss angewendet werden**: Die SQL-Datei muss im Supabase Dashboard ausgeführt werden
2. **Bestehende Daten**: Falls bereits eine `stress_reports` Tabelle existiert, muss diese ggf. migriert oder umbenannt werden
3. **Permissions**: RLS (Row Level Security) Policies müssen ggf. für die `reports` Tabelle konfiguriert werden

---

**Erstellt am:** 2024-12-04  
**Issue:** A3 Speicherung von AMY-Reports in Supabase  
**Autor:** GitHub Copilot
