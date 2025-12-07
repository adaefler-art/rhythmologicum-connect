# E4 Smoke Test für End-to-End Pilot-Flow

## Übersicht

Dieses Dokument enthält eine vollständige Checkliste für manuelle Smoke-Tests aller kritischen Flows in Rhythmologicum Connect. Die Tests sind für die Pilotpraxis konzipiert und können selbstständig durchgeführt werden.

**Kernflüsse abgedeckt:**
1. Login & Registrierung
2. Fragebogen (Stress-Assessment)
3. Auswertung & Ergebnisse
4. Verlauf (Patient Historie)
5. Clinician Dashboard

## Voraussetzungen

### Software & Zugriff
- **Browser:** Chrome, Firefox, Safari oder Edge (aktuelle Version)
- **Internetverbindung:** Stabile Verbindung erforderlich
- **Test-Accounts:** Mindestens 2 Test-Accounts (1 Patient, 1 Kliniker)
- **Zugriff:** URL der deployed Application (z.B. `https://rhythmologicum-connect.vercel.app`)

### Vorbereitung

#### Test-Accounts erstellen

**1. Patient-Account:**
```
E-Mail: test-patient@pilotpraxis.de
Passwort: TestPatient123!
```

**2. Kliniker-Account:**
```
E-Mail: test-kliniker@pilotpraxis.de
Passwort: TestKliniker123!
```

**Wichtig:** Der Kliniker-Account muss die Clinician-Rolle zugewiesen bekommen. Kontaktieren Sie den Administrator oder setzen Sie die Rolle in Supabase:

```sql
SELECT set_user_role('test-kliniker@pilotpraxis.de', 'clinician');
```

#### Browser-Vorbereitung
1. Öffnen Sie einen Inkognito-/Privat-Modus Browser
2. Löschen Sie Cookies und Cache (optional, für saubere Tests)
3. Öffnen Sie die Browser Developer Tools (F12) um Fehler zu überwachen

---

## Test-Suite

### ✅ Flow 1: Patient-Registrierung & Login

#### Test 1.1: Neue Registrierung

**Ziel:** Verifizieren, dass neue Patienten sich erfolgreich registrieren können.

**Schritte:**
1. Öffnen Sie die Homepage
2. Klicken Sie auf "Noch kein Konto? Hier registrieren"
3. Geben Sie eine neue E-Mail ein (z.B. `neupatient@test.de`)
4. Geben Sie ein sicheres Passwort ein (mind. 6 Zeichen)
5. Klicken Sie "Registrieren"

**Erwartetes Ergebnis:**
- ✅ Registrierung erfolgreich
- ✅ Bestätigungs-E-Mail erhalten oder Hinweis angezeigt
- ✅ Keine Fehlermeldungen
- ✅ Keine Console-Errors (F12 Developer Tools prüfen)

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
_________________________________________________________________
```

---

#### Test 1.2: Patient-Login

**Ziel:** Verifizieren, dass bestehende Patienten sich anmelden können.

**Schritte:**
1. Gehen Sie zur Login-Seite
2. Geben Sie Patient-Credentials ein:
   - E-Mail: `test-patient@pilotpraxis.de`
   - Passwort: `TestPatient123!`
3. Klicken Sie "Anmelden"

**Erwartetes Ergebnis:**
- ✅ Login erfolgreich
- ✅ Automatische Weiterleitung zu `/patient/stress-check`
- ✅ Patient-Portal wird angezeigt
- ✅ Benutzer-E-Mail im Header sichtbar (falls implementiert)

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
_________________________________________________________________
```

---

#### Test 1.3: Logout

**Ziel:** Verifizieren, dass Benutzer sich korrekt abmelden können.

**Schritte:**
1. Klicken Sie auf "Abmelden" oder Logout-Button
2. Warten Sie auf Weiterleitung

**Erwartetes Ergebnis:**
- ✅ Weiterleitung zur Login-Seite
- ✅ Session beendet (kein automatischer Re-Login)
- ✅ Direkter Zugriff auf `/patient/*` ohne Login nicht möglich

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
_________________________________________________________________
```

---

### ✅ Flow 2: Fragebogen (Stress-Assessment)

#### Test 2.1: Assessment starten

**Ziel:** Verifizieren, dass Patienten den Fragebogen öffnen können.

**Schritte:**
1. Melden Sie sich als Patient an
2. Navigieren Sie zu `/patient/stress-check` (oder klicken Sie auf entsprechenden Button)

**Erwartetes Ergebnis:**
- ✅ Fragebogen wird angezeigt
- ✅ Alle Fragen sind lesbar
- ✅ Antwort-Optionen (Radio Buttons/Skala) sind interaktiv
- ✅ Keine technischen Fehler

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
_________________________________________________________________
```

