# B1 Testing Guide - Funnel Definition API

## Übersicht

Dieser Guide beschreibt, wie die B1 Funnel Definition API getestet werden kann. Die API lädt Funnel-Strukturen dynamisch aus der Datenbank und stellt sie in einem strukturierten Format bereit.

## Voraussetzungen

1. **Development Server läuft**:
   ```bash
   npm run dev
   ```

2. **Datenbank ist eingerichtet**:
   - Supabase-Projekt ist konfiguriert
   - `stress` Funnel existiert in der Datenbank
   - Migration `20251207150000_populate_stress_questions.sql` wurde ausgeführt

3. **Environment Variables sind gesetzt**:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
   ```

## Test-Methoden

### 1. Browser-basiertes Testing

#### Demo-Seite nutzen
Die einfachste Methode zum Testen:

```
http://localhost:3000/patient/funnel-definition-demo
```

Features:
- Interaktive UI zur Anzeige der Funnel-Definition
- Eingabefeld für verschiedene Funnel-Slugs
- Detaillierte Anzeige aller Steps und Fragen
- JSON-Vorschau mit Copy-Funktion

#### Direct API Test
Öffne Browser Console und führe aus:

```javascript
// Test API endpoint
fetch('/api/funnels/stress/definition')
  .then(r => r.json())
  .then(data => {
    console.log('Funnel Definition:', data)
    console.log('Total Steps:', data.totalSteps)
    console.log('Total Questions:', data.totalQuestions)
  })
```

### 2. Command Line Testing

#### Mit curl
```bash
# Test stress funnel
curl http://localhost:3000/api/funnels/stress/definition | jq

# Test non-existent funnel (should return 404)
curl http://localhost:3000/api/funnels/nonexistent/definition
```

#### Mit dem Test-Script
```bash
# Run automated test
node tools/test-funnel-api.js
```

Das Script testet:
- ✅ API-Verbindung
- ✅ Response-Struktur
- ✅ Required Fields
- ✅ Step-Reihenfolge
- ✅ Question Count
- ✅ Data Validation

### 3. Integration Testing

#### In React Component
```typescript
'use client'
import { useEffect, useState } from 'react'
import { getFunnelDefinition } from '@/lib/funnelHelpers'

export default function TestComponent() {
  const [funnel, setFunnel] = useState(null)
  
  useEffect(() => {
    getFunnelDefinition('stress')
      .then(setFunnel)
      .catch(console.error)
  }, [])
  
  if (!funnel) return <div>Loading...</div>
  
  return (
    <div>
      <h1>{funnel.title}</h1>
      <p>Steps: {funnel.totalSteps}</p>
      <p>Questions: {funnel.totalQuestions}</p>
    </div>
  )
}
```

#### In Server Component
```typescript
import { getFunnelDefinitionServer } from '@/lib/funnelHelpers'

export default async function ServerComponent() {
  const funnel = await getFunnelDefinitionServer('stress')
  
  return (
    <div>
      <h1>{funnel.title}</h1>
      <ul>
        {funnel.steps.map((step, i) => (
          <li key={step.id}>
            {i + 1}. {step.title} ({step.type})
          </li>
        ))}
      </ul>
    </div>
  )
}
```

## Erwartete Response-Struktur

### Erfolgreiche Response (200 OK)

```json
{
  "id": "uuid-here",
  "slug": "stress",
  "title": "Stress & Resilienz Assessment",
  "subtitle": "Fragebogen",
  "description": "Erfassen Sie Ihren aktuellen Stress- und Belastungszustand",
  "theme": null,
  "steps": [
    {
      "id": "step-uuid-1",
      "orderIndex": 1,
      "title": "Umgang mit Stress",
      "description": null,
      "type": "question_step",
      "questions": [
        {
          "id": "question-uuid-1",
          "key": "stress_q1",
          "label": "Wie häufig fühlen Sie sich im Alltag gestresst?",
          "helpText": "Denken Sie dabei an die letzten 2-4 Wochen...",
          "questionType": "scale",
          "minValue": 0,
          "maxValue": 4,
          "isRequired": true,
          "orderIndex": 1
        }
      ]
    },
    {
      "id": "step-uuid-2",
      "orderIndex": 2,
      "title": "Schlaf & Erholung",
      "description": null,
      "type": "question_step",
      "questions": [...]
    }
  ],
  "totalSteps": 2,
  "totalQuestions": 8,
  "isActive": true
}
```

### Fehler-Responses

#### Funnel nicht gefunden (404)
```json
{
  "error": "Funnel not found"
}
```

#### Fehlende Parameter (400)
```json
{
  "error": "Funnel slug is required"
}
```

#### Server-Fehler (500)
```json
{
  "error": "Internal server error"
}
```

## Validierungs-Checkliste

Bei jedem Test sollte geprüft werden:

### Response-Struktur
- [ ] Status Code ist 200
- [ ] Content-Type ist `application/json`
- [ ] Response enthält alle Required Fields

### Funnel Metadata
- [ ] `id` ist eine gültige UUID
- [ ] `slug` entspricht dem Request-Parameter
- [ ] `title` ist nicht leer
- [ ] `isActive` ist boolean
- [ ] `totalSteps` entspricht `steps.length`
- [ ] `totalQuestions` entspricht Summe aller Fragen

### Steps
- [ ] `steps` ist ein Array
- [ ] Steps haben aufsteigende `orderIndex` (1, 2, 3, ...)
- [ ] Jeder Step hat `id`, `title`, `type`, `orderIndex`
- [ ] Question Steps haben `questions` Array
- [ ] Info Steps haben `content` Field

### Questions
- [ ] Fragen haben alle Required Fields
- [ ] `key` ist unique
- [ ] `questionType` ist valide (scale, text, etc.)
- [ ] `isRequired` ist boolean
- [ ] `orderIndex` ist fortlaufend innerhalb eines Steps

## Performance Testing

### Response Time
```bash
# Measure API response time
time curl -s http://localhost:3000/api/funnels/stress/definition > /dev/null
```

Erwartete Response Time: < 500ms

### Load Testing (Optional)
```bash
# Simple load test with Apache Bench
ab -n 100 -c 10 http://localhost:3000/api/funnels/stress/definition
```

## Debugging

### Common Issues

#### 1. "Funnel not found" Error
**Lösung**: Prüfe, ob der Funnel in der Datenbank existiert:
```sql
SELECT * FROM funnels WHERE slug = 'stress';
```

#### 2. "Server configuration error"
**Lösung**: Prüfe Environment Variables:
```bash
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

