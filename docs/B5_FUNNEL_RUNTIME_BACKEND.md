# B5 — Funnel Runtime Backend (Assessment Lifecycle & Step Navigation)

**Status:** ✅ Implementiert  
**Datum:** 2024-12-09  
**Feature Branch:** `copilot/add-funnel-runtime-backend`

---

## Überblick

Die B5 Funnel Runtime Backend ist eine serverseitige Orchestrierungsschicht, die den gesamten Assessment-Lebenszyklus verwaltet: vom Start über die schrittweise Navigation und Antwortspeicherung bis hin zum Abschluss. Diese zentrale Backend-Komponente ermöglicht es Mobile- und Desktop-Apps, einen konsistenten Funnel-Ablauf zu nutzen, ohne selbst komplexen State halten zu müssen.

## Ziele

1. ✅ **Assessment-Verwaltung**: Assessments starten, fortsetzen und abschließen
2. ✅ **Step-Kontrolle**: Aktuellen Step serverseitig bestimmen und Step-Wechsel kontrollieren
3. ✅ **Antwortspeicherung**: Antworten pro Step speichern (Upsert in assessment_answers)
4. ✅ **Validierung**: Schrittweise und globale Validierung vor Completion
5. ✅ **Step-Skipping Prevention**: Verhinderung von unerlaubten Sprüngen
6. ✅ **Einheitliche API**: Konsistente Schnittstelle für Mobile und Desktop

---

## Architektur

### Komponenten-Übersicht

```
┌─────────────────────────────────────────────────────────┐
│                    Client Apps                          │
│              (Mobile, Desktop, Web)                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ REST API
                     ▼
┌─────────────────────────────────────────────────────────┐
│              B5 Funnel Runtime Backend                  │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Lifecycle  │  │  Navigation  │  │  Validation  │  │
│  │  Management │  │   (B3)       │  │   (B2/B4)    │  │
│  └─────────────┘  └──────────────┘  └──────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    Database Layer                       │
│  - assessments (status, completed_at)                  │
│  - assessment_answers                                   │
│  - funnel_steps                                         │
│  - funnel_step_questions                                │
└─────────────────────────────────────────────────────────┘
```

### Datenbankschema-Erweiterungen

**Neue Felder in `assessments`:**
- `status`: ENUM ('in_progress', 'completed') - Lifecycle-Status
- Indizes für Performance (patient_id + status)

---

## API-Endpunkte

### 1. Assessment starten

**POST** `/api/funnels/{slug}/assessments`

Erstellt ein neues Assessment für den authentifizierten Patienten.

**Request:**
```json
POST /api/funnels/stress/assessments
Headers: { Cookie: "..." }
```

**Response (201 Created):**
```json
{
  "success": true,
  "assessmentId": "uuid",
  "status": "in_progress",
  "currentStep": {
    "stepId": "uuid",
    "title": "Stressbelastung",
    "type": "question_step",
    "orderIndex": 1,
    "stepIndex": 0
  }
}
```

**Fehler:**
- `400`: Funnel nicht aktiv
- `401`: Nicht authentifiziert
- `404`: Funnel nicht gefunden oder Patientenprofil fehlt

---

### 2. Assessment-Status abrufen

**GET** `/api/funnels/{slug}/assessments/{assessmentId}`

Gibt den aktuellen Status und Step eines Assessments zurück.

**Request:**
```json
GET /api/funnels/stress/assessments/abc-123
Headers: { Cookie: "..." }
```

**Response (200 OK):**
```json
{
  "success": true,
  "assessmentId": "abc-123",
  "status": "in_progress",
  "currentStep": {
    "stepId": "step-uuid",
    "title": "Schlafqualität",
    "type": "question_step",
    "stepIndex": 2,
    "orderIndex": 2
  },
  "completedSteps": 2,
  "totalSteps": 5
}
```

**Fehler:**
- `401`: Nicht authentifiziert
- `403`: Assessment gehört anderem User
- `404`: Assessment nicht gefunden

---

### 3. Antworten speichern

**POST** `/api/assessment-answers/save`

Speichert oder aktualisiert eine Antwort (idempotent via Upsert).

**Request:**
```json
POST /api/assessment-answers/save
{
  "assessmentId": "abc-123",
  "questionId": "stress_frequency",
  "answerValue": 3
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "answer-uuid",
    "assessment_id": "abc-123",
    "question_id": "stress_frequency",
    "answer_value": 3
  }
}
```

**B5-Erweiterung:**
- ✅ Verhindert Speichern in abgeschlossenen Assessments (status='completed')

**Fehler:**
- `400`: Assessment bereits abgeschlossen
- `401`: Nicht authentifiziert
- `403`: Kein Zugriff auf Assessment