---

#### Test 2.2: Fragebogen ausfüllen

**Ziel:** Verifizieren, dass alle Fragen beantwortet werden können.

**Schritte:**
1. Beantworten Sie alle Stress-Fragen (typischerweise 5 Fragen)
2. Beantworten Sie alle Schlaf-Fragen (typischerweise 3 Fragen)
3. Verwenden Sie verschiedene Antwortwerte (z.B. 1, 3, 5 auf einer Skala)

**Erwartetes Ergebnis:**
- ✅ Alle Fragen können beantwortet werden
- ✅ Antworten werden visuell markiert/bestätigt
- ✅ Keine Blockierungen oder Fehler
- ✅ "Absenden" oder "Assessment abschließen" Button wird aktiv

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
_________________________________________________________________
```

---

#### Test 2.3: Assessment absenden

**Ziel:** Verifizieren, dass das Assessment erfolgreich gespeichert wird.

**Schritte:**
1. Klicken Sie auf "Assessment abschließen" oder "Absenden"
2. Warten Sie auf Verarbeitung (kann 2-5 Sekunden dauern)

**Erwartetes Ergebnis:**
- ✅ Weiterleitung zur Ergebnis-Seite
- ✅ Keine Fehlermeldung
- ✅ Ladeindikator während Verarbeitung (optional)
- ✅ Assessment in Datenbank gespeichert

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
_________________________________________________________________
```

---

### ✅ Flow 3: Auswertung & Ergebnisse

#### Test 3.1: Ergebnisse anzeigen

**Ziel:** Verifizieren, dass die Assessment-Ergebnisse korrekt angezeigt werden.

**Schritte:**
1. Auf der Ergebnis-Seite verbleiben (`/patient/stress-check/result`)
2. Überprüfen Sie alle angezeigten Informationen

**Erwartetes Ergebnis:**
- ✅ **Stress-Score** wird angezeigt (z.B. "68/100" oder "3.4/5")
- ✅ **Schlaf-Score** wird angezeigt
- ✅ **Risiko-Level** wird angezeigt (niedrig/moderat/hoch oder ähnlich)
- ✅ Scores sind plausibel basierend auf Antworten
- ✅ Keine "undefined" oder "NaN" Werte

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
_________________________________________________________________
```

---

#### Test 3.2: AMY-Bericht (falls aktiviert)

**Ziel:** Verifizieren, dass die AMY AI-Auswertung angezeigt wird.

**Hinweis:** Dieser Test gilt nur, wenn `NEXT_PUBLIC_FEATURE_AMY_ENABLED=true` gesetzt ist.

**Schritte:**
1. Scrollen Sie auf der Ergebnis-Seite nach unten
2. Suchen Sie nach Abschnitt "Deine persönliche Einordnung von AMY" oder ähnlich

**Erwartetes Ergebnis:**
- ✅ AMY-Abschnitt ist sichtbar
- ✅ Personalisierter Text wird angezeigt (nicht nur Platzhalter)
- ✅ Text ist relevant zu Assessment (erwähnt Stress/Schlaf)
- ✅ Text ist gut lesbar und formatiert

**Wenn AMY deaktiviert:**
- ✅ Kein AMY-Abschnitt vorhanden (erwartetes Verhalten)
- ✅ Scores werden trotzdem korrekt angezeigt

**Status:** [ ] Bestanden [ ] Fehlgeschlagen [ ] N/A (AMY deaktiviert)

**Notizen:**
```
_________________________________________________________________
_________________________________________________________________
```

---

#### Test 3.3: Navigation nach Auswertung

**Ziel:** Verifizieren, dass Benutzer nach der Auswertung navigieren können.

**Schritte:**
1. Klicken Sie auf "Zurück zum Dashboard" oder ähnlichen Button
2. Alternativ: Klicken Sie auf "Verlauf" oder "Historie"

**Erwartetes Ergebnis:**
- ✅ Navigation funktioniert
- ✅ Keine 404 Fehler
- ✅ Benutzer kann zu anderen Bereichen wechseln

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
_________________________________________________________________
```

---

