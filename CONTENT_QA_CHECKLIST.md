# Content QA Checklist – v0.3

**Rhythmologicum Connect**  
**Für: Internes QS-Team vor Release v0.3**  
**Stand: Dezember 2024**

---

## 📋 Übersicht

Diese Checkliste deckt alle kritischen Quality-Assurance-Tests für das Content-Management-System von Rhythmologicum Connect ab. Die Tests fokussieren sich auf Admin-Zugriff, CRUD-Operationen, Sections, Content-Rendering und Funnel-Integration.

**Zeitaufwand:** Ca. 2-3 Stunden für vollständige QA

**Voraussetzungen:**
- Deployed Application (Production oder Staging)
- Admin-Account mit entsprechenden Berechtigungen
- Patient-Account für Frontend-Tests
- Browser Developer Tools (F12)

---

## ✅ 1. Admin-Zugriff & Berechtigungen

### Test 1.1: Admin-Login

**Ziel:** Verifizieren, dass Admin-Benutzer sich anmelden können.

**Schritte:**
1. Navigiere zur Login-Seite
2. Melde dich mit Admin-Credentials an
3. Navigiere zu `/admin/content`

**Erwartetes Ergebnis:**
- ✅ Login erfolgreich
- ✅ Weiterleitung zu Admin-Bereich funktioniert
- ✅ Content-Übersichtsseite wird angezeigt
- ✅ Keine Authentifizierungsfehler

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

### Test 1.2: Zugriffskontrolle – Patient darf nicht auf Admin-Bereich zugreifen

**Ziel:** Verifizieren, dass normale Patienten keinen Admin-Zugriff haben.

**Schritte:**
1. Melde dich als Patient an
2. Versuche direkt zu `/admin/content` zu navigieren

**Erwartetes Ergebnis:**
- ✅ Zugriff wird verweigert
- ✅ Redirect zu Homepage oder Fehlermeldung
- ✅ Kein Zugriff auf Admin-Funktionen
- ✅ Sicherheitslog-Eintrag (optional zu prüfen)

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

### Test 1.3: Zugriffskontrolle – Unauthentifizierter Zugriff

**Ziel:** Verifizieren, dass nicht angemeldete Benutzer keinen Admin-Zugriff haben.

**Schritte:**
1. Melde dich komplett ab
2. Versuche direkt zu `/admin/content` zu navigieren

**Erwartetes Ergebnis:**
- ✅ Redirect zur Login-Seite
- ✅ Kein Zugriff auf Admin-Funktionen
- ✅ Nach Login: Redirect zurück zu ursprünglichem Ziel (optional)

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

### Test 1.4: Kliniker-Zugriff

**Ziel:** Verifizieren, dass Kliniker Zugriff auf Content-Verwaltung haben.

**Schritte:**
1. Melde dich als Kliniker an
2. Navigiere zu `/admin/content` oder `/clinician/content` (je nach Implementation)

**Erwartetes Ergebnis:**
- ✅ Kliniker kann Content-Übersicht sehen
- ✅ Bearbeitungsfunktionen sind verfügbar
- ✅ Keine Zugriffsfehler

**Status:** [ ] Bestanden [ ] Fehlgeschlagen [ ] N/A (Feature nicht für Kliniker)

**Notizen:**
```
_________________________________________________________________
```

---

## ✅ 2. CRUD-Operationen (Create, Read, Update, Delete)

### Test 2.1: Content-Page erstellen (CREATE)

**Ziel:** Verifizieren, dass neue Content-Pages erstellt werden können.

**Schritte:**
1. Navigiere zu `/admin/content`
2. Klicke auf "Neue Seite anlegen" oder ähnlichen Button
3. Fülle alle erforderlichen Felder aus:
   - Titel: "QA Test Page"
   - Slug: "qa-test-page"
   - Kategorie: "info"
   - Inhalt: Einfacher Markdown-Text (z.B. "# Test\n\nDies ist ein Test.")
4. Klicke auf "Als Entwurf speichern"

**Erwartetes Ergebnis:**
- ✅ Seite wird erfolgreich erstellt
- ✅ Erfolgsmeldung erscheint
- ✅ Redirect zur Content-Übersicht oder zur Edit-Seite
- ✅ Neue Seite erscheint in der Übersichtsliste
- ✅ Status ist "draft"

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

### Test 2.2: Content-Page lesen (READ)

**Ziel:** Verifizieren, dass Content-Pages angezeigt werden können.

**Schritte:**
1. Navigiere zu `/admin/content`
2. Klicke auf eine bestehende Content-Page (z.B. die gerade erstellte "QA Test Page")

**Erwartetes Ergebnis:**
- ✅ Detail-/Edit-Ansicht öffnet sich
- ✅ Alle Felder werden korrekt angezeigt (Titel, Slug, Inhalt, etc.)
- ✅ Markdown wird im Editor angezeigt
- ✅ Metadaten sind korrekt (Kategorie, Status, Priorität, etc.)
- ✅ Keine Fehler beim Laden

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

### Test 2.3: Content-Page aktualisieren (UPDATE)

