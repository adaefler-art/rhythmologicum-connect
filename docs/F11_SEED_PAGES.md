# F11 – Seed-Script: 10 Basis-Seiten für Stress-Funnel

## Übersicht

Diese Dokumentation beschreibt das Seed-Script für die 10 Basis-Markdown-Seiten des Stress-Funnels.

**Migration:** `supabase/migrations/20251211070000_seed_stress_funnel_base_pages.sql`

## Eigenschaften

- ✅ **Idempotent**: Script kann mehrfach ausgeführt werden ohne Fehler
- ✅ **Status**: Alle Seiten haben Status `published`
- ✅ **Funnel-Zuordnung**: Alle Seiten sind mit dem `stress-assessment` Funnel verknüpft
- ✅ **Slug-Mapping**: Eindeutige, sprechende Slugs im kebab-case Format

## Die 10 Basis-Seiten

### 1. Was ist Stress? (`was-ist-stress`)
**Layout:** default  
**Zweck:** Einführung in das Thema Stress  
**Inhalte:**
- Arten von Stress (Eustress vs. Distress)
- Körperliche und psychische Symptome
- Handlungsempfehlungen

### 2. Schlaf und Resilienz (`schlaf-und-resilienz`)
**Layout:** default  
**Zweck:** Zusammenhang zwischen Schlaf und psychischer Widerstandsfähigkeit  
**Inhalte:**
- Bedeutung von Schlaf für Resilienz
- Schlafhygiene-Tipps
- Warnsignale für Schlafprobleme
- Zusammenhang mit Stress

### 3. Über das Assessment (`ueber-das-assessment`)
**Layout:** wide  
**Zweck:** Wissenschaftliche Grundlage und Ablauf des Assessments  
**Inhalte:**
- Wissenschaftliche Messinstrumente (PSS, PSQI, BRS)
- Ablauf des Assessments
- Datenschutz und Vertraulichkeit
- FAQ

### 4. Vorbereitung (`intro-vorbereitung`)
**Layout:** default  
**Zweck:** Optimale Vorbereitung auf das Assessment  
**Inhalte:**
- Was Teilnehmer erwartet
- Tipps für aussagekräftige Ergebnisse
- Datenschutzhinweise
- Hinweis auf automatisches Speichern

### 5. Nächste Schritte (`result-naechste-schritte`)
**Layout:** default  
**Zweck:** Orientierung nach Abschluss des Assessments  
**Inhalte:**
- Was mit den Ergebnissen passiert
- Handlungsempfehlungen (kurz-, mittel-, langfristig)
- Wann ärztliche Hilfe nötig ist
- Notfall-Kontakte und Ressourcen

### 6. Wissenschaftliche Grundlage (`info-wissenschaftliche-grundlage`)
**Layout:** wide  
**Zweck:** Detaillierte wissenschaftliche Validierung  
**Inhalte:**
- Verwendete Instrumente mit Reliabilitätswerten
- Wissenschaftliche Validierung
- KI-gestützte Auswertung (AMY)
- Vollständige Referenzen

### 7. Stressbewältigungstechniken (`stressbewaeltigung-techniken`)
**Layout:** default  
**Zweck:** Praktische Methoden zur Stressbewältigung  
**Inhalte:**
- Sofortige Stressreduktion (Atemübungen)
- Mittelfristige Techniken (PME, Meditation)
- Langfristige Strategien (Zeitmanagement, Sport)
- Individueller Stressreduktionsplan

### 8. Burnout-Prävention (`burnout-praevention`)
**Layout:** default  
**Zweck:** Früherkennung und Prävention von Burnout  
**Inhalte:**
- Was ist Burnout? (3 Dimensionen)
- Frühe Warnsignale
- Präventionsstrategien
- 12 Phasen des Burnouts nach Freudenberger
- Professionelle Hilfe

### 9. Work-Life-Balance (`work-life-balance`)
**Layout:** default  
**Zweck:** Strategien für gesunde Balance  
**Inhalte:**
- Definition und Bedeutung
- Die vier Lebensbereiche
- Praktische Strategien (Grenzen, Zeitmanagement)
- Digital Detox
- Selbstcheck-Tool
- Warnsignale

### 10. Resilienz aufbauen (`resilienz-aufbauen`)
**Layout:** default  
**Zweck:** Systematische Entwicklung mentaler Stärke  
**Inhalte:**
- Die sieben Säulen der Resilienz
- Praktische Übungen (Dankbarkeitstagebuch, Perspektivenwechsel)
- Resilienz im Alltag
- Mentale Werkzeugkiste
- 30-Tage-Challenge
- Wissenschaftliche Belege

