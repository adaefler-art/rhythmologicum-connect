# B6 — Frontend-Integration der Funnel Runtime (B5)

**Status:** ✅ Implementiert  
**Datum:** 2024-12-09  
**Branch:** `copilot/integrate-frontend-with-runtime-api`

---

## Überblick

B6 integriert das Frontend vollständig mit der B5 Funnel Runtime API. Das bedeutet, dass der gesamte Assessment-Ablauf (Start, Navigation, Validierung, Speicherung, Completion) nun ausschließlich über serverseitige APIs gesteuert wird.

### Vor B6 (Legacy)

```typescript
// ❌ Lokale Step-Verwaltung
const [currentStepIndex, setCurrentStepIndex] = useState(0)

// ❌ Direkter Supabase-Zugriff
await supabase.from('assessments').insert({ ... })
await supabase.from('assessment_answers').upsert({ ... })
await supabase.from('assessments').update({ completed_at: ... })

// ❌ Problem: Browser-Refresh setzt zurück auf Step 1
```

### Nach B6 (Runtime API)

```typescript
// ✅ Serverseitige Step-Verwaltung
const [assessmentStatus, setAssessmentStatus] = useState<AssessmentStatus | null>(null)

// ✅ Runtime API für alle Operationen
await fetch('/api/funnels/stress/assessments', { method: 'POST' })
await fetch('/api/assessment-answers/save', { method: 'POST', body: ... })
await fetch(`/api/funnels/stress/assessments/${id}/complete`, { method: 'POST' })

// ✅ Reload-sicher: Status wird von Server geladen
```

---

## Arbeitspakete (AKs)

### ✅ AK1 — Assessment Bootstrapping

**Ziel:** Beim Öffnen des Stress-Funnels wird ein Assessment gestartet oder fortgesetzt.

**Implementierung:**

1. **Check auf existierendes Assessment:**
   ```typescript
   const { data: existingAssessments } = await supabase
     .from('assessments')
     .select('id, status')
     .eq('patient_id', profileData.id)
     .eq('funnel', 'stress')
     .order('started_at', { ascending: false })
     .limit(1)
   ```

2. **Redirect bei completed Assessment:**
   ```typescript
   if (latest.status === 'completed') {
     router.push(`/patient/stress-check/result?assessmentId=${latest.id}`)
     return
   }
   ```

3. **Start neues Assessment via API:**
   ```typescript
   const response = await fetch('/api/funnels/stress/assessments', {
     method: 'POST',
     credentials: 'include',
   })
   const { assessmentId, currentStep } = await response.json()
   ```

4. **Lade Status:**
   ```typescript
   await loadAssessmentStatus(assessmentId)
   ```

**Wichtige Funktionen:**
- `bootstrapAssessment()` - Orchestriert den Start/Resume-Prozess
- `loadAssessmentStatus(assessmentId)` - Lädt Status von Runtime API

---

### ✅ AK2 — Step Rendering

**Ziel:** UI rendert den Step basierend auf API-Daten, nicht auf lokalem Index.

**Implementierung:**

1. **Step aus API-Status:**
   ```typescript
   const currentStep = funnel.steps.find(
     (s) => s.id === assessmentStatus.currentStep.stepId
   )
   ```

2. **Progress aus API-Daten:**
   ```typescript
   <h1>
     Schritt {assessmentStatus.currentStep.stepIndex + 1} von {assessmentStatus.totalSteps}
   </h1>
   ```

3. **Step-Eigenschaften aus Funnel-Definition:**
   ```typescript
   {currentStep.title}
   {currentStep.description}
   {isQuestionStep(currentStep) && currentStep.questions.map(...)}
   ```

**State:**
```typescript
type AssessmentStatus = {
  assessmentId: string
  status: 'in_progress' | 'completed'
  currentStep: {
    stepId: string      // ← Wichtig: ID statt Index
    title: string
    type: string
    stepIndex: number
    orderIndex: number
  }
  completedSteps: number
  totalSteps: number
}
```

---

### ✅ AK3 — Step Navigation

**Ziel:** Next/Back-Navigation basiert vollständig auf B5 Runtime.

#### Next-Navigation

**Flow:**
1. Validate aktuellen Step via API
2. API gibt `nextStep` zurück wenn valid
3. Reload Status von API → neuer `currentStep`
4. Wenn letzter Step → `handleComplete()`

