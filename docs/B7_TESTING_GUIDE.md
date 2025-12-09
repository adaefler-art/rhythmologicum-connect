# B7 Testing Guide - Funnel Management UI

## Vorbereitung

### 1. Clinician-Benutzer einrichten

Bevor Sie die Funnel-Management-UI testen können, benötigen Sie einen Benutzer mit der Rolle `clinician`.

**Option A: Via Supabase Dashboard**
1. Gehen Sie zu Supabase Dashboard → Authentication → Users
2. Wählen Sie einen Benutzer aus oder erstellen Sie einen neuen
3. Gehen Sie zu "User Management" oder "Raw User Meta Data"
4. Fügen Sie `role: clinician` zu `app_metadata` oder `raw_app_meta_data` hinzu

**Option B: Via SQL (empfohlen)**
```sql
-- Funktion zum Setzen der Benutzerrolle (falls noch nicht vorhanden)
CREATE OR REPLACE FUNCTION set_user_role(user_email TEXT, new_role TEXT)
RETURNS void AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', new_role)
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Benutzer die Clinician-Rolle zuweisen
SELECT set_user_role('ihr-email@example.com', 'clinician');
```

### 2. Testdaten erstellen (optional)

Wenn noch keine Funnels in der Datenbank existieren, können Sie Testdaten mit den B4-Demo-Daten erstellen:

```sql
-- Siehe docs/B4_DEMO_DATA.sql für vollständige Testdaten
```

## Testfälle

### Test 1: Zugriffskontrolle

#### 1.1 Nicht-authentifizierter Zugriff
**Schritte:**
1. Öffnen Sie http://localhost:3000/clinician/funnels (ohne Login)
2. **Erwartung:** Redirect zu `/` mit Fehlermeldung "Bitte melden Sie sich an"

#### 1.2 Patient-Zugriff
**Schritte:**
1. Melden Sie sich als Patient an (Benutzer ohne `clinician` Rolle)
2. Navigieren Sie zu http://localhost:3000/clinician/funnels
3. **Erwartung:** Redirect zu `/` mit Fehlermeldung "Keine Berechtigung"

#### 1.3 Clinician-Zugriff
**Schritte:**
1. Melden Sie sich als Clinician an
2. Navigieren Sie zu http://localhost:3000/clinician/funnels
3. **Erwartung:** Funnel-Übersichtsseite wird angezeigt

### Test 2: Funnel-Übersicht

**Schritte:**
1. Melden Sie sich als Clinician an
2. Klicken Sie auf "Funnels" in der Navigation
3. **Erwartung:**
   - Liste aller Funnels wird angezeigt
   - Jeder Funnel zeigt: Titel, Subtitle, Slug, Status (Aktiv/Inaktiv), Erstellungsdatum
   - Status-Badge ist grün für aktive, grau für inaktive Funnels
   - "Details"-Button ist vorhanden

### Test 3: Funnel-Detail anzeigen

**Schritte:**
1. Auf der Funnel-Übersicht, klicken Sie "Details" bei einem Funnel
2. **Erwartung:**
   - Funnel-Metadaten werden angezeigt (Titel, Subtitle, Slug)
   - Anzahl Steps und Fragen wird korrekt angezeigt
   - Alle Steps werden in der richtigen Reihenfolge (order_index) angezeigt
   - Jeder Step zeigt: Step-Nummer, Titel, Beschreibung, Typ
   - Alle Fragen pro Step werden angezeigt
   - Jede Frage zeigt: Key, Label, Help-Text, Typ, Required-Status

### Test 4: Funnel Aktivierung/Deaktivierung

**Vorbedingung:** Funnel-Detailseite ist geöffnet

#### 4.1 Funnel aktivieren
**Schritte:**
1. Bei einem inaktiven Funnel (grauer Button "Inaktiv")
2. Klicken Sie auf den "Inaktiv"-Button
3. **Erwartung:**
   - Button zeigt "Speichert…" während der Aktualisierung
   - Nach Erfolg: Button wird grün und zeigt "Aktiv"
   - Keine Seitenneuladung erforderlich

