# B3 Assessment Navigation API

## Übersicht

Die B3 Navigation API bietet performante Endpunkte für die Navigation innerhalb von Assessments und die Wiederaufnahme unterbrochener Assessments.

**Performance-Ziel:** < 200ms Serverantwortzeit für snappy Navigation

## API Endpunkte

### 1. GET `/api/assessments/[id]/current-step`

Ermittelt den aktuellen Schritt eines Assessments basierend auf den beantworteten Fragen.

#### Request

```
GET /api/assessments/550e8400-e29b-41d4-a716-446655440000/current-step
```

#### Response

```json
{
  "success": true,
  "step": {
    "stepId": "123e4567-e89b-12d3-a456-426614174000",
    "stepIndex": 2,
    "orderIndex": 2,
    "title": "Stressbelastung",
    "type": "question_step",
    "hasQuestions": true,
    "requiredQuestions": ["stress_frequency", "feeling_overwhelmed"],
    "answeredQuestions": ["stress_frequency"]
  },
  "performanceMs": 145
}
```

#### Fehler

- `400` - Fehlende Assessment ID
- `401` - Nicht authentifiziert
- `403` - Keine Berechtigung für dieses Assessment
- `404` - Assessment nicht gefunden
- `500` - Serverfehler

---

### 2. GET `/api/assessments/[id]/navigation`

Liefert den vollständigen Navigationsstatus inklusive nächster/vorheriger Schritt-IDs.

#### Request

```
GET /api/assessments/550e8400-e29b-41d4-a716-446655440000/navigation
```

#### Response

```json
{
  "success": true,
  "navigation": {
    "currentStepId": "123e4567-e89b-12d3-a456-426614174000",
    "currentStepIndex": 2,
    "nextStepId": "234e5678-e89b-12d3-a456-426614174001",
    "previousStepId": "012e3456-e89b-12d3-a456-426614173999",
    "canGoNext": true,
    "canGoPrevious": true,
    "isComplete": false,
    "totalSteps": 5,
    "answeredQuestions": 8,
    "totalQuestions": 15
  },
  "performanceMs": 178
}
```

#### Verwendung

Dieser Endpunkt ist optimiert für:
- Schnelle Navigation (Next/Previous Buttons)
- Progress-Anzeige
- Validierung von Navigationsmöglichkeiten

---

### 3. GET `/api/assessments/[id]/resume`

Stellt alle Daten bereit, um ein unterbrochenes Assessment fortzusetzen.

#### Request

```
GET /api/assessments/550e8400-e29b-41d4-a716-446655440000/resume
```

#### Response

```json
{
  "success": true,
  "resume": {
    "assessmentId": "550e8400-e29b-41d4-a716-446655440000",
    "funnelId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "currentStep": {
      "stepId": "123e4567-e89b-12d3-a456-426614174000",
      "stepIndex": 2,
      "orderIndex": 2,
      "title": "Stressbelastung",
      "type": "question_step",
      "hasQuestions": true,
      "requiredQuestions": ["stress_frequency", "feeling_overwhelmed"],
      "answeredQuestions": ["stress_frequency"]
    },
    "navigation": {
      "currentStepId": "123e4567-e89b-12d3-a456-426614174000",
      "currentStepIndex": 2,
      "canGoNext": false,
      "canGoPrevious": true,
      "isComplete": false,
      "totalSteps": 5,
      "answeredQuestions": 8,
      "totalQuestions": 15
    },
    "previousAnswers": {
      "stress_frequency": 3,
      "sleep_quality": 2,
      "exercise_frequency": 4
    }
  },
  "performanceMs": 165
}
```

#### Verwendung

Dieser Endpunkt ist ideal für:
- Wiederaufnahme nach Browser-Reload
- Fortsetzung nach Timeout
- Wiederherstellung nach Netzwerkverlust

---

## React Hooks

### `useAssessmentNavigation`

Hook für die Verwaltung des Navigationsstatus.

```typescript
import { useAssessmentNavigation } from '@/lib/hooks/useAssessmentNavigation'

function MyComponent({ assessmentId }) {
  const { navigation, status, error, refresh, isNavigating } = 
    useAssessmentNavigation(assessmentId)

  if (status === 'loading') return <div>Lädt...</div>
  if (error) return <div>Fehler: {error}</div>

  return (
    <div>
      <p>Schritt {navigation.currentStepIndex + 1} von {navigation.totalSteps}</p>
      <button 
        disabled={!navigation.canGoPrevious || isNavigating}
        onClick={() => {/* navigate previous */}}
      >
        Zurück
      </button>
      <button 
        disabled={!navigation.canGoNext || isNavigating}
        onClick={() => {/* navigate next */}}
      >
        Weiter
      </button>
    </div>
  )
}
```

### `useAssessmentResume`

Hook für die Wiederaufnahme eines Assessments.

```typescript
import { useAssessmentResume } from '@/lib/hooks/useAssessmentNavigation'

function ResumeAssessment({ assessmentId }) {
  const { resumeData, status, error, load } = useAssessmentResume(assessmentId)

  useEffect(() => {
    load()
  }, [load])

  if (status === 'loading') return <div>Lädt Assessment...</div>
  if (error) return <div>Fehler: {error}</div>
  if (!resumeData) return null

  return (
    <div>
      <h2>{resumeData.currentStep.title}</h2>
      <p>Sie haben bereits {resumeData.navigation.answeredQuestions} von {resumeData.navigation.totalQuestions} Fragen beantwortet.</p>
      {/* Restore previous answers to form state */}
    </div>
  )
}
```

---

## Debouncing & Race Condition Prevention

Die Navigation verwendet Debouncing, um Race Conditions bei schnellen Swipe-Gesten zu verhindern.

