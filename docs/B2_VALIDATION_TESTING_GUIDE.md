# B2 Answer Validation v2 - Testing Guide

## Übersicht

Dieses Dokument beschreibt wie die Answer Validation v2 Implementierung getestet werden kann.

## Voraussetzungen

1. **Development Server läuft**: `npm run dev`
2. **Datenbank bereit**: Supabase mit allen Migrationen
3. **Test-User**: Ein Benutzer-Account zum Login
4. **Fragen konfiguriert**: Mindestens eine Pflichtfrage und eine optionale Frage im Stress-Funnel

## Database Setup für Testing

### 1. Prüfen der aktuellen is_required Werte

```sql
-- Zeige alle Fragen mit is_required Status
SELECT 
  f.slug as funnel,
  fs.title as step_title,
  fs.order_index as step_order,
  q.key as question_key,
  q.label as question_text,
  fsq.is_required,
  fsq.order_index as question_order
FROM funnel_step_questions fsq
JOIN funnel_steps fs ON fsq.funnel_step_id = fs.id
JOIN funnels f ON fs.funnel_id = f.id
JOIN questions q ON fsq.question_id = q.id
WHERE f.slug = 'stress'
ORDER BY fs.order_index, fsq.order_index;
```

### 2. Eine Frage als optional markieren (für Tests)

```sql
-- Beispiel: Letzte Frage als optional markieren
UPDATE funnel_step_questions
SET is_required = false
WHERE question_id = (
  SELECT q.id 
  FROM questions q
  JOIN funnel_step_questions fsq ON q.id = fsq.question_id
  JOIN funnel_steps fs ON fsq.funnel_step_id = fs.id
  JOIN funnels f ON fs.funnel_id = f.id
  WHERE f.slug = 'stress'
  ORDER BY fs.order_index DESC, fsq.order_index DESC
  LIMIT 1
);
```

### 3. Prüfen ob Änderung erfolgreich

```sql
SELECT 
  q.key,
  q.label,
  fsq.is_required
FROM funnel_step_questions fsq
JOIN questions q ON fsq.question_id = q.id
JOIN funnel_steps fs ON fsq.funnel_step_id = fs.id
JOIN funnels f ON fs.funnel_id = f.id
WHERE f.slug = 'stress'
ORDER BY fs.order_index, fsq.order_index;
```

## Test-Szenarien

### Test 1: Alle Pflichtfragen beantwortet

**Ziel**: Submit sollte erfolgreich sein

**Schritte**:
1. Navigate zu `/patient/stress-check`
2. Beantworte alle Fragen die als **Pflichtfrage** markiert sind (keine "Optional" Badge)
3. Optionale Fragen können übersprungen werden
4. Klick auf "Antworten speichern & weiter"

**Erwartetes Ergebnis**:
- ✅ Submit funktioniert
- ✅ Weiterleitung zu `/patient/stress-check/result`
- ✅ Assessment wird in DB gespeichert

### Test 2: Pflichtfrage fehlt

**Ziel**: Submit sollte blockiert werden mit klarer Fehlermeldung

**Schritte**:
1. Navigate zu `/patient/stress-check`
2. Beantworte NICHT alle Pflichtfragen
3. Klick auf "Antworten speichern & weiter"

**Erwartetes Ergebnis**:
- ❌ Submit wird blockiert
- ✅ Error Message erscheint: "Bitte beantworten Sie alle Pflichtfragen. Fehlend: Frage X, Y"
- ✅ Auto-Scroll zur ersten fehlenden Pflichtfrage
- ✅ Submit Button bleibt disabled bis alle Pflichtfragen beantwortet

### Test 3: Nur optionale Frage fehlt

**Ziel**: Submit sollte funktionieren trotz fehlender optionaler Frage

**Voraussetzung**: Mindestens eine Frage muss als optional markiert sein

**Schritte**:
1. Navigate zu `/patient/stress-check`
2. Beantworte alle Pflichtfragen
3. Lasse mindestens eine optionale Frage unbeantwortet
4. Klick auf "Antworten speichern & weiter"

**Erwartetes Ergebnis**:
- ✅ Submit funktioniert trotz fehlender optionaler Fragen
- ✅ Weiterleitung zu Result-Seite
- ✅ Nur beantwortete Fragen werden gespeichert

### Test 4: UI Feedback

**Ziel**: Benutzer sieht deutlich welche Fragen Pflicht sind

**Schritte**:
1. Navigate zu `/patient/stress-check`
2. Prüfe visuelle Unterscheidung

**Erwartetes Ergebnis**:
- ✅ Pflichtfragen haben KEINE "Optional" Badge
- ✅ Optionale Fragen haben graue "Optional" Badge
- ✅ Unbeantwortete Pflichtfragen zeigen amber Warning
- ✅ Unbeantwortete optionale Fragen zeigen KEIN Warning
- ✅ Progress zeigt "Pflichtfragen: X/Y" wenn nicht alle beantwortet

### Test 5: Progress Indicator

**Ziel**: User sieht Fortschritt bei Pflichtfragen