#### 4.2 Funnel deaktivieren
**Schritte:**
1. Bei einem aktiven Funnel (grüner Button "Aktiv")
2. Klicken Sie auf den "Aktiv"-Button
3. **Erwartung:**
   - Button zeigt "Speichert…" während der Aktualisierung
   - Nach Erfolg: Button wird grau und zeigt "Inaktiv"
   - Keine Seitenneuladung erforderlich

#### 4.3 Persistenz prüfen
**Schritte:**
1. Ändern Sie den Status eines Funnels
2. Laden Sie die Seite neu (F5)
3. **Erwartung:** Status bleibt wie geändert

### Test 5: Step-Reihenfolge ändern

**Vorbedingung:** Funnel-Detailseite mit mindestens 2 Steps ist geöffnet

#### 5.1 Step nach oben verschieben
**Schritte:**
1. Bei einem Step (nicht der erste), klicken Sie auf "↑"
2. **Erwartung:**
   - Step tauscht Position mit dem darüber liegenden Step
   - order_index-Werte werden aktualisiert
   - Seite lädt neue Daten und zeigt korrekte Reihenfolge

#### 5.2 Step nach unten verschieben
**Schritte:**
1. Bei einem Step (nicht der letzte), klicken Sie auf "↓"
2. **Erwartung:**
   - Step tauscht Position mit dem darunter liegenden Step
   - order_index-Werte werden aktualisiert
   - Seite lädt neue Daten und zeigt korrekte Reihenfolge

#### 5.3 Button-Deaktivierung am Rand
**Schritte:**
1. Prüfen Sie den ersten Step
2. **Erwartung:** "↑"-Button ist deaktiviert (opacity reduziert)
3. Prüfen Sie den letzten Step
4. **Erwartung:** "↓"-Button ist deaktiviert (opacity reduziert)

#### 5.4 Persistenz prüfen
**Schritte:**
1. Verschieben Sie einen Step
2. Laden Sie die Seite neu
3. **Erwartung:** Neue Reihenfolge bleibt erhalten

### Test 6: Question Required-Status ändern

**Vorbedingung:** Funnel-Detailseite mit Questions ist geöffnet

#### 6.1 Question auf Pflicht setzen
**Schritte:**
1. Bei einer optionalen Frage (grauer Button "Optional"), klicken Sie den Button
2. **Erwartung:**
   - Button wird orange und zeigt "Pflicht"
   - Seite lädt neue Daten
   - Status wird korrekt angezeigt

#### 6.2 Question auf Optional setzen
**Schritte:**
1. Bei einer Pflicht-Frage (oranger Button "Pflicht"), klicken Sie den Button
2. **Erwartung:**
   - Button wird grau und zeigt "Optional"
   - Seite lädt neue Daten
   - Status wird korrekt angezeigt

#### 6.3 Persistenz prüfen
**Schritte:**
1. Ändern Sie den Required-Status einer Frage
2. Laden Sie die Seite neu
3. **Erwartung:** Status bleibt wie geändert

### Test 7: Navigation

#### 7.1 Navigation im Header
**Schritte:**
1. Auf der Funnel-Übersicht, klicken Sie "Dashboard" in der Navigation
2. **Erwartung:** Weiterleitung zum Clinician Dashboard
3. Klicken Sie "Funnels" in der Navigation
4. **Erwartung:** Zurück zur Funnel-Übersicht

#### 7.2 Zurück-Navigation
**Schritte:**
1. Auf einer Funnel-Detailseite, klicken Sie "← Zurück zur Übersicht"
2. **Erwartung:** Zurück zur Funnel-Übersicht

### Test 8: Error-Handling

