-- D2: Add content pages following D2 naming conventions
-- This migration adds sample content pages with proper slug patterns for funnel context integration

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
    
    -- Intro page: Shown before/during assessment
    INSERT INTO public.content_pages (
      slug,
      title,
      excerpt,
      body_markdown,
      status,
      layout,
      funnel_id
    ) VALUES (
      'intro-vorbereitung',
      'Vorbereitung auf Ihr Stress-Assessment',
      'Tipps zur optimalen Vorbereitung auf das Assessment für aussagekräftige Ergebnisse.',
      '# Vorbereitung auf Ihr Stress-Assessment

Willkommen! Bevor Sie mit dem Assessment beginnen, möchten wir Ihnen einige Hinweise geben, um die besten Ergebnisse zu erzielen.

## Was Sie erwartet

- **Dauer**: Ca. 5-10 Minuten
- **Fragen**: 15-20 Fragen zu Ihrem aktuellen Befinden
- **Format**: Multiple-Choice mit Skala von 0-4

## Tipps für aussagekräftige Ergebnisse

### 1. Ruhige Umgebung wählen
Suchen Sie sich einen ungestörten Ort, an dem Sie sich konzentrieren können.

### 2. Ehrlich antworten
Es gibt keine "richtigen" oder "falschen" Antworten. Antworten Sie so, wie es Ihrem aktuellen Empfinden entspricht.

### 3. Nicht zu lange nachdenken
Vertrauen Sie Ihrer ersten Intuition. Überdenken Sie Ihre Antworten nicht zu sehr.

### 4. Aktuellen Zeitraum betrachten
Beziehen Sie sich bei Ihren Antworten auf die letzten 2-4 Wochen, nicht auf Ausnahmesituationen.

## Datenschutz

✅ Ihre Daten werden verschlüsselt gespeichert  
✅ Nur Sie und Ihr behandelnder Arzt haben Zugriff  
✅ Die Daten werden nicht an Dritte weitergegeben  

## Bereit?

Wenn Sie bereit sind, schließen Sie diese Seite und beginnen Sie mit dem Assessment.

> **Hinweis:** Sie können das Assessment jederzeit unterbrechen und später fortsetzen. Ihre Antworten werden automatisch gespeichert.',
      'published',
      'default',
      stress_funnel_id
    ) ON CONFLICT (slug) DO NOTHING;

    -- Result page: Shown after completion
    INSERT INTO public.content_pages (
      slug,
      title,
      excerpt,
      body_markdown,
      status,
      layout,
      funnel_id
    ) VALUES (
      'result-naechste-schritte',
      'Nächste Schritte nach Ihrem Assessment',
      'Was Sie nach Abschluss des Assessments tun können und wie es weitergeht.',
      '# Nächste Schritte nach Ihrem Assessment

Herzlichen Glückwunsch zum Abschluss Ihres Stress-Assessments! Hier erfahren Sie, wie es weitergeht.

## Was passiert mit Ihren Ergebnissen?

### 1. Automatische Auswertung
Ihre Antworten werden automatisch von unserem KI-gestützten System (AMY) analysiert und ausgewertet.

### 2. Ärztliche Einsicht
Ihr behandelnder Arzt kann Ihre Ergebnisse in seinem Dashboard einsehen und wird diese bei Ihrem nächsten Termin mit Ihnen besprechen.

### 3. Verlaufsbeobachtung
Wenn Sie das Assessment regelmäßig wiederholen, können Veränderungen über die Zeit erkannt werden.

## Was können Sie selbst tun?

### Kurzfristig (diese Woche)

- **Selbstfürsorge praktizieren**: Gönnen Sie sich bewusste Pausen
- **Bewegung**: 20-30 Minuten moderate Bewegung täglich
- **Soziale Kontakte**: Verbringen Sie Zeit mit Menschen, die Ihnen guttun

### Mittelfristig (dieser Monat)

- **Stressquellen identifizieren**: Notieren Sie, was Sie belastet
- **Entspannungstechniken erlernen**: Z.B. progressive Muskelentspannung
- **Schlafhygiene verbessern**: Regelmäßige Zeiten, ruhige Umgebung

### Langfristig

- **Professionelle Unterstützung**: Bei Bedarf psychologische Beratung in Anspruch nehmen
- **Lebensstil-Anpassungen**: Nachhaltige Veränderungen etablieren
- **Regelmäßiges Monitoring**: Assessment alle 4-6 Wochen wiederholen

## Wann sollten Sie Ihren Arzt kontaktieren?

🚨 **Kontaktieren Sie umgehend Ihren Arzt, wenn:**

- Sie sich selbst gefährden oder Suizidgedanken haben
- Sie massive Schlafstörungen über mehrere Wochen haben
- Sie körperliche Symptome wie starke Herzrasen, Atemnot erleben
- Ihr Alltag stark beeinträchtigt ist

## Ressourcen und Hilfe

### Notfall-Kontakte

- **Telefonseelsorge**: 0800 111 0 111 (kostenlos, 24/7)
- **Ärztlicher Notdienst**: 116 117
- **Notfall**: 112

### Weitere Informationen

Auf unserer Plattform finden Sie weitere Informationen zu:
- Stressbewältigung
- Entspannungstechniken
- Resilienz aufbauen
- Schlaf verbessern

---

**Ihr nächster Schritt:** Vereinbaren Sie einen Termin mit Ihrem Arzt, um Ihre Ergebnisse zu besprechen.',
      'published',
      'default',
      stress_funnel_id
    ) ON CONFLICT (slug) DO NOTHING;

    -- Info page: Shown both before and after
    INSERT INTO public.content_pages (
      slug,
      title,
      excerpt,
      body_markdown,
      status,
      layout,
      funnel_id
    ) VALUES (
      'info-wissenschaftliche-grundlage',
      'Wissenschaftliche Grundlage unseres Assessments',
      'Das Assessment basiert auf validierten psychologischen Messinstrumenten.',
      '# Wissenschaftliche Grundlage

Unser Stress- und Resilienz-Assessment verwendet etablierte, wissenschaftlich validierte Messinstrumente.

## Verwendete Instrumente

### Perceived Stress Scale (PSS)
**Entwickelt von:** Cohen, Kamarck & Mermelstein (1983)  
**Validierung:** Über 1000 Studien weltweit  
**Reliabilität:** Cronbach''s α = 0.84-0.86

Die PSS misst das subjektiv wahrgenommene Stressniveau der letzten 4 Wochen.

### Pittsburgh Sleep Quality Index (PSQI)
**Entwickelt von:** Buysse et al. (1989)  
**Anwendung:** Goldstandard für Schlafqualitätsmessung  
**Reliabilität:** Cronbach''s α = 0.83

Erfasst Schlafqualität und -störungen über einen Zeitraum von einem Monat.

### Brief Resilience Scale (BRS)
**Entwickelt von:** Smith et al. (2008)  
**Fokus:** Psychische Widerstandsfähigkeit  
**Reliabilität:** Cronbach''s α = 0.80-0.91

Misst die Fähigkeit, sich von Stress zu erholen.

## Wissenschaftliche Validierung

Alle verwendeten Instrumente wurden in mehreren unabhängigen Studien validiert und zeigen:

✅ **Hohe Reliabilität** - Konsistente Messergebnisse  
✅ **Gute Validität** - Messen tatsächlich das, was sie messen sollen  
✅ **Kulturelle Anpassung** - Für den deutschen Sprachraum validiert  
✅ **Klinische Relevanz** - Korrelieren mit objektiven Gesundheitsmarkern

## KI-gestützte Auswertung

Unser System AMY (Assessment Management Yielder) nutzt:

- **Anthropic Claude API** für natürlichsprachliche Analysen
- **Wissenschaftlich validierte Auswertungsalgorithmen**
- **Normwerte aus klinischen Studien**

## Referenzen

1. Cohen, S., Kamarck, T., & Mermelstein, R. (1983). A global measure of perceived stress. *Journal of Health and Social Behavior*, 24(4), 385-396.

2. Buysse, D. J., Reynolds, C. F., Monk, T. H., Berman, S. R., & Kupfer, D. J. (1989). The Pittsburgh Sleep Quality Index. *Psychiatry Research*, 28(2), 193-213.

3. Smith, B. W., Dalen, J., Wiggins, K., Tooley, E., Christopher, P., & Bernard, J. (2008). The brief resilience scale. *International Journal of Behavioral Medicine*, 15(3), 194-200.

---

*Diese Seite dient nur zur Information und ersetzt keine medizinische Beratung.*',
      'published',
      'wide',
      stress_funnel_id
    ) ON CONFLICT (slug) DO NOTHING;

  END IF;
END $$;
