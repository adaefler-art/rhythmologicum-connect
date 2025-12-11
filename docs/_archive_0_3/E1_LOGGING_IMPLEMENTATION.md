# E1 Logging Implementation - Zentrale technische Parameter

## Übersicht

Dieses Dokument beschreibt die Implementierung des zentralen Loggings für technische Parameter im Rhythmologicum Connect System, gemäß Issue E1.

## Implementierte Funktionen

### 1. AMY-Request Duration Logging

**Datei:** `app/api/amy/stress-report/route.ts` und `app/api/amy/stress-summary/route.ts`

Jeder AMY-Request (Anthropic API Call) wird mit folgenden Informationen geloggt:

#### Start des Requests
```typescript
console.log('[stress-report/createAmySummary] Starting AMY request', {
  model: MODEL,
  stressScore,
  sleepScore,
  riskLevel,
  answersCount: answers.length,
});
```

#### Erfolgreicher Request
```typescript
console.log('[stress-report/createAmySummary] AMY request completed successfully', {
  duration: `${duration}ms`,
  model: MODEL,
  responseLength: reportText.length,
  contentBlocks: response.content.length,
});
```

### 2. Strukturierte Fehlertypen

Alle Fehler werden mit spezifischen Typen kategorisiert:

- **`rate_limit`** - HTTP 429 Fehler (Rate Limiting)
- **`timeout`** - HTTP 408 oder Timeout-Fehler
- **`json_parsing`** - JSON-Parsing Fehler
- **`api_error`** - Server-Fehler (HTTP 5xx)
- **`unknown`** - Unbekannte Fehler

#### Beispiel Error Logging
```typescript
console.error('[stress-report/createAmySummary] AMY request failed', {
  duration: `${duration}ms`,
  errorType,
  errorMessage,
  model: MODEL,
});
```

### 3. Score-Berechnung Logging

**Datei:** `app/api/amy/stress-report/route.ts`

Die `computeScores` Funktion loggt:

#### Start der Berechnung
```typescript
console.log('[stress-report/computeScores] Starting score calculation', {
  totalAnswers: answers.length,
});
```

#### Gesammelte Werte
```typescript
console.log('[stress-report/computeScores] Collected values', {
  stressValues: stressVals.length,
  sleepValues: sleepVals.length,
});
```

#### Berechnete Ergebnisse
```typescript
console.log('[stress-report/computeScores] Score calculation completed', {
  duration: `${duration}ms`,
  stressScore,
  sleepScore,
  riskLevel,
});
```

### 4. Request-Level Logging

Jeder API-Request wird auf Endpoint-Ebene geloggt:

#### Request-Start
```typescript
const requestStartTime = Date.now();
console.log('[stress-report] POST request received');
```

#### Request-Ende (Erfolg)
```typescript
console.log('[stress-report] Request completed successfully', {
  duration: `${totalDuration}ms`,
  assessmentId,
  reportId: reportRow.id,
  stressScore,
  sleepScore,
  riskLevel,
});
```

#### Request-Ende (Fehler)
```typescript
console.error('[stress-report] Unerwarteter Fehler', {
  duration: `${totalDuration}ms`,
  error: error?.message ?? String(err),
});
```

## Log-Format

Alle Logs folgen einem konsistenten Format:

1. **Prefix**: `[modulename/function]` oder `[endpoint]`
2. **Message**: Kurze, beschreibende Nachricht
3. **Context Object**: Strukturierte zusätzliche Informationen
   - `duration`: Zeitdauer in Millisekunden (`${duration}ms`)
   - Spezifische Parameter je nach Kontext

## Beispiel-Logs

### Erfolgreicher AMY-Request Flow

```
[stress-report] POST request received
[stress-report] Processing assessment { assessmentId: 'abc-123' }
[stress-report/computeScores] Starting score calculation { totalAnswers: 8 }
[stress-report/computeScores] Collected values { stressValues: 5, sleepValues: 3 }
[stress-report/computeScores] Score calculation completed { 
  duration: '2ms',
  stressScore: 65,
  sleepScore: 58,
  riskLevel: 'moderate'
}
[stress-report/createAmySummary] Starting AMY request {
  model: 'claude-sonnet-4-5-20250929',
  stressScore: 65,
  sleepScore: 58,
  riskLevel: 'moderate',
  answersCount: 8
}
[stress-report/createAmySummary] AMY request completed successfully {
  duration: '1543ms',
  model: 'claude-sonnet-4-5-20250929',
  responseLength: 487,
  contentBlocks: 1
}
[stress-report] Request completed successfully {
  duration: '1678ms',
  assessmentId: 'abc-123',
  reportId: 'def-456',
  stressScore: 65,
  sleepScore: 58,
  riskLevel: 'moderate'
}
```

### Rate-Limit Fehler