**Ziel:** Verifizieren, dass Content-Pages bearbeitet werden können.

**Schritte:**
1. Öffne die "QA Test Page" zur Bearbeitung
2. Ändere den Titel zu "QA Test Page – Updated"
3. Ändere den Markdown-Inhalt (z.B. füge einen Absatz hinzu)
4. Ändere die Kategorie zu "result"
5. Klicke auf "Veröffentlichen"

**Erwartetes Ergebnis:**
- ✅ Änderungen werden gespeichert
- ✅ Erfolgsmeldung erscheint
- ✅ Status ändert sich zu "published"
- ✅ Alle geänderten Felder werden korrekt aktualisiert
- ✅ `updated_at` Timestamp wird aktualisiert
- ✅ Keine Datenverluste bei anderen Feldern

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

### Test 2.4: Content-Page löschen (DELETE)

**Ziel:** Verifizieren, dass Content-Pages gelöscht werden können.

**Hinweis:** Falls DELETE nicht implementiert ist, überspringe diesen Test.

**Schritte:**
1. Navigiere zu `/admin/content`
2. Suche die "QA Test Page – Updated"
3. Klicke auf "Löschen" oder Äquivalent
4. Bestätige die Lösch-Aktion

**Erwartetes Ergebnis:**
- ✅ Bestätigungs-Dialog erscheint
- ✅ Nach Bestätigung: Seite wird gelöscht
- ✅ Erfolgsmeldung erscheint
- ✅ Seite verschwindet aus der Übersichtsliste
- ✅ Datenbankdaten werden entfernt

**Wenn DELETE nicht implementiert:**
- ✅ Kein Löschen-Button vorhanden (erwartetes Verhalten)
- ✅ Alternative: Status auf "archived" oder "deleted" setzen

**Status:** [ ] Bestanden [ ] Fehlgeschlagen [ ] N/A (nicht implementiert)

**Notizen:**
```
_________________________________________________________________
```

---

### Test 2.5: Slug-Validierung

**Ziel:** Verifizieren, dass Slugs korrekt validiert werden.

**Schritte:**
1. Versuche eine neue Content-Page zu erstellen
2. Gib einen ungültigen Slug ein (z.B. "Test Page!" mit Leerzeichen und Sonderzeichen)
3. Versuche zu speichern

**Erwartetes Ergebnis:**
- ✅ Validierungsfehler wird angezeigt
- ✅ Fehlertext ist klar (z.B. "Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten")
- ✅ Speichern wird verhindert
- ✅ Felder bleiben ausgefüllt (keine Datenverluste)

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

### Test 2.6: Duplikat-Slug-Prüfung

**Ziel:** Verifizieren, dass Slugs eindeutig sein müssen.

**Schritte:**
1. Erstelle eine Content-Page mit Slug "duplicate-test"
2. Versuche eine zweite Content-Page mit dem gleichen Slug "duplicate-test" zu erstellen

**Erwartetes Ergebnis:**
- ✅ Fehler wird angezeigt (z.B. "Slug bereits vergeben" oder HTTP 409 Conflict)
- ✅ Zweite Seite kann nicht gespeichert werden
- ✅ Erste Seite bleibt unverändert

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

### Test 2.7: Erforderliche Felder

**Ziel:** Verifizieren, dass erforderliche Felder validiert werden.

**Schritte:**
1. Versuche eine neue Content-Page zu erstellen
2. Lasse erforderliche Felder leer (z.B. Titel, Slug, Inhalt)
3. Versuche zu speichern

**Erwartetes Ergebnis:**
- ✅ Validierungsfehler für jedes leere erforderliche Feld
- ✅ Speichern wird verhindert
- ✅ Klare Fehlermeldungen
- ✅ Fokus springt zum ersten fehlerhaften Feld (optional)

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

## ✅ 3. Sections (Content Page Sections)

**Hinweis:** Dieser Abschnitt testet Content-Page-Sections, falls implementiert. Überspringe die Tests, falls Sections nicht Teil von v0.3 sind.

### Test 3.1: Sections erstellen

**Ziel:** Verifizieren, dass Sections einer Content-Page hinzugefügt werden können.

**Schritte:**
1. Öffne eine Content-Page zur Bearbeitung
2. Suche nach "Section hinzufügen" oder ähnlichem UI-Element
3. Erstelle eine neue Section mit:
   - Titel: "Test Section"
   - Inhalt: "## Test\n\nDies ist eine Test-Section."
   - Order-Index: 1

**Erwartetes Ergebnis:**
- ✅ Section wird erstellt
- ✅ Section erscheint in der Section-Liste
- ✅ Order-Index wird respektiert
- ✅ Keine Fehler

**Status:** [ ] Bestanden [ ] Fehlgeschlagen [ ] N/A (nicht implementiert)

**Notizen:**
```
_________________________________________________________________
```

---

### Test 3.2: Sections anzeigen

**Ziel:** Verifizieren, dass Sections in korrekter Reihenfolge angezeigt werden.

