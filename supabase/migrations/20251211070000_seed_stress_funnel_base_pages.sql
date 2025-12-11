-- F11: Seed Script - 10 Basis-Seiten für Stress-Funnel
-- This migration creates/updates 10 base content pages for the stress assessment funnel
-- The script is idempotent using ON CONFLICT ... DO UPDATE

DO $$
DECLARE
  stress_funnel_id uuid;
BEGIN
  -- Get the stress funnel ID
  SELECT id INTO stress_funnel_id 
  FROM public.funnels 
  WHERE slug = 'stress-assessment' 
  LIMIT 1;

  -- Only proceed if we found the stress funnel
  IF stress_funnel_id IS NOT NULL THEN
    
    -- Page 1: Was ist Stress?
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
    ) ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      excerpt = EXCLUDED.excerpt,
      body_markdown = EXCLUDED.body_markdown,
      status = EXCLUDED.status,
      layout = EXCLUDED.layout,
      funnel_id = EXCLUDED.funnel_id,
      updated_at = now();

    -- Page 2: Schlaf und Resilienz
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
    ) ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      excerpt = EXCLUDED.excerpt,
      body_markdown = EXCLUDED.body_markdown,
      status = EXCLUDED.status,
      layout = EXCLUDED.layout,
      funnel_id = EXCLUDED.funnel_id,
      updated_at = now();

    -- Page 3: Über das Assessment
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
Die verwendeten Instrumente haben eine hohe Reliabilität (Cronbach''s α > 0.80) und wurden in zahlreichen Studien validiert.

---

