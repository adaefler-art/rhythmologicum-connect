# B4 — Erweiterte Validierungsregeln (Conditional Required & dynamische Logik)

## Überblick

Die B4 Dynamic Validation Rules erweitern die bestehende B2-Validierung um flexible, datengetriebene Regeln für komplexe klinische Fragebögen. Die Implementierung ermöglicht:

- **Conditional Required**: Fragen werden nur Pflicht, wenn bestimmte Bedingungen erfüllt sind
- **Datengetrieben**: Regeln werden aus der Datenbank geladen, nicht im Code verdrahtet
- **Abwärtskompatibel**: Funktioniert nahtlos mit der bestehenden B2-Validierung
- **Erweiterbar**: Vorbereitet für zukünftige Features wie Conditional Visibility

## Architektur

### Datenmodell

#### Tabelle: `funnel_question_rules`

```sql
CREATE TABLE funnel_question_rules (
    id uuid PRIMARY KEY,
    question_id uuid NOT NULL,
    funnel_step_id uuid NOT NULL,
    rule_type text NOT NULL CHECK (rule_type IN ('conditional_required', 'conditional_visible')),
    rule_payload jsonb NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

**Felder:**
- `question_id`: Die Frage, für die diese Regel gilt
- `funnel_step_id`: Der Step, in dem die Regel evaluiert wird
- `rule_type`: Typ der Regel (`conditional_required` oder `conditional_visible`)
- `rule_payload`: JSONB-Struktur mit Bedingungen und Logik
- `priority`: Höhere Priorität = zuerst evaluiert (Standard: 0)
- `is_active`: Erlaubt Deaktivierung ohne Löschung

**Indizes:**
- `idx_funnel_question_rules_question_id`
- `idx_funnel_question_rules_funnel_step_id`
- `idx_funnel_question_rules_type`
- `idx_funnel_question_rules_active`

### Rule Payload Struktur

#### Basis-Struktur

```typescript
{
  "type": "conditional_required",
  "logic": "AND" | "OR",  // Optional, Standard: AND
  "conditions": [
    {
      "question_key": "stress_frequency",
      "operator": "eq" | "neq" | "in" | "gte" | "lte" | "gt" | "lt",
      "value": 3,           // Für eq, neq, gte, lte, gt, lt
      "values": [1, 2, 3]   // Für "in" Operator
    }
  ]
}
```

#### Unterstützte Operatoren

| Operator | Bedeutung | Beispiel | Beschreibung |
|----------|-----------|----------|--------------|
| `eq` | Gleich | `{"operator": "eq", "value": 3}` | Antwort muss genau 3 sein |
| `neq` | Ungleich | `{"operator": "neq", "value": 0}` | Antwort darf nicht 0 sein |
| `in` | In Liste | `{"operator": "in", "values": [3, 4]}` | Antwort muss 3 oder 4 sein |
| `gt` | Größer als | `{"operator": "gt", "value": 2}` | Antwort muss größer als 2 sein |
| `gte` | Größer gleich | `{"operator": "gte", "value": 3}` | Antwort muss mindestens 3 sein |
| `lt` | Kleiner als | `{"operator": "lt", "value": 2}` | Antwort muss kleiner als 2 sein |
| `lte` | Kleiner gleich | `{"operator": "lte", "value": 1}` | Antwort muss höchstens 1 sein |

## Beispiele

### Beispiel 1: Einfache Conditional Required Regel

**Szenario**: Frage B ist Pflicht, wenn Frage A = 1 oder 2 ist.

```sql
INSERT INTO funnel_question_rules (
  question_id,
  funnel_step_id,
  rule_type,
  rule_payload
) VALUES (
  (SELECT id FROM questions WHERE key = 'follow_up_question'),
  (SELECT id FROM funnel_steps WHERE title = 'Detailerfassung'),
  'conditional_required',
  '{
    "type": "conditional_required",
    "conditions": [
      {
        "question_key": "initial_screening",
        "operator": "in",
        "values": [1, 2]
      }
    ]
  }'
);
```

### Beispiel 2: Mehrere Bedingungen mit AND-Logik

**Szenario**: Frage C ist Pflicht, wenn Stress ≥ 3 UND Schlaf ≤ 1.

```sql
INSERT INTO funnel_question_rules (
  question_id,
  funnel_step_id,
  rule_type,
  rule_payload,
  priority
) VALUES (
  (SELECT id FROM questions WHERE key = 'health_impact'),
  (SELECT id FROM funnel_steps WHERE title = 'Vertiefende Fragen'),
  'conditional_required',
  '{
    "type": "conditional_required",
    "logic": "AND",
    "conditions": [
      {
        "question_key": "stress_frequency",
        "operator": "gte",
        "value": 3
      },
      {
        "question_key": "sleep_quality",
        "operator": "lte",
        "value": 1
      }
    ]
  }',
  10
);
```

### Beispiel 3: OR-Logik für Screening

**Szenario**: Frage D ist Pflicht, wenn ENTWEDER Gesundheitsproblem = Ja ODER Alter ≥ 65.

```sql
INSERT INTO funnel_question_rules (
  question_id,
  funnel_step_id,
  rule_type,
  rule_payload
) VALUES (
  (SELECT id FROM questions WHERE key = 'detailed_assessment'),
  (SELECT id FROM funnel_steps WHERE title = 'Risikobewertung'),
  'conditional_required',
  '{
    "type": "conditional_required",
    "logic": "OR",
    "conditions": [
      {
        "question_key": "has_health_issue",
        "operator": "eq",
        "value": 1
      },
      {
        "question_key": "age_group",
        "operator": "gte",
        "value": 65
      }
    ]
  }'
);
```

## Medizinische Use Cases

### Use Case 1: Stress-Screening mit Follow-up

```sql
-- Wenn Stress-Level hoch ist (≥3), müssen zusätzliche Fragen beantwortet werden
INSERT INTO funnel_question_rules (question_id, funnel_step_id, rule_type, rule_payload)
VALUES (
  (SELECT id FROM questions WHERE key = 'stress_duration'),
  (SELECT id FROM funnel_steps WHERE title = 'Stress-Assessment'),
  'conditional_required',
  '{
    "type": "conditional_required",
    "conditions": [
      {"question_key": "stress_frequency", "operator": "gte", "value": 3}
    ]
  }'
),
(
  (SELECT id FROM questions WHERE key = 'stress_triggers'),
  (SELECT id FROM funnel_steps WHERE title = 'Stress-Assessment'),
  'conditional_required',
  '{
    "type": "conditional_required",
    "conditions": [
      {"question_key": "stress_frequency", "operator": "gte", "value": 3}
    ]
  }'
);
```

### Use Case 2: Schlafstörungen-Protokoll

```sql
-- Bei schlechter Schlafqualität (≤1) werden Detailfragen Pflicht
INSERT INTO funnel_question_rules (question_id, funnel_step_id, rule_type, rule_payload)
VALUES (
  (SELECT id FROM questions WHERE key = 'sleep_latency'),
  (SELECT id FROM funnel_steps WHERE title = 'Schlaf-Assessment'),
  'conditional_required',
  '{
    "type": "conditional_required",
    "conditions": [
      {"question_key": "sleep_quality", "operator": "lte", "value": 1}
    ]
  }'
),
(
  (SELECT id FROM questions WHERE key = 'night_awakenings'),
  (SELECT id FROM funnel_steps WHERE title = 'Schlaf-Assessment'),
  'conditional_required',
  '{
    "type": "conditional_required",
    "conditions": [
      {"question_key": "sleep_quality", "operator": "lte", "value": 1}
    ]
  }'
);
```

### Use Case 3: Kombiniertes Risiko-Screening

```sql
-- Detailliertes Assessment bei hohem Stress UND schlechtem Schlaf
INSERT INTO funnel_question_rules (question_id, funnel_step_id, rule_type, rule_payload)
VALUES (
  (SELECT id FROM questions WHERE key = 'medical_history'),
  (SELECT id FROM funnel_steps WHERE title = 'Risiko-Bewertung'),
  'conditional_required',
  '{
    "type": "conditional_required",
    "logic": "AND",
    "conditions": [
      {"question_key": "stress_frequency", "operator": "gte", "value": 3},
      {"question_key": "sleep_quality", "operator": "lte", "value": 1}
    ]
  }'
);
```

## API-Nutzung

### Endpoint: Validate Step (Erweitert)

**Request:**
```json
POST /api/assessment-validation/validate-step