```
[stress-report] POST request received
[stress-report] Processing assessment { assessmentId: 'abc-123' }
[stress-report/computeScores] Starting score calculation { totalAnswers: 8 }
[stress-report/computeScores] Score calculation completed { 
  duration: '1ms',
  stressScore: 65,
  sleepScore: 58,
  riskLevel: 'moderate'
}
[stress-report/createAmySummary] Starting AMY request { ... }
[stress-report/createAmySummary] AMY request failed {
  duration: '234ms',
  errorType: 'rate_limit',
  errorMessage: 'Rate limit exceeded',
  model: 'claude-sonnet-4-5-20250929'
}
[stress-report] Request completed successfully {
  duration: '367ms',
  assessmentId: 'abc-123',
  reportId: 'def-456',
  stressScore: 65,
  sleepScore: 58,
  riskLevel: 'moderate'
}
```

## Zugriff auf Logs

### Supabase

Logs sind über die Supabase Dashboard Logs-Funktion einsehbar:
1. Öffnen Sie das Supabase Dashboard
2. Navigieren Sie zu "Logs" → "API Logs" oder "Functions Logs"
3. Filtern Sie nach `[stress-report]` oder `[stress-summary]`

### Vercel

Bei Deployment auf Vercel:
1. Öffnen Sie das Vercel Dashboard
2. Navigieren Sie zu Ihrem Projekt
3. Wählen Sie "Logs" oder "Functions" → "Logs"
4. Filtern Sie nach den relevanten Präfixen

### Lokale Entwicklung

Bei lokaler Entwicklung (`npm run dev`):
- Alle Logs erscheinen in der Konsole
- Format: Standard `console.log` Output

## Erfüllte Akzeptanzkriterien

✅ **AMY-Requestdauer wird geloggt**
   - Start- und End-Timestamps
   - Berechnete Duration in Millisekunden
   - Erfolgreiche und fehlgeschlagene Requests

✅ **Fehlerfälle erkennbar**
   - Timeout: Erkannt via HTTP 408 oder Error-Message
   - Rate Limit: Erkannt via HTTP 429
   - JSON-Parsing: Erkannt via Error-Type oder Message
   - Zusätzlich: API-Errors (5xx) und Unknown-Fehler

✅ **Score-Berechnung schreibt Log-Einträge**
   - Start der Berechnung
   - Gesammelte Werte
   - Berechnete Ergebnisse mit Scores und Risk-Level

✅ **Logs über Supabase/Vercel einsehbar**
   - Alle Logs verwenden Standard `console.log` / `console.error`
   - Automatisch in Supabase und Vercel Logs sichtbar

## Technische Details

### Geänderte Dateien

1. `app/api/amy/stress-report/route.ts`
   - `computeScores()`: Score-Berechnung Logging
   - `createAmySummary()`: AMY-Request Logging mit Error-Typing
   - `POST()`: Request-Level Logging

2. `app/api/amy/stress-summary/route.ts`
   - `generateSummary()`: AMY-Request Logging mit Error-Typing
   - `POST()`: Request-Level Logging mit detaillierten Metriken

### Performance-Auswirkungen

- Minimaler Overhead durch Logging (~1-2ms pro Request)
- Keine blockierenden Operationen
- Asynchrone Log-Verarbeitung durch Runtime

### Sicherheit

- Keine sensiblen Daten (PII) in Logs
- Assessment-IDs werden geloggt (UUID-Format, nicht-sensitiv)
- Error-Messages werden gefiltert und strukturiert

## Wartung und Monitoring

### Empfohlene Überwachung

1. **Performance Monitoring**
   - AMY-Request Duration Trends
   - Score-Berechnung Duration
   - Gesamt-Request Duration

2. **Error Monitoring**
   - Rate-Limit Häufigkeit
   - Timeout-Häufigkeit
   - API-Error Trends

3. **Alert-Schwellenwerte** (Vorschlag)
   - AMY-Request > 5000ms: Warning
   - AMY-Request > 10000ms: Critical
   - Error-Rate > 10%: Warning
   - Error-Rate > 25%: Critical

### Log-Aufbewahrung

Abhängig von der Plattform:
- **Supabase**: Standard-Aufbewahrung je nach Plan
- **Vercel**: 1 Tag (Hobby), 7-30 Tage (Pro/Enterprise)

Für langfristige Analyse: Log-Export in externe Tools (z.B. Datadog, New Relic, Sentry)

## Weitere Verbesserungen (Optional)

Falls erwünscht, können folgende Erweiterungen implementiert werden:

1. **Strukturiertes Logging Library** (z.B. Winston, Pino)
2. **Log-Aggregation** (z.B. Datadog, LogRocket)
3. **Performance Metrics** (z.B. OpenTelemetry)
4. **Alert-System** (z.B. PagerDuty Integration)
5. **Dashboard** (z.B. Grafana für Log-Visualisierung)