**Schritte:**
1. Erstelle mehrere Sections mit verschiedenen Order-Indizes (z.B. 1, 2, 3)
2. Öffne die Content-Page im Frontend (`/patient/funnel/{slug}/content/{pageSlug}`)

**Erwartetes Ergebnis:**
- ✅ Alle Sections werden angezeigt
- ✅ Sections erscheinen in korrekter Reihenfolge (sortiert nach Order-Index)
- ✅ Jede Section hat ihre eigene Überschrift (falls implementiert)
- ✅ Markdown wird korrekt gerendert

**Status:** [ ] Bestanden [ ] Fehlgeschlagen [ ] N/A (nicht implementiert)

**Notizen:**
```
_________________________________________________________________
```

---

### Test 3.3: Sections bearbeiten

**Ziel:** Verifizieren, dass Sections bearbeitet werden können.

**Schritte:**
1. Öffne eine Content-Page mit Sections zur Bearbeitung
2. Ändere den Titel einer Section
3. Ändere den Order-Index (z.B. von 2 zu 1)
4. Speichere die Änderungen

**Erwartetes Ergebnis:**
- ✅ Änderungen werden gespeichert
- ✅ Section-Titel wird aktualisiert
- ✅ Reihenfolge wird korrekt angepasst
- ✅ Keine Datenverluste

**Status:** [ ] Bestanden [ ] Fehlgeschlagen [ ] N/A (nicht implementiert)

**Notizen:**
```
_________________________________________________________________
```

---

### Test 3.4: Sections löschen

**Ziel:** Verifizieren, dass Sections gelöscht werden können.

**Schritte:**
1. Öffne eine Content-Page mit Sections zur Bearbeitung
2. Lösche eine Section
3. Speichere die Content-Page

**Erwartetes Ergebnis:**
- ✅ Section wird gelöscht
- ✅ Section verschwindet aus der Liste
- ✅ Section wird nicht mehr im Frontend angezeigt
- ✅ Andere Sections bleiben unberührt

**Status:** [ ] Bestanden [ ] Fehlgeschlagen [ ] N/A (nicht implementiert)

**Notizen:**
```
_________________________________________________________________
```

---

### Test 3.5: Leere Sections

**Ziel:** Verifizieren, dass Content-Pages ohne Sections korrekt angezeigt werden.

**Schritte:**
1. Erstelle eine Content-Page ohne Sections
2. Öffne die Seite im Frontend

**Erwartetes Ergebnis:**
- ✅ Seite wird ohne Fehler angezeigt
- ✅ Nur der Haupt-Markdown-Inhalt wird gerendert
- ✅ Keine "undefined" oder leeren Section-Container

**Status:** [ ] Bestanden [ ] Fehlgeschlagen [ ] N/A (nicht implementiert)

**Notizen:**
```
_________________________________________________________________
```

---

## ✅ 4. Content Rendering (Frontend)

### Test 4.1: Markdown-Rendering – Überschriften

**Ziel:** Verifizieren, dass Markdown-Überschriften korrekt gerendert werden.

**Schritte:**
1. Erstelle eine Content-Page mit folgendem Inhalt:
   ```markdown
   # Überschrift 1
   ## Überschrift 2
   ### Überschrift 3
   #### Überschrift 4
   ```
2. Öffne die Seite im Frontend

**Erwartetes Ergebnis:**
- ✅ H1 wird als `<h1>` gerendert (größte Schrift, fett)
- ✅ H2 wird als `<h2>` gerendert (mittelgroß, fett)
- ✅ H3 wird als `<h3>` gerendert (kleiner, fett)
- ✅ H4 wird als `<h4>` gerendert (noch kleiner, fett)
- ✅ Hierarchie ist visuell erkennbar
- ✅ Spacing zwischen Überschriften ist angemessen

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

### Test 4.2: Markdown-Rendering – Listen

**Ziel:** Verifizieren, dass Listen korrekt gerendert werden.

**Schritte:**
1. Erstelle eine Content-Page mit folgendem Inhalt:
   ```markdown
   **Ungeordnete Liste:**
   - Punkt 1
   - Punkt 2
   - Punkt 3

   **Geordnete Liste:**
   1. Erster Punkt
   2. Zweiter Punkt
   3. Dritter Punkt
   ```
2. Öffne die Seite im Frontend

**Erwartetes Ergebnis:**
- ✅ Ungeordnete Liste wird mit Bullet-Points angezeigt
- ✅ Geordnete Liste wird mit Nummern angezeigt
- ✅ Einrückung ist korrekt
- ✅ Spacing zwischen Listeneinträgen ist lesbar

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

### Test 4.3: Markdown-Rendering – Textformatierung

**Ziel:** Verifizieren, dass Textformatierung korrekt gerendert wird.

**Schritte:**
1. Erstelle eine Content-Page mit folgendem Inhalt:
   ```markdown
   **Fetter Text**
   *Kursiver Text*
   ***Fett und kursiv***
   `Inline-Code`
   ```
2. Öffne die Seite im Frontend

