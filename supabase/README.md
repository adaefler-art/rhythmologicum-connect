# Supabase Database Schema

## Tabelle: `patient_measures`

Diese Tabelle verfolgt abgeschlossene Patientenmessungen/Assessments mit idempotenter Logik, um Duplikate zu verhindern.

### Schema

| Spalte              | Typ          | Beschreibung                                              | Constraints                           |
|---------------------|--------------|-----------------------------------------------------------|---------------------------------------|
| `id`                | UUID         | Eindeutige ID der Messung (Primary Key)                  | PRIMARY KEY, DEFAULT gen_random_uuid()|
| `assessment_id`     | UUID         | Referenz zum Assessment (Foreign Key, UNIQUE)             | NOT NULL, UNIQUE, REFERENCES assessments(id)|
| `patient_id`        | UUID         | Patienten-ID für diese Messung                           | NOT NULL                              |
| `measurement_type`  | TEXT         | Art der Messung (stress, sleep, etc.)                     | NOT NULL, DEFAULT 'stress'            |
| `status`            | TEXT         | Status: 'completed', 'in_progress', 'failed'              | NOT NULL, CHECK constraint            |
| `completed_at`      | TIMESTAMPTZ  | Zeitstempel der Fertigstellung                            | DEFAULT NOW()                         |
| `created_at`        | TIMESTAMPTZ  | Zeitstempel der Erstellung                                | DEFAULT NOW()                         |
| `updated_at`        | TIMESTAMPTZ  | Zeitstempel der letzten Aktualisierung                    | DEFAULT NOW(), auto-updated via trigger|

### Indizes

- `assessment_id`: UNIQUE constraint (automatischer Index)
- `idx_patient_measures_patient_id`: Index auf `patient_id` für schnellere Abfragen
- `idx_patient_measures_completed_at`: Index auf `completed_at` (DESC) für schnelleres Sortieren

### Trigger

- `trigger_patient_measures_updated_at`: Automatisches Update von `updated_at` bei jeder Änderung

### Beziehungen

- **Foreign Key**: `assessment_id` → `assessments(id)` mit `ON DELETE CASCADE`
  - Wenn ein Assessment gelöscht wird, wird automatisch die zugehörige Messung gelöscht
- **UNIQUE Constraint**: Verhindert Duplikate für dieselbe `assessment_id` (Idempotenz)

### Verwendung

#### Neue Messung speichern (idempotent)

```typescript
const response = await fetch('/api/patient-measures/save', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ assessmentId: 'uuid-des-assessments' }),
})

const data = await response.json()
// { measure: {...}, message: '...', isNew: true/false }
```

#### Messungen abfragen

```typescript
const { data, error } = await supabase
  .from('patient_measures')
  .select('*')
  .eq('patient_id', 'patient-uuid')
  .order('completed_at', { ascending: false });
```

### Idempotenz

Die Tabelle stellt durch den UNIQUE Constraint auf `assessment_id` sicher, dass:
- Jedes Assessment nur einmal als Messung gespeichert wird
- Wiederholte API-Aufrufe keine Duplikate erzeugen
- Bei Race Conditions der zweite Insert fehlschlägt und der existierende Eintrag zurückgegeben wird

---

## Tabelle: `reports`

Diese Tabelle speichert die von AMY generierten Kurzinterpretationen und zugehörigen Scores für Stress- und Schlaf-Assessments.

### Schema

| Spalte              | Typ          | Beschreibung                                              | Constraints                           |
|---------------------|--------------|-----------------------------------------------------------|---------------------------------------|
| `id`                | UUID         | Eindeutige ID des Reports (Primary Key)                  | PRIMARY KEY, DEFAULT gen_random_uuid()|
| `assessment_id`     | UUID         | Referenz zum Assessment (Foreign Key)                     | NOT NULL, REFERENCES assessments(id)  |
| `score_numeric`     | INTEGER      | Stress-Score (0-100)                                      | NULL erlaubt                          |
| `sleep_score`       | INTEGER      | Schlaf-Score (0-100)                                      | NULL erlaubt                          |
| `risk_level`        | TEXT         | Stress-Risiko-Level: 'low', 'moderate', 'high'           | CHECK constraint                      |
| `report_text_short` | TEXT         | Kurze Interpretation durch AMY                            | NULL erlaubt                          |
| `created_at`        | TIMESTAMPTZ  | Zeitstempel der Erstellung                                | DEFAULT NOW()                         |
| `updated_at`        | TIMESTAMPTZ  | Zeitstempel der letzten Aktualisierung                    | DEFAULT NOW(), auto-updated via trigger|

### Indizes

- `idx_reports_assessment_id`: Index auf `assessment_id` für schnellere Lookups
- `idx_reports_created_at`: Index auf `created_at` (DESC) für schnelleres Sortieren

### Trigger

- `trigger_reports_updated_at`: Automatisches Update von `updated_at` bei jeder Änderung

### Beziehungen

- **Foreign Key**: `assessment_id` → `assessments(id)` mit `ON DELETE CASCADE`
  - Wenn ein Assessment gelöscht wird, werden automatisch alle zugehörigen Reports gelöscht

### Verwendung

#### Neuen Report erstellen

```typescript
const { data, error } = await supabase
  .from('reports')
  .insert({
    assessment_id: 'uuid-des-assessments',
    score_numeric: 75,
    sleep_score: 60,
    risk_level: 'moderate',
    report_text_short: 'Deine AMY-Interpretation...'
  })
  .select()
  .single();
```

#### Existierenden Report aktualisieren

```typescript
const { data, error } = await supabase
  .from('reports')
  .update({
    score_numeric: 80,
    sleep_score: 65,
    risk_level: 'high',
    report_text_short: 'Aktualisierte Interpretation...'
  })
  .eq('id', 'report-uuid')
  .select()
  .single();
```

#### Reports abfragen

```typescript
// Mit Join zu Assessments und Patient Profiles
const { data, error } = await supabase
  .from('reports')
  .select(`
    id,
    created_at,
    score_numeric,
    sleep_score,
    risk_level,
    report_text_short,
    assessments (
      id,
      patient_id,
      patient_profiles (
        id,
        full_name,
        user_id
      )
    )
  `)
  .order('created_at', { ascending: false });
```

## Migration anwenden

Um die Tabelle in Supabase zu erstellen:

```bash
# Lokal mit Supabase CLI
supabase db push

# Oder SQL direkt im Supabase Dashboard ausführen
# Kopieren Sie den Inhalt von supabase/migrations/20241204120000_create_reports_table.sql
```

## Hinweise

- Die Tabelle unterstützt sowohl INSERT als auch UPDATE Operationen
- `updated_at` wird automatisch bei jedem UPDATE aktualisiert
- Alle Score-Felder sind optional (NULL erlaubt), um Flexibilität zu bieten
- Die CASCADE-Regel stellt sicher, dass keine verwaisten Reports existieren