{
  "assessmentId": "uuid-assessment",
  "stepId": "uuid-step",
  "extended": true
}
```

**Response (mit Rules):**
```json
{
  "success": true,
  "isValid": false,
  "missingQuestions": [
    {
      "questionId": "uuid",
      "questionKey": "follow_up_question",
      "questionLabel": "Wie lange dauert der Stress schon an?",
      "orderIndex": 2,
      "reason": "conditional_required",
      "ruleId": "rule-uuid",
      "ruleDescription": "Ihre Antwort war mindestens 3"
    }
  ]
}
```

**Response (ohne Rules - B2 kompatibel):**
```json
{
  "success": true,
  "isValid": false,
  "missingQuestions": [
    {
      "questionId": "uuid",
      "questionKey": "base_required_question",
      "questionLabel": "Wie häufig fühlen Sie Stress?",
      "orderIndex": 1,
      "reason": "required"
    }
  ]
}
```

## Frontend-Integration

### Fehlermeldungen

Die UI unterscheidet zwischen drei Arten von Pflichtfragen:

1. **Basis-Pflicht (B2)**: "⚠️ Diese Pflichtfrage muss beantwortet werden"
2. **Conditional Required (B4)**: "⚠️ Diese Frage muss beantwortet werden, weil Ihre Antwort war mindestens 3"
3. **Optional**: "Optional" Badge

### Visual Indicators

```tsx
// Conditional Required Badge
{isConditionalRequired && (
  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-md">
    Pflicht (abhängig)
  </span>
)}