**Schritte**:
1. Navigate zu `/patient/stress-check`
2. Beantworte schrittweise Pflichtfragen
3. Beobachte Progress Indicator oben

**Erwartetes Ergebnis**:
- ✅ Zeigt "Frage X von Y" (Gesamt)
- ✅ Zeigt "Pflichtfragen: X/Y" in amber wenn nicht alle beantwortet
- ✅ Progress Bar füllt sich mit Gesamtfortschritt
- ✅ Indicator verschwindet wenn alle Pflichtfragen beantwortet

### Test 6: Submit Button State

**Ziel**: Submit Button reflektiert Validation Status

**Schritte**:
1. Navigate zu `/patient/stress-check`
2. Beobachte Submit Button

**Erwartetes Ergebnis**:
- ✅ Button disabled wenn Pflichtfragen fehlen
- ✅ Button enabled wenn alle Pflichtfragen beantwortet
- ✅ Checkmark (✓) erscheint wenn bereit zum Submit
- ✅ Loading Spinner während Submit
- ✅ Cursor not-allowed bei disabled

## API Endpoint Tests

### Test 7: Validation API - Step Validation

**Ziel**: API validiert korrekt auf Step-Ebene

**Voraussetzung**: 
- Assessment ID verfügbar
- Step ID bekannt
- Einige Fragen beantwortet, einige nicht

**Request**:
```bash
# Terminal - benötigt authentifizierten Cookie
curl -X POST http://localhost:3000/api/assessment-validation/validate-step \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_AUTH_COOKIE" \
  -d '{
    "assessmentId": "your-assessment-uuid",
    "stepId": "your-step-uuid"
  }'
```

**Oder im Browser Console (einfacher)**:
```javascript
// Browser Console auf localhost:3000
const response = await fetch('/api/assessment-validation/validate-step', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    assessmentId: 'paste-assessment-id-here',
    stepId: 'paste-step-id-here'
  })
})

const result = await response.json()
console.log(result)
```

**Erwartetes Ergebnis bei fehlenden Pflichtfragen**:
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

**Erwartetes Ergebnis bei allen Pflichtfragen beantwortet**:
```json
{
  "success": true,
  "isValid": true,
  "missingQuestions": []
}
```

### Test 8: API Error Handling

**Ziel**: API gibt aussagekräftige Fehler zurück

**Test Cases**:

1. **Fehlende Parameter**:
```javascript
fetch('/api/assessment-validation/validate-step', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ assessmentId: 'uuid' }) // stepId fehlt
})
// Erwartung: 400 Bad Request
```

2. **Nicht authentifiziert**:
```bash
# Ohne Cookie
curl -X POST http://localhost:3000/api/assessment-validation/validate-step \
  -H "Content-Type: application/json" \
  -d '{"assessmentId": "uuid", "stepId": "uuid"}'
# Erwartung: 401 Unauthorized
```

3. **Assessment gehört anderem User**:
```javascript
// Als User A einloggen, Assessment ID von User B verwenden
// Erwartung: 403 Forbidden
```

## Database Verification

### Test 9: Answers werden korrekt gespeichert

**Nach einem erfolgreichen Submit**:

```sql
-- Prüfe gespeicherte Antworten
SELECT 
  a.id as assessment_id,
  q.label as question,
  aa.answer_value,
  fsq.is_required
FROM assessments a
JOIN assessment_answers aa ON a.id = aa.assessment_id
JOIN questions q ON aa.question_id = q.key
LEFT JOIN funnel_step_questions fsq ON q.id = fsq.question_id
WHERE a.id = 'your-assessment-uuid'
ORDER BY q.label;
```

**Erwartung**:
- ✅ Alle beantworteten Fragen (inkl. optional) sind gespeichert
- ✅ Unbeantwortete optionale Fragen fehlen (OK)
- ✅ Unbeantwortete Pflichtfragen fehlen (sollte nicht vorkommen durch Validation!)

## Edge Cases

### Test 10: Alle Fragen optional

**Ziel**: System funktioniert wenn keine Pflichtfragen existieren

**Setup**:
```sql
-- Temporär alle Fragen als optional markieren
UPDATE funnel_step_questions
SET is_required = false
WHERE funnel_step_id IN (
  SELECT id FROM funnel_steps 
  WHERE funnel_id = (SELECT id FROM funnels WHERE slug = 'stress')
);
```

**Test**:
1. Navigate zu `/patient/stress-check`
2. Klick sofort auf Submit ohne Fragen zu beantworten

**Erwartung**:
- ✅ Submit Button ist enabled (keine Pflichtfragen)
- ✅ Kein Error
- ⚠️ Warnung im Console: "Optional questions unanswered: ..."
- ✅ Assessment wird erstellt (ggf. mit 0 answers)

**Cleanup**:
```sql
-- Pflichtfragen wiederherstellen
UPDATE funnel_step_questions
SET is_required = true
WHERE funnel_step_id IN (
  SELECT id FROM funnel_steps 
  WHERE funnel_id = (SELECT id FROM funnels WHERE slug = 'stress')
);
```

### Test 11: Alle Fragen pflicht

**Ziel**: System wie erwartet wenn alle Fragen required sind

