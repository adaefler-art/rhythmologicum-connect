# B2 — Answer Validation v2 Implementation

## Zusammenfassung

Die B2 Answer Validation v2 Implementation ermöglicht es, Pflichtfragen basierend auf dem `funnel_step_questions.is_required` Feld zu validieren. Benutzer können Steps mit unbeantworteten Pflichtfragen nicht abschließen.

**Hinweis**: Diese Implementierung wurde durch B4 Dynamic Validation Rules erweitert, welches zusätzliche konditionale Validierungslogik ermöglicht. Siehe `/docs/B4_DYNAMIC_VALIDATION_RULES.md` für Details zu dynamischen, regelbasierten Pflichtfeldern.

## Implementierte Komponenten

### 1. Validation Logic (`lib/validation/requiredQuestions.ts`)

Zentrale Validierungslogik für Pflichtfragen.

#### Exported Functions

**`validateRequiredQuestions(assessmentId: string, stepId: string): Promise<ValidationResult>`**

Validiert, ob alle Pflichtfragen für einen bestimmten Step beantwortet wurden.

- Lädt alle required questions für den Step aus `funnel_step_questions`
- Prüft gegen `assessment_answers` ob Antworten vorhanden sind
- Gibt `ValidationResult` mit `isValid` Flag und Liste fehlender Fragen zurück

**`validateAllRequiredQuestions(assessmentId: string, funnelId: string): Promise<ValidationResult>`**

Validiert alle Pflichtfragen für alle Steps in einem Funnel.

- Wird für finale Assessment-Validierung vor Submission verwendet
- Lädt alle Steps des Funnels
- Validiert jeden Step einzeln
- Sammelt alle fehlenden Pflichtfragen

#### Types

```typescript
type ValidationResult = {
  isValid: boolean
  missingQuestions: MissingQuestion[]
}

type MissingQuestion = {
  questionId: string       // UUID der Frage
  questionKey: string      // key der Frage (z.B. "stress_frequency")
  questionLabel: string    // Fragentext
  orderIndex: number       // Reihenfolge im Step
}
```

### 2. API Endpoint (`app/api/assessment-validation/validate-step/route.ts`)

Server-seitiger Endpoint für Step-Validierung.

**Endpoint**: `POST /api/assessment-validation/validate-step`

**Request Body**:
```json
{
  "assessmentId": "uuid-here",
  "stepId": "uuid-here"
}
```

**Response**:
```json
{
  "success": true,
  "isValid": false,
  "missingQuestions": [
    {
      "questionId": "uuid",
      "questionKey": "stress_frequency",
      "questionLabel": "Wie häufig fühlen Sie sich gestresst?",
      "orderIndex": 1
    }
  ]
}
```

**Features**:
- Authentifizierungsprüfung
- Assessment-Ownership Validierung
- Fehlerbehandlung mit spezifischen Error-Messages
- Logging für Debugging

### 3. Client Hook (`lib/hooks/useStepValidation.ts`)

React Hook für Client-seitige Validierung.

**Usage**:
```typescript
const { 
  validateStep, 
  isValid, 
  missingQuestions, 
  validationState,
  error,
  reset
} = useStepValidation()

// In Button onClick
const handleNext = async () => {
  const valid = await validateStep(assessmentId, currentStepId)
  if (valid) {
    // Navigate to next step
  } else {
    // Show error with missing questions
  }
}
```

**States**:
- `idle` - Noch keine Validierung durchgeführt
- `validating` - Validierung läuft
- `success` - Validierung erfolgreich abgeschlossen
- `error` - Fehler bei Validierung

### 4. Updated Stress-Check Page (`app/patient/stress-check/page.tsx`)

Hauptseite mit integrierter Pflichtfragen-Validierung.

**Änderungen**:

1. **Question Type erweitert**:
   ```typescript
   type Question = {
     id: string
     text: string
     group: 'stress' | 'sleep'
     helpText: string | null
     isRequired: boolean  // NEU
   }
   ```

2. **Database Query erweitert**:
   - Lädt jetzt `is_required` aus `funnel_step_questions`
   - Speichert im Question-Objekt