---

### 4. Step validieren & nächsten Step ermitteln

**POST** `/api/funnels/{slug}/assessments/{assessmentId}/steps/{stepId}/validate`

Validiert einen Step und gibt bei Erfolg den nächsten Step zurück.

**Request:**
```json
POST /api/funnels/stress/assessments/abc-123/steps/step-1/validate
Headers: { Cookie: "..." }
```

**Response (200 OK) - Validation erfolgreich:**
```json
{
  "success": true,
  "ok": true,
  "missingQuestions": [],
  "nextStep": {
    "stepId": "step-2",
    "title": "Schlafqualität",
    "type": "question_step",
    "orderIndex": 2
  }
}
```

**Response (200 OK) - Validation fehlgeschlagen:**
```json
{
  "success": true,
  "ok": false,
  "missingQuestions": [
    {
      "questionId": "q-uuid",
      "questionKey": "stress_frequency",
      "questionLabel": "Wie häufig fühlen Sie sich gestresst?",
      "orderIndex": 1
    }
  ]
}
```

**Step-Skipping Prevention:**
- ✅ Validiert nur aktuelle oder vorherige Steps
- ✅ Blockiert Sprünge zu zukünftigen Steps mit 403

**Fehler:**
- `401`: Nicht authentifiziert
- `403`: Step-Skipping-Versuch oder kein Zugriff
- `404`: Assessment oder Step nicht gefunden

---

### 5. Assessment abschließen

**POST** `/api/funnels/{slug}/assessments/{assessmentId}/complete`

Führt vollständige Funnel-Validierung aus und markiert Assessment als abgeschlossen.

**Request:**
```json
POST /api/funnels/stress/assessments/abc-123/complete
Headers: { Cookie: "..." }
```

**Response (200 OK) - Erfolg:**
```json
{
  "success": true,
  "ok": true,
  "assessmentId": "abc-123",
  "status": "completed"
}
```

**Response (400 Bad Request) - Unvollständig:**
```json
{
  "success": true,
  "ok": false,
  "missingQuestions": [
    {
      "questionId": "q-uuid",
      "questionKey": "sleep_quality",
      "questionLabel": "Wie schätzen Sie Ihre Schlafqualität ein?",
      "orderIndex": 3
    }
  ],
  "error": "Nicht alle Pflichtfragen wurden beantwortet."
}
```

**Fehler:**
- `400`: Pflichtfragen fehlen
- `401`: Nicht authentifiziert
- `403`: Kein Zugriff auf Assessment
- `404`: Assessment nicht gefunden

---

## Sequenzdiagramm: Kompletter Ablauf

```
┌────────┐          ┌──────────┐          ┌──────────┐
│ Client │          │   API    │          │    DB    │
└───┬────┘          └────┬─────┘          └────┬─────┘
    │                    │                     │
    │ 1. Start Assessment│                     │
    ├───────────────────>│                     │
    │                    │ Create Assessment   │
    │                    ├────────────────────>│
    │                    │                     │
    │<─────── assessmentId + currentStep ──────┤
    │                    │                     │
    │                    │                     │
    │ 2. Save Answer     │                     │
    ├───────────────────>│                     │
    │                    │ Upsert Answer       │
    │                    ├────────────────────>│
    │                    │                     │
    │<─────────── success ─────────────────────┤
    │                    │                     │
    │                    │                     │
    │ 3. Validate Step   │                     │
    ├───────────────────>│                     │
    │                    │ Check Required Qs   │
    │                    ├────────────────────>│
    │                    │                     │
    │                    │ Get Next Step       │
    │                    ├────────────────────>│
    │                    │                     │
    │<────── nextStep ────────────────────────┤
    │                    │                     │
    │ ... (repeat 2-3 for each step)          │
    │                    │                     │
    │ 4. Complete        │                     │
    ├───────────────────>│                     │
    │                    │ Validate All Steps  │
    │                    ├────────────────────>│
    │                    │                     │
    │                    │ Update status       │
    │                    ├────────────────────>│
    │                    │                     │
    │<────── completed ───────────────────────┤
    │                    │                     │
```

---

## Integration in B2 und B3

### B2 Validation Integration

Die B5 Runtime nutzt die bestehenden B2-Validierungsfunktionen:

```typescript
import { 
  validateRequiredQuestions,      // Single step validation
  validateAllRequiredQuestions    // Full funnel validation
} from '@/lib/validation/requiredQuestions'
```

**Verwendung:**
- **Step Validation**: `validateRequiredQuestions(assessmentId, stepId)`
- **Complete Validation**: `validateAllRequiredQuestions(assessmentId, funnelId)`