// Error Message mit Regel-Beschreibung
{hasError && isConditionalRequired && validationError?.ruleDescription && (
  <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
    ⚠️ Diese Frage muss beantwortet werden, weil {validationError.ruleDescription}
  </p>
)}
```

## Validierungslogik

### Ablauf

1. **Laden der Fragen**: Alle Fragen für den Step werden geladen (required und optional)
2. **Laden der Antworten**: Alle bisherigen Antworten des Assessments werden geladen
3. **Laden der Regeln**: Alle aktiven Regeln für den Step werden geladen
4. **Basis-Validierung (B2)**: Prüfung der `is_required` Flags
5. **Regel-Evaluierung (B4)**: 
   - Für jede Frage werden zugehörige `conditional_required` Regeln gesucht
   - Bedingungen werden gegen die Antworten evaluiert
   - Bei erfüllter Bedingung und fehlender Antwort → Fehler
6. **Rückgabe**: Liste mit fehlenden Fragen inkl. Grund

### Code-Struktur

```typescript
// 1. Rule Engine
evaluateCondition(condition, answerValue) -> boolean
evaluateRule(rulePayload, answers) -> boolean
describeRule(rulePayload) -> string

// 2. Validation
validateRequiredQuestionsExtended(assessmentId, stepId) -> ValidationResultExtended