**Erwartetes Ergebnis:**
- ✅ Fetter Text wird fett angezeigt
- ✅ Kursiver Text wird kursiv angezeigt
- ✅ Fett und kursiv kombiniert funktioniert
- ✅ Inline-Code hat Monospace-Font und grauen Hintergrund

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

### Test 4.4: Markdown-Rendering – Links

**Ziel:** Verifizieren, dass Links korrekt gerendert werden.

**Schritte:**
1. Erstelle eine Content-Page mit folgendem Inhalt:
   ```markdown
   [Interner Link](/patient/history)
   [Externer Link](https://www.example.com)
   ```
2. Öffne die Seite im Frontend
3. Klicke auf beide Links

**Erwartetes Ergebnis:**
- ✅ Links werden blau und unterstrichen angezeigt
- ✅ Interner Link navigiert zur richtigen Seite
- ✅ Externer Link öffnet sich in neuem Tab (optional)
- ✅ Hover-Effekt ist sichtbar

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

### Test 4.5: Markdown-Rendering – Code-Blöcke

**Ziel:** Verifizieren, dass Code-Blöcke korrekt gerendert werden.

**Schritte:**
1. Erstelle eine Content-Page mit folgendem Inhalt:
   ```markdown
   ```javascript
   function test() {
     console.log("Hello World");
   }
   ```
   ```
2. Öffne die Seite im Frontend

**Erwartetes Ergebnis:**
- ✅ Code-Block wird als Block mit Monospace-Font angezeigt
- ✅ Syntax-Highlighting funktioniert (falls implementiert)
- ✅ Hintergrund ist deutlich vom Fließtext unterscheidbar
- ✅ Scrollbar erscheint bei langem Code (horizontal)

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

### Test 4.6: Markdown-Rendering – Blockquotes

**Ziel:** Verifizieren, dass Blockquotes korrekt gerendert werden.

**Schritte:**
1. Erstelle eine Content-Page mit folgendem Inhalt:
   ```markdown
   > Dies ist ein Zitat.
   > Es kann mehrzeilig sein.
   ```
2. Öffne die Seite im Frontend

**Erwartetes Ergebnis:**
- ✅ Blockquote hat linke Border (oft blau oder grau)
- ✅ Hintergrund ist leicht abgesetzt (optional)
- ✅ Text ist eingerückt
- ✅ Mehrzeilige Blockquotes funktionieren

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

### Test 4.7: Rendering – Layout-Varianten

**Ziel:** Verifizieren, dass verschiedene Layout-Varianten korrekt angewendet werden.

**Hinweis:** Nur testen, falls mehrere Layouts implementiert sind (z.B. default, wide, hero).

**Schritte:**
1. Erstelle Content-Pages mit verschiedenen Layouts:
   - default
   - wide
   - hero (falls implementiert)
2. Öffne jede Seite im Frontend

**Erwartetes Ergebnis:**
- ✅ Default-Layout hat normale Breite (z.B. max-width: 768px)
- ✅ Wide-Layout ist breiter (z.B. max-width: 1200px)
- ✅ Hero-Layout hat Hero-Header (falls implementiert)
- ✅ Layouts sind responsive auf mobilen Geräten

**Status:** [ ] Bestanden [ ] Fehlgeschlagen [ ] N/A (nur ein Layout)

**Notizen:**
```
_________________________________________________________________
```

---

### Test 4.8: Rendering – Mobile Responsiveness

**Ziel:** Verifizieren, dass Content-Pages auf mobilen Geräten korrekt angezeigt werden.

**Schritte:**
1. Öffne eine Content-Page im Browser
2. Aktiviere Browser DevTools Device Toolbar (Ctrl+Shift+M)
3. Teste mit verschiedenen Bildschirmgrößen (iPhone, iPad, Android)

**Erwartetes Ergebnis:**
- ✅ Text ist lesbar (nicht zu klein)
- ✅ Kein horizontales Scrollen nötig
- ✅ Bilder passen in den Viewport
- ✅ Navigation funktioniert auf Touch-Geräten
- ✅ Buttons sind groß genug zum Tippen

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

### Test 4.9: Rendering – Status-Filter (draft vs. published)

**Ziel:** Verifizieren, dass nur published Content-Pages im Frontend sichtbar sind.

**Schritte:**
1. Erstelle eine Content-Page mit Status "draft"
2. Versuche die Seite im Frontend zu öffnen (z.B. `/patient/funnel/{slug}/content/{pageSlug}`)
3. Erstelle eine zweite Content-Page mit Status "published"
4. Öffne die published Seite im Frontend

**Erwartetes Ergebnis:**
- ✅ Draft-Seite ist NICHT erreichbar (404 oder Zugriff verweigert)
- ✅ Published-Seite wird korrekt angezeigt
- ✅ Keine Fehlermeldungen in Console

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

## ✅ 5. Funnel-Integration

### Test 5.1: Content-Page einem Funnel zuordnen

**Ziel:** Verifizieren, dass Content-Pages mit Funnels verknüpft werden können.

**Schritte:**
1. Erstelle oder öffne eine Content-Page zur Bearbeitung
2. Wähle einen Funnel aus dem Dropdown (z.B. "stress-assessment")
3. Speichere die Seite

