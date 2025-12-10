-- F8: Add result-specific content blocks with sections
-- This migration adds content pages specifically for the stress result page

DO $$
DECLARE
  stress_funnel_id uuid;
  result_interpretation_id uuid;
BEGIN
  -- Get the stress funnel ID
  SELECT id INTO stress_funnel_id 
  FROM public.funnels 
  WHERE slug = 'stress-assessment' 
  LIMIT 1;

  -- Only insert if we found the stress funnel
  IF stress_funnel_id IS NOT NULL THEN
    
    -- Result interpretation page with sections
    INSERT INTO public.content_pages (
      slug,
      title,
      excerpt,
      body_markdown,
      status,
      layout,
      funnel_id,
      category,
      priority
    ) VALUES (
      'result-ergebnis-verstehen',
      'Ihre Ergebnisse verstehen',
      'Was bedeuten die Zahlen? Hier erfahren Sie, wie Sie Ihre Stress- und Schlaf-Scores interpretieren.',
      '# Ihre Ergebnisse verstehen

Ihr Assessment hat drei Hauptwerte ermittelt, die zusammen ein umfassendes Bild Ihrer aktuellen Belastungssituation zeigen.

## Die drei Messwerte

Jeder Score gibt Aufschluss über einen wichtigen Aspekt Ihrer mentalen und körperlichen Gesundheit:

- **Stress-Score**: Ihr subjektiv wahrgenommenes Stressniveau
- **Schlaf-Score**: Die Qualität und Erholsamkeit Ihres Schlafs
- **Risiko-Einschätzung**: Eine Gesamtbewertung Ihrer aktuellen Belastung

Im Folgenden erklären wir jeden dieser Werte genauer.',
      'published',
      'default',
      stress_funnel_id,
      'result',
      80
    ) ON CONFLICT (slug) DO NOTHING
    RETURNING id INTO result_interpretation_id;

    -- Add sections to the result interpretation page
    IF result_interpretation_id IS NOT NULL THEN
      INSERT INTO public.content_page_sections (
        content_page_id,
        title,
        body_markdown,
        order_index
      ) VALUES
      (
        result_interpretation_id,
        'Stress-Score verstehen',
        '## Was bedeutet Ihr Stress-Score?

Der Stress-Score basiert auf der **Perceived Stress Scale (PSS)** und gibt an, wie stark Sie Stress in den letzten Wochen wahrgenommen haben.

### Score-Bereiche

- **0-13**: Niedriges Stressniveau – Sie fühlen sich überwiegend im Gleichgewicht
- **14-26**: Moderates Stressniveau – Typisch für viele Menschen im Alltag
- **27-40**: Hohes Stressniveau – Hier sollten Sie aktiv werden

### Was tun bei hohem Stress?

1. **Priorisieren Sie Pausen**: Planen Sie bewusst Erholungszeiten ein
2. **Setzen Sie Grenzen**: Lernen Sie, "Nein" zu sagen
3. **Suchen Sie Unterstützung**: Sprechen Sie mit Vertrauenspersonen oder Fachleuten
4. **Bewegen Sie sich**: Sport hilft, Stresshormone abzubauen

> **Wichtig:** Ein hoher Stress-Score ist kein Zeichen von Schwäche, sondern ein Signal Ihres Körpers, dass Sie Ihre Belastung anpassen sollten.',
        1
      ),
      (
        result_interpretation_id,
        'Schlaf-Score verstehen',
        '## Was bedeutet Ihr Schlaf-Score?

Der Schlaf-Score zeigt die Qualität Ihres Schlafs. Guter Schlaf ist essenziell für die Stressbewältigung und körperliche Regeneration.

### Score-Bereiche

- **0-5**: Gute Schlafqualität – Ihr Schlaf ist erholsam
- **6-10**: Leichte Schlafprobleme – Verbesserungspotenzial vorhanden
- **11-21**: Deutliche Schlafstörungen – Handlungsbedarf

### Tipps für besseren Schlaf

1. **Regelmäßige Zeiten**: Gehen Sie jeden Tag zur gleichen Zeit ins Bett
2. **Schlafumgebung optimieren**: Dunkel, kühl (16-19°C), ruhig
3. **Bildschirme meiden**: 1-2 Stunden vor dem Schlafengehen keine Bildschirme
4. **Entspannungsritual**: Finden Sie eine beruhigende Abendroutine

### Wann zum Arzt?

Wenn Sie seit mehr als 4 Wochen unter Schlafproblemen leiden, die Ihren Alltag beeinträchtigen, sollten Sie ärztliche Hilfe suchen. Chronische Schlafstörungen können ernsthafte gesundheitliche Folgen haben.',
        2
      ),
      (
        result_interpretation_id,
        'Risiko-Einschätzung verstehen',
        '## Was bedeutet Ihre Risiko-Einschätzung?

Die Risiko-Einschätzung fasst Ihre Stress- und Schlafwerte zusammen und gibt eine Gesamtbewertung ab.

### Risiko-Stufen

**Niedriges Risiko** 🟢  
Sie sind gut im Gleichgewicht. Behalten Sie Ihre gesunden Gewohnheiten bei.

**Moderates Risiko** 🟡  
Es gibt Warnsignale. Jetzt ist der richtige Zeitpunkt, präventiv aktiv zu werden, bevor sich Beschwerden verschlimmern.

**Erhöhtes Risiko** 🔴  
Ihre aktuelle Belastung ist hoch. Wir empfehlen dringend, zeitnah mit Ihrem Arzt zu sprechen und Unterstützung zu suchen.

### Wichtiger Hinweis

Diese Einschätzung ersetzt keine ärztliche Diagnose. Sie dient als Orientierung und Anstoß, Ihre Gesundheit ernst zu nehmen. Bei akuten Beschwerden oder Suizidgedanken kontaktieren Sie bitte umgehend:

- **Telefonseelsorge**: 0800 111 0 111 (24/7, kostenlos)
- **Ärztlicher Notdienst**: 116 117
- **Notfall**: 112',
        3
      );
    END IF;

    -- Additional result content: Self-care recommendations
    INSERT INTO public.content_pages (
      slug,
      title,
      excerpt,
      body_markdown,
      status,
      layout,
      funnel_id,
      category,
      priority
    ) VALUES (
      'result-selbstfuersorge',
      'Selbstfürsorge-Empfehlungen',
      'Praktische Übungen und Techniken zur Stressbewältigung, die Sie sofort anwenden können.',
      '# Selbstfürsorge: Sofort anwendbare Techniken

Basierend auf Ihren Ergebnissen haben wir einige evidenzbasierte Selbstfürsorge-Strategien für Sie zusammengestellt.

## Atemübungen (5 Minuten)

### 4-7-8 Atemtechnik

Diese Technik wirkt beruhigend auf das Nervensystem:

1. Atmen Sie durch die Nase ein und zählen Sie bis 4
2. Halten Sie den Atem an und zählen Sie bis 7
3. Atmen Sie durch den Mund aus und zählen Sie bis 8
4. Wiederholen Sie dies 4-mal

**Wann anwenden**: Bei akutem Stress, vor dem Schlafengehen, in Pausen

## Progressive Muskelentspannung (15 Minuten)

Diese Technik hilft, körperliche Anspannung bewusst zu lösen:

1. **Spannen** Sie eine Muskelgruppe für 5-7 Sekunden an
2. **Lösen** Sie die Spannung abrupt
3. **Spüren** Sie 20-30 Sekunden der Entspannung nach
4. Arbeiten Sie sich durch alle Muskelgruppen (Füße → Kopf)

**Tipp**: Es gibt viele kostenlose Audio-Anleitungen online

## Achtsamkeitsübung (10 Minuten)

### 5-4-3-2-1 Technik

Diese Übung bringt Sie ins Hier und Jetzt:

- Benenne **5 Dinge**, die du siehst
- Benenne **4 Dinge**, die du hörst
- Benenne **3 Dinge**, die du fühlst (physisch)
- Benenne **2 Dinge**, die du riechst
- Benenne **1 Ding**, das du schmeckst

**Wann anwenden**: Bei Gedankenkarussell, Ängsten, Überforderung

## Bewegung und Natur

### Tägliche Bewegungseinheit (20-30 Minuten)

Bewegung ist einer der effektivsten Stress-Abbauer:

- **Spaziergang** in der Natur
- **Yoga** oder sanftes Stretching
- **Schwimmen** oder Radfahren
- **Tanzen** zu Ihrer Lieblingsmusik

**Wissenschaft**: Bewegung reduziert Cortisol (Stresshormon) und erhöht Endorphine (Glückshormone)

## Soziale Verbindung

### Qualitätszeit mit anderen (30-60 Minuten)

- Treffen Sie sich mit einem Freund zum Kaffee
- Telefonieren Sie mit jemandem, dem Sie vertrauen
- Verbringen Sie Zeit mit Haustieren
- Engagieren Sie sich in der Gemeinschaft

**Wichtig**: Wählen Sie Menschen, bei denen Sie sich sicher und verstanden fühlen

## Schlafhygiene

### Bessere Schlaf-Routine

**Abends**:
- 19:00 Uhr: Letzte Hauptmahlzeit
- 20:30 Uhr: Entspannende Aktivität (Lesen, Musik)
- 21:30 Uhr: Bildschirme ausschalten
- 22:00 Uhr: Zu Bett gehen

**Morgens**:
- Zur gleichen Zeit aufstehen (auch am Wochenende!)
- Sofort Tageslicht tanken (15 Minuten)

---

**Ihr Aktionsplan**: Wählen Sie 1-2 Techniken aus und probieren Sie diese eine Woche lang täglich. Notieren Sie, wie Sie sich fühlen.',
      'published',
      'default',
      stress_funnel_id,
      'result',
      70
    ) ON CONFLICT (slug) DO NOTHING;

  END IF;
END $$;
