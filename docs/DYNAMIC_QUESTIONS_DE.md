# Dynamische Fragen - Implementierung

## Zusammenfassung

Die Fragen für den Stress-Check wurden erfolgreich von hartkodiertem Code in die Datenbank übertragen. Die Fragenseite lädt die Fragen jetzt dynamisch aus der Datenbank.

## Was wurde geändert

### 1. Datenbank-Migration

**Datei**: `supabase/migrations/20251207150000_populate_stress_questions.sql`

Die Migration erstellt:
- Den "stress" Funnel in der `funnels` Tabelle
- Zwei Funnel-Schritte in `funnel_steps`: "Umgang mit Stress" und "Schlaf & Erholung"
- 8 Fragen in der `questions` Tabelle:
  - 4 Stress-Fragen (stress_q1 bis stress_q4)
  - 4 Schlaf-Fragen (sleep_q1 bis sleep_q4)
- Verknüpfungen zwischen Fragen und Schritten in `funnel_step_questions`
- RLS-Richtlinien für authentifizierte Benutzer

### 2. Code-Änderungen

**Datei**: `app/patient/stress-check/page.tsx`

Entfernt:
- Hartkodiertes `QUESTIONS` Array (46 Zeilen)

Hinzugefügt:
- Dynamisches Laden der Fragen aus der Datenbank
- `questionsLoading` State für Ladezustand
- Unterstützung für `help_text` Feld (Hilfetext) pro Frage
- Fehlerbehandlung beim Laden der Fragen

Beibehalten:
- Alle bestehenden Funktionen (Fortschrittsanzeige, Validierung, Absenden)
- Gleiche Benutzeroberfläche und UX
- Kompatibilität mit bestehenden Daten

**Datei**: `lib/funnelHelpers.ts`
- Nur TypeScript-Typ-Korrekturen
- Keine funktionalen Änderungen

## Wie es funktioniert

1. Beim Laden der Seite wird der "stress" Funnel aus der Datenbank abgerufen
2. Die Funnel-Schritte werden in der richtigen Reihenfolge geladen
3. Für jeden Schritt werden die zugehörigen Fragen geladen
4. Die Fragen werden nach Schritt und Reihenfolge sortiert
5. Die Benutzeroberfläche passt sich automatisch an die Anzahl der Fragen an

## Vorteile

### Flexibilität
- Neue Fragen können direkt in der Datenbank hinzugefügt werden
- Fragen können geändert werden ohne Code-Änderungen
- Hilfetext kann pro Frage hinzugefügt werden
- Fragentexte können in Zukunft mehrsprachig gemacht werden

### Wartbarkeit
- Fragen sind zentral in der Datenbank gespeichert
- Keine Code-Änderungen nötig für neue Fragen
- Einfachere Verwaltung durch Nicht-Entwickler möglich

### Skalierbarkeit
- Layout passt sich automatisch an Anzahl der Fragen an
- Fortschrittsbalken berechnet sich dynamisch
- Fragenummerierung erfolgt automatisch

## Neue Fragen hinzufügen

Um eine neue Frage hinzuzufügen, nur SQL ausführen:

```sql
-- 1. Neue Frage erstellen
INSERT INTO public.questions (key, label, help_text, question_type, min_value, max_value)
VALUES ('stress_q5', 'Ihre neue Frage?', 'Optionaler Hilfetext', 'scale', 0, 4);

-- 2. Frage mit Funnel-Schritt verknüpfen
INSERT INTO public.funnel_step_questions (funnel_step_id, question_id, order_index, is_required)
SELECT fs.id, q.id, 5, true
FROM public.questions q, public.funnel_steps fs
JOIN public.funnels f ON fs.funnel_id = f.id
WHERE q.key = 'stress_q5'
  AND f.slug = 'stress'
  AND fs.order_index = 1; -- 1 für Stress, 2 für Schlaf
```

Die Seite zeigt die neue Frage automatisch an!

## Abwärtskompatibilität

- Bestehende Assessments funktionieren weiterhin
- Die Fragen-IDs (stress_q1, etc.) bleiben gleich
- Die `assessment_answers` Tabelle verwendet weiterhin den Fragen-Key
- Keine Datenmigrationen für bestehende Daten nötig

## Testen

Siehe `docs/DYNAMIC_QUESTIONS_TESTING.md` für detaillierte Testanweisungen.

### Schnelltest

1. Migration anwenden (geschieht automatisch beim Deployment)
2. Als Patient einloggen
3. Zur Stress-Check Seite navigieren
4. Überprüfen, dass 8 Fragen angezeigt werden
5. Alle Fragen beantworten und absenden
6. Verifizieren, dass Assessment gespeichert wird

## Dateien

### Geändert
- `app/patient/stress-check/page.tsx` - Hauptänderung für dynamisches Laden
- `lib/funnelHelpers.ts` - TypeScript-Korrekturen

### Neu
- `supabase/migrations/20251207150000_populate_stress_questions.sql` - Datenbank-Migration
- `docs/DYNAMIC_QUESTIONS_TESTING.md` - Testdokumentation (Englisch)
- `docs/DYNAMIC_QUESTIONS_DE.md` - Diese Datei (Deutsch)

## Hinweise

- Die Fragen werden beim Laden der Seite einmalig abgerufen
- Bei Fragen-Änderungen muss die Seite neu geladen werden
- Hilfetext wird nur angezeigt, wenn vorhanden (derzeit alle NULL)
- RLS-Richtlinien erlauben nur authentifizierten Benutzern Zugriff