### B3 Navigation Integration

Die B5 Runtime nutzt die B3-Navigationsfunktionen:

```typescript
import {
  getCurrentStep,      // Determine current step
  getNextStepId,       // Get next step ID
  canNavigateToStep    // Validate navigation
} from '@/lib/navigation/assessmentNavigation'
```

**Verwendung:**
- Bestimmung des aktuellen Steps bei Start
- Navigation zum nächsten Step nach Validation
- Prüfung, ob Navigation erlaubt ist (Step-Skipping Prevention)

---

## Sicherheit

### Authentifizierung & Authorization

Alle Endpunkte erfordern:
1. ✅ **Authentifizierung**: Gültige Supabase-Session
2. ✅ **Ownership-Prüfung**: Assessment gehört zum eingeloggten User
3. ✅ **Funnel-Zuordnung**: Step gehört zum korrekten Funnel

### HTTP-Status-Codes

- **200 OK**: Erfolgreiche Anfrage
- **201 Created**: Assessment erfolgreich erstellt
- **400 Bad Request**: Ungültige Eingabe oder Validation fehlgeschlagen
- **401 Unauthorized**: Nicht authentifiziert
- **403 Forbidden**: Kein Zugriff (Ownership oder Step-Skipping)
- **404 Not Found**: Ressource nicht gefunden
- **500 Internal Server Error**: Serverfehler

### Logging

Alle sicherheitsrelevanten Ereignisse werden geloggt:
- Unauthorized access attempts
- Step-skipping attempts
- Assessment lookup errors
- Validation failures

---

## Verwendungsbeispiele

### Mobile App: Kompletter Funnel-Durchlauf

```typescript
// 1. Assessment starten
const startResponse = await fetch('/api/funnels/stress/assessments', {
  method: 'POST',
  credentials: 'include'
})
const { assessmentId, currentStep } = await startResponse.json()

// 2. Durch Steps iterieren
let step = currentStep
while (step) {
  // Fragen anzeigen und Antworten sammeln
  const answers = await collectAnswers(step)
  
  // Antworten speichern
  for (const [questionId, value] of Object.entries(answers)) {
    await fetch('/api/assessment-answers/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ assessmentId, questionId, answerValue: value })
    })
  }
  
  // Step validieren und nächsten Step holen
  const validateResponse = await fetch(
    `/api/funnels/stress/assessments/${assessmentId}/steps/${step.stepId}/validate`,
    { method: 'POST', credentials: 'include' }
  )
  const { ok, nextStep } = await validateResponse.json()
  
  if (!ok) {
    // Validation fehlgeschlagen - Fehler anzeigen
    showValidationErrors()
    break
  }
  
  step = nextStep
}

// 3. Assessment abschließen
const completeResponse = await fetch(
  `/api/funnels/stress/assessments/${assessmentId}/complete`,
  { method: 'POST', credentials: 'include' }
)
const { ok, status } = await completeResponse.json()

if (ok && status === 'completed') {
  navigateToResults()
}
```

### Desktop App: Assessment fortsetzen

```typescript
// Assessment-Status abrufen (nach Browser-Reload)
const statusResponse = await fetch(
  `/api/funnels/stress/assessments/${assessmentId}`,
  { credentials: 'include' }
)
const { currentStep, completedSteps, totalSteps } = await statusResponse.json()

// UI aktualisieren
updateProgressBar(completedSteps, totalSteps)
showStep(currentStep)
```

---

## Testing

### Unit Tests (Empfohlen)

```typescript
// Test: Assessment Creation
test('POST /api/funnels/stress/assessments creates new assessment', async () => {
  const response = await authenticatedRequest('POST', '/api/funnels/stress/assessments')
  expect(response.status).toBe(201)
  expect(response.body).toHaveProperty('assessmentId')
  expect(response.body.status).toBe('in_progress')
})

// Test: Step-Skipping Prevention
test('Validation rejects skipping steps', async () => {
  const assessment = await createAssessment('stress')
  const step3 = await getStep(3)
  
  const response = await authenticatedRequest(
    'POST',
    `/api/funnels/stress/assessments/${assessment.id}/steps/${step3.id}/validate`
  )
  
  expect(response.status).toBe(403)
  expect(response.body.error).toContain('zukünftigen Schritt')
})

// Test: Completed Assessment Protection
test('Cannot save answers to completed assessment', async () => {
  const assessment = await createAndCompleteAssessment('stress')
  
  const response = await authenticatedRequest('POST', '/api/assessment-answers/save', {
    assessmentId: assessment.id,
    questionId: 'stress_q1',
    answerValue: 3
  })
  
  expect(response.status).toBe(400)
  expect(response.body.error).toContain('abgeschlossen')
})
```

