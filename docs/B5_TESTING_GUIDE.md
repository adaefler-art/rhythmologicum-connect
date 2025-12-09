# B5 Funnel Runtime Backend - Testing Guide

**Datum:** 2024-12-09  
**Version:** 1.0

---

## Überblick

Dieser Testing Guide beschreibt manuelle und automatisierte Tests für die B5 Funnel Runtime Backend-Implementierung. Alle Tests sollten vor dem Deployment durchgeführt werden.

---

## Voraussetzungen

### Setup
1. Lokale Entwicklungsumgebung:
   ```bash
   npm run dev
   ```

2. Migrationen anwenden:
   ```bash
   # In Supabase Dashboard oder CLI
   supabase db push
   ```

3. Test-User erstellen:
   - Patient-Account mit valider Email
   - Mindestens ein aktiver Funnel (z.B. "stress")

4. API-Test-Tool:
   - Browser DevTools (Fetch API)
   - cURL
   - Postman/Insomnia

---

## Test-Szenarien

### Szenario 1: Happy Path - Kompletter Funnel-Durchlauf

**Ziel:** Verifizieren, dass ein Assessment vollständig durchlaufen werden kann.

#### Schritt 1: Assessment starten

```bash
curl -X POST http://localhost:3000/api/funnels/stress/assessments \
  -H "Cookie: sb-access-token=..." \
  -v
```

**Erwartetes Ergebnis:**
- Status: `201 Created`
- Response enthält `assessmentId`, `status: 'in_progress'`, `currentStep`

**Validierung:**
```sql
-- Prüfe, dass Assessment erstellt wurde
SELECT id, patient_id, funnel_id, status, started_at 
FROM assessments 
WHERE id = '<assessmentId>';

-- Expected: status = 'in_progress', completed_at IS NULL
```

#### Schritt 2: Erste Frage beantworten

```bash
curl -X POST http://localhost:3000/api/assessment-answers/save \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "assessmentId": "<assessmentId>",
    "questionId": "stress_frequency",
    "answerValue": 3
  }'
```

**Erwartetes Ergebnis:**
- Status: `200 OK`
- Response: `{ "success": true, "data": { ... } }`

**Validierung:**
```sql
-- Prüfe, dass Antwort gespeichert wurde
SELECT * FROM assessment_answers 
WHERE assessment_id = '<assessmentId>' 
  AND question_id = 'stress_frequency';

-- Expected: answer_value = 3
```

#### Schritt 3: Step validieren

```bash
curl -X POST http://localhost:3000/api/funnels/stress/assessments/<assessmentId>/steps/<stepId>/validate \
  -H "Cookie: sb-access-token=..." \
  -v
```

**Erwartetes Ergebnis (bei fehlenden Pflichtfragen):**
```json
{
  "success": true,
  "ok": false,
  "missingQuestions": [
    {
      "questionId": "...",
      "questionKey": "stress_intensity",
      "questionLabel": "...",
      "orderIndex": 2
    }
  ]
}
```

**Erwartetes Ergebnis (bei vollständigem Step):**
```json
{
  "success": true,
  "ok": true,
  "missingQuestions": [],
  "nextStep": {
    "stepId": "...",
    "title": "Schlafqualität",
    "type": "question_step",
    "orderIndex": 2
  }
}
```

#### Schritt 4: Alle verbleibenden Schritte durchlaufen

Wiederhole Schritt 2-3 für alle Steps.

#### Schritt 5: Assessment abschließen

```bash
curl -X POST http://localhost:3000/api/funnels/stress/assessments/<assessmentId>/complete \
  -H "Cookie: sb-access-token=..." \
  -v
```

**Erwartetes Ergebnis:**
```json
{
  "success": true,
  "ok": true,
  "assessmentId": "...",
  "status": "completed"
}
```

**Validierung:**
```sql
-- Prüfe, dass Assessment als completed markiert wurde
SELECT status, completed_at 
FROM assessments 
WHERE id = '<assessmentId>';

-- Expected: status = 'completed', completed_at IS NOT NULL
```

---

### Szenario 2: Validation Failure - Fehlende Pflichtfrage