#### 3. Leere Questions Arrays
**Lösung**: Prüfe `funnel_step_questions` Tabelle:
```sql
SELECT fsq.*, q.label 
FROM funnel_step_questions fsq
JOIN questions q ON q.id = fsq.question_id
WHERE fsq.funnel_step_id IN (
  SELECT id FROM funnel_steps 
  WHERE funnel_id = (SELECT id FROM funnels WHERE slug = 'stress')
);
```

#### 4. Wrong Question Order
**Lösung**: Prüfe `order_index` Werte:
```sql
SELECT * FROM funnel_step_questions 
ORDER BY funnel_step_id, order_index;
```

### Logging

Aktiviere ausführliches Logging:
```javascript
// In API route
console.log('Fetching funnel:', slug)
console.log('Steps found:', steps?.length)
console.log('Questions per step:', stepsWithQuestions.map(s => 
  'questions' in s ? s.questions.length : 0
))
```

## Regression Testing

Nach Änderungen an der API sollten diese Tests durchgeführt werden:

1. **Basis-Funktionalität**
   - [ ] API liefert Response für bekannte Slugs
   - [ ] 404 für unbekannte Slugs
   - [ ] Alle Required Fields vorhanden

2. **Daten-Integrität**
   - [ ] totalSteps/totalQuestions korrekt
   - [ ] Step-Reihenfolge stimmt
   - [ ] Fragen-Zuordnung korrekt

3. **Type Safety**
   - [ ] TypeScript kompiliert ohne Fehler
   - [ ] Type Guards funktionieren korrekt
   - [ ] No `any` Types in Production Code

4. **Backwards Compatibility**
   - [ ] Bestehende Komponenten funktionieren
   - [ ] Alte API-Calls funktionieren noch
   - [ ] Migrations laufen erfolgreich

## Weitere Tests

### Database Tests
```sql
-- Test Funnel vollständigkeit
SELECT 
  f.slug,
  COUNT(DISTINCT fs.id) as step_count,
  COUNT(DISTINCT q.id) as question_count
FROM funnels f
LEFT JOIN funnel_steps fs ON fs.funnel_id = f.id
LEFT JOIN funnel_step_questions fsq ON fsq.funnel_step_id = fs.id
LEFT JOIN questions q ON q.id = fsq.question_id
WHERE f.slug = 'stress'
GROUP BY f.slug;
```

### Type Guard Tests
```typescript
import { isQuestionStep, isInfoStep } from '@/lib/types/funnel'

const step = { type: 'question_step', questions: [] }
console.assert(isQuestionStep(step), 'Should be question step')
console.assert(!isInfoStep(step), 'Should not be info step')
```

## Dokumentation

Für weitere Details siehe:
- `docs/B1_IMPLEMENTATION.md` - Vollständige Implementierungs-Dokumentation
- `lib/types/funnel.ts` - TypeScript Type Definitions
- `app/api/funnels/[slug]/definition/route.ts` - API Implementation

---

**Erstellt am:** 2024-12-08  
**Letztes Update:** 2024-12-08