### ✅ Flow 4: Verlauf (Patient Historie)

#### Test 4.1: Historie öffnen

**Ziel:** Verifizieren, dass Patienten ihre Assessment-Historie sehen können.

**Schritte:**
1. Navigieren Sie zu `/patient/history`
2. Oder klicken Sie auf "Verlauf" / "Historie" Button im Patient-Portal

**Erwartetes Ergebnis:**
- ✅ Historie-Seite wird geladen
- ✅ Keine Fehler beim Laden
- ✅ Seite ist responsive (funktioniert auf Desktop und Mobil)

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
_________________________________________________________________
```

---

#### Test 4.2: Assessment-Einträge anzeigen

**Ziel:** Verifizieren, dass alle durchgeführten Assessments in der Historie sichtbar sind.

**Schritte:**
1. Überprüfen Sie die Liste der Assessments
2. Mindestens das gerade durchgeführte Assessment sollte sichtbar sein

**Erwartetes Ergebnis:**
- ✅ Alle Assessments werden chronologisch angezeigt
- ✅ Jeder Eintrag zeigt:
  - Datum/Zeitstempel
  - Stress-Score
  - Schlaf-Score
  - Risiko-Level
- ✅ Neueste Einträge oben (oder wie dokumentiert)
- ✅ Scores stimmen mit vorherigen Ergebnissen überein

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
_________________________________________________________________
```

---

#### Test 4.3: Leere Historie (Neuer Benutzer)

**Ziel:** Verifizieren, dass neue Benutzer eine angemessene leere Ansicht sehen.

**Schritte:**
1. Erstellen Sie einen neuen Patient-Account
2. Melden Sie sich an
3. Öffnen Sie die Historie ohne ein Assessment durchgeführt zu haben

**Erwartetes Ergebnis:**
- ✅ Keine Fehlermeldung
- ✅ Freundliche Nachricht wie "Noch keine Assessments vorhanden"
- ✅ Hinweis, wie man ein Assessment startet
- ✅ Keine "undefined" oder Fehler im UI

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
_________________________________________________________________
```

---

#### Test 4.4: Export-Funktion (falls implementiert)

**Ziel:** Verifizieren, dass Patienten ihre Daten exportieren können.

**Schritte:**
1. Suchen Sie nach "Exportieren" oder "Als JSON exportieren" Button
2. Klicken Sie auf den Export-Button

**Erwartetes Ergebnis:**
- ✅ JSON-Datei wird heruntergeladen
- ✅ Datei enthält Assessment-Daten
- ✅ Struktur ist valides JSON
- ✅ Alle relevanten Felder vorhanden (stress_score, sleep_score, etc.)

**Wenn nicht implementiert:**
- ✅ Kein Export-Button vorhanden (erwartetes Verhalten)

**Status:** [ ] Bestanden [ ] Fehlgeschlagen [ ] N/A (nicht implementiert)

**Notizen:**
```
_________________________________________________________________
_________________________________________________________________
```

---

### ✅ Flow 5: Clinician Dashboard

#### Test 5.1: Kliniker-Login

**Ziel:** Verifizieren, dass Kliniker sich anmelden und zum Dashboard gelangen.

**Voraussetzung:** Kliniker-Account muss die "clinician" Rolle haben.

**Schritte:**
1. Melden Sie sich ab (falls angemeldet)
2. Melden Sie sich mit Kliniker-Credentials an:
   - E-Mail: `test-kliniker@pilotpraxis.de`
   - Passwort: `TestKliniker123!`
3. Klicken Sie "Anmelden"

**Erwartetes Ergebnis:**
- ✅ Login erfolgreich
- ✅ Automatische Weiterleitung zu `/clinician`
- ✅ Kliniker-Dashboard wird angezeigt
- ✅ Keine Weiterleitung zu Patient-Portal

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
_________________________________________________________________
```

---

#### Test 5.2: Patienten-Übersicht

**Ziel:** Verifizieren, dass Kliniker alle Patienten sehen können.

**Schritte:**
1. Auf `/clinician` Dashboard verbleiben
2. Überprüfen Sie die Patienten-Liste/Tabelle

**Erwartetes Ergebnis:**
- ✅ Tabelle mit Patienten wird angezeigt
- ✅ Mindestens die Test-Patienten sind sichtbar
- ✅ Spalten enthalten relevante Informationen:
  - Name
  - Letztes Assessment Datum
  - Stress-Level
  - Anzahl Assessments (optional)