**Erwartetes Ergebnis:**
- ✅ Funnel-Zuordnung wird gespeichert
- ✅ Content-Page erscheint in der Liste für diesen Funnel
- ✅ API-Abfrage `/api/funnels/{slug}/content-pages` gibt die Seite zurück

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

### Test 5.2: Content-Pages nach Funnel filtern

**Ziel:** Verifizieren, dass Content-Pages nach Funnel gefiltert werden können.

**Schritte:**
1. Erstelle mehrere Content-Pages und ordne sie verschiedenen Funnels zu
2. Navigiere zu `/admin/content` (oder API-Abfrage)
3. Filtere nach einem spezifischen Funnel

**Erwartetes Ergebnis:**
- ✅ Nur Content-Pages des ausgewählten Funnels werden angezeigt
- ✅ Filter funktioniert korrekt
- ✅ Anzahl der angezeigten Seiten ist korrekt

**Status:** [ ] Bestanden [ ] Fehlgeschlagen [ ] N/A (kein Filter im UI)

**Notizen:**
```
_________________________________________________________________
```

---

### Test 5.3: Content-Pages im Funnel anzeigen

**Ziel:** Verifizieren, dass Content-Pages im Funnel-Kontext angezeigt werden.

**Schritte:**
1. Erstelle eine Content-Page und ordne sie dem "stress-assessment" Funnel zu
2. Navigiere zum Funnel (z.B. `/patient/stress-check`)
3. Suche nach Links oder Verweisen zu Content-Pages

**Erwartetes Ergebnis:**
- ✅ Content-Page ist verlinkt im Funnel-Flow (z.B. Info-Button)
- ✅ Link führt zur korrekten Seite (`/patient/funnel/{slug}/content/{pageSlug}`)
- ✅ Zurück-Navigation funktioniert (zurück zum Funnel)
- ✅ Keine 404-Fehler

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

### Test 5.4: Content-Resolver API

**Ziel:** Verifizieren, dass die Content-Resolver API korrekt funktioniert.

**Schritte:**
1. Teste API-Endpunkt:
   ```bash
   curl "https://your-app.vercel.app/api/content-resolver?funnel=stress-assessment"
   ```
2. Teste mit Kategorie-Filter:
   ```bash
   curl "https://your-app.vercel.app/api/content-resolver?funnel=stress-assessment&category=result"
   ```

**Erwartetes Ergebnis:**
- ✅ API gibt JSON-Array mit Content-Pages zurück
- ✅ Nur Content-Pages des spezifizierten Funnels
- ✅ Mit Kategorie-Filter: Nur Seiten der Kategorie
- ✅ Nur published Seiten werden zurückgegeben
- ✅ Sortierung nach Priorität (höchste zuerst)

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

### Test 5.5: Kategorie-basierte Anzeige

**Ziel:** Verifizieren, dass Content-Pages nach Kategorie gefiltert angezeigt werden.

**Schritte:**
1. Erstelle Content-Pages mit verschiedenen Kategorien:
   - "intro" – Einführungs-Seiten
   - "info" – Informations-Seiten
   - "result" – Ergebnis-Seiten
2. Öffne die Ergebnis-Seite eines Assessments
3. Prüfe, welche Content-Blocks angezeigt werden

**Erwartetes Ergebnis:**
- ✅ Nur Content-Pages der Kategorie "result" werden auf der Ergebnis-Seite angezeigt
- ✅ Intro- und Info-Seiten erscheinen NICHT auf der Ergebnis-Seite
- ✅ Richtiger Kontext wird angezeigt (z.B. intro während Assessment, result nach Assessment)

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

### Test 5.6: Prioritäts-Sortierung

**Ziel:** Verifizieren, dass Content-Pages nach Priorität sortiert werden.

**Schritte:**
1. Erstelle 3 Content-Pages für denselben Funnel mit verschiedenen Prioritäten:
   - Seite A: Priorität 90
   - Seite B: Priorität 80
   - Seite C: Priorität 70
2. Öffne die Seite im Frontend, wo diese Seiten angezeigt werden

**Erwartetes Ergebnis:**
- ✅ Seiten werden in der Reihenfolge A, B, C angezeigt (höchste Priorität zuerst)
- ✅ Sortierung ist stabil bei gleichen Prioritäten (z.B. nach created_at)

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

### Test 5.7: Keine Funnel-Zuordnung

**Ziel:** Verifizieren, dass Content-Pages ohne Funnel-Zuordnung korrekt behandelt werden.

**Schritte:**
1. Erstelle eine Content-Page ohne Funnel-Zuordnung (funnel_id = null)
2. Speichere die Seite

**Erwartetes Ergebnis:**
- ✅ Seite kann gespeichert werden
- ✅ Seite erscheint NICHT in Funnel-spezifischen Listen
- ✅ Seite kann weiterhin direkt aufgerufen werden (falls URL bekannt)
- ✅ Keine Fehler beim Speichern oder Abrufen

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

