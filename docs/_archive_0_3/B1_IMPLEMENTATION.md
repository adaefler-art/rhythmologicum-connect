# B1 — Funnel Definition aus DB-Tabellen zusammensetzen

## Zusammenfassung

Die B1-Implementierung ermöglicht es, Funnel-Definitionen vollständig aus den Datenbanktabellen zu laden und in einer strukturierten Form bereitzustellen, die sowohl von Desktop- als auch von Mobile-UI konsumiert werden kann. Die Implementierung eliminiert die Abhängigkeit von statischen JSON-Dateien und ermöglicht eine flexible, datenbankgesteuerte Funnel-Konfiguration.

## Implementierte Komponenten

### 1. TypeScript-Typen (`lib/types/funnel.ts`)

#### Neue Typen

**`QuestionDefinition`** - UI-ready Question-Daten
```typescript
{
  id: string
  key: string
  label: string
  helpText: string | null
  questionType: string
  minValue: number | null
  maxValue: number | null
  isRequired: boolean
  orderIndex: number
}
```

**`StepDefinition`** - Union-Typ für alle Step-Typen
- `QuestionStepDefinition` - Schritte mit Fragen
- `InfoStepDefinition` - Informations-Schritte
- `OtherStepDefinition` - Andere Schritte (Summary, etc.)

**`FunnelDefinition`** - Vollständige Funnel-Struktur
```typescript
{
  id: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  theme: string | null
  steps: StepDefinition[]
  totalSteps: number
  totalQuestions: number
  isActive: boolean
}
```

#### Type Guards

- `isQuestionStep(step)` - Prüft, ob ein Step ein QuestionStep ist
- `isInfoStep(step)` - Prüft, ob ein Step ein InfoStep ist

### 2. API Endpoint (`app/api/funnels/[slug]/definition/route.ts`)

**Endpoint**: `GET /api/funnels/{slug}/definition`

**Parameter**:
- `slug` (path parameter) - Der Funnel-Slug (z.B. 'stress')

**Response**: `FunnelDefinition` Objekt (JSON)

**Beispiel-Request**:
```bash
GET /api/funnels/stress/definition
```

**Beispiel-Response**:
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
      "id": "step-uuid",
      "orderIndex": 1,
      "title": "Umgang mit Stress",
      "description": null,
      "type": "question_step",
      "questions": [
        {
          "id": "question-uuid",
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
    }
  ],
  "totalSteps": 2,
  "totalQuestions": 8,
  "isActive": true
}
```

### 3. Helper-Funktionen (`lib/funnelHelpers.ts`)

#### `getFunnelDefinition(slug: string): Promise<FunnelDefinition>`

Client-Side Funktion zum Laden der Funnel-Definition über die API.

**Verwendung**:
```typescript
import { getFunnelDefinition } from '@/lib/funnelHelpers'

const funnel = await getFunnelDefinition('stress')
```

#### `getFunnelDefinitionServer(slug: string): Promise<FunnelDefinition>`

Server-Side Funktion zum direkten Laden aus der Datenbank (für Server Components).

**Verwendung**:
```typescript
import { getFunnelDefinitionServer } from '@/lib/funnelHelpers'

export default async function ServerComponent() {
  const funnel = await getFunnelDefinitionServer('stress')
  // ...
}
```

### 4. Demo-Seite (`app/patient/funnel-definition-demo/page.tsx`)

Eine interaktive Demo-Seite, die die Funnel-Definition visualisiert:
- Funnel-Metadaten anzeigen
- Steps und Fragen strukturiert darstellen
- JSON-Vorschau mit Copy-Funktion
- Slug-basierte Auswahl

**URL**: `/patient/funnel-definition-demo`

## Datenfluss

```
┌──────────────┐
│   Database   │
│              │
│ - funnels    │
│ - funnel_    │
│   steps      │
│ - funnel_    │
│   step_      │
│   questions  │
│ - questions  │
└──────┬───────┘
       │
       │ SQL Queries
       ▼
┌──────────────────────┐
│  API Endpoint        │
│  /api/funnels/       │
│  [slug]/definition   │
│                      │
│  - Fetch funnel      │
│  - Fetch steps       │
│  - Fetch questions   │
│  - Build structure   │
└──────┬───────────────┘
       │
       │ JSON Response
       ▼
┌──────────────────────┐
│  Client/Server       │
│  Component           │
│                      │
│  - getFunnel         │
│    Definition()      │
│  - Render UI         │
└──────────────────────┘
```

## Step-Typen und Verwendung

### Question Step
```typescript
type: 'question_step' | 'form'
```
Enthält ein Array von Fragen. Wird für Frage-Screens verwendet.

**Beispiel**:
```typescript
if (isQuestionStep(step)) {
  step.questions.forEach(question => {
    // Render question UI
  })
}
```

### Info Step
```typescript
type: 'info_step' | 'info'
```
Enthält Informations-Content. Wird für Informations-Screens verwendet.

**Beispiel**:
```typescript
if (isInfoStep(step)) {
  // Render info content
  return <div>{step.content}</div>
}
```

### Other Step
```typescript
type: 'summary' | 'other'
```
Für andere Step-Typen wie Summary-Screens.

## Verwendungsbeispiele

### Client Component

```typescript
'use client'
import { useEffect, useState } from 'react'
import { getFunnelDefinition } from '@/lib/funnelHelpers'
import type { FunnelDefinition } from '@/lib/types/funnel'