## Technische Details

### Idempotenz

Das Script verwendet `ON CONFLICT (slug) DO UPDATE SET` statt `DO NOTHING`, um:
- Bei neuen Seiten: INSERT durchzuführen
- Bei bestehenden Seiten: UPDATE mit neuen Inhalten
- `updated_at` Timestamp wird bei Updates automatisch aktualisiert

### Funnel-Zuordnung

Alle Seiten sind mit dem Stress-Funnel verknüpft:
```sql
SELECT id INTO stress_funnel_id 
FROM public.funnels 
WHERE slug = 'stress-assessment' 
LIMIT 1;
```

Falls der Funnel nicht existiert, werden keine Seiten angelegt (IF-Bedingung).

### Slug-Konventionen

- Kebab-case Format (`was-ist-stress`)
- Deutsche Sprache
- Beschreibend und eindeutig
- SEO-freundlich

### Status

Alle Seiten haben `status = 'published'`:
- Sofort im Frontend sichtbar
- Keine manuellen Freigaben nötig
- Produktionsbereit

## Ausführung

### Lokal mit Supabase CLI
```bash
supabase db reset
```

### Remote Deployment
```bash
supabase db push
```

### Manuell in Supabase Dashboard
1. SQL Editor öffnen
2. Migrations-SQL einfügen
3. Ausführen

## Verifikation

### Anzahl Seiten prüfen
```sql
SELECT COUNT(*) 
FROM content_pages 
WHERE funnel_id = (
  SELECT id FROM funnels WHERE slug = 'stress-assessment'
);
-- Erwartetes Ergebnis: 10
```

### Alle Slugs auflisten
```sql
SELECT slug, title, status, layout
FROM content_pages
WHERE funnel_id = (
  SELECT id FROM funnels WHERE slug = 'stress-assessment'
)
ORDER BY slug;
```

### Published-Status prüfen
```sql
SELECT slug, status
FROM content_pages
WHERE funnel_id = (
  SELECT id FROM funnels WHERE slug = 'stress-assessment'
)
AND status != 'published';
-- Erwartetes Ergebnis: 0 Zeilen
```

## Integration

Die Seiten können in verschiedenen Kontexten verwendet werden:

### Frontend-Routing
```
/content/was-ist-stress
/content/schlaf-und-resilienz
/content/ueber-das-assessment
...
```

### Funnel-Integration
- `intro-vorbereitung`: Vor dem Assessment anzeigen
- `result-naechste-schritte`: Nach dem Assessment anzeigen
- Andere Seiten: Als zusätzliche Informationen verlinken

### API-Zugriff
```typescript
// Einzelne Seite laden
const page = await supabase
  .from('content_pages')
  .select('*')
  .eq('slug', 'was-ist-stress')
  .single()

// Alle Funnel-Seiten laden
const pages = await supabase
  .from('content_pages')
  .select('*')
  .eq('funnel_id', funnelId)
  .eq('status', 'published')
  .order('slug')
```

## Wartung

### Inhalte aktualisieren
1. Migration-Datei bearbeiten
2. Geänderte Inhalte anpassen
3. Migration erneut ausführen (idempotent!)

### Neue Seite hinzufügen
```sql
INSERT INTO public.content_pages (
  slug,
  title,
  excerpt,
  body_markdown,
  status,
  layout,
  funnel_id
) VALUES (
  'neue-seite',
  'Neuer Titel',
  'Kurzbeschreibung',
  '# Markdown Content',
  'published',
  'default',
  stress_funnel_id
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  body_markdown = EXCLUDED.body_markdown,
  status = EXCLUDED.status,
  layout = EXCLUDED.layout,
  funnel_id = EXCLUDED.funnel_id,
  updated_at = now();
```

## Akzeptanzkriterien

- [x] 10 Basis-Seiten werden erzeugt (oder aktualisiert, idempotent)
- [x] Status initial `published`
- [x] Slug-Mapping korrekt (kebab-case, eindeutig, beschreibend)
- [x] Alle Seiten mit `stress-assessment` Funnel verknüpft
- [x] Script ist idempotent (mehrfache Ausführung ohne Fehler)
- [x] Markdown-Inhalte sind vollständig und formatiert
- [x] Layouts korrekt zugeordnet (`default` oder `wide`)

## Weiterführende Dokumentation

- [D1 Content Pages](./D1_CONTENT_PAGES.md)
- [D2 Content Integration](./D2_CONTENT_INTEGRATION_SUMMARY.md)
- [F2 Content Editor](./F2_CONTENT_EDITOR.md)