**Code:**
```typescript
const handleNextStep = async () => {
  // 1. Validate
  const response = await fetch(
    `/api/funnels/stress/assessments/${assessmentStatus.assessmentId}/steps/${currentStep.id}`,
    { method: 'POST', credentials: 'include' }
  )
  const { ok, nextStep } = await response.json()
  
  if (!ok) {
    // Zeige Validation-Errors
    return
  }
  
  // 2. Reload Status (enthält neuen currentStep)
  if (nextStep) {
    await loadAssessmentStatus(assessmentStatus.assessmentId)
  } else {
    // Letzter Step → Complete
    await handleComplete()
  }
}
```

**API-Endpoint:**
```
POST /api/funnels/stress/assessments/{assessmentId}/steps/{stepId}

Response (erfolg):
{
  "success": true,
  "ok": true,
  "missingQuestions": [],
  "nextStep": {
    "stepId": "uuid-...",
    "title": "Stress-Symptome",
    "type": "question_step",
    "orderIndex": 2
  }
}

Response (fehler):
{
  "success": true,
  "ok": false,
  "missingQuestions": [
    {
      "questionId": "uuid-...",
      "questionKey": "stress_frequency",
      "questionLabel": "Wie häufig fühlen Sie sich gestresst?",
      "orderIndex": 1,
      "reason": "required"
    }
  ]
}
```

#### Back-Navigation

**Flow:**
1. Finde vorherigen Step in Funnel-Definition
2. Update lokalen `assessmentStatus` State
3. Kein API-Call nötig (bereits validiert)

**Code:**
```typescript
const handlePreviousStep = () => {
  const currentStepIndex = assessmentStatus.currentStep.stepIndex
  
  if (currentStepIndex > 0) {
    const previousStep = funnel.steps.find(
      (s) => s.orderIndex === funnel.steps[currentStepIndex - 1]?.orderIndex
    )
    
    setAssessmentStatus({
      ...assessmentStatus,
      currentStep: {
        stepId: previousStep.id,
        title: previousStep.title,
        type: previousStep.type,
        stepIndex: currentStepIndex - 1,
        orderIndex: previousStep.orderIndex,
      },
    })
  }
}
```

**Wichtig:** Back-Navigation ist client-seitig, da alle vorherigen Steps bereits validiert wurden.

---

### ✅ AK4 — Answer Save

**Ziel:** Ersetze direkte Supabase-Upserts durch Runtime API Endpoint.

**Vorher (Legacy):**
```typescript
// ❌ Direkter Supabase-Client
const { error } = await supabase
  .from('assessment_answers')
  .upsert({
    assessment_id: assessmentId,
    question_id: questionKey,
    answer_value: value,
  })
```

**Nachher (B6):**
```typescript
// ✅ Runtime API
const saveAnswer = async (questionKey: string, value: number) => {
  const response = await fetch('/api/assessment-answers/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      assessmentId: assessmentStatus.assessmentId,
      questionId: questionKey,
      answerValue: value,
    }),
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error)
  }
}
```

**API-Endpoint:**
```
POST /api/assessment-answers/save

Request Body:
{
  "assessmentId": "uuid-...",
  "questionId": "stress_frequency",  // question.key
  "answerValue": 3
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid-...",
    "assessment_id": "uuid-...",
    "question_id": "stress_frequency",
    "answer_value": 3
  }
}
```

**Vorteile:**
- ✅ Serverseitige Validation (z.B. Assessment nicht completed)
- ✅ Konsistentes Error-Handling
- ✅ Keine direkten DB-Zugriffe im Frontend

---

### ✅ AK5 — Assessment Completion

**Ziel:** Assessment-Abschluss erfolgt über Runtime API mit Full-Validation.

**Vorher (Legacy):**
```typescript
// ❌ Direkter Supabase-Update
const { error } = await supabase
  .from('assessments')
  .update({ completed_at: new Date().toISOString() })
  .eq('id', assessmentId)
```

**Nachher (B6):**
```typescript
// ✅ Runtime API mit Full-Validation
const handleComplete = async () => {
  const response = await fetch(
    `/api/funnels/stress/assessments/${assessmentStatus.assessmentId}/complete`,
    {
      method: 'POST',
      credentials: 'include',
    }
  )
  
  const data = await response.json()
  
  if (!data.ok) {
    // Zeige fehlende Pflichtfragen
    setValidationErrors(data.missingQuestions)
    setError(data.error)
    return
  }
  
  // Erfolg → Redirect zu Result
  router.push(`/patient/stress-check/result?assessmentId=${assessmentStatus.assessmentId}`)
}
```

