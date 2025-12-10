-- D1: Sample Content Pages for Testing
-- This migration adds sample content pages to demonstrate the content rendering feature

-- Insert sample content pages linked to the stress funnel
-- First, we need to get the stress funnel ID
DO $$
DECLARE
  stress_funnel_id uuid;
BEGIN
  -- Get the stress funnel ID
  SELECT id INTO stress_funnel_id 
  FROM public.funnels 
  WHERE slug = 'stress-assessment' 
  LIMIT 1;

  -- Only insert if we found the stress funnel
  IF stress_funnel_id IS NOT NULL THEN
    -- Sample Page 1: Information about stress
    INSERT INTO public.content_pages (
      slug,
      title,
      excerpt,
      body_markdown,
      status,
      layout,
      funnel_id
    ) VALUES (
      'was-ist-stress',
      'Was ist Stress?',
      'Erfahren Sie mehr über die Grundlagen von Stress und seine Auswirkungen auf Körper und Geist.',
      '# Was ist Stress?

Stress ist eine natürliche Reaktion des Körpers auf Herausforderungen und Anforderungen. Er kann sowohl **positive** als auch **negative** Auswirkungen haben.

## Arten von Stress

### Positiver Stress (Eustress)
- Motiviert zu Höchstleistungen
- Fördert persönliches Wachstum
- Kurzzeitige Belastung

### Negativer Stress (Distress)
- Überforderung und Erschöpfung
- Langfristige Gesundheitsrisiken
- Beeinträchtigung der Lebensqualität

## Symptome von Stress

**Körperliche Symptome:**
- Erhöhter Herzschlag
- Verspannungen
- Kopfschmerzen
- Schlafstörungen

**Psychische Symptome:**
- Nervosität
- Konzentrationsschwierigkeiten
- Gereiztheit
- Niedergeschlagenheit

> **Wichtig:** Chronischer Stress kann zu ernsthaften gesundheitlichen Problemen führen. Eine frühzeitige Erkennung und Behandlung ist entscheidend.

## Was Sie tun können

1. **Stressfaktoren identifizieren** - Erkennen Sie, was Stress auslöst
2. **Entspannungstechniken** erlernen - Meditation, Atemübungen, Yoga
3. **Soziale Unterstützung** suchen - Gespräche mit Freunden und Familie
4. **Professionelle Hilfe** in Anspruch nehmen - Bei Bedarf therapeutische Unterstützung

---

Unser Stress-Assessment hilft Ihnen dabei, Ihr aktuelles Stresslevel zu erfassen und gibt Ihnen individuelle Empfehlungen für den Umgang mit Stress.',
      'published',
      'default',
      stress_funnel_id
    ) ON CONFLICT (slug) DO NOTHING;

    -- Sample Page 2: Sleep and resilience
    INSERT INTO public.content_pages (
      slug,
      title,
      excerpt,
      body_markdown,
      status,
      layout,
      funnel_id
    ) VALUES (
      'schlaf-und-resilienz',
      'Schlaf und Resilienz',
      'Verstehen Sie den Zusammenhang zwischen gutem Schlaf und Ihrer psychischen Widerstandsfähigkeit.',
      '# Schlaf und Resilienz

Guter Schlaf ist einer der wichtigsten Faktoren für **psychische Widerstandsfähigkeit** (Resilienz). Er beeinflusst direkt Ihre Fähigkeit, mit Stress umzugehen.

## Warum ist Schlaf so wichtig?

Der Körper nutzt die Schlafphase zur:
- **Regeneration** von Körper und Geist
- **Verarbeitung** von Tageserlebnissen
- **Stärkung** des Immunsystems
- **Konsolidierung** von Erinnerungen

## Empfehlungen für gesunden Schlaf

### Schlafhygiene-Tipps

1. **Regelmäßiger Rhythmus**
   - Gleiche Schlafens- und Aufstehzeiten
   - Auch am Wochenende beibehalten

2. **Schlafumgebung optimieren**
   - Dunkler, ruhiger Raum
   - Angenehme Temperatur (16-19°C)
   - Bequeme Matratze und Kissen

3. **Vor dem Schlafengehen**
   - Bildschirmzeit reduzieren (1-2 Stunden vorher)
   - Entspannungsrituale etablieren
   - Schwere Mahlzeiten vermeiden

4. **Tagsüber**
   - Regelmäßige Bewegung
   - Tageslicht tanken
   - Koffein nur in Maßen

### Warnsignale für Schlafprobleme

- Einschlafzeit > 30 Minuten
- Häufiges nächtliches Erwachen
- Zu frühes Aufwachen
- Müdigkeit am Tag trotz ausreichender Schlafdauer

## Der Zusammenhang mit Stress

```
Guter Schlaf → Bessere Stressresistenz → Weniger Stress → Besserer Schlaf
```

Dieser positive Kreislauf zeigt, wie wichtig es ist, auf beide Aspekte zu achten.

> **Tipp:** Nutzen Sie unser Assessment, um Ihre Schlafqualität objektiv einzuschätzen und individuelle Verbesserungsvorschläge zu erhalten.',
      'published',
      'default',
      stress_funnel_id
    ) ON CONFLICT (slug) DO NOTHING;

    -- Sample Page 3: About the assessment (wide layout)
    INSERT INTO public.content_pages (
      slug,
      title,
      excerpt,
      body_markdown,
      status,
      layout,
      funnel_id
    ) VALUES (
      'ueber-das-assessment',
      'Über das Stress-Assessment',
      'Erfahren Sie, wie unser wissenschaftlich fundiertes Assessment funktioniert und was Sie erwarten können.',
      '# Über das Stress-Assessment

Unser **Rhythmologicum Stress-Assessment** ist ein wissenschaftlich fundiertes Instrument zur Erfassung Ihres aktuellen Stress- und Resilienz-Niveaus.

## Wissenschaftliche Grundlagen

Das Assessment basiert auf etablierten psychologischen Messinstrumenten:

| Dimension | Messinstrument | Validierung |
|-----------|----------------|-------------|
| Stress | Perceived Stress Scale (PSS) | Cohen et al. 1983 |
| Schlaf | Pittsburgh Sleep Quality Index | Buysse et al. 1989 |
| Resilienz | Brief Resilience Scale | Smith et al. 2008 |

## Ablauf des Assessments

1. **Begrüßung und Einführung**
   - Überblick über den Prozess
   - Datenschutzhinweise

2. **Fragebogen-Sektion**
   - Ca. 15-20 Fragen
   - Dauer: 5-10 Minuten
   - Intuitive Bedienung

3. **KI-gestützte Auswertung**
   - Automatische Analyse durch AMY (Assessment Management Yielder)
   - Berücksichtigung individueller Muster
   - Wissenschaftlich validierte Algorithmen

4. **Ergebnisse und Empfehlungen**
   - Detaillierte Auswertung
   - Risikoeinstufung
   - Personalisierte Handlungsempfehlungen

## Datenschutz und Vertraulichkeit

Ihre Daten werden:
- ✅ Verschlüsselt gespeichert
- ✅ Nur für Ihre Behandlung verwendet
- ✅ Nicht an Dritte weitergegeben
- ✅ Nach DSGVO-Standards verwaltet

## Häufig gestellte Fragen

**Wie oft sollte ich das Assessment durchführen?**  
Wir empfehlen eine erste Baseline-Messung, dann monatliche Follow-ups zur Verlaufskontrolle.

**Kann ich die Ergebnisse mit meinem Arzt teilen?**  
Ja, Sie können einen detaillierten Report als PDF exportieren.

**Wie genau ist das Assessment?**  
Die verwendeten Instrumente haben eine hohe Reliabilität (Cronbach's α > 0.80) und wurden in zahlreichen Studien validiert.

---

**Bereit anzufangen?** [Zurück zum Fragebogen](#)
',
      'published',
      'wide',
      stress_funnel_id
    ) ON CONFLICT (slug) DO NOTHING;

    -- Draft page (should NOT be visible in frontend)
    INSERT INTO public.content_pages (
      slug,
      title,
      excerpt,
      body_markdown,
      status,
      layout,
      funnel_id
    ) VALUES (
      'draft-seite',
      'Dies ist eine Draft-Seite',
      'Diese Seite sollte nicht im Frontend sichtbar sein.',
      '# Draft Content

This should not be visible in the frontend!',
      'draft',
      'default',
      stress_funnel_id
    ) ON CONFLICT (slug) DO NOTHING;
    
  END IF;
END $$;
