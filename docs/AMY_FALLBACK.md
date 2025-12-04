# AMY Fallback-Mechanismus

## Übersicht

Wenn die AMY-LLM-Integration ausfällt oder nicht verfügbar ist, werden Patient:innen beruhigende, generische Fallback-Texte angezeigt, die Orientierung bieten ohne klinische Entscheidungen zu suggerieren.

## Implementierung

### Zentrale Fallback-Texte

Die Fallback-Texte sind in `lib/amyFallbacks.ts` definiert und werden für folgende Risiko-Stufen bereitgestellt:

- **low** (Niedriges Stressniveau)
- **moderate** (Mittleres Stressniveau)  
- **high** (Erhöhtes Stressniveau)
- **null** (Noch nicht klassifiziert)

### Verwendung in den APIs

Die Fallback-Mechanismen sind in beiden AMY-API-Endpunkten implementiert:

#### `/api/amy/stress-report`

- Verwendet Fallback-Texte wenn:
  - Kein Anthropic API-Key konfiguriert ist
  - Ein LLM-Fehler auftritt (Netzwerkfehler, Rate Limiting, API-Fehler, etc.)
- Die API-Response bleibt formal gültig - gleiche Struktur wie bei erfolgreicher LLM-Antwort

#### `/api/amy/stress-summary`

- Verwendet Fallback-Texte wenn:
  - Kein Anthropic API-Key konfiguriert ist
  - Ein LLM-Fehler auftritt
- Die API-Response bleibt formal gültig

### Frontend-Transparenz

Das Frontend unterscheidet nicht zwischen "echter AMY" und Fallback - nur der Text ist anders. Die Benutzeroberfläche bleibt identisch und zeigt:

- Stress-Score (falls verfügbar)
- Schlaf-Score (falls verfügbar)
- Risiko-Einschätzung (low/moderate/high/unknown)
- Kurze Einordnung (AMY-generiert oder Fallback)

## Textmerkmale

Die Fallback-Texte sind:

- **Beruhigend**: Vermeiden alarmistische Sprache
- **Generisch**: Keine spezifischen medizinischen Ratschläge
- **Orientierend**: Geben klare nächste Schritte
- **Empathisch**: Sprechen Patient:innen auf Augenhöhe an
- **Sicher**: Weisen auf Kontakt zur behandelnden Praxis hin

## Beispiele

### Low Risk
> "Deine aktuellen Werte liegen im eher entspannten Bereich. Das ist eine gute Basis. Achte weiterhin auf ausreichend Schlaf, regelmäßige Bewegung und kleine Pausen im Alltag, damit das so bleibt. Bei Fragen oder Veränderungen wende dich gerne an deine behandelnde Praxis."

### Moderate Risk
> "Dein aktuelles Stressniveau liegt im mittleren Bereich. Es kann hilfreich sein, jetzt auf ausreichend Erholung und klare Grenzen zu achten. Kleine Anpassungen bei Schlaf, Bewegung oder Auszeiten können bereits einen Unterschied machen. Bei Unsicherheiten oder wenn sich Beschwerden verstärken, wende dich an deine behandelnde Praxis."

### High Risk
> "Deine aktuellen Werte zeigen ein erhöhtes Stressniveau. Das ist ein Hinweis, dass dein System gerade viel trägt – du bist damit nicht allein. Es ist wichtig, jetzt gut für dich zu sorgen: ausreichend Schlaf, Pausen und bei Bedarf Unterstützung anzunehmen. Bitte wende dich bei anhaltenden Beschwerden an deine behandelnde Praxis."

### Unknown Status
> "Deine Antworten sind sicher gespeichert. Eine detaillierte Einschätzung ist aktuell noch nicht verfügbar. Das ist kein Notfallhinweis. Bei Fragen oder Beschwerden wende dich gerne an deine behandelnde Praxis. Du kannst diese Seite später erneut aufrufen oder den Fragebogen wiederholen."

## Logging und Monitoring

Fehler werden geloggt aber die API antwortet weiterhin erfolgreich:
- `[stress-report] Anthropic not configured, using fallback text`
- `[stress-report] LLM error, using fallback text: <error>`
- `[stress-summary] Anthropic not configured, using fallback text`
- `[stress-summary] LLM request failed after Xms, using fallback text: <error>`

Dies ermöglicht Monitoring der LLM-Verfügbarkeit ohne die Patient:innen-Erfahrung zu beeinträchtigen.