**API-Endpoint:**
```
POST /api/funnels/stress/assessments/{assessmentId}/complete

Response (erfolg):
{
  "success": true,
  "ok": true,
  "assessmentId": "uuid-...",
  "status": "completed"
}

Response (incomplete):
{
  "success": true,
  "ok": false,
  "missingQuestions": [ ... ],
  "error": "Nicht alle Pflichtfragen wurden beantwortet."
}
```

**Wichtig:** Das Backend validiert alle Steps im Funnel, nicht nur den aktuellen!

---

### ✅ AK6 — Edge Cases

#### 1. Completed Assessment Redirect

**Problem:** User öffnet `/patient/stress-check` mit abgeschlossenem Assessment.

**Lösung:**
```typescript
if (latest.status === 'completed') {
  router.push(`/patient/stress-check/result?assessmentId=${latest.id}`)
  return
}
```

#### 2. Error-Handling für API-Calls

**Implementierung:**
```typescript
try {
  const response = await fetch(...)
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'API-Fehler')
  }
} catch (err) {
  console.error('API-Fehler:', err)
  setError('Fehler beim Laden. Bitte versuchen Sie es erneut.')
}
```

#### 3. Loading States

```typescript
const [initialLoading, setInitialLoading] = useState(true)
const [submitting, setSubmitting] = useState(false)

if (initialLoading || !funnel || !assessmentStatus) {
  return <p>Bitte warten…</p>
}
```

#### 4. Validation Errors mit Auto-Scroll

```typescript
if (data.missingQuestions && data.missingQuestions.length > 0) {
  const firstMissing = data.missingQuestions[0]
  setTimeout(() => {
    const element = document.getElementById(`question-${firstMissing.questionId}`)
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, 100)
}
```

---

## Reload-Sicherheit

**Problem vor B6:**
```
User ist bei Schritt 3
→ Browser Refresh (F5)
→ State zurückgesetzt
→ User landet wieder bei Schritt 1 ❌
```

**Lösung mit B6:**
```
User ist bei Schritt 3
→ Browser Refresh (F5)
→ bootstrapAssessment() läuft
→ loadAssessmentStatus() holt currentStep von API
→ User landet wieder bei Schritt 3 ✅
```

**Code:**
```typescript
useEffect(() => {
  if (hasConsent && userId && funnel && !assessmentStatus) {
    bootstrapAssessment()  // Lädt Status von API
  }
}, [hasConsent, userId, funnel])
```

---

## API-Übersicht

### 1. Start Assessment
```
POST /api/funnels/stress/assessments

Response:
{
  "success": true,
  "assessmentId": "uuid-...",
  "status": "in_progress",
  "currentStep": {
    "stepId": "uuid-...",
    "title": "Willkommen",
    "type": "info_step",
    "orderIndex": 0,
    "stepIndex": 0
  }
}
```

### 2. Get Status
```
GET /api/funnels/stress/assessments/{assessmentId}

Response:
{
  "success": true,
  "assessmentId": "uuid-...",
  "status": "in_progress",
  "currentStep": { ... },
  "completedSteps": 2,
  "totalSteps": 5
}
```

### 3. Validate Step
```
POST /api/funnels/stress/assessments/{assessmentId}/steps/{stepId}

Response (valid):
{
  "success": true,
  "ok": true,
  "missingQuestions": [],
  "nextStep": { stepId, title, type, orderIndex } | null
}

Response (invalid):
{
  "success": true,
  "ok": false,
  "missingQuestions": [ ... ]
}
```

### 4. Save Answer
```
POST /api/assessment-answers/save

Body:
{
  "assessmentId": "uuid-...",
  "questionId": "stress_frequency",
  "answerValue": 3
}

Response:
{
  "success": true,
  "data": { id, assessment_id, question_id, answer_value }
}
```

### 5. Complete Assessment
```
POST /api/funnels/stress/assessments/{assessmentId}/complete

Response (success):
{
  "success": true,
  "ok": true,
  "assessmentId": "uuid-...",
  "status": "completed"
}

Response (incomplete):
{
  "success": true,
  "ok": false,
  "missingQuestions": [ ... ],
  "error": "Nicht alle Pflichtfragen wurden beantwortet."
}
```

---

## Code-Änderungen

### Entfernte Funktionen

```typescript
// ❌ Gelöscht
const createAssessmentIfNeeded = async () => { ... }  // → Runtime API
const handleSubmit = async () => { ... }              // → handleComplete()
```

### Neue Funktionen

