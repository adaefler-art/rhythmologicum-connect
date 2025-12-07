# EPIC: v0.3 ÔÇô Funnel-Engine Backend (konfigurierbare Funnels)

Ziel:
Einf├╝hrung einer vollst├ñndig konfigurierbaren Funnel-Engine, in der alle Frageb├Âgen dynamisch aus der Datenbank geladen werden. Der Stress-Funnel dient als erstes Beispiel und wird als Seed integriert.
Diese Engine bildet das Fundament f├╝r weitere medizinische Assessments in kommenden Versionen (Sleep, HRV, Fatigue, AF-Risk usw.).

## Issue 1 ÔÇö DB: Funnel-Basis-Tabellen anlegen

Beschreibung:
Erstelle alle Tabellen, die notwendig sind, um Funnels flexibel in der DB abzubilden. Diese Tabellen definieren Struktur, Schritte, Fragen und deren Zuordnung. Sie ersetzen den aktuellen Hardcode im Frontend.

Zweck:
Alle zuk├╝nftigen Funnels sollen ohne Code├ñnderungen konfigurierbar sein.

Zu erstellende Tabellen:

funnels

funnel_steps

questions

funnel_step_questions

Aufgaben (AKs):

SQL-Migration basierend auf 01_create_funnel_tables.sql anlegen.

Foreign Keys und Indizes definieren.

slug in funnels als unique markieren.

Datentypen und Defaults korrekt setzen (created_at, updated_at).

Sicherstellen, dass L├Âschregeln (on delete cascade) sinnvoll gesetzt sind.

Acceptance Criteria:

Migration l├ñuft lokal und remote ohne Fehler.

Alle Tabellen erscheinen korrekt im Supabase-Dashboard.

Indizes funktionieren (Test ├╝ber EXPLAIN optional).

Der Datensatzaufbau ist konsistent mit dem geplanten API-Response-Format.

## Issue 2 ÔÇö DB: assessments um funnel_id erweitern

Beschreibung:
Jedes Assessment soll wissen, zu welchem Funnel es geh├Ârt. Dadurch wird die Logik in API & UI funnel-agnostisch.

Aufgaben:

Migration 02_add_funnel_id_to_assessments.sql anlegen.

Spalte funnel_id uuid erg├ñnzen.

FK zu funnels.id.

Index f├╝r Performance erstellen.

Bestehende Daten unber├╝hrt lassen (nullable).

Acceptance Criteria:

select * from assessments zeigt neue Spalte.

FKs und Indizes funktionieren.

API- und Frontend-Code kompiliert weiter ohne ├änderungen (Backwards-compatible).

## Issue 3 ÔÇö API: GET /api/funnels/[slug]

Beschreibung:
Erstelle eine API-Route, die die vollst├ñndige Definition eines Funnels aus der DB l├ñdt, inklusive aller Steps und Questions.
Diese API ersetzt das bisher im Frontend hardcodierte QUESTIONS-Array.

R├╝ckgabetyp (vereinfacht):

{
  "id": "uuid",
  "slug": "stress",
  "title": "Stress Check",
  "steps": [
    {
      "id": "uuid",
      "type": "form",
      "title": "Stress-Bewertung",
      "questions": [
        { "id": "uuid", "label": "...", "question_type": "scale_0_10" }
      ]
    }
  ]
}


Aufgaben:

Route app/api/funnels/[slug]/route.ts anlegen.

Funnel per Slug laden.

Funnel Steps sortiert per order_index.

Questions ├╝ber Join laden.

Zusammenf├╝hren in strukturiertes JSON.

Error-Handling bei nicht existierendem Slug (404).

Acceptance Criteria:

/api/funnels/stress liefert komplette Definition.

Response entspricht den Tabellen.

Keine unsortierten Steps oder Fragen.

Fehlerf├ñlle werden sauber abgefangen.

## Issue 4 ÔÇö API: POST /api/funnel-assessments/[slug]

Beschreibung:
Generische Submission-Route, die Antworten eines Funnels speichert und ein Assessment erzeugt.
Diese Route ersetzt die spezielle Stress-Submit-Logik.

Aufgaben:

Route app/api/funnel-assessments/[slug]/route.ts implementieren.

Authentifizierten User ermitteln.

Patient Profile laden (wie bisher).

Assessment mit funnel_id erstellen.

Antworten in assessment_answers einf├╝gen.

patient_measures aktualisieren (inkl. Risk-Level, Score falls vorhanden).

F├╝r den Stress-Funnel:

bestehende AMY-Report-Engine aufrufen.

report_id speichern.

Acceptance Criteria:

Ein POST erzeugt korrekt:

assessment

answers

patient_measures

AMY-Report wird wie bisher generiert.

Fehlerhafte Payloads liefern klare, hilfreiche Fehlermeldungen.

## Issue 5 ÔÇö Seed: Stress-Funnel in Funnel-Modell ├╝bertragen

Beschreibung:
Der bestehende Stress-Fragebogen soll in die neuen Tabellen eingetragen werden, sodass /api/funnels/stress vollst├ñndig funktioniert.

Aufgaben:

Script oder SQL-Seed erstellen.

Funnel mit slug = stress anlegen.

Mindestens 1 Step (type = form).

Alle Stress-Fragen (Scale 0ÔÇô10) aus bisherigem QUESTIONS-Array einf├╝gen.

Fragen dem Step zuordnen.

Test: GET-API soll funktionierenden Stress-Funnel liefern.

Acceptance Criteria:

Seed ist reproduzierbar.

Funnel erscheint korrekt in Supabase.

Stress-Funnel l├ñsst sich ├╝ber die API konsumieren.

