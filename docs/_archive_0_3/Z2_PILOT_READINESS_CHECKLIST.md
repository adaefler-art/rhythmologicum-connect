# Z2 Pilot-Bereitschafts-Checkliste

**Rhythmologicum Connect v0.2**  
**Für: Pilotpraxis & Remote-Piloten**  
**Stand: Dezember 2024**

---

## 📋 Überblick

Diese Checkliste hilft Ihnen, den Remote-Piloten von Rhythmologicum Connect vorzubereiten und durchzuführen. Sie ist speziell für nicht-technisches Personal konzipiert und führt Sie Schritt für Schritt durch alle notwendigen Vorbereitungen, Tests und das Onboarding.

**Zeitaufwand:** Ca. 2-3 Stunden für vollständige Vorbereitung und Tests

---

## ✅ Phase 1: Setup & Voraussetzungen

### 1.1 Hardware & Software

**Erforderlich:**
- [ ] Computer/Laptop mit aktuellem Browser (Chrome, Firefox, Safari oder Edge)
- [ ] Stabile Internetverbindung (mind. 2 Mbit/s)
- [ ] Optional: Smartphone/Tablet für mobile Tests

**Empfohlen:**
- [ ] Zweiter Bildschirm für Dokumentation während Tests
- [ ] Zugriff zu einem Drucker (für Patienteninformationen)

**Browser-Check:**
- [ ] Browser ist auf aktuellster Version
- [ ] JavaScript ist aktiviert
- [ ] Cookies sind erlaubt
- [ ] Pop-up-Blocker ausgeschaltet (für diese Website)

**Status:** ⬜ Nicht begonnen | 🟡 In Arbeit | ✅ Abgeschlossen

---

### 1.2 Zugriff & Accounts