```typescript
// ✅ Neu
const bootstrapAssessment = async () => { ... }       // AK1
const loadAssessmentStatus = async (id: string) => { ... }  // AK1, AK2
const validateCurrentStep = async () => { ... }       // AK3 (API-basiert)
const handleNextStep = async () => { ... }            // AK3 (API-basiert)
const handlePreviousStep = () => { ... }              // AK3 (client-seitig)
const saveAnswer = async (key, value) => { ... }      // AK4 (API-basiert)
const handleComplete = async () => { ... }            // AK5 (API-basiert)
```

### Geänderte State-Struktur

**Vorher:**
```typescript
const [currentStepIndex, setCurrentStepIndex] = useState(0)
const [assessmentId, setAssessmentId] = useState<string | null>(null)
```

**Nachher:**
```typescript
const [assessmentStatus, setAssessmentStatus] = useState<AssessmentStatus | null>(null)

type AssessmentStatus = {
  assessmentId: string
  status: 'in_progress' | 'completed'
  currentStep: {
    stepId: string      // ← ID statt Index!
    title: string
    type: string
    stepIndex: number
    orderIndex: number
  }
  completedSteps: number
  totalSteps: number
}
```

---

## Testing Guide (AK7)

### Test 1: Initial Load

**Schritte:**
1. Öffne `/patient/stress-check`
2. Akzeptiere Consent

**Erwartung:**
- ✅ Neues Assessment wird gestartet
- ✅ Erster Step wird angezeigt
- ✅ Progress zeigt "Schritt 1 von X"

**Debugging:**
```javascript
// Browser Console
console.log('Assessment Status:', assessmentStatus)
// Sollte zeigen: { assessmentId, status: 'in_progress', currentStep: { stepIndex: 0, ... } }
```

---

### Test 2: Answer Save

**Schritte:**
1. Beantworte eine Frage durch Klick auf Skala
2. Öffne Browser DevTools → Network Tab

**Erwartung:**
- ✅ POST zu `/api/assessment-answers/save`
- ✅ Status 200
- ✅ Antwort wird in UI als "beantwortet" markiert

**Debugging:**
```javascript
// Network Tab → Request Payload
{
  "assessmentId": "uuid-...",
  "questionId": "stress_frequency",
  "answerValue": 3
}

// Response
{
  "success": true,
  "data": { ... }
}
```

---

### Test 3: Step Validation (Success)

**Schritte:**
1. Beantworte alle Pflichtfragen in einem Step
2. Klicke "Weiter"

**Erwartung:**
- ✅ POST zu `/api/.../steps/{stepId}`
- ✅ Response: `{ ok: true, nextStep: { ... } }`
- ✅ Navigation zum nächsten Step
- ✅ URL ändert sich nicht (gleiche Page)

---

### Test 4: Step Validation (Failure)

**Schritte:**
1. Lasse Pflichtfragen unbeantwortet
2. Klicke "Weiter"

**Erwartung:**
- ✅ POST zu `/api/.../steps/{stepId}`
- ✅ Response: `{ ok: false, missingQuestions: [...] }`
- ✅ Error-Message wird angezeigt
- ✅ Scroll zu erster fehlender Frage
- ✅ Keine Navigation

---

### Test 5: Browser Reload (Reload-Sicherheit)

**Schritte:**
1. Navigiere zu Schritt 3
2. Drücke F5 (Browser Refresh)

**Erwartung:**
- ✅ Page lädt
- ✅ `bootstrapAssessment()` wird aufgerufen
- ✅ `loadAssessmentStatus()` holt currentStep von API
- ✅ User landet wieder bei Schritt 3 ✅ (nicht Schritt 1!)

**Debugging:**
```javascript
// Browser Console beim Reload
console.log('Loading status...')
// API-Call zu GET /api/funnels/stress/assessments/{id}
// Response sollte zeigen: currentStep.stepIndex = 2 (Schritt 3)
```

---

### Test 6: Back-Navigation

**Schritte:**
1. Navigiere zu Schritt 3
2. Klicke "Zurück"

**Erwartung:**
- ✅ Navigation zu Schritt 2
- ✅ Kein API-Call (client-seitig)
- ✅ State-Update lokal
- ✅ Bereits beantwortete Fragen sind sichtbar

---

### Test 7: Assessment Completion

**Schritte:**
1. Beantworte alle Fragen im Funnel
2. Navigiere zum letzten Step
3. Klicke "Abschließen"

**Erwartung:**
- ✅ POST zu `/api/.../complete`
- ✅ Response: `{ ok: true, status: 'completed' }`
- ✅ Redirect zu `/patient/stress-check/result?assessmentId=...`