3. **Validierungslogik angepasst**:
   ```typescript
   // Nur Pflichtfragen blockieren Submission
   const requiredQuestions = questions.filter(q => q.isRequired)
   const allRequiredAnswered = requiredQuestions
     .every(q => answers[q.id] !== undefined)
   ```

4. **UI Improvements**:
   - Optional-Badge für nicht-Pflichtfragen
   - Amber Warning nur bei Pflichtfragen
   - Progress zeigt Pflichtfragen-Status
   - Submit-Button blockiert nur bei fehlenden Pflichtfragen

5. **Error Messages**:
   - Spezifische Meldung für fehlende Pflichtfragen
   - Auto-Scroll zum ersten fehlenden Pflichtfeld
   - Optional-Fragen werden nicht mehr als Fehler angezeigt

## Datenbankschema

Die Implementierung nutzt das bestehende Schema:

### `funnel_step_questions`
```sql
CREATE TABLE funnel_step_questions (
  id uuid PRIMARY KEY,
  funnel_step_id uuid NOT NULL,
  question_id uuid NOT NULL,
  order_index int NOT NULL,
  is_required boolean NOT NULL DEFAULT true,  -- ← Schlüsselfeld
  -- ...
)
```

### `assessment_answers`
```sql
CREATE TABLE assessment_answers (
  id uuid PRIMARY KEY,
  assessment_id uuid NOT NULL,
  question_id text NOT NULL,  -- question.key
  answer_value int NOT NULL,
  -- UNIQUE constraint on (assessment_id, question_id)
)
```

## Verwendungsbeispiele

### Für Desktop/Mobile Komponenten (zukünftig)

```typescript
import { useStepValidation } from '@/lib/hooks/useStepValidation'

function MobileQuestionCard({ currentStepId, assessmentId, onNext }) {
  const { validateStep, missingQuestions } = useStepValidation()
  
  const handleNext = async () => {
    const valid = await validateStep(assessmentId, currentStepId)
    
    if (!valid) {
      alert(`Bitte beantworten Sie folgende Pflichtfragen:\n${
        missingQuestions.map(q => `- ${q.questionLabel}`).join('\n')
      }`)
      return
    }
    
    onNext()
  }
  
  return <button onClick={handleNext}>Weiter</button>
}
```

### Für API Consumers

```typescript
const response = await fetch('/api/assessment-validation/validate-step', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    assessmentId: 'uuid',
    stepId: 'uuid'
  })
})

const { isValid, missingQuestions } = await response.json()

if (!isValid) {
  console.log('Missing required questions:', missingQuestions)
}
```

## Vorteile der Implementierung

### ✅ Datenbankgesteuert
- Keine hardcoded Validierung
- Fragen können in DB als optional markiert werden
- Flexibel anpassbar ohne Code-Änderungen

### ✅ Server-Side Absicherung
- API-Endpoint validiert serverseitig
- Keine Umgehung durch Client-Manipulation möglich
- Proper Authentication & Authorization

### ✅ User-Friendly
- Klare Unterscheidung Pflicht/Optional
- Spezifische Error Messages
- Auto-Scroll zu fehlenden Fragen
- Visual Feedback (Badges, Colors)

### ✅ Konsistent
- Desktop und Mobile nutzen gleiche Logik
- Wiederverwendbare Komponenten
- Type-Safe TypeScript Implementation

## Akzeptanzkriterien - Erfüllung

✅ **Steps mit offenen Pflichtfragen können nicht übersprungen werden**
- Stress-Check Page blockiert Submit bei fehlenden Pflichtfragen
- API-Endpoint kann für step-by-step Navigation verwendet werden

✅ **Validierung nutzt ausschließlich vorhandenes Schema**
- Verwendet `funnel_step_questions.is_required`
- Prüft gegen `assessment_answers`
- Keine Schema-Änderungen nötig

✅ **Desktop- und Mobile-Verhalten einheitlich**
- Gleiche Validation-Logik über `validateRequiredQuestions()`
- Hook kann in beiden Flows verwendet werden
- API-Endpoint ist universell nutzbar

## Testing Guide

### 1. Manual Testing - Stress Check Page