### Manuelle Test-Szenarien

#### ✅ Happy Path: Kompletter Durchlauf
1. Assessment starten → assessmentId erhalten
2. Alle Fragen pro Step beantworten
3. Step validieren → nextStep erhalten
4. Zum nächsten Step navigieren
5. Assessment abschließen → status='completed'

#### ✅ Validation Failure: Fehlende Pflichtfrage
1. Assessment starten
2. Frage überspringen (nicht beantworten)
3. Step validieren → missingQuestions erhalten
4. Fehler anzeigen
5. Frage beantworten
6. Erneut validieren → Erfolg

#### ✅ Authorization: Fremdes Assessment
1. Als User A einloggen
2. Assessment von User B laden
3. → 403 Forbidden

#### ✅ Step-Skipping Prevention
1. Assessment starten (Step 1 aktiv)
2. Versuche Step 3 zu validieren
3. → 403 Forbidden

---

## Performance

### Optimierungen

1. **B3 Navigation**: Cached funnel_id Parameter vermeidet redundante Queries
2. **Bulk Queries**: Step-Questions werden in einem Query geladen (kein N+1)
3. **Database Indizes**: 
   - `idx_assessments_status`
   - `idx_assessments_patient_status`
4. **Parallele Queries**: Promise.all() wo möglich

### Erwartete Antwortzeiten

- **Assessment Start**: < 150ms
- **Status Abruf**: < 100ms
- **Step Validation**: < 150ms
- **Assessment Completion**: < 200ms

---

## Backwards-Kompatibilität

### Bestehende Funktionalität bleibt erhalten

✅ **B1 (Funnel Definition)**: Keine Änderungen  
✅ **B2 (Validation)**: Erweitert um Completed-Check  
✅ **B3 (Navigation)**: Wiederverwendet ohne Änderungen  
✅ **B4 (Dynamic Rules)**: Kompatibel via B2 Integration  

### Migration bestehender Assessments

Die Migration `20251209111000_add_assessment_status.sql` setzt automatisch:
- `status = 'in_progress'` für Assessments ohne `completed_at`
- `status = 'completed'` für Assessments mit `completed_at`

---

## Implementierte Akzeptanzkriterien

✅ **Ein Assessment kann serverseitig gestartet, geprüft und abgeschlossen werden**  
✅ **Der aktuelle Step wird serverseitig korrekt bestimmt**  
✅ **Step-Validierung blockiert Navigation, wenn Pflichtfragen fehlen**  
✅ **Step-Skipping wird zuverlässig verhindert**  
✅ **Mobile & Desktop können denselben Ablauf konsumieren**  
✅ **Antworten werden korrekt und idempotent gespeichert**  
✅ **Dokumentation erklärt Architektur, API-Endpunkte und Testfälle**  
✅ **Backwards-Kompatibilität: B1/B2/B3/B4 bleiben funktionsfähig**

---

## Dateien

### Neu erstellt

| Datei | Zweck |
|-------|-------|
| `supabase/migrations/20251209111000_add_assessment_status.sql` | Database migration für status field |
| `app/api/funnels/[slug]/assessments/route.ts` | Assessment creation endpoint |
| `app/api/funnels/[slug]/assessments/[assessmentId]/route.ts` | Assessment status endpoint |
| `app/api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts` | Step validation endpoint |
| `app/api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts` | Assessment completion endpoint |
| `docs/B5_FUNNEL_RUNTIME_BACKEND.md` | Diese Dokumentation |

### Modifiziert

| Datei | Änderung |
|-------|----------|
| `schema/schema.sql` | Added status field to assessments |
| `lib/types/funnel.ts` | Added status to Assessment type |
| `app/api/assessment-answers/save/route.ts` | Added completed-check protection |

---

## Nächste Schritte

### Empfohlene Frontend-Integrationen

1. **Funnel Progress Bar**: Nutze `completedSteps` / `totalSteps`
2. **Resume Feature**: Lade Assessment-Status bei App-Start
3. **Offline Support**: Queue Antworten bei Netzwerkausfall
4. **Error Handling**: Zeige strukturierte Validierungsfehler

### Mögliche Erweiterungen

- **Partial Save**: Speichere Step-Progress auch ohne Completion
- **Analytics**: Track Funnel Drop-off Rates
- **Time Tracking**: Erfasse Zeit pro Step
- **Auto-Save**: Periodisches Speichern ohne User-Aktion

---

**Autor:** GitHub Copilot  
**Status:** ✅ Production Ready  
**Version:** 1.0  
**Letzte Änderung:** 2024-12-09