**Bereit anzufangen?** [Zurück zum Fragebogen](#)',
      'published',
      'wide',
      stress_funnel_id
    ) ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      excerpt = EXCLUDED.excerpt,
      body_markdown = EXCLUDED.body_markdown,
      status = EXCLUDED.status,
      layout = EXCLUDED.layout,
      funnel_id = EXCLUDED.funnel_id,
      updated_at = now();

    -- Page 4: Vorbereitung auf das Assessment
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
    ) ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      excerpt = EXCLUDED.excerpt,
      body_markdown = EXCLUDED.body_markdown,
      status = EXCLUDED.status,
      layout = EXCLUDED.layout,
      funnel_id = EXCLUDED.funnel_id,
      updated_at = now();

    -- Page 5: Nächste Schritte nach dem Assessment
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
    ) ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      excerpt = EXCLUDED.excerpt,
      body_markdown = EXCLUDED.body_markdown,
      status = EXCLUDED.status,
      layout = EXCLUDED.layout,
      funnel_id = EXCLUDED.funnel_id,
      updated_at = now();

    -- Page 6: Wissenschaftliche Grundlage
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
    ) ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      excerpt = EXCLUDED.excerpt,
      body_markdown = EXCLUDED.body_markdown,
      status = EXCLUDED.status,
      layout = EXCLUDED.layout,
      funnel_id = EXCLUDED.funnel_id,
      updated_at = now();

    -- Page 7: Stressbewältigungstechniken
    INSERT INTO public.content_pages (
      slug,
      title,
      excerpt,
      body_markdown,
      status,
      layout,
      funnel_id
    ) VALUES (
      'stressbewaeltigung-techniken',
      'Stressbewältigungstechniken',
      'Praktische Methoden und Übungen zur effektiven Stressbewältigung im Alltag.',
      '# Stressbewältigungstechniken

Lernen Sie bewährte Methoden kennen, um Stress effektiv zu bewältigen und Ihre Resilienz zu stärken.

## Sofortige Stressreduktion

### Atemübungen

**4-7-8 Atmung:**
1. 4 Sekunden durch die Nase einatmen
2. 7 Sekunden den Atem anhalten
3. 8 Sekunden durch den Mund ausatmen
4. 4-5 Mal wiederholen

**Bauchatmung:**
- Hand auf den Bauch legen
- Tief in den Bauch atmen (Hand hebt sich)
- Langsam ausatmen
- 5-10 Minuten täglich

## Mittelfristige Techniken

### Progressive Muskelentspannung (PME)

Systematische An- und Entspannung verschiedener Muskelgruppen:

1. **Hände**: Fäuste ballen (5 Sek.) → entspannen (30 Sek.)
2. **Arme**: Anspannen → entspannen
3. **Schultern**: Hochziehen → fallen lassen
4. **Gesicht**: Grimasse ziehen → entspannen
5. **Beine**: Anspannen → entspannen

### Achtsamkeitsmeditation

**Einfache Übung für Anfänger:**
- Bequem hinsetzen
- Augen schließen
- Auf den Atem konzentrieren
- Gedanken beobachten, nicht bewerten
- 10-20 Minuten täglich

## Langfristige Strategien

### Zeitmanagement

- **Prioritäten setzen**: Wichtig vs. Dringend unterscheiden
- **Pausen einplanen**: Regelmäßige kurze Breaks
- **Nein sagen lernen**: Grenzen setzen
- **Realistische Ziele**: Überforderung vermeiden

### Körperliche Aktivität

**Empfohlene Aktivitäten:**
- Ausdauersport: 30 Min., 3x pro Woche
- Yoga oder Tai Chi
- Spaziergänge in der Natur
- Team- oder Gruppensport

### Soziale Unterstützung

- Regelmäßiger Austausch mit Freunden
- Professionelle Beratung bei Bedarf
- Selbsthilfegruppen
- Online-Communities

## Individueller Stressreduktionsplan

Erstellen Sie Ihren persönlichen Plan:

1. **Identifizieren**: Was stresst mich?
2. **Auswählen**: Welche Techniken passen zu mir?
3. **Üben**: Regelmäßig anwenden (auch ohne Stress)
4. **Anpassen**: Was funktioniert, was nicht?
5. **Beibehalten**: Erfolgreiche Methoden zur Routine machen

> **Tipp:** Kombinieren Sie verschiedene Techniken für optimale Wirkung. Was heute hilft, kann morgen anders sein.

---

Probieren Sie verschiedene Methoden aus und finden Sie heraus, was für Sie am besten funktioniert.',
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

    -- Page 8: Burnout erkennen und vorbeugen
    INSERT INTO public.content_pages (
      slug,
      title,
      excerpt,
      body_markdown,
      status,
      layout,
      funnel_id
    ) VALUES (
      'burnout-praevention',
      'Burnout erkennen und vorbeugen',
      'Frühe Warnsignale erkennen und präventive Maßnahmen gegen Burnout.',
      '# Burnout erkennen und vorbeugen

Burnout ist mehr als nur Stress – es ist ein Zustand totaler Erschöpfung. Früherkennung ist der Schlüssel zur Prävention.

## Was ist Burnout?

Burnout ist ein **Zustand emotionaler, geistiger und körperlicher Erschöpfung**, der durch anhaltenden Stress verursacht wird.

### Die drei Dimensionen des Burnouts

1. **Emotionale Erschöpfung**
   - Gefühl der Überforderung
   - Keine Energie mehr für alltägliche Aufgaben
   - Innere Leere

2. **Depersonalisation**
   - Zynismus und Distanzierung
   - Gefühlskälte gegenüber anderen
   - Verlust der Empathie

3. **Reduzierte Leistungsfähigkeit**
   - Ineffektivität trotz Anstrengung
   - Konzentrationsprobleme
   - Fehleranfälligkeit

## Frühe Warnsignale

### Körperliche Symptome
- Chronische Müdigkeit
- Schlafstörungen
- Häufige Kopfschmerzen
- Magen-Darm-Probleme
- Geschwächtes Immunsystem

### Emotionale Symptome
- Innere Leere
- Antriebslosigkeit
- Reizbarkeit
- Gefühl der Hilflosigkeit
- Ängste

### Verhaltensänderungen
- Sozialer Rückzug
- Vernachlässigung von Hobbys
- Erhöhter Konsum (Alkohol, Koffein)
- Prokrastination
- Perfektionismus

## Burnout-Prävention

### Im Arbeitskontext

**Work-Life-Balance:**
- Klare Grenzen zwischen Arbeit und Freizeit
- Regelmäßige Urlaubstage nutzen
- Überstunden reduzieren
- Feierabend-Rituale etablieren

**Am Arbeitsplatz:**
- Realistische Ziele setzen
- Delegieren lernen
- Pausen einhalten
- Kollegiale Unterstützung suchen

### Im Privatleben

**Selbstfürsorge:**
- Regelmäßige Auszeiten
- Hobbys und Interessen pflegen
- Soziale Kontakte aufrechterhalten
- Bewegung und gesunde Ernährung

**Mentale Gesundheit:**
- Achtsamkeitspraktiken
- Professionelle Unterstützung bei Bedarf
- Selbstreflexion
- Grenzen setzen und einhalten

## Die 12 Phasen des Burnouts (nach Freudenberger)

1. Zwang, sich zu beweisen
2. Verstärkter Einsatz
3. Vernachlässigung eigener Bedürfnisse
4. Verdrängung von Konflikten
5. Umdeutung von Werten
6. Verleugnung von Problemen
7. Rückzug
8. Beobachtbare Verhaltensänderungen
9. Depersonalisation
10. Innere Leere
11. Depression
12. Totale Erschöpfung

> **Wichtig:** Je früher Sie eingreifen, desto besser. Warten Sie nicht, bis Sie Phase 12 erreichen!

## Professionelle Hilfe

**Wann sollten Sie Hilfe suchen?**
- Symptome dauern länger als 2-3 Wochen
- Alltag ist stark beeinträchtigt
- Selbsthilfemaßnahmen reichen nicht aus
- Suizidgedanken treten auf

**Anlaufstellen:**
- Hausarzt
- Psychotherapeut
- Betriebsarzt
- Burnout-Kliniken
- Beratungsstellen

---

**Prävention ist besser als Behandlung.** Achten Sie auf die Signale Ihres Körpers und handeln Sie frühzeitig.',
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

    -- Page 9: Work-Life-Balance
    INSERT INTO public.content_pages (
      slug,
      title,
      excerpt,
      body_markdown,
      status,
      layout,
      funnel_id
    ) VALUES (
      'work-life-balance',
      'Work-Life-Balance: Beruf und Privatleben im Gleichgewicht',
      'Strategien für eine gesunde Balance zwischen Arbeit und Privatleben.',
      '# Work-Life-Balance: Beruf und Privatleben im Gleichgewicht

Eine ausgewogene Work-Life-Balance ist entscheidend für Ihre Gesundheit, Produktivität und Zufriedenheit.

## Was ist Work-Life-Balance?

Work-Life-Balance bedeutet **nicht**, Arbeit und Privatleben in exakt gleiche Zeitabschnitte aufzuteilen. Es geht vielmehr darum:

- Zufriedenheit in beiden Bereichen
- Flexibilität bei wechselnden Anforderungen
- Energie für beide Lebensbereiche
- Vereinbarkeit persönlicher und beruflicher Ziele

## Die vier Lebensbereiche

Eine gute Balance umfasst:

1. **Arbeit & Leistung**
   - Berufliche Erfüllung
   - Karriereentwicklung
   - Finanzielle Sicherheit

2. **Familie & Soziales**
   - Beziehungen pflegen
   - Zeit mit Liebsten
   - Soziale Verpflichtungen

3. **Gesundheit & Körper**
   - Bewegung
   - Ernährung
   - Schlaf & Erholung

4. **Sinn & Kultur**
   - Hobbys & Interessen
   - Persönliche Entwicklung
   - Spiritualität oder Werte

## Praktische Strategien

### Grenzen setzen

**Zeitliche Grenzen:**
- Feste Arbeitszeiten definieren
- E-Mails nur während Arbeitszeit
- Wochenenden schützen
- Urlaub vollständig nutzen

**Mentale Grenzen:**
- "Nein" sagen lernen
- Erwartungen klären
- Prioritäten setzen
- Perfektion loslassen

### Zeitmanagement-Methoden

**Eisenhower-Matrix:**

|                | **Dringend**        | **Nicht dringend**   |
|----------------|---------------------|----------------------|
| **Wichtig**    | Sofort erledigen    | Einplanen            |
| **Unwichtig**  | Delegieren          | Eliminieren          |

**Pomodoro-Technik:**
- 25 Min. fokussiert arbeiten
- 5 Min. Pause
- Nach 4 Zyklen: 15-30 Min. Pause

**Time Blocking:**
- Feste Zeitblöcke für Aufgaben
- Pufferzeiten einplanen
- Auch Freizeit blocken

### Digital Detox

**Bildschirmpausen:**
- 20-20-20 Regel: Alle 20 Min. für 20 Sek. auf 20 Fuß Entfernung schauen
- Bildschirmfreie Zeiten etablieren
- Smartphone-Nutzung limitieren

**Abend-Routine:**
- 1-2 Stunden vor dem Schlaf: Kein Bildschirm
- Flugmodus über Nacht
- Separater Wecker (nicht das Smartphone)

## Für Arbeitgeber und Teams

### Flexible Arbeitsmodelle
- Home Office-Optionen
- Flexible Arbeitszeiten
- Teilzeitmodelle
- Jobsharing

### Unternehmenskultur
- Überstunden nicht glorifizieren
- Pausen fördern
- Urlaubskultur etablieren
- Mental Health Days

## Selbstcheck: Wie ist Ihre Balance?

Bewerten Sie jeden Bereich von 1-10:

- [ ] Arbeit & Karriere: ___
- [ ] Familie & Freunde: ___
- [ ] Gesundheit & Fitness: ___
- [ ] Hobbys & Interessen: ___

**Ziel:** Alle Bereiche sollten mindestens bei 6/10 liegen.

## Warnsignale für Ungleichgewicht

🚩 Sie denken ständig an die Arbeit  
🚩 Hobbys werden vernachlässigt  
🚩 Beziehungen leiden  
🚩 Chronische Müdigkeit  
🚩 Häufige Krankheiten  
🚩 Gereiztheit und Unzufriedenheit  

## Kleine Schritte, große Wirkung

Sie müssen nicht alles auf einmal ändern. Beginnen Sie mit:

1. **Diese Woche:** Eine Sache identifizieren, die Sie ändern möchten
2. **Dieser Monat:** Eine neue Gewohnheit etablieren
3. **Dieses Jahr:** Kontinuierlich nachjustieren

> **Denken Sie daran:** Work-Life-Balance ist keine Zielgerade, sondern ein fortlaufender Prozess. Seien Sie geduldig mit sich selbst.

---

Eine gute Balance ist die Grundlage für langfristige Gesundheit und Zufriedenheit – sowohl beruflich als auch privat.',
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

    -- Page 10: Resilienz aufbauen
    INSERT INTO public.content_pages (
      slug,
      title,
      excerpt,
      body_markdown,
      status,
      layout,
      funnel_id
    ) VALUES (
      'resilienz-aufbauen',
      'Resilienz aufbauen: Psychische Widerstandskraft stärken',
      'Wie Sie Ihre mentale Stärke und Widerstandsfähigkeit systematisch entwickeln können.',
      '# Resilienz aufbauen: Psychische Widerstandskraft stärken

Resilienz ist die Fähigkeit, Krisen zu bewältigen und gestärkt aus ihnen hervorzugehen. Sie ist erlernbar!

## Was ist Resilienz?

Resilienz ist **nicht** die Abwesenheit von Problemen, sondern die **Fähigkeit, trotz Widrigkeiten zu gedeihen**.

### Die sieben Säulen der Resilienz

1. **Optimismus**
   - Positive Grundhaltung
   - Chancen in Krisen sehen
   - Vertrauen in die Zukunft

2. **Akzeptanz**
   - Unveränderliches annehmen
   - Realität anerkennen
   - Nicht gegen Windmühlen kämpfen

3. **Lösungsorientierung**
   - Fokus auf Machbares
   - Kreative Problemlösung
   - Handlungsfähigkeit bewahren

4. **Opferrolle verlassen**
   - Eigenverantwortung übernehmen
   - Aktiv gestalten statt passiv erdulden
   - Selbstwirksamkeit stärken

5. **Verantwortung übernehmen**
   - Für eigene Entscheidungen einstehen
   - Aus Fehlern lernen
   - Proaktiv handeln

6. **Netzwerkorientierung**
   - Soziale Kontakte pflegen
   - Hilfe annehmen und geben
   - Teil einer Gemeinschaft sein

7. **Zukunftsplanung**
   - Ziele setzen
   - Perspektive entwickeln
   - Vorwärts schauen

## Resilienz trainieren: Praktische Übungen

### Übung 1: Dankbarkeitstagebuch

**Täglich aufschreiben:**
- 3 Dinge, für die Sie dankbar sind
- Warum diese wichtig sind
- Wie sie sich angefühlt haben

**Wirkung:** Shift des Fokus auf Positives

### Übung 2: Perspektivenwechsel

Bei Problemen fragen:
1. Was kann ich daraus lernen?
2. Welche neue Möglichkeit eröffnet sich?
3. Wie würde mein "Zukunfts-Ich" damit umgehen?

### Übung 3: Kleine Erfolge feiern

- Tägliche "Win-Liste" führen
- Auch kleine Fortschritte würdigen
- Erfolge vor dem Schlafengehen reflektieren

### Übung 4: Selbstmitgefühl üben

Bei Fehlern oder Rückschlägen:
1. Anerkennen: "Das ist schwierig gerade"
2. Normalisieren: "Anderen geht es auch so"
3. Freundlich zu sich sein: "Ich gebe mir selbst, was ich brauche"

## Resilienz im Alltag

### Morgenroutine
- 5 Min. Meditation oder Atemübung
- Intention für den Tag setzen
- Gesundes Frühstück
- Positive Affirmation

### Im Arbeitsalltag
- Regelmäßige Pausen
- Erfolge dokumentieren
- Grenzen kommunizieren
- Kollegiale Unterstützung

### Abendroutine
- Tagesreflexion
- Dankbarkeit praktizieren
- Digitale Auszeit
- Ausreichend Schlaf

## Mentale Werkzeugkiste

Ihre persönliche Toolbox für schwierige Zeiten:

**Körperliche Tools:**
- Atemübungen
- Bewegung/Sport
- Progressive Muskelentspannung
- Gesunde Ernährung

**Mentale Tools:**
- Positive Selbstgespräche
- Visualisierung
- Gedankenstopp-Techniken
- Achtsamkeitsübungen

**Soziale Tools:**
- Vertrauenspersonen kontaktieren
- Professionelle Hilfe
- Selbsthilfegruppen
- Online-Communities

## Wachstum durch Krisen

### Posttraumatisches Wachstum

Menschen können aus Krisen gestärkt hervorgehen durch:
- Neuentdeckung eigener Stärken
- Intensivierung von Beziehungen
- Neubewertung von Prioritäten
- Persönliche Reifung
- Vertieftes Sinnerleben

### Fragen für Reflexion

- Was habe ich durch diese Erfahrung über mich gelernt?
- Welche Stärken habe ich entdeckt?
- Was ist mir jetzt wichtiger als vorher?
- Wie hat mich diese Krise verändert?

## Resilienz-Training: 30-Tage-Challenge

**Woche 1-2:** Grundlagen etablieren
- Täglich Dankbarkeitstagebuch
- 10 Min. Achtsamkeitsübung
- Eine Sache, die Freude bringt

**Woche 3-4:** Vertiefen
- Perspektivenwechsel üben
- Soziale Kontakte intensivieren
- Neue Bewältigungsstrategie ausprobieren

**Kontinuierlich:**
- Reflexion: Was funktioniert?
- Anpassung: Was brauche ich noch?
- Integration: Was wird zur Gewohnheit?

## Wissenschaftlich belegt

Studien zeigen, dass Resilienz-Training:
- ✅ Stressresistenz erhöht
- ✅ Mentale Gesundheit verbessert
- ✅ Körperliche Gesundheit fördert
- ✅ Lebensqualität steigert
- ✅ Berufliche Leistung optimiert

> **Wichtig:** Resilienz entwickelt sich über Zeit. Seien Sie geduldig und konsequent in Ihrem Training.

---

**Beginnen Sie noch heute:** Wählen Sie eine Übung aus und praktizieren Sie sie täglich für 21 Tage. Das ist der erste Schritt zu mehr Widerstandskraft!',
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

  END IF;
END $$;