- ✅ Daten sind aktuell

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
_________________________________________________________________
```

---

#### Test 5.3: Patienten-Details öffnen

**Ziel:** Verifizieren, dass Kliniker detaillierte Patienteninformationen sehen können.

**Schritte:**
1. Klicken Sie auf einen Patienten in der Liste
2. Navigieren Sie zu `/clinician/patient/[id]`

**Erwartetes Ergebnis:**
- ✅ Patienten-Detail-Seite wird geladen
- ✅ Patienten-Profil wird angezeigt (Name, Geburtsjahr, etc.)
- ✅ Assessment-Historie ist sichtbar
- ✅ Keine Fehler beim Laden

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
_________________________________________________________________
```

---

#### Test 5.4: Diagramme (Charts)

**Ziel:** Verifizieren, dass Stress- und Schlaf-Verlaufsdiagramme korrekt angezeigt werden.

**Hinweis:** Dieser Test gilt nur, wenn `NEXT_PUBLIC_FEATURE_CHARTS_ENABLED=true` gesetzt ist.

**Schritte:**
1. Auf der Patienten-Detail-Seite nach unten scrollen
2. Suchen Sie nach "Stress-Verlauf" und "Schlaf-Verlauf" Diagrammen

**Erwartetes Ergebnis:**
- ✅ **Stress-Verlauf** Diagramm wird angezeigt
- ✅ **Schlaf-Verlauf** Diagramm wird angezeigt
- ✅ Diagramme zeigen Datenpunkte basierend auf Assessments
- ✅ Achsenbeschriftungen sind lesbar
- ✅ Keine leeren oder fehlerhaften Diagramme

**Wenn Charts deaktiviert:**
- ✅ Keine Diagramm-Sektionen sichtbar (erwartetes Verhalten)
- ✅ Andere Patientendaten bleiben zugänglich

**Status:** [ ] Bestanden [ ] Fehlgeschlagen [ ] N/A (Charts deaktiviert)

**Notizen:**
```
_________________________________________________________________
_________________________________________________________________
```

---

#### Test 5.5: AMY-Berichte in Clinician View

**Ziel:** Verifizieren, dass Kliniker AMY-Berichte für Patienten sehen können.

**Schritte:**
1. Auf der Patienten-Detail-Seite nach AMY-Berichten suchen
2. Überprüfen Sie die Timeline oder Liste der Berichte

**Erwartetes Ergebnis:**
- ✅ AMY-Berichte werden chronologisch angezeigt
- ✅ Jeder Bericht zeigt:
  - Datum/Zeitstempel
  - Risiko-Level (mit Farb-Codierung)
  - Stress/Schlaf Scores
  - Vollständiger AMY-Text
- ✅ Berichte sind lesbar und korrekt formatiert

**Wenn AMY deaktiviert:**
- ✅ Keine AMY-Berichte angezeigt (erwartetes Verhalten)
- ✅ Scores und andere Daten weiterhin sichtbar

**Status:** [ ] Bestanden [ ] Fehlgeschlagen [ ] N/A (AMY deaktiviert)

**Notizen:**
```
_________________________________________________________________
_________________________________________________________________
```

---

#### Test 5.6: Rohdaten-Ansicht (JSON)

**Ziel:** Verifizieren, dass Kliniker Zugriff auf Rohdaten haben.

**Schritte:**
1. Suchen Sie nach "Rohdaten anzeigen" oder "JSON anzeigen" Toggle/Button
2. Klicken Sie den Button

**Erwartetes Ergebnis:**
- ✅ JSON-Daten werden angezeigt
- ✅ Daten enthalten Patienten-Profil und alle Measures
- ✅ Format ist lesbar (formatiert mit Einrückung)
- ✅ Toggle funktioniert (Anzeigen/Verbergen)

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
_________________________________________________________________
```

---

#### Test 5.7: Zugriffskontrolle - Patient kann nicht auf Clinician Dashboard zugreifen

**Ziel:** Verifizieren, dass Patienten KEINEN Zugriff auf das Clinician Dashboard haben.

**Schritte:**
1. Melden Sie sich als Patient an (`test-patient@pilotpraxis.de`)
2. Versuchen Sie manuell zu `/clinician` zu navigieren

**Erwartetes Ergebnis:**
- ✅ Zugriff wird verweigert
- ✅ Weiterleitung zu Homepage mit Fehler `?error=access_denied`
- ✅ Klare Fehlermeldung wird angezeigt
- ✅ Kein Zugriff auf Kliniker-Funktionen

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
_________________________________________________________________
```