### Verwendung von `debouncedNavigationFetch`

```typescript
import { debouncedNavigationFetch } from '@/lib/navigation/debouncedFetch'

async function handleSwipeNavigation(assessmentId: string) {
  try {
    const response = await debouncedNavigationFetch(
      `nav-${assessmentId}`,
      `/api/assessments/${assessmentId}/navigation`,
      { method: 'GET' },
      100 // 100ms debounce
    )
    
    const result = await response.json()
    // Handle result
  } catch (error) {
    if (error.message.includes('superseded')) {
      // Request was superseded by a newer one - ignore
      return
    }
    // Handle real error
  }
}
```

### Features

- **Automatic Cancellation**: Ältere Requests werden automatisch abgebrochen
- **Debounce Delay**: Konfigurierbare Verzögerung (Standard: 100ms)
- **AbortController**: Nutzt native Browser-API für saubere Cancellation

---

## Performance-Optimierung

### Datenbank-Indizes

Die folgenden Indizes wurden für optimale Performance hinzugefügt:

```sql
-- Composite index für Funnel-Step-Ordering
CREATE INDEX idx_funnel_steps_funnel_order 
  ON funnel_steps (funnel_id, order_index);

-- Composite index für Step-Fragen mit Required-Flag
CREATE INDEX idx_funnel_step_questions_with_order 
  ON funnel_step_questions (funnel_step_id, order_index, is_required);

-- Index für Question-ID Lookups
CREATE INDEX idx_assessment_answers_question_id 
  ON assessment_answers (question_id);
```

### Query-Optimierung

1. **Parallele Abfragen**: Navigation-Endpunkte nutzen `Promise.all()` für parallele Datenbankabfragen
2. **Minimal Joins**: Nur notwendige Felder werden abgefragt
3. **Indizierte Sorts**: Alle ORDER BY Klauseln nutzen indizierte Spalten

### Performance-Monitoring

Alle Endpunkte loggen Performance-Warnungen:

```typescript
if (duration > 200) {
  console.warn(`Navigation request took ${duration}ms`)
}
```

Antworten enthalten `performanceMs` für Client-seitiges Monitoring.

---

## Navigationslogik

### Aktuellen Schritt ermitteln

```
1. Hole alle Funnel-Steps sortiert nach order_index
2. Für jeden Step:
   a. Hole alle Required Questions
   b. Prüfe, welche davon beantwortet sind
   c. Falls nicht alle beantwortet → dies ist der aktuelle Step
3. Falls alle Steps komplett → letzter Step (Complete/Summary)
```

### Next Step

```
1. Hole aktuellen Step
2. Finde Step mit nächst-höherem order_index
3. Return Step-ID oder null
```

### Previous Step

```
1. Hole aktuellen Step
2. Finde Step mit nächst-niedrigerem order_index
3. Return Step-ID oder null
```

---

## Testing

### Manuelle Tests

```bash
# Current Step
curl -X GET http://localhost:3000/api/assessments/{id}/current-step \
  -H "Cookie: sb-access-token=..."

# Navigation State
curl -X GET http://localhost:3000/api/assessments/{id}/navigation \
  -H "Cookie: sb-access-token=..."

# Resume
curl -X GET http://localhost:3000/api/assessments/{id}/resume \
  -H "Cookie: sb-access-token=..."
```

### Edge Cases

- ✅ Leeres Assessment (keine Antworten)
- ✅ Partiell ausgefülltes Assessment
- ✅ Vollständig ausgefülltes Assessment
- ✅ Assessment ohne funnel_id
- ✅ Schnelle aufeinanderfolgende Requests (Swipe-Simulation)
- ✅ Ungültige Assessment-ID
- ✅ Unauthorized Access

---

## Migration & Rollout

### 1. Datenbank-Migration

```bash
# Lokal testen
supabase db reset

# Production deployment
supabase db push
```

### 2. Frontend-Integration

Bestehende Assessment-Flows können schrittweise migriert werden:

```typescript
// Alt: Manuelle Step-Verwaltung
const [currentStep, setCurrentStep] = useState(0)

// Neu: Server-basierte Navigation
const { navigation } = useAssessmentNavigation(assessmentId)
```

### 3. Rollback-Plan

Falls Probleme auftreten:
1. API-Endpunkte können deaktiviert werden
2. Frontend fällt zurück auf lokale State-Verwaltung
3. Datenbank-Indizes können ohne Breaking Changes entfernt werden

---

## Wartung & Monitoring

### Performance-Metriken überwachen

```sql
-- Index-Nutzung prüfen
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public' 
  AND tablename IN ('assessments', 'assessment_answers', 'funnel_steps')
ORDER BY idx_scan DESC;

-- Langsame Queries identifizieren
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE query LIKE '%assessment%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Logging

Alle Endpunkte loggen:
- Performance-Warnungen (> 200ms)
- Authentifizierungsfehler
- Unauthorized Access Attempts
- Unerwartete Fehler

---

## Bekannte Limitierungen

1. **Funnel-Änderungen**: Wenn sich die Funnel-Struktur ändert (Steps hinzugefügt/entfernt), müssen laufende Assessments möglicherweise invalidiert werden
2. **Conditional Logic**: Die aktuelle Implementierung unterstützt noch keine bedingten Sprünge (Skip Logic)
3. **Multi-Funnel**: Ein Assessment kann nur einem Funnel zugeordnet sein

---

## Nächste Schritte

- [ ] Integration Tests schreiben
- [ ] Load Testing (Concurrent Users)
- [ ] Conditional Logic Support
- [ ] Analytics-Events für Navigation-Tracking
- [ ] Cache-Layer für häufige Queries