**Ziel:** Verifizieren, dass unvollständige Steps blockiert werden.

#### Test-Schritte:

1. Assessment starten
2. Nur erste Frage beantworten (zweite Pflichtfrage überspringen)
3. Step validieren

**Erwartetes Ergebnis:**
```json
{
  "success": true,
  "ok": false,
  "missingQuestions": [
    {
      "questionId": "...",
      "questionKey": "stress_intensity",
      "questionLabel": "Wie stark ist Ihr Stressempfinden?",
      "orderIndex": 2
    }
  ]
}
```

4. Fehlende Frage beantworten
5. Erneut validieren → sollte jetzt erfolgreich sein

---

### Szenario 3: Authorization - Fremdes Assessment

**Ziel:** Verifizieren, dass User nur auf eigene Assessments zugreifen können.

#### Test-Schritte:

1. Als User A einloggen
2. Assessment für User A erstellen → `assessmentId_A`
3. Als User B einloggen
4. Versuche, Assessment von User A abzurufen:

```bash
curl -X GET http://localhost:3000/api/funnels/stress/assessments/<assessmentId_A> \
  -H "Cookie: sb-access-token=<user_b_token>" \
  -v
```

**Erwartetes Ergebnis:**
- Status: `403 Forbidden`
- Response: `{ "success": false, "error": "Sie haben keine Berechtigung..." }`

**Log-Check:**
```
Console should contain:
"Unauthorized assessment access attempt by user <user_b_id> for assessment <assessmentId_A>"
```

---

### Szenario 4: Step-Skipping Prevention

**Ziel:** Verifizieren, dass Sprünge zu zukünftigen Steps verhindert werden.

#### Test-Schritte:

1. Assessment starten (aktueller Step = Step 1)
2. Versuche, Step 3 zu validieren (ohne Step 1 und 2 abzuschließen):

```bash
curl -X POST http://localhost:3000/api/funnels/stress/assessments/<assessmentId>/steps/<step3_id>/validate \
  -H "Cookie: sb-access-token=..." \
  -v
```

**Erwartetes Ergebnis:**
- Status: `403 Forbidden`
- Response: `{ "success": false, "error": "Sie können nicht zu einem zukünftigen Schritt springen." }`

---

### Szenario 5: Completed Assessment Protection

**Ziel:** Verifizieren, dass abgeschlossene Assessments nicht mehr bearbeitet werden können.

#### Test-Schritte:

1. Assessment vollständig abschließen (status = 'completed')
2. Versuche, neue Antwort zu speichern:

```bash
curl -X POST http://localhost:3000/api/assessment-answers/save \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "assessmentId": "<completedAssessmentId>",
    "questionId": "stress_frequency",
    "answerValue": 4
  }'
```

**Erwartetes Ergebnis:**
- Status: `400 Bad Request`
- Response: `{ "success": false, "error": "Dieses Assessment wurde bereits abgeschlossen und kann nicht mehr bearbeitet werden." }`

**Validierung:**
```sql
-- Prüfe, dass Antwort NICHT aktualisiert wurde
SELECT answer_value FROM assessment_answers 
WHERE assessment_id = '<completedAssessmentId>' 
  AND question_id = 'stress_frequency';

-- Expected: answer_value bleibt bei ursprünglichem Wert (z.B. 3)
```

---

### Szenario 6: Assessment Status Abruf

**Ziel:** Verifizieren, dass der aktuelle Status korrekt zurückgegeben wird.

#### Test-Schritte:

1. Assessment erstellen
2. Erste 2 Steps abschließen
3. Status abrufen:

```bash
curl -X GET http://localhost:3000/api/funnels/stress/assessments/<assessmentId> \
  -H "Cookie: sb-access-token=..." \
  -v
```

**Erwartetes Ergebnis:**
```json
{
  "success": true,
  "assessmentId": "...",
  "status": "in_progress",
  "currentStep": {
    "stepId": "...",
    "title": "Schlafqualität",
    "type": "question_step",
    "stepIndex": 2,
    "orderIndex": 2
  },
  "completedSteps": 2,
  "totalSteps": 5
}
```