---

#### Test 5.8: Zugriffskontrolle - Unauthentifiziert

**Ziel:** Verifizieren, dass nicht angemeldete Benutzer keinen Zugriff haben.

**Schritte:**
1. Melden Sie sich ab (komplett ausloggen)
2. Versuchen Sie zu `/clinician` oder `/patient` zu navigieren

**Erwartetes Ergebnis:**
- ✅ Zugriff wird verweigert
- ✅ Weiterleitung zur Login-Seite
- ✅ Nach Login: Weiterleitung zum ursprünglichen Ziel (optional)

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
_________________________________________________________________
```

---

## Performance & Cross-Browser Tests

### Test P1: Performance

**Ziel:** Verifizieren, dass die Anwendung performant ist.

**Schritte:**
1. Öffnen Sie Chrome DevTools → Network Tab
2. Navigieren Sie durch verschiedene Seiten
3. Beachten Sie Ladezeiten

**Erwartetes Ergebnis:**
- ✅ Homepage lädt in < 3 Sekunden
- ✅ Fragebogen lädt in < 2 Sekunden
- ✅ Ergebnisse erscheinen in < 5 Sekunden nach Absenden
- ✅ Clinician Dashboard lädt in < 3 Sekunden
- ✅ Keine extrem langsamen Requests (> 10 Sekunden)

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
_________________________________________________________________
```

---

### Test P2: Mobile Responsiveness

**Ziel:** Verifizieren, dass die Anwendung auf mobilen Geräten funktioniert.

**Schritte:**
1. Öffnen Sie die Anwendung auf einem Smartphone ODER
2. Verwenden Sie Chrome DevTools → Toggle Device Toolbar (Ctrl+Shift+M)
3. Testen Sie mit verschiedenen Bildschirmgrößen (iPhone, iPad, Android)

**Erwartetes Ergebnis:**
- ✅ Alle Seiten sind lesbar auf mobilen Geräten
- ✅ Buttons sind klickbar (nicht zu klein)
- ✅ Formulare sind bedienbar
- ✅ Kein horizontales Scrollen erforderlich
- ✅ Navigation funktioniert auf Touch-Geräten

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
_________________________________________________________________
```

---

### Test P3: Browser-Kompatibilität

**Ziel:** Verifizieren, dass die Anwendung in verschiedenen Browsern funktioniert.

**Schritte:**
1. Testen Sie mindestens 2 der folgenden Browser:
   - Chrome
   - Firefox
   - Safari (Mac/iOS)
   - Edge
2. Führen Sie Login und Assessment durch

**Erwartetes Ergebnis:**
- ✅ Anwendung funktioniert in allen getesteten Browsern
- ✅ Keine kritischen Layout-Probleme
- ✅ Alle Funktionen sind verfügbar

**Getestete Browser:**
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
_________________________________________________________________
```

---

## Fehlerbehandlung

### Test E1: Ungültige Login-Daten

**Schritte:**
1. Versuchen Sie Login mit falschen Credentials
2. Lassen Sie Felder leer

**Erwartetes Ergebnis:**
- ✅ Klare Fehlermeldung wird angezeigt
- ✅ Keine technischen Fehler in Console
- ✅ Benutzer kann es erneut versuchen

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

---

### Test E2: Unvollständiger Fragebogen

**Schritte:**
1. Versuchen Sie Assessment abzusenden ohne alle Fragen zu beantworten

**Erwartetes Ergebnis:**
- ✅ Absenden wird verhindert ODER
- ✅ Klare Validierungsmeldung erscheint
- ✅ Benutzer kann fehlende Antworten ergänzen

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

---

### Test E3: Netzwerkfehler (optional)

**Schritte:**
1. Schalten Sie WLAN/Internet kurz aus
2. Versuchen Sie Aktionen in der Anwendung

**Erwartetes Ergebnis:**
- ✅ Angemessene Fehlermeldung (z.B. "Netzwerkfehler")
- ✅ Keine kryptischen technischen Fehler
- ✅ Nach Wiederherstellung funktioniert alles wieder

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

---

## Zusammenfassung & Checkliste

### Quick Checklist für schnellen Durchlauf

Minimal erforderliche Tests für einen schnellen Smoke-Test:

- [ ] **Login:** Patient und Kliniker können sich anmelden
- [ ] **Fragebogen:** Assessment kann durchgeführt werden
- [ ] **Ergebnisse:** Scores werden korrekt angezeigt
- [ ] **Verlauf:** Assessment erscheint in Patient-Historie
- [ ] **Clinician Dashboard:** Kliniker sieht Patienten-Liste
- [ ] **Patienten-Details:** Kliniker kann Patient-Details öffnen
- [ ] **Zugriffskontrolle:** Patient kann nicht auf Clinician-Bereich zugreifen

### Vollständige Checkliste

Alle Tests in diesem Dokument:

**Flow 1: Login & Registrierung**
- [ ] Test 1.1: Neue Registrierung
- [ ] Test 1.2: Patient-Login
- [ ] Test 1.3: Logout

**Flow 2: Fragebogen**
- [ ] Test 2.1: Assessment starten
- [ ] Test 2.2: Fragebogen ausfüllen
- [ ] Test 2.3: Assessment absenden

**Flow 3: Auswertung**
- [ ] Test 3.1: Ergebnisse anzeigen
- [ ] Test 3.2: AMY-Bericht
- [ ] Test 3.3: Navigation nach Auswertung

**Flow 4: Verlauf**
- [ ] Test 4.1: Historie öffnen
- [ ] Test 4.2: Assessment-Einträge anzeigen
- [ ] Test 4.3: Leere Historie
- [ ] Test 4.4: Export-Funktion

**Flow 5: Clinician Dashboard**
- [ ] Test 5.1: Kliniker-Login
- [ ] Test 5.2: Patienten-Übersicht
- [ ] Test 5.3: Patienten-Details öffnen
- [ ] Test 5.4: Diagramme
- [ ] Test 5.5: AMY-Berichte
- [ ] Test 5.6: Rohdaten-Ansicht
- [ ] Test 5.7: Zugriffskontrolle - Patient
- [ ] Test 5.8: Zugriffskontrolle - Unauthentifiziert

**Performance & Cross-Browser**
- [ ] Test P1: Performance
- [ ] Test P2: Mobile Responsiveness
- [ ] Test P3: Browser-Kompatibilität

**Fehlerbehandlung**
- [ ] Test E1: Ungültige Login-Daten
- [ ] Test E2: Unvollständiger Fragebogen
- [ ] Test E3: Netzwerkfehler

---

## Bekannte Einschränkungen

**Feature Flags:**
- Einige Tests (AMY, Charts) sind nur relevant, wenn entsprechende Feature Flags aktiviert sind
- Prüfen Sie die `.env` Konfiguration für aktuelle Feature-Flag Status

**Rollen-Setup:**
- Clinician-Rolle muss manuell in Supabase gesetzt werden
- Siehe `docs/CLINICIAN_AUTH.md` für Details

**Performance:**
- Erste Ladezeiten können länger sein (Cold Start)
- AMY-Generierung kann 5-10 Sekunden dauern bei hoher API-Last

---

## Fehler melden

Wenn Sie während der Tests Probleme feststellen:

1. **Dokumentieren Sie den Fehler:**
   - Was haben Sie getan? (Schritte)
   - Was war das erwartete Ergebnis?
   - Was ist tatsächlich passiert?
   - Screenshot (wenn möglich)
   - Browser und Gerät

2. **Prüfen Sie Browser Console:**
   - Öffnen Sie Developer Tools (F12)
   - Kopieren Sie Fehlermeldungen aus der Console

3. **Melden Sie über:**
   - GitHub Issues: `adaefler-art/rhythmologicum-connect`
   - Oder kontaktieren Sie das Entwicklungsteam direkt

---

## Weiterführende Dokumentation

- **Deployment Guide:** `docs/DEPLOYMENT_GUIDE.md`
- **Clinician Auth Setup:** `docs/CLINICIAN_AUTH.md`
- **Feature Flags:** `docs/FEATURE_FLAGS.md`
- **RLS Testing:** `docs/RLS_TESTING_GUIDE.md`
- **B2 Testing:** `docs/B2_TESTING_GUIDE.md`

---

## Versions-Historie

| Version | Datum | Änderungen |
|---------|-------|------------|
| 1.0 | 2024-12-07 | Initiale Version - Vollständige E4 Smoke Test Suite |

---

**Letzte Aktualisierung:** 2024-12-07  
**Erstellt für:** Rhythmologicum Connect v0.2+  
**Autor:** Development Team