**Setup**:
```sql
-- Alle Fragen als required markieren
UPDATE funnel_step_questions
SET is_required = true
WHERE funnel_step_id IN (
  SELECT id FROM funnel_steps 
  WHERE funnel_id = (SELECT id FROM funnels WHERE slug = 'stress')
);
```

**Test**:
1. Navigate zu `/patient/stress-check`
2. Versuche Submit ohne alle zu beantworten

**Erwartung**:
- ✅ Submit blockiert
- ✅ Alle unbeantworteten Fragen in Error Message
- ✅ Keine "Optional" Badges sichtbar

## Performance Tests

### Test 12: Viele Fragen

**Ziel**: Validation ist performant auch mit vielen Fragen

**Setup**: Funnel mit 50+ Fragen

**Messpunkte**:
- ✅ Page Load < 2s
- ✅ Validation Check < 500ms
- ✅ Submit mit allen Antworten < 3s
- ✅ Kein UI Freeze

## Browser Compatibility

### Test 13: Cross-Browser

**Ziel**: Funktioniert in allen wichtigen Browsern

**Browsers to Test**:
- ✅ Chrome (Desktop)
- ✅ Firefox (Desktop)
- ✅ Safari (Desktop + Mobile)
- ✅ Edge
- ✅ Chrome Mobile (Android)

**Features zu testen**:
- Scroll-to-question
- Button disabled states
- Progress indicators
- Error messages
- Submit flow

## Accessibility

### Test 14: Keyboard Navigation

**Ziel**: Navigation und Submit per Keyboard möglich

**Test**:
1. Navigate zu `/patient/stress-check`
2. Nur Keyboard verwenden (Tab, Enter, Arrow Keys)
3. Beantworte Fragen
4. Submit

**Erwartung**:
- ✅ Alle Fragen per Tab erreichbar
- ✅ Antworten per Keyboard wählbar
- ✅ Submit Button per Enter aktivierbar
- ✅ Focus Indicators sichtbar

### Test 15: Screen Reader

**Ziel**: Screen Reader gibt hilfreiche Infos

**Test mit Screen Reader** (NVDA, JAWS, VoiceOver):
- ✅ Pflicht/Optional Status wird angesagt
- ✅ Progress wird angesagt
- ✅ Error Messages werden angesagt
- ✅ Button States werden angesagt

## Regression Tests

### Test 16: Bestehende Funktionalität

**Ziel**: Neue Validation bricht nichts

**Zu prüfen**:
- ✅ Answer-Save funktioniert (save-on-tap wenn implementiert)
- ✅ Assessment Creation funktioniert
- ✅ Report Generation funktioniert
- ✅ History Page zeigt Assessments
- ✅ Export funktioniert

## Deployment Testing

### Test 17: Production-Like Environment

**Nach Deploy auf Staging/Production**:

1. Prüfe Environment Variables
2. Prüfe DB Migrations gelaufen
3. Prüfe API erreichbar
4. Kompletter User-Flow von Login bis Report
5. Performance Monitoring
6. Error Logging prüfen

## Test Checklist

- [ ] Test 1: Alle Pflichtfragen beantwortet
- [ ] Test 2: Pflichtfrage fehlt
- [ ] Test 3: Nur optionale Frage fehlt
- [ ] Test 4: UI Feedback
- [ ] Test 5: Progress Indicator
- [ ] Test 6: Submit Button State
- [ ] Test 7: Validation API
- [ ] Test 8: API Error Handling
- [ ] Test 9: Database Verification
- [ ] Test 10: Alle Fragen optional
- [ ] Test 11: Alle Fragen pflicht
- [ ] Test 12: Performance mit vielen Fragen
- [ ] Test 13: Cross-Browser
- [ ] Test 14: Keyboard Navigation
- [ ] Test 15: Screen Reader
- [ ] Test 16: Regression Tests
- [ ] Test 17: Production Testing

## Bekannte Limitationen

1. **Step-Level Validation**: Aktuell nur in stress-check Page implementiert. Mobile/Desktop Komponenten für step-by-step Navigation benötigen noch Integration.

2. **Real-Time Validation**: Validation erfolgt erst bei Submit, nicht während dem Ausfüllen.

3. **Batch Updates**: Wenn viele Fragen auf einmal als required/optional geändert werden, muss Page reloaded werden.

## Troubleshooting

### Problem: Submit Button bleibt disabled

**Lösung**:
- Prüfe ob wirklich ALLE Pflichtfragen beantwortet sind
- Check Browser Console für JavaScript Errors
- Prüfe Network Tab für API Errors

### Problem: API gibt 401 Unauthorized

**Lösung**:
- Session abgelaufen - neu einloggen
- Cookie wurde nicht gesendet
- Prüfe Supabase Auth Status

### Problem: Frage wird als Pflicht angezeigt aber sollte optional sein

**Lösung**:
- Prüfe DB: `SELECT * FROM funnel_step_questions WHERE question_id = ...`
- ggf. Update Query ausführen
- Page reload

---

**Erstellt am:** 2024-12-09  
**Version:** 1.0  
**Basiert auf:** B2 Answer Validation v2 Implementation