**Supabase-Zugang:**
- [ ] Account bei [supabase.com](https://supabase.com) erstellt
- [ ] Projekt für Rhythmologicum Connect angelegt
- [ ] Datenbank-Schema importiert (SQL aus `schema/schema.sql`)
- [ ] Zugriff auf Supabase Dashboard verifiziert

**Vercel-Zugang (für Deployment):**
- [ ] Account bei [vercel.com](https://vercel.com) erstellt
- [ ] GitHub-Repository verbunden
- [ ] Zugriff auf Vercel Dashboard verifiziert

**Anthropic-Zugang (optional, für AMY AI):**
- [ ] Account bei [console.anthropic.com](https://console.anthropic.com) erstellt
- [ ] API-Key generiert
- [ ] Guthaben/Credits verfügbar

**GitHub-Zugang:**
- [ ] Leserechte für Repository `adaefler-art/rhythmologicum-connect`
- [ ] Zugriff verifiziert

**Status:** ⬜ Nicht begonnen | 🟡 In Arbeit | ✅ Abgeschlossen

---

### 1.3 Umgebungsvariablen vorbereiten

Sammeln Sie folgende Informationen (siehe `docs/DEPLOYMENT_GUIDE.md` für Details):

**Supabase (erforderlich):**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` notiert
  - Zu finden: Supabase → Settings → API → Project URL
  - Beispiel: `https://abcdefgh.supabase.co`

- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` notiert
  - Zu finden: Supabase → Settings → API → anon public
  - Beispiel: `eyJhbGciOiJIUzI1NiIsInR5cC...`

- [ ] `SUPABASE_SERVICE_ROLE_KEY` notiert
  - Zu finden: Supabase → Settings → API → service_role
  - ⚠️ **GEHEIM HALTEN!** Niemals in Code committen!

**Anthropic (optional):**
- [ ] `ANTHROPIC_API_KEY` notiert (falls AMY aktiviert werden soll)
  - Zu finden: Anthropic Console → API Keys
  - ⚠️ **GEHEIM HALTEN!**

**Feature Flags (optional):**
- [ ] Entscheiden: AMY AI aktivieren? (`NEXT_PUBLIC_FEATURE_AMY_ENABLED`)
- [ ] Entscheiden: Kliniker-Dashboard aktivieren? (`NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED`)
- [ ] Entscheiden: Diagramme aktivieren? (`NEXT_PUBLIC_FEATURE_CHARTS_ENABLED`)

**Empfehlung für Pilotstart:** Alle Features aktiviert (`true`)

**Status:** ⬜ Nicht begonnen | 🟡 In Arbeit | ✅ Abgeschlossen

---

## ✅ Phase 2: Deployment durchführen

### 2.1 Vercel Deployment

**Schritt-für-Schritt:**

1. **Projekt importieren**
   - [ ] In Vercel Dashboard: "Add New..." → "Project"
   - [ ] Repository auswählen: `adaefler-art/rhythmologicum-connect`
   - [ ] Framework: Next.js (wird automatisch erkannt)
   - [ ] Root Directory: `/` (Standard)

2. **Umgebungsvariablen setzen**
   - [ ] "Environment Variables" aufklappen
   - [ ] Alle erforderlichen Variablen eintragen:
     - [ ] `NEXT_PUBLIC_SUPABASE_URL`
     - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - [ ] `SUPABASE_SERVICE_ROLE_KEY`
   - [ ] Optional: AMY und Feature Flags eintragen
   - [ ] Für alle Umgebungen aktivieren: Production, Preview, Development

3. **Deployment starten**
   - [ ] "Deploy" Button klicken
   - [ ] Warten (ca. 2-5 Minuten)
   - [ ] Auf erfolgreichen Build warten (grüner Haken)

4. **URL notieren**
   - [ ] Production-URL kopieren (z.B. `https://rhythmologicum-connect.vercel.app`)
   - [ ] URL für Tests und Onboarding verwenden

**Bei Fehlern:** Siehe [Troubleshooting](#troubleshooting) am Ende dieses Dokuments

**Status:** ⬜ Nicht begonnen | 🟡 In Arbeit | ✅ Abgeschlossen

---

### 2.2 Datenbank-Setup

**Migrationen ausführen:**

1. **Supabase SQL Editor öffnen**
   - [ ] Supabase Dashboard → SQL Editor
   - [ ] "New query" erstellen

2. **Schema importieren**
   - [ ] Inhalt von `schema/schema.sql` kopieren
   - [ ] In SQL Editor einfügen
   - [ ] "Run" klicken
   - [ ] Erfolgsmeldung verifizieren

3. **Migrationen nacheinander ausführen**
   - [ ] Dateien aus `supabase/migrations/` der Reihe nach ausführen
   - [ ] Reihenfolge: Nach Timestamp (älteste zuerst)
   - [ ] Jede Migration einzeln testen

4. **RLS-Richtlinien verifizieren**
   - [ ] Supabase → Authentication → Policies
   - [ ] Prüfen: Policies für alle Tabellen vorhanden
   - [ ] Prüfen: RLS ist aktiviert (Enabled = true)

**Status:** ⬜ Nicht begonnen | 🟡 In Arbeit | ✅ Abgeschlossen

---

## ✅ Phase 3: Test-Accounts erstellen

### 3.1 Patient-Test-Account

**Registrierung durchführen:**

1. **Website öffnen**
   - [ ] Production-URL in Browser öffnen
   - [ ] Homepage wird korrekt angezeigt

2. **Test-Patient registrieren**
   - [ ] Klick auf "Registrieren" oder "Noch kein Konto?"
   - [ ] E-Mail: `test-patient@pilotpraxis.de` (oder eigene Test-E-Mail)
   - [ ] Passwort: Sicheres Passwort wählen (mind. 6 Zeichen)
   - [ ] "Registrieren" klicken
   - [ ] Bestätigungs-E-Mail erhalten (Postfach prüfen)
   - [ ] E-Mail-Link klicken zur Bestätigung

3. **Login testen**
   - [ ] Mit Test-Patient anmelden
   - [ ] Weiterleitung zu Patient-Portal erfolgreich
   - [ ] Kein Fehler angezeigt

**Zugangsdaten notieren:**
```
Test-Patient:
E-Mail: _________________________________
Passwort: _______________________________
```

**Status:** ⬜ Nicht begonnen | 🟡 In Arbeit | ✅ Abgeschlossen

---

### 3.2 Kliniker-Test-Account

**Registrierung & Rollenzuweisung:**

1. **Kliniker registrieren**
   - [ ] Wie bei Patient: Registrierung durchführen
   - [ ] E-Mail: `test-kliniker@pilotpraxis.de` (oder eigene Test-E-Mail)
   - [ ] Passwort: Sicheres Passwort wählen
   - [ ] E-Mail bestätigen

2. **Clinician-Rolle zuweisen** (SQL in Supabase)
   - [ ] Supabase → SQL Editor öffnen
   - [ ] Folgenden SQL-Befehl ausführen:
   ```sql
   SELECT set_user_role('test-kliniker@pilotpraxis.de', 'clinician');
   ```
   - [ ] Erfolgsmeldung: "set_user_role: 1 row" (oder ähnlich)

3. **Kliniker-Login testen**
   - [ ] Mit Kliniker-Account anmelden
   - [ ] Automatische Weiterleitung zu `/clinician` Dashboard
   - [ ] Dashboard wird angezeigt (keine Fehlermeldung)

**Zugangsdaten notieren:**
```
Test-Kliniker:
E-Mail: _________________________________
Passwort: _______________________________
```

**Status:** ⬜ Nicht begonnen | 🟡 In Arbeit | ✅ Abgeschlossen

---

### 3.3 Zusätzliche Test-Patienten (optional)

Für realistischere Tests empfohlen:

- [ ] 2-3 weitere Patient-Accounts erstellen
- [ ] Verschiedene E-Mail-Adressen verwenden
- [ ] Verschiedene Namen/Profile in Datenbank (optional)

**Zweck:** Kliniker-Dashboard mit mehreren Patienten testen

**Status:** ⬜ Nicht begonnen | 🟡 In Arbeit | ✅ Abgeschlossen

---

## ✅ Phase 4: End-to-End Tests

### 4.1 Patient-Flow: Fragebogen durchführen

**Test: Vollständiger Patient-Durchlauf**

1. **Als Patient anmelden**
   - [ ] Login mit Test-Patient Zugangsdaten
   - [ ] Weiterleitung zu `/patient/stress-check` oder Dashboard

2. **Einwilligung (Consent) bestätigen**
   - [ ] Consent-Modal erscheint (falls erste Nutzung)
   - [ ] Datenschutz-Text wird angezeigt
   - [ ] "Ich stimme zu" anklicken
   - [ ] Modal schließt sich
   - [ ] Fragebogen wird sichtbar

3. **Fragebogen ausfüllen**
   - [ ] Alle 8 Fragen werden angezeigt
   - [ ] 4 Fragen zu Stress/Überforderung
   - [ ] 4 Fragen zu Schlaf/Erholung
   - [ ] Antwortskala 0-4 ist klar erkennbar
   - [ ] Alle Fragen beantworten (verschiedene Werte wählen)
   - [ ] Fortschrittsanzeige wird aktualisiert

4. **Assessment absenden**
   - [ ] "Antworten speichern & weiter" Button klicken
   - [ ] Ladeindikator erscheint (2-5 Sekunden)
   - [ ] Weiterleitung zur Ergebnis-Seite (`/patient/stress-check/result`)

5. **Ergebnisse prüfen**
   - [ ] **Stress-Score** wird angezeigt (z.B. "68/100")
   - [ ] **Schlaf-Score** wird angezeigt (z.B. "45/100")
   - [ ] **Risiko-Level** wird angezeigt (niedrig/mittel/hoch)
   - [ ] Farb-Codierung: grün/gelb/rot entspricht Risiko
   - [ ] Scores sind plausibel basierend auf Antworten

6. **AMY-Bericht prüfen** (falls aktiviert)
   - [ ] AMY-Abschnitt ist sichtbar
   - [ ] Personalisierter Text wird angezeigt (nicht "Loading...")
   - [ ] Text erwähnt Stress oder Schlaf
   - [ ] Text ist verständlich und gut formatiert
   - [ ] Keine technischen Fehler oder "undefined"

7. **Navigation zum Verlauf**
   - [ ] "📊 Meinen Verlauf ansehen" Button ist sichtbar
   - [ ] Button klicken
   - [ ] Weiterleitung zu `/patient/history`
   - [ ] Das gerade durchgeführte Assessment wird angezeigt

**Erwartetes Ergebnis:** ✅ Vollständiger Flow ohne Fehler

**Probleme notieren:**
```
_______________________________________________________________
_______________________________________________________________
_______________________________________________________________
```

**Status:** ⬜ Nicht begonnen | 🟡 In Arbeit | ✅ Abgeschlossen

---

### 4.2 Patient-Flow: Historie & Wiederholung

**Test: Verlauf und weitere Assessments**

1. **Historie ansehen**
   - [ ] Auf `/patient/history` navigieren
   - [ ] Mindestens 1 Assessment wird angezeigt
   - [ ] Anzeige enthält:
     - [ ] Datum/Zeitstempel
     - [ ] Stress-Score
     - [ ] Schlaf-Score
     - [ ] Risiko-Level (farbig)

2. **Zweites Assessment durchführen**
   - [ ] "Neue Messung durchführen" Button klicken
   - [ ] Fragebogen öffnet sich (leer, keine vorherigen Antworten)
   - [ ] Fragebogen komplett ausfüllen (andere Werte als vorher)
   - [ ] Absenden
   - [ ] Neue Ergebnisse werden angezeigt

3. **Historie erneut prüfen**
   - [ ] Zu Historie navigieren
   - [ ] Jetzt 2 Assessments sichtbar
   - [ ] Neuestes Assessment steht oben
   - [ ] Scores sind unterschiedlich (falls anders beantwortet)

4. **Export-Funktion testen** (falls implementiert)
   - [ ] "Als JSON exportieren" Button suchen
   - [ ] Button klicken
   - [ ] JSON-Datei wird heruntergeladen
   - [ ] Datei öffnen und Struktur prüfen
   - [ ] Enthält alle Assessments und Scores

**Erwartetes Ergebnis:** ✅ Mehrere Assessments funktionieren, Historie wird korrekt aktualisiert

**Probleme notieren:**
```
_______________________________________________________________
_______________________________________________________________
_______________________________________________________________
```

**Status:** ⬜ Nicht begonnen | 🟡 In Arbeit | ✅ Abgeschlossen

---

### 4.3 Kliniker-Flow: Dashboard & Patientenansicht

**Test: Kliniker-Funktionen**

1. **Kliniker-Login**
   - [ ] Ausloggen (falls als Patient angemeldet)
   - [ ] Mit Kliniker-Account anmelden
   - [ ] Automatische Weiterleitung zu `/clinician`
   - [ ] Dashboard wird angezeigt

2. **Patienten-Übersicht**
   - [ ] Tabelle mit Patienten wird angezeigt
   - [ ] Mindestens Test-Patient ist sichtbar
   - [ ] Spalten sind korrekt ausgefüllt:
     - [ ] Patient-Name
     - [ ] Aktueller Stress-Score
     - [ ] Risiko-Level (farbiger Badge)
     - [ ] Datum der letzten Messung
     - [ ] Anzahl der Messungen

3. **Sortierung testen**
   - [ ] Auf Spalten-Überschrift klicken
   - [ ] Tabelle sortiert sich neu
   - [ ] Sortier-Indikator (↑/↓) wird angezeigt

4. **Patienten-Details öffnen**
   - [ ] Auf einen Patienten klicken
   - [ ] Weiterleitung zu `/clinician/patient/[id]`
   - [ ] Detail-Seite wird geladen

5. **Patienten-Profil prüfen**
   - [ ] Name wird angezeigt
   - [ ] Geburtsjahr wird angezeigt (falls vorhanden)
   - [ ] Geschlecht wird angezeigt (falls vorhanden)

6. **Diagramme prüfen** (falls aktiviert)
   - [ ] **Stress-Verlauf** Diagramm wird angezeigt
   - [ ] **Schlaf-Verlauf** Diagramm wird angezeigt
   - [ ] Datenpunkte entsprechen Assessments
   - [ ] Achsenbeschriftungen sind lesbar
   - [ ] Keine leeren oder kaputten Diagramme

7. **AMY-Berichte Timeline prüfen**
   - [ ] Liste aller AMY-Berichte wird angezeigt
   - [ ] Chronologische Reihenfolge (neueste oben)
   - [ ] Jeder Bericht zeigt:
     - [ ] Datum/Zeitstempel
     - [ ] Stress/Schlaf Scores
     - [ ] Risiko-Level (farblich umrandet)
     - [ ] Vollständiger AMY-Text

8. **Rohdaten-Ansicht testen**
   - [ ] "Rohdaten anzeigen" Toggle finden
   - [ ] Toggle aktivieren
   - [ ] JSON-Daten werden angezeigt
   - [ ] Daten enthalten Profil und alle Measures
   - [ ] Toggle deaktivieren
   - [ ] JSON verschwindet wieder

**Erwartetes Ergebnis:** ✅ Alle Kliniker-Funktionen arbeiten korrekt

**Probleme notieren:**
```
_______________________________________________________________
_______________________________________________________________
_______________________________________________________________
```

**Status:** ⬜ Nicht begonnen | 🟡 In Arbeit | ✅ Abgeschlossen

---

### 4.4 Zugriffskontrolle testen

**Test: Sicherheit & Berechtigungen**

1. **Patient darf nicht auf Kliniker-Bereich zugreifen**
   - [ ] Als Patient anmelden
   - [ ] Manuell zu `/clinician` navigieren (URL-Eingabe)
   - [ ] Zugriff wird verweigert
   - [ ] Weiterleitung zur Homepage mit Fehler `?error=access_denied`
   - [ ] Fehlermeldung wird angezeigt

2. **Unauthentifizierter Zugriff blockiert**
   - [ ] Komplett ausloggen
   - [ ] Zu `/patient/stress-check` navigieren
   - [ ] Weiterleitung zur Login-Seite
   - [ ] Zu `/clinician` navigieren
   - [ ] Weiterleitung zur Login-Seite

3. **Session-Persistenz**
   - [ ] Als Patient anmelden
   - [ ] Browser-Tab schließen
   - [ ] Neuen Tab öffnen und zur App navigieren
   - [ ] Noch angemeldet (kein erneuter Login nötig)

4. **Logout funktioniert**
   - [ ] "Abmelden" Button klicken
   - [ ] Weiterleitung zur Homepage
   - [ ] Versuch, zu `/patient` zu navigieren → Zugriff verweigert

**Erwartetes Ergebnis:** ✅ Zugriffskontrolle funktioniert korrekt, keine unbefugten Zugriffe möglich

**Probleme notieren:**
```
_______________________________________________________________
_______________________________________________________________
_______________________________________________________________
```

**Status:** ⬜ Nicht begonnen | 🟡 In Arbeit | ✅ Abgeschlossen

---

### 4.5 Performance & Browser-Kompatibilität

**Test: Technische Qualität**

1. **Performance-Messung**
   - [ ] Homepage lädt in < 3 Sekunden
   - [ ] Fragebogen lädt in < 2 Sekunden
   - [ ] Ergebnis-Generierung dauert < 5 Sekunden
   - [ ] Kliniker-Dashboard lädt in < 3 Sekunden
   - [ ] Keine extrem langsamen Requests (> 10 Sek.)

2. **Mobile Ansicht**
   - [ ] Website auf Smartphone öffnen ODER
   - [ ] Browser DevTools: Device Toolbar (Ctrl+Shift+M)
   - [ ] Alle Seiten sind auf Handy lesbar
   - [ ] Buttons sind groß genug zum Tippen
   - [ ] Kein horizontales Scrollen nötig

3. **Browser-Tests**
   Mindestens 2 Browser testen:
   - [ ] Chrome/Edge: Alles funktioniert
   - [ ] Firefox: Alles funktioniert
   - [ ] Safari (falls Mac/iOS): Alles funktioniert

4. **Console-Errors prüfen**
   - [ ] Browser Developer Tools öffnen (F12)
   - [ ] Console-Tab öffnen
   - [ ] Durch App navigieren
   - [ ] Keine kritischen Fehler (rot) in Console
   - [ ] Warnings (gelb) sind akzeptabel

**Erwartetes Ergebnis:** ✅ App ist performant und funktioniert in allen Browsern

**Probleme notieren:**
```
_______________________________________________________________
_______________________________________________________________
_______________________________________________________________
```

**Status:** ⬜ Nicht begonnen | 🟡 In Arbeit | ✅ Abgeschlossen

---

## ✅ Phase 5: Onboarding vorbereiten

### 5.1 Patienten-Informationsmaterial

**Dokumente vorbereiten:**

- [ ] **Willkommens-E-Mail** Vorlage erstellen
  - [ ] Begrüßung und Zweck des Pilotprojekts
  - [ ] Link zur Website
  - [ ] Anleitung zur Registrierung
  - [ ] Kontaktdaten bei Problemen

- [ ] **Kurzanleitung für Patienten** (1-2 Seiten)
  - [ ] Wie registriere ich mich?
  - [ ] Wie fülle ich den Fragebogen aus?
  - [ ] Wie verstehe ich meine Ergebnisse?
  - [ ] Wie oft soll ich teilnehmen?

- [ ] **FAQ für Patienten** erstellen
  - [ ] Was passiert mit meinen Daten?
  - [ ] Kann mein Arzt die Ergebnisse sehen?
  - [ ] Wie sicher ist die Plattform?
  - [ ] Was bedeuten die Scores?

**Vorlage für Willkommens-E-Mail:**
```
Betreff: Willkommen beim Rhythmologicum Connect Pilot

Liebe/r [Name],

vielen Dank für Ihre Teilnahme am Pilotprojekt Rhythmologicum Connect!

Diese Plattform hilft Ihnen, Ihre Stress- und Schlafbelastung regelmäßig 
zu erfassen und im Zeitverlauf zu beobachten.

SO GEHT'S:
1. Öffnen Sie: [IHRE-URL]
2. Klicken Sie auf "Registrieren"
3. Geben Sie Ihre E-Mail und ein Passwort ein
4. Bestätigen Sie Ihre E-Mail (Link im Postfach)
5. Füllen Sie den Fragebogen aus

Wir empfehlen, den Fragebogen einmal pro Woche auszufüllen, 
am besten immer zur gleichen Tageszeit.

Bei Fragen erreichen Sie uns unter: [KONTAKT]

Beste Grüße,
[Ihr Team]
```

**Status:** ⬜ Nicht begonnen | 🟡 In Arbeit | ✅ Abgeschlossen

---

### 5.2 Kliniker-Schulung vorbereiten

**Schulungsmaterial:**

- [ ] **Präsentation** erstellen (PowerPoint/PDF)
  - [ ] Überblick über Pilotprojekt
  - [ ] Demo: Patient-Flow (mit Screenshots)
  - [ ] Demo: Kliniker-Dashboard (mit Screenshots)
  - [ ] Interpretation der Ergebnisse
  - [ ] Umgang mit kritischen Risiko-Levels

- [ ] **Hands-on Session** planen
  - [ ] Live-Demo durchführen
  - [ ] Kliniker lassen selbst testen
  - [ ] Gemeinsam Testdaten interpretieren

- [ ] **Checkliste für Kliniker** (täglich/wöchentlich)
  - [ ] Dashboard aufrufen
  - [ ] Nach roten Risiko-Levels suchen
  - [ ] Patienten mit Auffälligkeiten extern kontaktieren
  - [ ] Wöchentlich: Verlaufsdiagramme prüfen

**Schulungs-Agenda (Beispiel):**
```
1. Einführung (10 Min.)
   - Ziel des Pilotprojekts
   - Technische Voraussetzungen

2. Patient-Flow Demo (15 Min.)
   - Registrierung
   - Fragebogen ausfüllen
   - Ergebnisse interpretieren

3. Kliniker-Dashboard Demo (20 Min.)
   - Login und Navigation
   - Patienten-Übersicht
   - Detail-Ansicht
   - Diagramme lesen

4. Hands-on Session (20 Min.)
   - Selbst einloggen
   - Dashboard erkunden
   - Testpatienten ansehen

5. Interpretation & Workflow (15 Min.)
   - Was bedeuten die Scores?
   - Wann sollte ich reagieren?
   - Wie kontaktiere ich Patienten?

6. Fragen & Feedback (10 Min.)
```

**Status:** ⬜ Nicht begonnen | 🟡 In Arbeit | ✅ Abgeschlossen

---

### 5.3 Support & Kommunikation einrichten

**Kontaktwege definieren:**

- [ ] **E-Mail-Adresse** für Support einrichten
  - [ ] Z.B. `support@rhythmologicum-pilot.de`
  - [ ] Autoresponder mit Reaktionszeit

- [ ] **Telefon-Hotline** (optional)
  - [ ] Zeiten definieren (z.B. Mo-Fr 9-17 Uhr)
  - [ ] Rufnummer kommunizieren

- [ ] **Feedback-Prozess** etablieren
  - [ ] Wie können Patienten Feedback geben?
  - [ ] Wie dokumentieren wir Probleme?
  - [ ] Wer ist verantwortlich für Bearbeitung?

- [ ] **Eskalationspfad** bei technischen Problemen
  - [ ] Level 1: FAQ & Kurzanleitungen
  - [ ] Level 2: E-Mail-Support
  - [ ] Level 3: Entwicklerteam kontaktieren

**Status:** ⬜ Nicht begonnen | 🟡 In Arbeit | ✅ Abgeschlossen

---

## ✅ Phase 6: Pilot-Start durchführen

### 6.1 Go-Live Checkliste

**Finale Checks vor Pilot-Start:**

- [ ] Alle Tests aus Phase 4 erfolgreich abgeschlossen
- [ ] Patienten-Informationsmaterial bereit
- [ ] Kliniker-Schulung durchgeführt
- [ ] Support-Kanäle eingerichtet
- [ ] Datenschutz-Dokumentation vorhanden
- [ ] Einwilligungserklärungen vorbereitet
- [ ] Backup-Plan bei technischen Problemen definiert

**Go/No-Go Entscheidung:**
- [ ] ✅ GO: Alle Punkte erfüllt → Pilot starten
- [ ] ⛔ NO-GO: Kritische Punkte fehlen → Nachbesserung nötig

**Status:** ⬜ Nicht begonnen | 🟡 In Arbeit | ✅ Abgeschlossen

---

### 6.2 Ersten 5 Patienten onboarden

**Weicher Start:**

1. **Patient 1-5 kontaktieren**
   - [ ] Telefonisch oder persönlich informieren
   - [ ] Willkommens-E-Mail senden
   - [ ] Bei Registrierung helfen (falls nötig)

2. **Erste Woche begleiten**
   - [ ] Nach 1 Tag: Nachfragen, ob Registrierung geklappt hat
   - [ ] Nach 3 Tagen: Nachfragen, ob Fragebogen ausgefüllt wurde
   - [ ] Nach 1 Woche: Erstes Feedback einholen

3. **Probleme dokumentieren**
   - [ ] Welche Fragen kamen auf?
   - [ ] Gab es technische Probleme?
   - [ ] Was war unklar?
   - [ ] Verbesserungsvorschläge notieren

**Learnings aus ersten 5 Patienten:**
```
_______________________________________________________________
_______________________________________________________________
_______________________________________________________________
_______________________________________________________________
```

**Status:** ⬜ Nicht begonnen | 🟡 In Arbeit | ✅ Abgeschlossen

---

### 6.3 Pilot ausweiten

Nach erfolgreichen ersten 5 Patienten:

- [ ] Weitere 10-20 Patienten onboarden
- [ ] Prozess standardisieren (basierend auf Learnings)
- [ ] Wöchentliche Review-Meetings etablieren
- [ ] Feedback-Loop mit Entwicklerteam aufsetzen

**Status:** ⬜ Nicht begonnen | 🟡 In Arbeit | ✅ Abgeschlossen

---

## ✅ Phase 7: Monitoring & Wartung

### 7.1 Regelmäßige Checks

**Täglich:**
- [ ] Dashboard auf kritische Risiko-Levels prüfen
- [ ] Support-E-Mails beantworten

**Wöchentlich:**
- [ ] Nutzungsstatistiken prüfen (Anzahl Assessments)
- [ ] Vercel Logs auf Fehler prüfen
- [ ] Feedback sammeln und dokumentieren

**Monatlich:**
- [ ] Review-Meeting mit Team
- [ ] Technische Qualität prüfen (Performance, Uptime)
- [ ] Verbesserungen priorisieren

**Status:** ⬜ Nicht begonnen | 🟡 In Arbeit | ✅ Abgeschlossen

---

### 7.2 Datenqualität überwachen

**Regelmäßig prüfen:**

- [ ] Werden alle Fragen beantwortet?
- [ ] Sind Scores plausibel?
- [ ] Gibt es Duplicate-Einträge?
- [ ] Funktioniert AMY zuverlässig?

**SQL-Queries zur Überwachung:**

```sql
-- Anzahl Assessments pro Patient
SELECT 
  patient_id, 
  COUNT(*) as assessment_count
FROM assessments
GROUP BY patient_id
ORDER BY assessment_count DESC;

-- Durchschnittliche Scores
SELECT 
  AVG(stress_score) as avg_stress,
  AVG(sleep_score) as avg_sleep
FROM patient_measures;

-- Risiko-Verteilung
SELECT 
  risk_level,
  COUNT(*) as count
FROM reports
GROUP BY risk_level;
```

**Status:** ⬜ Nicht begonnen | 🟡 In Arbeit | ✅ Abgeschlossen

---

## 📊 Troubleshooting

### Häufige Probleme und Lösungen

#### Problem: Deployment fehlgeschlagen

**Symptome:** Build in Vercel schlägt fehl, roter Status

**Mögliche Ursachen:**
- Fehlende Umgebungsvariablen
- TypeScript-Fehler im Code
- Node.js Version inkompatibel

**Lösung:**
1. Vercel Build Logs ansehen
2. Fehler lesen und interpretieren
3. Umgebungsvariablen prüfen
4. Bei Code-Fehler: GitHub Issue erstellen

---

#### Problem: AMY generiert keine Berichte

**Symptome:** "Pending" Status, keine personalisierten Texte

**Mögliche Ursachen:**
- `ANTHROPIC_API_KEY` fehlt oder ungültig
- API-Guthaben aufgebraucht
- API-Timeout

**Lösung:**
1. Prüfen: Ist `ANTHROPIC_API_KEY` in Vercel gesetzt?
2. Anthropic Console: Guthaben prüfen
3. Vercel Logs: Nach API-Errors suchen
4. Notlösung: AMY deaktivieren (`NEXT_PUBLIC_FEATURE_AMY_ENABLED=false`)

---

#### Problem: Kliniker kann nicht auf Dashboard zugreifen

**Symptome:** Weiterleitung zu Homepage, "Access denied"

**Mögliche Ursachen:**
- Clinician-Rolle nicht gesetzt
- Falsche E-Mail verwendet

**Lösung:**
1. Supabase → SQL Editor öffnen
2. Rolle prüfen:
   ```sql
   SELECT email, raw_app_meta_data->>'role' as role
   FROM auth.users
   WHERE email = 'test-kliniker@pilotpraxis.de';
   ```
3. Falls nicht "clinician": Rolle setzen:
   ```sql
   SELECT set_user_role('test-kliniker@pilotpraxis.de', 'clinician');
   ```

---

#### Problem: Patient sieht fremde Daten

**Symptome:** Patient sieht Assessments anderer Patienten

**Mögliche Ursachen:**
- RLS (Row Level Security) nicht korrekt aktiviert
- Kritischer Sicherheitsfehler

**Lösung:**
1. SOFORT: Feature deaktivieren, Patienten informieren
2. Supabase: RLS Policies prüfen
3. Migration `20251207094000_enable_comprehensive_rls.sql` erneut ausführen
4. Tests aus Phase 4.4 wiederholen
5. Entwicklerteam kontaktieren

---

#### Problem: Performance ist sehr langsam

**Symptome:** Ladezeiten > 10 Sekunden

**Mögliche Ursachen:**
- Viele Datenbank-Abfragen
- AMY API sehr langsam
- Vercel Cold Start

**Lösung:**
1. Browser DevTools: Network Tab prüfen
2. Welcher Request ist langsam?
3. Vercel Logs: Langsame Functions identifizieren
4. Bei AMY: Längere Timeouts setzen oder deaktivieren
5. Bei Datenbank: Indizes prüfen

---

## 📥 PDF-Version erstellen

### Option 1: Browser-Druck (einfach)

1. Diese Datei in Browser öffnen (z.B. GitHub, VSCode Preview)
2. Drucken (Ctrl+P oder Cmd+P)
3. "Als PDF speichern" wählen
4. Speichern

### Option 2: Pandoc (professionell)

Falls Pandoc installiert ist:

```bash
pandoc Z2_PILOT_READINESS_CHECKLIST.md \
  -o Z2_PILOT_READINESS_CHECKLIST.pdf \
  --pdf-engine=xelatex \
  -V geometry:margin=2cm \
  -V lang=de
```

### Option 3: Online-Tools

- [Markdown to PDF](https://www.markdowntopdf.com/)
- [Dillinger](https://dillinger.io/) (Export → PDF)

---

## 📞 Support & Kontakt

**Bei Problemen während der Pilot-Vorbereitung:**

- **GitHub Issues:** [adaefler-art/rhythmologicum-connect](https://github.com/adaefler-art/rhythmologicum-connect/issues)
- **Dokumentation:** Siehe `docs/` Ordner im Repository
- **Entwicklerteam:** [Kontakt eintragen]

---

## 📚 Weiterführende Dokumentation

- **[E4_SMOKE_TEST.md](E4_SMOKE_TEST.md)** - Detaillierte Test-Prozeduren
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Technische Deployment-Anleitung
- **[Z1_EXECUTIVE_SUMMARY_V0.2.md](Z1_EXECUTIVE_SUMMARY_V0.2.md)** - Executive Summary für Management
- **[CLINICIAN_AUTH.md](CLINICIAN_AUTH.md)** - Kliniker-Authentifizierung einrichten
- **[FEATURE_FLAGS.md](FEATURE_FLAGS.md)** - Feature-Flags konfigurieren

---

## 📝 Versions-Historie

| Version | Datum | Änderungen |
|---------|-------|------------|
| 1.0 | 2024-12-07 | Initiale Version - Vollständige Pilot-Bereitschafts-Checkliste |

---

**Letzte Aktualisierung:** 2024-12-07  
**Erstellt für:** Rhythmologicum Connect v0.2  
**Zielgruppe:** Pilotpraxis, Remote-Piloten, nicht-technisches Personal

---

## ✅ Abschluss-Checkliste

**Alles erledigt? Finale Überprüfung:**

- [ ] Alle 7 Phasen abgeschlossen
- [ ] Alle E2E-Tests erfolgreich
- [ ] Patienten-Material vorbereitet
- [ ] Kliniker geschult
- [ ] Support eingerichtet
- [ ] Go-Live durchgeführt
- [ ] Erste Patienten onboarded

**🎉 Herzlichen Glückwunsch! Der Pilot ist bereit zu starten!**

---

*Ende der Checkliste*