**Validierung:**
- `currentStep` zeigt auf Step 3 (index 2, da 0-basiert)
- `completedSteps` = 2 (Steps 0 und 1 abgeschlossen)
- `totalSteps` entspricht Anzahl Steps im Funnel

---

### Szenario 7: Incomplete Assessment Completion

**Ziel:** Verifizieren, dass unvollständige Assessments nicht abgeschlossen werden können.

#### Test-Schritte:

1. Assessment starten
2. Nur ersten Step abschließen
3. Versuche, Assessment abzuschließen:

```bash
curl -X POST http://localhost:3000/api/funnels/stress/assessments/<assessmentId>/complete \
  -H "Cookie: sb-access-token=..." \
  -v
```

**Erwartetes Ergebnis:**
- Status: `400 Bad Request`
- Response:
```json
{
  "success": true,
  "ok": false,
  "missingQuestions": [
    {
      "questionId": "...",
      "questionKey": "sleep_quality",
      "questionLabel": "...",
      "orderIndex": 1
    },
    {
      "questionId": "...",
      "questionKey": "sleep_duration",
      "questionLabel": "...",
      "orderIndex": 2
    }
  ],
  "error": "Nicht alle Pflichtfragen wurden beantwortet."
}
```

**Validierung:**
```sql
-- Prüfe, dass Assessment NICHT abgeschlossen wurde
SELECT status, completed_at 
FROM assessments 
WHERE id = '<assessmentId>';

-- Expected: status = 'in_progress', completed_at IS NULL
```

---

## SQL-Konsistenztests

### Test 1: Enum Values

```sql
-- Prüfe, dass nur valide Status-Werte existieren
SELECT DISTINCT status FROM assessments;

-- Expected: Nur 'in_progress' und 'completed'
```

### Test 2: Completed_at Consistency

```sql
-- Prüfe, dass completed Assessments immer completed_at haben
SELECT id, status, completed_at 
FROM assessments 
WHERE status = 'completed' AND completed_at IS NULL;

-- Expected: Keine Ergebnisse
```

### Test 3: Answer Integrity

```sql
-- Prüfe, dass alle Antworten zu existierenden Assessments gehören
SELECT aa.id 
FROM assessment_answers aa
LEFT JOIN assessments a ON aa.assessment_id = a.id
WHERE a.id IS NULL;

-- Expected: Keine Ergebnisse
```

### Test 4: Foreign Key Integrity

```sql
-- Prüfe, dass alle Assessments gültige funnel_id haben
SELECT id, funnel_id 
FROM assessments 
WHERE funnel_id IS NULL;

-- Expected: Möglicherweise alte Assessments vor B3, sonst keine
```

---

## Performance-Tests

### Test 1: Response Time

Verwende Browser DevTools Network Tab oder `curl -w`:

```bash
curl -X GET http://localhost:3000/api/funnels/stress/assessments/<assessmentId> \
  -H "Cookie: sb-access-token=..." \
  -w "\nTime Total: %{time_total}s\n" \
  -o /dev/null -s
```

**Erwartete Werte:**
- Assessment Start: < 150ms
- Status Abruf: < 100ms
- Step Validation: < 150ms
- Assessment Completion: < 200ms

### Test 2: Concurrent Requests

Simuliere 10 gleichzeitige Status-Abfragen:

```bash
for i in {1..10}; do
  curl -X GET http://localhost:3000/api/funnels/stress/assessments/<assessmentId> \
    -H "Cookie: sb-access-token=..." &
done
wait
```

**Erwartung:** Alle Requests erfolgreich, keine Race Conditions

---

## Backwards-Kompatibilitäts-Tests

### Test 1: B2 Validation weiterhin funktionsfähig

```bash
# Alter Endpoint sollte weiterhin funktionieren
curl -X POST http://localhost:3000/api/assessment-validation/validate-step \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "assessmentId": "<assessmentId>",
    "stepId": "<stepId>"
  }'
```

**Erwartung:** Funktioniert wie vorher, ignoriert status-Feld

### Test 2: B3 Navigation unverändert

```bash
curl -X GET http://localhost:3000/api/assessments/<assessmentId>/current-step \
  -H "Cookie: sb-access-token=..."
```