## ✅ 6. Performance & Qualität

### Test 6.1: Ladezeit – Content-Page

**Ziel:** Verifizieren, dass Content-Pages schnell laden.

**Schritte:**
1. Öffne Browser DevTools → Network Tab
2. Lade eine Content-Page im Frontend
3. Messe die Ladezeit

**Erwartetes Ergebnis:**
- ✅ Initial Load < 2 Sekunden (auf gutem Internet)
- ✅ API-Request (Content-Resolver) < 500ms
- ✅ Keine extrem langsamen Requests (> 5 Sekunden)

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

### Test 6.2: Console-Errors

**Ziel:** Verifizieren, dass keine JavaScript-Fehler im Frontend auftreten.

**Schritte:**
1. Öffne Browser DevTools → Console Tab
2. Navigiere durch verschiedene Content-Pages
3. Führe CRUD-Operationen im Admin-Bereich durch

**Erwartetes Ergebnis:**
- ✅ Keine roten Fehler in der Console
- ✅ Warnungen (gelb) sind akzeptabel, sollten aber minimal sein
- ✅ Keine "undefined" oder "null" Fehler

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

### Test 6.3: Accessibility – Keyboard Navigation

**Ziel:** Verifizieren, dass Content-Pages per Tastatur navigierbar sind.

**Schritte:**
1. Öffne eine Content-Page im Frontend
2. Nutze nur die Tastatur (Tab, Enter, Pfeiltasten)
3. Versuche alle interaktiven Elemente zu erreichen

**Erwartetes Ergebnis:**
- ✅ Alle Links sind per Tab erreichbar
- ✅ Fokus ist visuell erkennbar (Outline oder ähnlich)
- ✅ Enter/Space aktiviert Links/Buttons
- ✅ Zurück-Navigation ist per Tastatur möglich

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

### Test 6.4: Accessibility – Screen Reader (optional)

**Ziel:** Verifizieren, dass Content-Pages für Screen-Reader zugänglich sind.

**Hinweis:** Nur testen, falls Screen-Reader verfügbar (NVDA, JAWS, VoiceOver).

**Schritte:**
1. Aktiviere Screen-Reader
2. Navigiere durch eine Content-Page
3. Höre, wie Inhalte vorgelesen werden

**Erwartetes Ergebnis:**
- ✅ Überschriften werden als Überschriften angekündigt
- ✅ Links werden als Links angekündigt
- ✅ Inhalt ist logisch geordnet
- ✅ Alternative Texte für Bilder (falls vorhanden)

**Status:** [ ] Bestanden [ ] Fehlgeschlagen [ ] N/A (kein Screen-Reader)

**Notizen:**
```
_________________________________________________________________
```

---

## ✅ 7. Sicherheit

### Test 7.1: XSS-Schutz

**Ziel:** Verifizieren, dass Markdown-Content gegen XSS-Angriffe geschützt ist.

**Schritte:**
1. Erstelle eine Content-Page mit folgendem Inhalt:
   ```markdown
   <script>alert('XSS')</script>
   <img src="x" onerror="alert('XSS')">
   ```
2. Öffne die Seite im Frontend

**Erwartetes Ergebnis:**
- ✅ JavaScript-Code wird NICHT ausgeführt
- ✅ Script-Tags werden als Text oder entfernt angezeigt
- ✅ Kein Alert-Popup erscheint
- ✅ Markdown-Renderer sanitiert Eingaben

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

### Test 7.2: SQL-Injection-Schutz

**Ziel:** Verifizieren, dass API-Endpunkte gegen SQL-Injection geschützt sind.

**Schritte:**
1. Teste API mit bösartigen Parametern:
   ```bash
   curl "https://your-app.vercel.app/api/content-resolver?funnel='; DROP TABLE content_pages; --"
   ```

**Erwartetes Ergebnis:**
- ✅ Keine Datenbankfehler
- ✅ Query wird abgelehnt oder sicher behandelt
- ✅ Keine Datenmanipulation
- ✅ API gibt 400 oder ähnlichen Fehler zurück

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

### Test 7.3: Authentifizierung für API-Endpunkte

**Ziel:** Verifizieren, dass Admin-API-Endpunkte geschützt sind.

**Schritte:**
1. Melde dich ab
2. Versuche direkt auf Admin-API zuzugreifen:
   ```bash
   curl "https://your-app.vercel.app/api/admin/content-pages"
   ```

**Erwartetes Ergebnis:**
- ✅ API gibt 401 Unauthorized zurück
- ✅ Kein Zugriff auf Daten ohne Authentifizierung
- ✅ Klare Fehlermeldung

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

## ✅ 8. Edge Cases & Fehlerbehandlung

### Test 8.1: Leere Content-Page

**Ziel:** Verifizieren, dass leere Content-Pages korrekt gehandhabt werden.

**Schritte:**
1. Erstelle eine Content-Page mit minimalem Inhalt (nur Titel, Slug)
2. Lasse den Markdown-Inhalt leer oder mit nur Leerzeichen
3. Öffne die Seite im Frontend

