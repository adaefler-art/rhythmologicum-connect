# Use-Case Reference (Stand 2026-02-17)

Status:
- Verbindliche Referenz fuer Scope, Sprache und Output von UC1-UC3.
- Diese Referenz ersetzt fuer die operative Planung die vorherige Detaillierung in `ROLLOUT_USE_CASE_PLAN_2026-02-17.md`.

---

## Use Case 1 — Pre-Visit Structured Capture

Kontext:
- Home, patientgefuehrt, asynchron.

Zielsetzung:
- Vollstaendige, strukturierte Erfassung vor dem Arzttermin.
- Reduktion unstrukturierter Erstgespraeche.
- Vorbereitung eines hochwertigen aerztlichen Gespraechs.
- Keine klinische Interpretation waehrend der Dateneingabe.

Systemrolle:
- Datenerhebungs- und Strukturierungswerkzeug.
- Kein klinisches Entscheidungsinstrument.

### Funktionale Anforderungen

PAT muss:
- Beschwerden strukturiert erfassen (Freitext + strukturierte Felder).
- Zeitverlauf systematisch abfragen (Beginn, Verlauf, Trigger, Dauer, Frequenz).
- Medikation erfassen (Name, Dosis, Einnahmefrequenz, Foto-Upload).
- Vorerkrankungen systematisch aufnehmen.
- Vorbefunde erfassen (Upload + Metadaten).
- Standardisierte Skalen integrieren (z. B. Schmerz, Belastbarkeit).
- Fehlende Angaben markieren (Vollstaendigkeitscheck).

PAT darf nicht:
- Symptome interpretieren.
- Diagnosevorschlaege anzeigen.
- Wahrscheinlichkeiten nennen.
- Risiko- oder Dringlichkeitsbewertungen ausgeben.

### Sprachliche Rahmenbedingungen

Erlaubt:
- "Bitte beschreiben Sie…"
- "Fuer eine vollstaendige Erfassung werden haeufig folgende Aspekte abgefragt…"

Nicht erlaubt:
- "Das spricht fuer…"
- "Dies ist typisch fuer…"
- "Zur Abklaerung von X…"

Regel:
- Sprache bleibt symptom- und prozessorientiert, nicht nosologisch.

### Output

Erlaubter Output:
- Hauptanliegen
- Strukturierte Symptomdarstellung
- Zeitlinie
- Medikation
- Vorerkrankungen
- Vorbefunde (geordnet)
- Offene Punkte / fehlende Angaben

Nicht erlaubt:
- Patient-facing Clinical Reasoning
- Differenzialdiagnosen

---

## Use Case 2 — Waiting Room Fastpass

Kontext:
- Tablet/Kiosk, patientgefuehrt, leise, zeitkritisch.

Zielsetzung:
- Erhebung eines Minimum Dataset in kurzer Zeit.
- Verbesserung des sofortigen Gespraechseinstiegs.
- Reduktion von Informationsverlust.

Systemrolle:
- Komprimierter Datensammler.
- Kein Screening- oder Triage-Tool.

### Funktionale Anforderungen

PAT muss:
- Identitaet und Hauptanliegen erfassen.
- Hauptsymptom + Beginn aufnehmen.
- Aktuelle Medikation erfassen (ja/nein + Liste/Fotoupload).
- Kurze standardisierte Skala erfassen (z. B. Intensitaet).
- Wenige prozessuale Red-Flag-Fragen als Vollstaendigkeitscheck stellen.

Zulaessige Formulierung:
- "In vielen medizinischen Kontexten werden folgende Aspekte standardmaessig erfasst…"

Nicht zulaessig:
- "Bei Angabe von X ist eine sofortige Abklaerung erforderlich."

Nicht erlaubt:
- Dringlichkeitsklassifikation
- Triage-Output

### UX-Anforderungen

Pflicht:
- Tap-first Design
- Grosse Targets
- Kein Audio
- Maximal 3-5 Minuten Durchlaufzeit
- Markierung fehlender Felder

Optional:
- QR/Link zur Fortsetzung zu Hause (Upgrade auf UC1)

### Output

Erzeugt wird:
- Intake-Artefakt (Minimum Dataset)
- Markierte Open Loops
- Klar sichtbare Unvollstaendigkeiten

Nicht erlaubt:
- Diagnoseoutput
- Risikoeinstufung

---

## Use Case 3 — Consult Mode Silent Listener

Kontext:
- Arztgefuehrt, Audio-first, minimale Interruption.

Zielsetzung:
- Strukturierung des Arzt-Patienten-Gespraechs in Echtzeit.
- Reduktion der kognitiven Dokumentationslast.
- Sichtbarmachen fehlender oder unklarer Angaben.
- Kein Clinical Reasoning waehrend des Gespraechs.

Systemrolle:
- Strukturierender Dokumentationsassistent.
- Kein Entscheidungsassistent.

### Audio-Extraktion

Voraussetzung:
- Expliziter Consent.

PAT muss:
- Strukturierte Fakten extrahieren (Symptome, Zeitangaben, Medikation, relevante Vorerkrankungen).
- Gespraechsinhalte in strukturierte Felder ueberfuehren.
- Quellen markieren ("aus Gespraech", Timestamp).

### Panel-Logik

Arzt-UI zeigt ausschliesslich:
- Captured (erfasst)
- Missing (nicht adressiert)
- Unclear (widerspruechlich oder unpraezise)

Zulaessig:
- "Symptomdauer noch nicht eindeutig erfasst."

Nicht zulaessig:
- "Chronische Symptomatik spricht fuer…"

Nicht erlaubt:
- Hypothesengenerierung
- Differenzialdiagnosen
- Wahrscheinlichkeiten

### Rueckfrage-Vorschlaege

Erlaubt:
- "Dauer des Symptoms wurde nicht erfasst."

Nicht erlaubt:
- "Zur Abklaerung einer moeglichen X sollte nach Y gefragt werden."

Regel:
- Rueckfragen bleiben formal-strukturell, nicht diagnostisch.

### Output

Am Ende der Konsultation:
- Finales Intake-Artefakt
- Strukturierte Gespraechsdaten
- Open Loops
- Quellenmarkierung

Nicht erlaubt:
- Arbeitsdiagnose
- Priorisierung
- Empfohlene Diagnostik

---

## Uebergreifende Systemregeln (UC1-UC3)

Verboten:
1. Keine Ranking-Algorithmen
2. Keine Wahrscheinlichkeitsberechnung
3. Keine Risikoklassifikation
4. Keine Therapie- oder Diagnostikempfehlung
5. Keine patientenspezifische Interpretation

Rollenbild PAT:
- Strukturierer
- Kontextualisierer
- Dokumentationsoptimierer

Nicht im Scope:
- Diagnostiker
- Priorisierer
- Entscheidungsengine

Scope-Hinweis:
- Sobald das System patientenspezifisch gewichtet oder empfiehlt, verlaesst es den definierten Scope.