1. Starte Development Server: `npm run dev`
2. Navigiere zu: `/patient/stress-check`
3. **Test Pflichtfragen**:
   - Lasse eine Pflichtfrage unbeantwortet
   - Versuche Submit
   - Erwartung: Error Message + Auto-Scroll
4. **Test Optional-Fragen** (falls vorhanden):
   - Lasse optional Fragen unbeantwortet
   - Submit sollte funktionieren
5. **Test alle beantwortet**:
   - Beantworte alle Pflichtfragen
   - Submit sollte funktionieren

### 2. API Endpoint Testing

```bash
# Mit curl (benötigt gültigen Cookie)
curl -X POST http://localhost:3000/api/assessment-validation/validate-step \
  -H "Content-Type: application/json" \
  -d '{
    "assessmentId": "your-assessment-uuid",
    "stepId": "your-step-uuid"
  }'
```

### 3. Database Testing

```sql
-- Prüfe is_required Werte
SELECT 
  fs.title as step_title,
  q.label as question,
  fsq.is_required,
  fsq.order_index
FROM funnel_step_questions fsq
JOIN funnel_steps fs ON fsq.funnel_step_id = fs.id
JOIN questions q ON fsq.question_id = q.id
WHERE fs.funnel_id = (SELECT id FROM funnels WHERE slug = 'stress')
ORDER BY fs.order_index, fsq.order_index;

-- Prüfe answers
SELECT 
  q.label,
  aa.answer_value
FROM assessment_answers aa
JOIN questions q ON aa.question_id = q.key
WHERE aa.assessment_id = 'your-assessment-uuid';
```

### 4. Integration Testing

Test-Szenarien:
1. ✓ Alle Pflichtfragen beantwortet → Submit OK
2. ✓ Eine Pflichtfrage fehlt → Submit blockiert
3. ✓ Optional-Fragen fehlen → Submit OK
4. ✓ Error Message zeigt korrekte Fragen-Nummern
5. ✓ Auto-Scroll funktioniert
6. ✓ Optional-Badge wird angezeigt

## Nächste Schritte (Future Enhancements)

### 1. Mobile/Desktop Step-Navigation
- Integration in `MobileQuestionCard.tsx`
- Integration in `DesktopQuestionCard.tsx`
- Validation vor "Weiter"-Navigation

### 2. Funnel-Demo Update
- `/patient/funnel-demo` auf neue Validation umstellen
- Step-by-Step Validierung demonstrieren

### 3. Performance-Optimierung
- Caching der Required-Questions
- Batch-Validation mehrerer Steps

### 4. Enhanced Error Messages
- Mehrsprachigkeit
- Customizable Messages per Funnel
- Rich Error Objects mit Metadata

## Dateien

| Datei | Zweck |
|-------|-------|
| `lib/validation/requiredQuestions.ts` | Validation Logic |
| `app/api/assessment-validation/validate-step/route.ts` | API Endpoint |
| `lib/hooks/useStepValidation.ts` | React Hook |
| `app/patient/stress-check/page.tsx` | Updated Main Page |
| `docs/B2_VALIDATION_IMPLEMENTATION.md` | Diese Dokumentation |

## Sicherheit

### Server-Side
- ✅ Authentication Check via Supabase
- ✅ Assessment Ownership Validation
- ✅ Input Validation (assessmentId, stepId)
- ✅ Error Logging ohne sensible Daten

### Client-Side
- ✅ Type-Safe TypeScript
- ✅ Proper Error Handling
- ✅ No Sensitive Data in Console

## Migration bestehender Fragen

Wenn bestehende Fragen als optional markiert werden sollen:

```sql
-- Beispiel: Markiere Frage als optional
UPDATE funnel_step_questions
SET is_required = false
WHERE question_id = (
  SELECT id FROM questions WHERE key = 'optional_question_key'
);

-- Oder für mehrere Fragen
UPDATE funnel_step_questions
SET is_required = false
WHERE question_id IN (
  SELECT id FROM questions 
  WHERE key IN ('q1', 'q2', 'q3')
);
```

---

**Erstellt am:** 2024-12-09  
**Status:** Implementiert  
**Version:** 0.3