**Erwartetes Ergebnis:**
- ✅ Seite lädt ohne Fehler
- ✅ Titel wird angezeigt
- ✅ Keine "undefined" oder leeren Container
- ✅ Freundliche Nachricht oder einfach leere Content-Area

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

### Test 8.2: Sehr lange Content-Page

**Ziel:** Verifizieren, dass sehr lange Content-Pages korrekt angezeigt werden.

**Schritte:**
1. Erstelle eine Content-Page mit sehr viel Inhalt (z.B. 10+ Abschnitte, 1000+ Wörter)
2. Öffne die Seite im Frontend

**Erwartetes Ergebnis:**
- ✅ Seite ist scrollbar
- ✅ Kein Layout-Bruch
- ✅ Performance bleibt akzeptabel
- ✅ Keine Timeout-Fehler

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

### Test 8.3: Ungültige Slugs im URL

**Ziel:** Verifizieren, dass ungültige Slugs korrekt behandelt werden.

**Schritte:**
1. Versuche eine Content-Page mit ungültigem Slug zu öffnen:
   ```
   /patient/funnel/stress-assessment/content/does-not-exist
   ```

**Erwartetes Ergebnis:**
- ✅ 404-Fehlerseite wird angezeigt
- ✅ Keine technischen Fehler in Console
- ✅ Benutzer kann zur Startseite zurück navigieren

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

### Test 8.4: Netzwerkfehler während CRUD-Operationen

**Ziel:** Verifizieren, dass Netzwerkfehler angemessen behandelt werden.

**Schritte:**
1. Öffne eine Content-Page zur Bearbeitung im Admin-Bereich
2. Deaktiviere WLAN/Internet
3. Versuche zu speichern

**Erwartetes Ergebnis:**
- ✅ Fehlermeldung erscheint (z.B. "Netzwerkfehler")
- ✅ Keine kryptischen technischen Fehler
- ✅ Benutzereingaben bleiben erhalten (kein Datenverlust)
- ✅ Nach Wiederherstellung kann erneut gespeichert werden

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

## ✅ 9. Integration mit anderen Features

### Test 9.1: Content-Pages in Patient-Journey

**Ziel:** Verifizieren, dass Content-Pages nahtlos in den Patient-Journey integriert sind.

**Schritte:**
1. Starte als Patient einen kompletten Fragebogen-Durchlauf
2. Suche nach Möglichkeiten, Content-Pages während des Flows zu öffnen
3. Kehre zum Fragebogen zurück

**Erwartetes Ergebnis:**
- ✅ Content-Pages sind von relevanten Stellen aus verlinkt
- ✅ Öffnen von Content-Pages unterbricht den Flow nicht (neue Tab oder Modal)
- ✅ Zurück-Navigation funktioniert korrekt
- ✅ Fragebogen-Zustand bleibt erhalten

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

### Test 9.2: Content-Pages auf Ergebnis-Seite

**Ziel:** Verifizieren, dass Content-Pages (Kategorie "result") auf der Ergebnis-Seite angezeigt werden.

**Schritte:**
1. Erstelle mindestens 2 Content-Pages mit Kategorie "result"
2. Führe ein Assessment durch
3. Navigiere zur Ergebnis-Seite

**Erwartetes Ergebnis:**
- ✅ Result-Content-Blocks erscheinen unterhalb der Scores/AMY-Bericht
- ✅ Alle "result" Seiten werden angezeigt
- ✅ Sortierung nach Priorität ist korrekt
- ✅ Markdown wird korrekt gerendert
- ✅ Keine Layout-Probleme

**Status:** [ ] Bestanden [ ] Fehlgeschlagen

**Notizen:**
```
_________________________________________________________________
```

---

### Test 9.3: Content-Pages und AMY-Integration

**Ziel:** Verifizieren, dass Content-Pages und AMY-Berichte gut zusammenarbeiten.

**Schritte:**
1. Führe ein Assessment durch (mit AMY aktiviert)
2. Navigiere zur Ergebnis-Seite
3. Prüfe die Reihenfolge: Scores → AMY → Content-Blocks

**Erwartetes Ergebnis:**
- ✅ AMY-Bericht erscheint VOR den Content-Blocks
- ✅ Content-Blocks sind klar vom AMY-Bericht getrennt (visuell)
- ✅ Keine Überlappungen oder Layout-Konflikte
- ✅ Beide Features funktionieren parallel

**Status:** [ ] Bestanden [ ] Fehlgeschlagen [ ] N/A (AMY deaktiviert)

**Notizen:**
```
_________________________________________________________________
```

---

## 📊 Zusammenfassung & Checkliste

### Quick Checklist für schnellen Durchlauf

Minimal erforderliche Tests für schnelle QA:

- [ ] **Admin-Zugriff:** Admin kann sich anmelden und Content-Übersicht öffnen
- [ ] **CREATE:** Neue Content-Page kann erstellt werden
- [ ] **READ:** Content-Page kann angezeigt werden
- [ ] **UPDATE:** Content-Page kann bearbeitet werden
- [ ] **DELETE:** Content-Page kann gelöscht werden (oder Status auf draft setzen)
- [ ] **Rendering:** Markdown wird korrekt im Frontend gerendert
- [ ] **Funnel-Integration:** Content-Page kann einem Funnel zugeordnet werden
- [ ] **Kategorie-Filter:** Content-Pages werden nach Kategorie gefiltert angezeigt