// 3. Types
type MissingQuestionWithReason = {
  questionId: string
  questionKey: string
  questionLabel: string
  orderIndex: number
  reason: 'required' | 'conditional_required'
  ruleId?: string
  ruleDescription?: string
}
```

## Abwärtskompatibilität

### B2 bleibt voll funktionsfähig

- Wenn keine Regeln existieren, verhält sich das System exakt wie B2
- `validateRequiredQuestions()` existiert weiterhin unverändert
- API-Endpoint unterstützt beide Modi:
  - `extended: false` → B2 Verhalten (Standard)
  - `extended: true` → B4 mit Regeln

### Migration bestehender Funnels

Keine Änderungen nötig! Bestehende Funnels funktionieren weiterhin:
- `is_required = true` → Frage ist Pflicht
- `is_required = false` → Frage ist optional
- Regeln können schrittweise hinzugefügt werden

## Performance

### Optimierungen

1. **Batch-Loading**: Regeln und Antworten werden in einer Query geladen
2. **Indizes**: Optimierte Abfragen über Indizes auf `question_id`, `funnel_step_id`, `is_active`
3. **Lazy Evaluation**: Regeln werden nur evaluiert, wenn Frage unbeantworten ist
4. **Priority Sorting**: Regeln mit höherer Priorität werden zuerst evaluiert

### Geschätzte Performance

- **Typischer Step** (5 Fragen, 2 Regeln): <50ms
- **Großer Step** (20 Fragen, 10 Regeln): <150ms
- **Worst Case** (50 Fragen, 30 Regeln): <300ms

## Testing

### Test-Szenarien

#### 1. Basis-Tests
```typescript
// Keine Regeln → B2 Verhalten
test('validates required questions without rules', async () => {
  // Given: Step mit is_required=true Fragen
  // When: validateRequiredQuestionsExtended()
  // Then: reason = 'required'
})

// Conditional Required erfüllt → Frage wird Pflicht
test('enforces conditional required when condition met', async () => {
  // Given: Regel "Q2 required if Q1 >= 3", Q1 = 3, Q2 unanswered
  // When: validate
  // Then: Q2 in missingQuestions, reason = 'conditional_required'
})

// Conditional Required nicht erfüllt → Frage bleibt optional
test('ignores conditional required when condition not met', async () => {
  // Given: Regel "Q2 required if Q1 >= 3", Q1 = 1, Q2 unanswered
  // When: validate
  // Then: Q2 NOT in missingQuestions
})
```

#### 2. Operator-Tests
```typescript
test.each([
  ['eq', 3, 3, true],
  ['eq', 3, 2, false],
  ['neq', 3, 2, true],
  ['in', [1, 2, 3], 2, true],
  ['gte', 3, 4, true],
  ['lte', 2, 1, true],
])('evaluates %s operator correctly', (op, value, answer, expected) => {
  // Test all operators
})
```

#### 3. Logic-Tests
```typescript
test('AND logic requires all conditions', () => {
  // Given: logic=AND, condition1=true, condition2=false
  // Then: result = false
})

test('OR logic requires any condition', () => {
  // Given: logic=OR, condition1=false, condition2=true
  // Then: result = true
})
```

#### 4. Edge Cases
```typescript
test('handles missing answers gracefully', () => {
  // Condition references unanswered question → evaluates to false
})

test('handles invalid operators', () => {
  // Unknown operator → logs warning, returns false
})