**Erwartung:** Funktioniert wie vorher

---

## Fehlerbehandlung

### Test: Ungültiger Funnel-Slug

```bash
curl -X POST http://localhost:3000/api/funnels/invalid-slug/assessments \
  -H "Cookie: sb-access-token=..." \
  -v
```

**Erwartung:** `404 Not Found`, `{ "error": "Funnel nicht gefunden." }`

### Test: Inaktiver Funnel

```sql
-- Deaktiviere Funnel
UPDATE funnels SET is_active = false WHERE slug = 'stress';
```

```bash
curl -X POST http://localhost:3000/api/funnels/stress/assessments \
  -H "Cookie: sb-access-token=..." \
  -v
```

**Erwartung:** `400 Bad Request`, `{ "error": "Dieser Funnel ist nicht aktiv." }`

### Test: Fehlende Authentication

```bash
curl -X POST http://localhost:3000/api/funnels/stress/assessments \
  -v
```

**Erwartung:** `401 Unauthorized`, `{ "error": "Authentifizierung fehlgeschlagen..." }`

---

## Browser-basierte Tests

### Test mit Browser DevTools

1. Login als Patient
2. Öffne Browser Console
3. Führe aus:

```javascript
// 1. Assessment starten
const startResponse = await fetch('/api/funnels/stress/assessments', {
  method: 'POST',
  credentials: 'include'
})
const startData = await startResponse.json()
console.log('Start:', startData)

const assessmentId = startData.assessmentId
const stepId = startData.currentStep.stepId

// 2. Antwort speichern
const saveResponse = await fetch('/api/assessment-answers/save', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    assessmentId,
    questionId: 'stress_frequency',
    answerValue: 3
  })
})
console.log('Save:', await saveResponse.json())

// 3. Status abrufen
const statusResponse = await fetch(`/api/funnels/stress/assessments/${assessmentId}`, {
  credentials: 'include'
})
console.log('Status:', await statusResponse.json())

// 4. Step validieren
const validateResponse = await fetch(`/api/funnels/stress/assessments/${assessmentId}/steps/${stepId}/validate`, {
  method: 'POST',
  credentials: 'include'
})
console.log('Validate:', await validateResponse.json())
```

---

## Checkliste für Deployment

Vor dem Deployment müssen folgende Tests erfolgreich sein:

- [ ] Szenario 1: Happy Path durchlaufen
- [ ] Szenario 2: Validation Failure getestet
- [ ] Szenario 3: Authorization getestet
- [ ] Szenario 4: Step-Skipping Prevention getestet
- [ ] Szenario 5: Completed Assessment Protection getestet
- [ ] SQL-Konsistenztests durchgeführt
- [ ] Performance-Tests innerhalb erwarteter Grenzen
- [ ] Backwards-Kompatibilitäts-Tests erfolgreich
- [ ] Migration auf Staging-DB erfolgreich angewendet

---

## Troubleshooting

### Problem: "Assessment nicht gefunden"

**Mögliche Ursachen:**
1. AssessmentId falsch
2. Funnel-Slug stimmt nicht mit Assessment überein
3. Assessment gehört anderem User (403 statt 404)

**Debug:**
```sql
SELECT id, patient_id, funnel, funnel_id 
FROM assessments 
WHERE id = '<assessmentId>';
```

### Problem: "Step-Skipping" trotz validem currentStep

**Mögliche Ursachen:**
1. getCurrentStep() liefert falschen Step
2. order_index falsch

**Debug:**
```sql
SELECT fs.id, fs.order_index, fs.title
FROM funnel_steps fs
JOIN assessments a ON a.funnel_id = fs.funnel_id
WHERE a.id = '<assessmentId>'
ORDER BY fs.order_index;
```

### Problem: Performance > 200ms

**Debug:**
```sql
EXPLAIN ANALYZE
SELECT * FROM assessments WHERE id = '<assessmentId>';

-- Prüfe, ob Indizes genutzt werden
```

---

**Autor:** GitHub Copilot  
**Version:** 1.0  
**Letzte Änderung:** 2024-12-09