### Vollständige Checkliste

**1. Admin-Zugriff & Berechtigungen**
- [ ] Test 1.1: Admin-Login
- [ ] Test 1.2: Zugriffskontrolle – Patient
- [ ] Test 1.3: Zugriffskontrolle – Unauthentifiziert
- [ ] Test 1.4: Kliniker-Zugriff

**2. CRUD-Operationen**
- [ ] Test 2.1: Content-Page erstellen
- [ ] Test 2.2: Content-Page lesen
- [ ] Test 2.3: Content-Page aktualisieren
- [ ] Test 2.4: Content-Page löschen
- [ ] Test 2.5: Slug-Validierung
- [ ] Test 2.6: Duplikat-Slug-Prüfung
- [ ] Test 2.7: Erforderliche Felder

**3. Sections**
- [ ] Test 3.1: Sections erstellen
- [ ] Test 3.2: Sections anzeigen
- [ ] Test 3.3: Sections bearbeiten
- [ ] Test 3.4: Sections löschen
- [ ] Test 3.5: Leere Sections

**4. Content Rendering**
- [ ] Test 4.1: Markdown – Überschriften
- [ ] Test 4.2: Markdown – Listen
- [ ] Test 4.3: Markdown – Textformatierung
- [ ] Test 4.4: Markdown – Links
- [ ] Test 4.5: Markdown – Code-Blöcke
- [ ] Test 4.6: Markdown – Blockquotes
- [ ] Test 4.7: Layout-Varianten
- [ ] Test 4.8: Mobile Responsiveness
- [ ] Test 4.9: Status-Filter

**5. Funnel-Integration**
- [ ] Test 5.1: Content-Page einem Funnel zuordnen
- [ ] Test 5.2: Content-Pages nach Funnel filtern
- [ ] Test 5.3: Content-Pages im Funnel anzeigen
- [ ] Test 5.4: Content-Resolver API
- [ ] Test 5.5: Kategorie-basierte Anzeige
- [ ] Test 5.6: Prioritäts-Sortierung
- [ ] Test 5.7: Keine Funnel-Zuordnung

**6. Performance & Qualität**
- [ ] Test 6.1: Ladezeit – Content-Page
- [ ] Test 6.2: Console-Errors
- [ ] Test 6.3: Accessibility – Keyboard Navigation
- [ ] Test 6.4: Accessibility – Screen Reader

**7. Sicherheit**
- [ ] Test 7.1: XSS-Schutz
- [ ] Test 7.2: SQL-Injection-Schutz
- [ ] Test 7.3: Authentifizierung für API-Endpunkte

**8. Edge Cases**
- [ ] Test 8.1: Leere Content-Page
- [ ] Test 8.2: Sehr lange Content-Page
- [ ] Test 8.3: Ungültige Slugs im URL
- [ ] Test 8.4: Netzwerkfehler

**9. Integration**
- [ ] Test 9.1: Content-Pages in Patient-Journey
- [ ] Test 9.2: Content-Pages auf Ergebnis-Seite
- [ ] Test 9.3: Content-Pages und AMY-Integration

---

## 📋 Sign-Off

**Getestet von:** ________________________  
**Datum:** ________________________  
**Umgebung:** [ ] Local [ ] Staging [ ] Production  
**Ergebnis:** [ ] Alle Tests bestanden [ ] Tests mit Fehlern (siehe Issues)

**Kritische Issues:**
```
_______________________________________________________________
_______________________________________________________________
_______________________________________________________________
```

**Nicht-kritische Issues:**
```
_______________________________________________________________
_______________________________________________________________
_______________________________________________________________
```

---

## 📚 Weiterführende Dokumentation

- **F2: Content Editor** - `docs/F2_CONTENT_EDITOR.md`
- **D1: Content Pages** - `docs/D1_CONTENT_PAGES.md`
- **D2: Content Integration** - `docs/D2_CONTENT_INTEGRATION.md`
- **F8: Dynamic Result Blocks** - `docs/F8_IMPLEMENTATION_SUMMARY.md`
- **F5: Content Resolver** - `docs/F5_CONTENT_RESOLVER.md`
- **F8: Testing Checklist** - `docs/F8_TESTING_CHECKLIST.md`
- **E4: Smoke Test** - `docs/E4_SMOKE_TEST.md`

---

## 🔄 Versions-Historie

| Version | Datum | Änderungen |
|---------|-------|------------|
| 1.0 | 2024-12-11 | Initiale Version – Vollständige Content QA Checklist für v0.3 |

---

**Letzte Aktualisierung:** 2024-12-11  
**Erstellt für:** Rhythmologicum Connect v0.3  
**Zielgruppe:** Internes QS-Team

---

*Ende der Checkliste*
