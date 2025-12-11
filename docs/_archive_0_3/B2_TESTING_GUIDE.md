# Manual Testing Guide for B2 Save-Logic

## Prerequisites

1. Apply both migrations in Supabase:
   - `supabase/migrations/20241204210000_create_patient_measures_table.sql`
   - `supabase/migrations/20241209103000_update_patient_measures_schema.sql`
2. Start the dev server:
   ```bash
   npm run dev
   ```

## Test Scenarios

### Test 1: Stress-Check erzeugt Messung

**Steps**
1. Öffne `http://localhost:3000/patient/stress-check`
2. Fragebogen ausfüllen und absenden
3. Warte auf Weiterleitung zur Ergebnis-Seite (Aufruf von `/api/amy/stress-report`)

**Expected**
- In `patient_measures` existiert ein neuer Eintrag mit `report_id`, `stress_score`, `sleep_score`, `risk_level`
- `risk_level` entspricht der Einschätzung oder steht auf `pending`, falls keine Bewertung möglich war

**SQL Check**
```sql
SELECT id, patient_id, stress_score, sleep_score, risk_level, report_id, created_at
FROM patient_measures
ORDER BY created_at DESC
LIMIT 1;
```

### Test 2: Idempotenz pro Report

**Steps**
1. Ermittle die `assessmentId` der aktuellen Session (Query-Parameter auf der Ergebnis-Seite)
2. Rufe `/api/amy/stress-report` erneut auf:
   ```javascript
   fetch('/api/amy/stress-report', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ assessmentId })
   }).then(r => r.json()).then(console.log)
   ```

**Expected**
- Es bleibt bei genau EINEM `patient_measures` Datensatz für diesen Report
- `created_at` bleibt unverändert, Scores können sich aktualisieren

**SQL Check**
```sql
SELECT report_id, COUNT(*)
FROM patient_measures
GROUP BY report_id
HAVING COUNT(*) > 1;
-- Ergebnis: 0 Zeilen
```

### Test 3: Scores & Risiko werden aktualisiert

**Steps**
1. Wiederhole Test 1, beantworte Fragen extrem unterschiedlich
2. Vergleiche `stress_score`/`sleep_score` & `risk_level` mit den Werten im Report (`reports`-Tabelle)

**SQL Check**
```sql
SELECT
  pm.id,
  pm.stress_score,
  pm.sleep_score,
  pm.risk_level,
  r.score_numeric,
  r.sleep_score AS report_sleep,
  r.risk_level AS report_risk
FROM patient_measures pm
JOIN reports r ON r.id = pm.report_id
ORDER BY pm.created_at DESC
LIMIT 5;
```

**Expected**
- `patient_measures` spiegelt die Werte aus `reports`
- Bei fehlendem Report-Wert bleibt das Feld `null`

### Test 4: Export liefert neues Format

**Steps**
1. Als Patient eingeloggt die Historie öffnen (`/patient/history`)
2. „Als JSON exportieren" klicken oder API direkt abrufen

**Expected**
- Response enthält `measured_at`, `stress_score`, `sleep_score`, `risk_level`, `report_id`, `report_assessment_id`
- Struktur entspricht `docs/JSON_EXPORT.md`

### Test 5: Historie zeigt Messwerte an

**Steps**
1. Öffne `/patient/history`
2. Prüfe, dass Timeline-Einträge Score-Badges & Risiko anzeigen

**Expected**
- Stress/Sleep-Badges zeigen Werte aus `patient_measures`
- Datum entspricht `created_at` des Eintrags

## Database Verification Queries

### Alle Messungen mit Report-Bezug
```sql
SELECT
  pm.id,
  pm.patient_id,
  pm.created_at,
  pm.stress_score,
  pm.sleep_score,
  pm.risk_level,
  pm.report_id,
  r.assessment_id,
  r.report_text_short
FROM patient_measures pm
LEFT JOIN reports r ON r.id = pm.report_id
ORDER BY pm.created_at DESC;
```

### Wertebereiche prüfen
```sql
SELECT *
FROM patient_measures
WHERE stress_score < 0 OR stress_score > 100
   OR sleep_score < 0 OR sleep_score > 100;
```

### Patienten-Historie nach Profil filtern
```sql
SELECT pm.*
FROM patient_measures pm
JOIN patient_profiles pp ON pp.id = pm.patient_id
WHERE pp.user_id = '<auth-user-id>'
ORDER BY pm.created_at DESC;
```

## Acceptance Criteria Verification

✅ **Messung wird automatisch gespeichert** – Test 1

✅ **Idempotenz pro Report** – Test 2 (kein doppelter Datensatz)

✅ **Scores/Risiko verfügbar** – Test 3 und 5

✅ **Export liefert konsistentes JSON** – Test 4

## Clean Up

```sql
-- Messungen entfernen
DELETE FROM patient_measures;

-- Optional zugehörige Reports löschen
DELETE FROM reports;
```

---

Alle Tests setzen voraus, dass Supabase-Umgebungsvariablen lokal korrekt gesetzt sind und der Stress-Check mit einem Patient:innen-Account durchgeführt wird.