test('handles empty conditions array', () => {
  // No conditions → rule doesn't apply
})
```

### Manuelle Test-Checkliste

- [ ] Step ohne Regeln validiert korrekt (B2)
- [ ] Conditional Required mit single condition funktioniert
- [ ] Conditional Required mit AND-Logik funktioniert
- [ ] Conditional Required mit OR-Logik funktioniert
- [ ] UI zeigt unterschiedliche Fehlermeldungen korrekt
- [ ] "Pflicht (abhängig)" Badge wird angezeigt
- [ ] Rule Description wird in Fehlermeldung angezeigt
- [ ] Performance bleibt akzeptabel (<300ms)

## Erweiterte Funktionen (Zukünftig)

### Conditional Visibility

Vorbereitet, aber noch nicht implementiert:

```json
{
  "type": "conditional_visible",
  "conditions": [
    {
      "question_key": "has_symptoms",
      "operator": "eq",
      "value": 1
    }
  ]
}
```

Wenn implementiert:
- Frage wird nur angezeigt, wenn Bedingung erfüllt
- Reduziert Fragebogen-Länge dynamisch
- Verbessert User Experience

### Rule Chains

Regeln können auf andere regel-basierte Fragen referenzieren:

```json
{
  "type": "conditional_required",
  "conditions": [
    {
      "question_key": "conditionally_required_question",
      "operator": "gte",
      "value": 2
    }
  ]
}
```

### Custom Operators

Zukünftig könnten spezielle Operatoren hinzugefügt werden:
- `between`: Wert liegt zwischen min und max
- `regex`: String-Matching für Textantworten
- `date_before` / `date_after`: Datums-Vergleiche

## Troubleshooting

### Problem: Regel wird nicht evaluiert

**Ursache**: `is_active = false` oder ungültige `question_id`/`funnel_step_id`

**Lösung**:
```sql
-- Prüfen ob Regel aktiv ist
SELECT * FROM funnel_question_rules 
WHERE question_id = 'your-question-uuid';

-- Aktivieren falls nötig
UPDATE funnel_question_rules 
SET is_active = true 
WHERE id = 'rule-uuid';
```

### Problem: Bedingung evaluiert falsch

**Ursache**: `question_key` stimmt nicht überein oder Antwort existiert nicht

**Lösung**:
```sql
-- Prüfe question_key in Regel
SELECT rule_payload->>'conditions' 
FROM funnel_question_rules 
WHERE id = 'rule-uuid';

-- Prüfe ob Antwort existiert
SELECT * FROM assessment_answers 
WHERE assessment_id = 'your-assessment' 
AND question_id = 'referenced-question-key';
```

### Problem: Mehrere Regeln kollidieren

**Ursache**: Mehrere Regeln für dieselbe Frage mit unterschiedlichen Prioritäten

**Lösung**:
```sql
-- Prüfe Regel-Prioritäten
SELECT id, priority, rule_payload 
FROM funnel_question_rules 
WHERE question_id = 'your-question-uuid'
ORDER BY priority DESC;

-- Setze eindeutige Prioritäten
UPDATE funnel_question_rules 
SET priority = 10 
WHERE id = 'higher-priority-rule';
```

## Dateien

| Datei | Zweck |
|-------|-------|
| `supabase/migrations/20251209094000_create_funnel_question_rules.sql` | Datenbank-Migration |
| `lib/validation/ruleTypes.ts` | TypeScript Type Definitions |
| `lib/validation/ruleEngine.ts` | Rule Evaluation Engine |
| `lib/validation/requiredQuestions.ts` | Erweiterte Validation Logic |
| `app/api/assessment-validation/validate-step/route.ts` | Updated API Endpoint |
| `app/patient/stress-check/page.tsx` | Updated UI mit Conditional Required |
| `docs/B4_DYNAMIC_VALIDATION_RULES.md` | Diese Dokumentation |

## Zusammenfassung

B4 Dynamic Validation Rules erweitert die bestehende B2-Validierung um flexible, regelbasierte Logik für komplexe klinische Fragebögen. Die Implementierung ist:

✅ **Datengetrieben**: Regeln in Datenbank, nicht im Code  
✅ **Abwärtskompatibel**: B2 funktioniert unverändert weiter  
✅ **Performant**: Optimierte Queries und Indizes  
✅ **Erweiterbar**: Vorbereitet für Conditional Visibility und weitere Features  
✅ **User-Friendly**: Klare, kontextuelle Fehlermeldungen  
✅ **Gut dokumentiert**: Beispiele für medizinische Use Cases  

---

**Erstellt am:** 2024-12-09  
**Status:** Implementiert  
**Version:** 1.0