# EPIC: v0.3 ÔÇô Generischer Funnel-Client & Result-Ansichten

Ziel:
Frontend wird vollst├ñndig Funnel-agnostisch. Jede Funnel-Definition bestimmt, was das UI rendert.

## Issue 6 ÔÇö FE: Route /patient/funnel/[slug]

Beschreibung:
Neue allgemeine Funnel-Seite f├╝r Patienten, ersetzt die Stress-Check-Route.

Aufgaben:

Neue Page app/patient/funnel/[slug]/page.tsx.

Slug aus URL auslesen.

Funnel per API laden.

Fehlerzustand (404) f├╝r ung├╝ltige/slugs.

Acceptance Criteria:

/patient/funnel/stress zeigt Form-UI basierend auf DB-Daten.

Alte Stress-Check-Seite kann entfallen/redirecten.

## Issue 7 ÔÇö FE: FunnelFormClient (generisches Formular)

Beschreibung:
UI-Komponente, die einen Funnel dynamisch rendert.
Verwaltet Antworten, Validierung & Submit.

Aufgaben:

State per Question.

Required-Check (is_required).

UI-Renderer je question_type:

scale_0_10

text

single_choice (optional f├╝r Zukunft vorbereiten)

Submit ÔåÆ POST-API.

Redirect auf Result-Seite.

Acceptance Criteria:

Stress-Funnel l├ñsst sich vollst├ñndig ausf├╝llen.

Submit erzeugt vollst├ñndigen Assessment-Datensatz.

UI ist stabil und wiederverwendbar.

## Issue 8 ÔÇö FE: Result-Seite /patient/funnel/[slug]/result

Beschreibung:
Generische Ergebnis-Seite, ersetzt die Stress-Result-Seite.

Aufgaben:

assessmentId aus Query lesen.

Report laden (per Supabase-Query).

Funnel-Titel anzeigen.

Score, Risk-Level, AMY-Text darstellen.

"Mehr erfahren" Link f├╝r Content-Pages optional anzeigen.

Acceptance Criteria:

Ergebnisseite funktioniert f├╝r Stress-Funnel.

Fehlende Reports werden korrekt abgefangen.

## Issue 9 ÔÇö Redirect: /patient/stress-check ÔåÆ /patient/funnel/stress

Beschreibung:
Backward-Kompatibilit├ñt sicherstellen.

AKs:

In der alten Route Redirect einbauen.

Acceptance Criteria:

Alte URL funktioniert weiterhin.

# EPIC: v0.3 ÔÇô Parametrisierbares UI-System (Theme + Layout + Components)
## Issue 10 ÔÇö UI: Theme-/Design-Modell einf├╝hren

Beschreibung:
Zentrales Theme-Objekt, das Farben, Border-Radius, Abst├ñnde und Typografie definiert.

Aufgaben:

Datei ui/theme.ts erstellen.

Interface RhythmTheme.

defaultTheme exportieren.

Theme-Provider oder Hook anlegen.

Acceptance Criteria:

UI kann Theme-Werte konsistent verwenden.

Theme kann sp├ñter funnel-spezifisch ├╝berschrieben werden.

## Issue 11 ÔÇö UI: Globales AppLayout + PageShell

Beschreibung:
Einheitliches Layout-Ger├╝st f├╝r alle Seiten.

Aufgaben:

PageShell-Komponente bauen.

Titel, Untertitel, Back-Button, Varianten.

Konsistentes Spacing + max-width.

Acceptance Criteria:

Funnel-UI und Content-Pages nutzen PageShell.

Layout wirkt einheitlich.

## Issue 12 ÔÇö UI: Basiskomponenten (Button, Card, Text, Heading)

Beschreibung:
Zentrales Component-Set erstellen, das Theme nutzt.

Aufgaben:

Ordner components/ui/ erstellen.

Komponenten implementieren:

Button

Card

Text

Heading

Funnel-UI darauf umstellen.

Acceptance Criteria:

UI wirkt konsistenter.

Theme-├änderungen wirken global.

# EPIC: v0.3 ÔÇô Redaktionelle Content Pages
## Issue 13 ÔÇö DB: content_pages Tabelle erstellen

Beschreibung:
Migration 03_create_content_pages.sql implementieren.

Aufgaben:

Tabelle mit Markdown-Feld anlegen.

slug unique

status draft/published

optional: funnel_id logisch verkn├╝pfen.

Acceptance Criteria:

Content-Pages lassen sich im Dashboard einf├╝gen.

## Issue 14 ÔÇö API: GET /api/content/[slug]

Beschreibung:
Content aus DB via API abrufbar machen.

Aufgaben:

Neue Route unter app/api/content/[slug].

Filtering: nur published.

JSON-Response definieren.

Acceptance Criteria:

/api/content/was-ist-stress liefert vollst├ñndige Daten.

## Issue 15 ÔÇö FE: Route /content/[slug] ÔÇô Markdown Rendering

Beschreibung:
Content-Seite im Frontend, mit PageShell.

Aufgaben:

Route implementieren.

Markdown rendern.

Layout (optional wider/hero).

Acceptance Criteria:

Redaktionelle Stress-Seite funktioniert.

PageShell integriert.

## Issue 16 ÔÇö Content in Funnel-Result einbinden

Beschreibung:
Erg├ñnze eine Info-Box oder CTA, der auf Content Pages verweist.

AKs:

CTA in Result-Page einf├╝gen.

Slug konfigurierbar machen (z. B. per funnel.default_info_page).

Acceptance Criteria:

Ergebnis-Seite zeigt empfohlenen Content an.