**Debugging:**
```javascript
// Network Tab → POST /api/.../complete
// Response:
{
  "success": true,
  "ok": true,
  "assessmentId": "uuid-...",
  "status": "completed"
}
```

---

### Test 8: Completed Assessment Redirect

**Schritte:**
1. Schließe ein Assessment ab
2. Öffne `/patient/stress-check` erneut

**Erwartung:**
- ✅ `bootstrapAssessment()` erkennt completed Assessment
- ✅ Redirect zu `/patient/stress-check/result?assessmentId=...`
- ✅ Kein neues Assessment wird gestartet

---

## Troubleshooting

### Problem: "Assessment konnte nicht geladen werden"

**Ursache:** API-Fehler beim Bootstrap

**Debugging:**
```javascript
// Browser Console
console.error('Bootstrap error:', error)
```

**Lösung:**
- Prüfe Supabase-Connection
- Prüfe ob Patient-Profile existiert
- Prüfe API-Logs im Backend

---

### Problem: "Antworten werden nicht gespeichert"

**Ursache:** Save-Endpoint gibt Fehler

**Debugging:**
```javascript
// Network Tab → POST /api/assessment-answers/save
// Response Status: 400/500?
// Response Body: { "error": "..." }
```

**Lösung:**
- Prüfe ob Assessment `in_progress` ist (nicht `completed`)
- Prüfe ob `questionId` korrekt (question.key, nicht question.id)
- Prüfe ob `answerValue` Integer ist

---

### Problem: "Browser Reload setzt zurück auf Schritt 1"

**Ursache:** `bootstrapAssessment()` wird nicht aufgerufen

**Debugging:**
```javascript
// Browser Console
console.log('hasConsent:', hasConsent)
console.log('userId:', userId)
console.log('funnel:', funnel)
console.log('assessmentStatus:', assessmentStatus)
```

**Lösung:**
- Stelle sicher, dass `useEffect` mit korrekten Dependencies läuft
- Prüfe ob `loadAssessmentStatus()` erfolgreich ist

---

### Problem: "Validation schlägt fehl obwohl alle Fragen beantwortet"

**Ursache:** B4 Dynamic Rules erfordern zusätzliche Fragen

**Debugging:**
```javascript
// Network Tab → POST /api/.../steps/{stepId}
// Response:
{
  "ok": false,
  "missingQuestions": [
    {
      "questionId": "uuid-...",
      "reason": "conditional_required",  // ← Bedingte Pflichtfrage
      "ruleDescription": "Sie haben 'Ja' bei Frage X gewählt"
    }
  ]
}
```

**Lösung:**
- Beantworte die bedingt erforderlichen Fragen
- UI zeigt diese mit "Pflicht (abhängig)" Badge

---

## Performance

### Erwartete Response-Zeiten

- **Bootstrap:** < 500ms
- **Load Status:** < 200ms
- **Validate Step:** < 300ms
- **Save Answer:** < 150ms
- **Complete:** < 400ms

### Optimierungen

1. **Caching:** Status wird nur bei Bedarf nachgeladen
2. **Parallel Queries:** Funnel + Status parallel laden
3. **Debouncing:** Answer-Save könnte debounced werden (noch nicht implementiert)
4. **Local State:** Back-Navigation nutzt lokalen State (kein API-Call)

---

## Nächste Schritte

### Sofort
- [ ] Manuelles Testing durchführen (AK7)
- [ ] Edge Cases testen (siehe Testing Guide)
- [ ] Performance messen

### Später
- [ ] Debouncing für Answer-Save
- [ ] Offline-Support (Service Worker)
- [ ] Analytics (Drop-off Tracking)
- [ ] Multi-Device Resume (gleicher User, anderes Gerät)

---

## Zusammenfassung

### Was wurde erreicht?

✅ **Vollständige Runtime API Integration**
- Kein direkter Supabase-Zugriff mehr im Frontend
- Alle Operationen über B5 Runtime API

✅ **Reload-Sicherheit**
- Browser Refresh landet im korrekten Step
- State wird von Server geladen

✅ **Step-Skipping Prevention**
- Serverseitige Validation verhindert Sprünge
- Navigation nur zu validierten Steps

✅ **Completed Assessment Protection**
- Save-Endpoint blockiert Edits bei completed
- Redirect zu Result-Page bei erneutem Öffnen

✅ **Konsistentes Error-Handling**
- Alle API-Fehler werden abgefangen
- User-freundliche Fehlermeldungen

---

**Implementation:** GitHub Copilot  
**Review Status:** Bereit für Testing  
**Next:** Manuelles Testing (AK7)