#### 8.1 Ungültige Funnel-ID
**Schritte:**
1. Navigieren Sie zu http://localhost:3000/clinician/funnels/invalid-uuid
2. **Erwartung:**
   - Fehlermeldung wird angezeigt
   - "Zurück zur Übersicht"-Link ist vorhanden

#### 8.2 Netzwerkfehler simulieren
**Schritte:**
1. Öffnen Sie Browser DevTools → Network Tab
2. Aktivieren Sie "Offline" Modus
3. Versuchen Sie, einen Status zu ändern
4. **Erwartung:**
   - Alert mit Fehlermeldung wird angezeigt
   - UI bleibt benutzbar
   - Nach Wiederherstellung der Verbindung funktioniert alles wieder

### Test 9: Loading-States

**Schritte:**
1. Öffnen Sie Browser DevTools → Network Tab
2. Drosseln Sie die Verbindung auf "Slow 3G"
3. Navigieren Sie zur Funnel-Übersicht
4. **Erwartung:** "Lade Funnels…" Message wird angezeigt
5. Öffnen Sie eine Funnel-Detailseite
6. **Erwartung:** "Lade Funnel-Details…" Message wird angezeigt
7. Ändern Sie einen Status
8. **Erwartung:** Button zeigt "Speichert…" während der Aktualisierung

### Test 10: UI/UX Details

#### 10.1 Responsive Design
**Schritte:**
1. Öffnen Sie die Funnel-Übersicht auf verschiedenen Bildschirmgrößen
2. **Erwartung:** Layout passt sich an (Desktop, Tablet, Mobile)

#### 10.2 Hover-States
**Schritte:**
1. Bewegen Sie die Maus über verschiedene Elemente
2. **Erwartung:**
   - Buttons zeigen Hover-Effekte
   - Funnel-Zeilen zeigen Hover-Background
   - Links ändern Farbe bei Hover

#### 10.3 Disabled-States
**Schritte:**
1. Während einer Speicher-Operation, versuchen Sie weitere Änderungen
2. **Erwartung:** Buttons sind deaktiviert (cursor: not-allowed, opacity reduziert)

## API-Tests (Optional)

### Mit curl

**Voraussetzung:** Extrahieren Sie das Session-Cookie aus dem Browser

```bash
# Cookie aus Browser DevTools → Application → Cookies kopieren
COOKIE="sb-access-token=YOUR_TOKEN_HERE"

# Test 1: Funnel-Liste abrufen
curl -X GET "http://localhost:3000/api/admin/funnels" \
  -H "Cookie: $COOKIE" \
  -s | jq

# Test 2: Funnel-Details abrufen
FUNNEL_ID="uuid-here"
curl -X GET "http://localhost:3000/api/admin/funnels/$FUNNEL_ID" \
  -H "Cookie: $COOKIE" \
  -s | jq

# Test 3: Funnel aktivieren
curl -X PATCH "http://localhost:3000/api/admin/funnels/$FUNNEL_ID" \
  -H "Content-Type: application/json" \
  -H "Cookie: $COOKIE" \
  -d '{"is_active": true}' \
  -s | jq

# Test 4: Step-Reihenfolge ändern
STEP_ID="uuid-here"
curl -X PATCH "http://localhost:3000/api/admin/funnel-steps/$STEP_ID" \
  -H "Content-Type: application/json" \
  -H "Cookie: $COOKIE" \
  -d '{"order_index": 1}' \
  -s | jq

# Test 5: Question Required ändern
QUESTION_ID="uuid-here"
curl -X PATCH "http://localhost:3000/api/admin/funnel-step-questions/$QUESTION_ID" \
  -H "Content-Type: application/json" \
  -H "Cookie: $COOKIE" \
  -d '{"is_required": false}' \
  -s | jq
```

### Mit Postman/Insomnia

Importieren Sie die folgenden Requests:

1. **GET Funnels**
   - URL: `http://localhost:3000/api/admin/funnels`
   - Method: GET
   - Auth: Cookie-based (kopieren Sie aus Browser)

2. **GET Funnel Details**
   - URL: `http://localhost:3000/api/admin/funnels/{{funnelId}}`
   - Method: GET
   - Auth: Cookie-based

3. **PATCH Funnel Active**
   - URL: `http://localhost:3000/api/admin/funnels/{{funnelId}}`
   - Method: PATCH
   - Body: `{"is_active": true}`
   - Auth: Cookie-based

4. **PATCH Step Order**
   - URL: `http://localhost:3000/api/admin/funnel-steps/{{stepId}}`
   - Method: PATCH
   - Body: `{"order_index": 1}`
   - Auth: Cookie-based

5. **PATCH Question Required**
   - URL: `http://localhost:3000/api/admin/funnel-step-questions/{{questionId}}`
   - Method: PATCH
   - Body: `{"is_required": false}`
   - Auth: Cookie-based

## Bekannte Probleme & Troubleshooting

### Problem: "Unauthorized" bei API-Aufrufen
**Lösung:** Session-Cookie ist abgelaufen oder nicht gesetzt. Erneut anmelden.

### Problem: "Forbidden" trotz Login
**Lösung:** Benutzer hat nicht die Rolle `clinician`. Rolle in Supabase zuweisen.

### Problem: Änderungen werden nicht gespeichert
**Lösung:** 
1. Browser-Console auf Fehler prüfen
2. Network-Tab auf fehlgeschlagene Requests prüfen
3. Supabase-Verbindung testen
4. Environment-Variablen prüfen (SUPABASE_SERVICE_ROLE_KEY)

### Problem: Seite lädt nicht
**Lösung:**
1. Dev-Server läuft? (`npm run dev`)
2. Port 3000 verfügbar?
3. Environment-Variablen gesetzt? (`.env.local`)

## Test-Protokoll

Verwenden Sie dieses Template, um Ihre Tests zu dokumentieren:

```markdown
## Test-Durchlauf: [Datum]

**Tester:** [Name]
**Browser:** [Chrome/Firefox/Safari] [Version]
**Umgebung:** [Development/Staging/Production]

### Ergebnisse

- [ ] Test 1: Zugriffskontrolle ✅/❌
  - Notizen: 
- [ ] Test 2: Funnel-Übersicht ✅/❌
  - Notizen:
- [ ] Test 3: Funnel-Detail ✅/❌
  - Notizen:
- [ ] Test 4: Funnel Aktivierung ✅/❌
  - Notizen:
- [ ] Test 5: Step-Reihenfolge ✅/❌
  - Notizen:
- [ ] Test 6: Question Required ✅/❌
  - Notizen:
- [ ] Test 7: Navigation ✅/❌
  - Notizen:
- [ ] Test 8: Error-Handling ✅/❌
  - Notizen:
- [ ] Test 9: Loading-States ✅/❌
  - Notizen:
- [ ] Test 10: UI/UX Details ✅/❌
  - Notizen:

### Gefundene Bugs

1. [Bug-Beschreibung]
   - Schritte zur Reproduktion:
   - Erwartetes Verhalten:
   - Tatsächliches Verhalten:
   - Schweregrad: [Kritisch/Hoch/Mittel/Niedrig]

### Verbesserungsvorschläge

1. [Vorschlag]
   - Begründung:
   - Priorität: [Hoch/Mittel/Niedrig]
```

## Deployment-Test

Nach Deployment auf Staging/Production:

1. [ ] Alle Tests wiederholen
2. [ ] HTTPS-Verbindung verifizieren
3. [ ] Session-Handling im Production-Modus testen
4. [ ] Performance prüfen (Ladezeiten)
5. [ ] Mobile Devices testen
6. [ ] Verschiedene Browser testen (Chrome, Firefox, Safari)
7. [ ] Logs in Production prüfen