export default function MyFunnelComponent() {
  const [funnel, setFunnel] = useState<FunnelDefinition | null>(null)
  
  useEffect(() => {
    getFunnelDefinition('stress')
      .then(setFunnel)
      .catch(console.error)
  }, [])
  
  if (!funnel) return <div>Loading...</div>
  
  return (
    <div>
      <h1>{funnel.title}</h1>
      <p>Total Questions: {funnel.totalQuestions}</p>
      {/* Render steps... */}
    </div>
  )
}
```

### Server Component

```typescript
import { getFunnelDefinitionServer } from '@/lib/funnelHelpers'
import type { FunnelDefinition } from '@/lib/types/funnel'

export default async function MyServerComponent() {
  const funnel = await getFunnelDefinitionServer('stress')
  
  return (
    <div>
      <h1>{funnel.title}</h1>
      <p>Steps: {funnel.totalSteps}</p>
      <p>Questions: {funnel.totalQuestions}</p>
    </div>
  )
}
```

### Mit Type Guards

```typescript
import { isQuestionStep } from '@/lib/types/funnel'

funnel.steps.forEach((step, index) => {
  if (isQuestionStep(step)) {
    console.log(`Step ${index + 1} has ${step.questions.length} questions`)
    step.questions.forEach(q => {
      console.log(`  - ${q.label}`)
    })
  }
})
```

## Datenbank-Schema

Die Implementierung nutzt folgende Tabellen:

### `funnels`
- Enthält Funnel-Metadaten (Title, Subtitle, Description, Theme)
- `slug` ist unique und wird für API-Zugriff verwendet
- `is_active` steuert die Verfügbarkeit

### `funnel_steps`
- Definiert die Steps eines Funnels
- `order_index` bestimmt die Reihenfolge (aufsteigend sortiert)
- `type` unterscheidet Step-Typen

### `funnel_step_questions`
- Join-Tabelle zwischen Steps und Questions
- `order_index` bestimmt Fragen-Reihenfolge innerhalb eines Steps
- `is_required` definiert Pflichtfelder

### `questions`
- Zentrale Fragenbank
- `key` ist unique und wird für Antworten verwendet
- `question_type` definiert UI-Rendering (scale, text, etc.)

## Vorteile der Implementierung

### ✅ Flexibilität
- Fragen können in der Datenbank geändert werden ohne Code-Änderungen
- Neue Funnels können ohne Code-Änderungen erstellt werden
- Step-Reihenfolge ist konfigurierbar

### ✅ Wartbarkeit
- Zentrale Datenhaltung in der Datenbank
- Type-Safe TypeScript-Implementierung
- Klare Trennung von Daten und Logik

### ✅ Skalierbarkeit
- Unterstützt beliebig viele Funnels
- Beliebig viele Steps und Fragen pro Funnel
- Optimierte Datenbankabfragen

### ✅ Konsistenz
- Einheitliche Datenstruktur für alle Funnels
- Type Guards garantieren korrekte Verwendung
- Validierung über `order_index`

## Akzeptanzkriterien - Erfüllung

✅ **Für einen gegebenen Funnel kann eine vollständige Step-Sequenz erzeugt werden**
- API Endpoint liefert vollständige Sequenz basierend auf `order_index`
- Reihenfolge ist stabil und deterministisch

✅ **Steps enthalten alle Informationen für UI und Navigation**
- Jeder Step enthält Title, Description, Type
- Question Steps enthalten vollständige Question-Daten
- Alle Metadaten für Rendering vorhanden

✅ **Keine Abhängigkeit von separaten JSON-Dateien**
- Alle Daten kommen aus der Datenbank
- Kein statisches JSON mehr notwendig
- Vollständig datenbankgesteuert

## Migration bestehender Komponenten

Bestehende Komponenten können schrittweise migriert werden:

1. **Kompatibilitäts-Layer**: Alte Datenstrukturen können in `FunnelDefinition` konvertiert werden
2. **Graduelle Migration**: Komponenten können einzeln auf die neue API umgestellt werden
3. **Type Safety**: TypeScript hilft bei der Migration durch Typ-Prüfung

## Testing

### API Endpoint testen
```bash
# Mit curl
curl http://localhost:3000/api/funnels/stress/definition

# Mit fetch in Browser Console
fetch('/api/funnels/stress/definition')
  .then(r => r.json())
  .then(console.log)
```

### Demo-Seite nutzen
1. Starte Development-Server: `npm run dev`
2. Navigiere zu: `http://localhost:3000/patient/funnel-definition-demo`
3. Teste verschiedene Slugs: `stress`, etc.

## Nächste Schritte

1. **Integration in bestehende Komponenten**
   - `stress-check/page.tsx` auf neue API umstellen
   - `funnel-demo/page.tsx` aktualisieren

2. **Performance-Optimierung**
   - Caching-Strategie implementieren
   - Server-Side Caching für häufig genutzte Funnels

3. **Erweiterte Features**
   - Mehrsprachigkeit (i18n) für Fragen
   - Conditional Logic für Steps
   - Dynamische Validierung

## Dateien

| Datei | Zweck |
|-------|-------|
| `lib/types/funnel.ts` | TypeScript-Typen und Type Guards |
| `app/api/funnels/[slug]/definition/route.ts` | API Endpoint für Funnel-Definition |
| `lib/funnelHelpers.ts` | Helper-Funktionen (Client & Server) |
| `app/patient/funnel-definition-demo/page.tsx` | Demo-Seite zur Visualisierung |
| `docs/B1_IMPLEMENTATION.md` | Diese Dokumentation |

---

**Erstellt am:** 2024-12-08  
**Status:** Implementiert  
**Version:** 0.3
