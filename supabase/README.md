# Supabase Database Schema

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
