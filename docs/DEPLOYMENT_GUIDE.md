# Deployment-Leitfaden für Rhythmologicum Connect

Dieser Leitfaden beschreibt den vollständigen Deployment-Prozess für Rhythmologicum Connect v0.2 auf Vercel, inklusive Konfiguration aller Umgebungsvariablen.

## Inhaltsverzeichnis

- [Voraussetzungen](#voraussetzungen)
- [Umgebungsvariablen](#umgebungsvariablen)
- [Vercel Deployment](#vercel-deployment)
- [Umgebungs-spezifische Konfiguration](#umgebungs-spezifische-konfiguration)
- [Smoke-Tests](#smoke-tests)
- [Troubleshooting](#troubleshooting)
- [Checkliste für Thomas](#checkliste-für-thomas)

---

## Voraussetzungen

### Software & Accounts

- **Node.js** v20.x oder höher
- **npm** v10.x oder höher
- **Git** für Versionskontrolle
- **Vercel Account** (kostenlos unter [vercel.com](https://vercel.com))
- **Supabase Projekt** (kostenlos unter [supabase.com](https://supabase.com))
- **Anthropic Account** (optional, für AMY AI-Features unter [console.anthropic.com](https://console.anthropic.com))

### Zugriff auf Repository

- Push-Rechte für das GitHub Repository `adaefler-art/rhythmologicum-connect`
- Vercel Projekt verbunden mit dem GitHub Repository

---

## Umgebungsvariablen

### Übersicht aller Variablen

| Variable | Erforderlich | Beschreibung | Wo zu finden |
|----------|--------------|--------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Ja | Öffentliche Supabase Projekt-URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Ja | Öffentlicher Anonymous-Key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Ja | Service Role Key (geheim!) | Supabase Dashboard → Settings → API |
| `ANTHROPIC_API_KEY` | ⚠️ Optional | Anthropic API-Schlüssel für AMY | Anthropic Console → API Keys |
| `ANTHROPIC_MODEL` | ⚪ Optional | Anthropic Modell-Version | Standard: `claude-sonnet-4-5-20250929` |
| `NEXT_PUBLIC_FEATURE_AMY_ENABLED` | ⚪ Optional | AMY AI aktivieren/deaktivieren | Standard: `true` |
| `NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED` | ⚪ Optional | Kliniker-Dashboard aktivieren | Standard: `true` |
| `NEXT_PUBLIC_FEATURE_CHARTS_ENABLED` | ⚪ Optional | Diagramme aktivieren | Standard: `true` |

### Erforderliche Variablen

#### 1. NEXT_PUBLIC_SUPABASE_URL

**Was ist das?**
Die öffentliche URL Ihres Supabase-Projekts.

**Wo finden?**
1. Öffnen Sie [app.supabase.com](https://app.supabase.com)
2. Wählen Sie Ihr Projekt
3. Navigieren Sie zu "Settings" → "API"
4. Kopieren Sie die "Project URL"

**Beispiel:**
```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
```

**Sicherheit:** ✅ Kann öffentlich exponiert werden

---

#### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY

**Was ist das?**
Der öffentliche "Anonymous"-Schlüssel mit eingeschränkten Berechtigungen. Wird durch Row Level Security (RLS) geschützt.

**Wo finden?**
1. Gleicher Pfad wie oben: Settings → API
2. Kopieren Sie den "anon public" Key

**Beispiel:**
```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Sicherheit:** ✅ Kann öffentlich exponiert werden (geschützt durch RLS)

---

#### 3. SUPABASE_SERVICE_ROLE_KEY

**Was ist das?**
Der administrative Service-Schlüssel mit vollen Datenbankrechten. Wird nur serverseitig in API-Routes verwendet.

**Wo finden?**
1. Settings → API
2. Kopieren Sie den "service_role" Key (⚠️ GEHEIM!)

**Beispiel:**
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Sicherheit:** 🔒 **GEHEIM HALTEN!** Niemals im Client-Code verwenden oder committen!

**Verwendung:**
- Backend API-Routes (`/app/api/*`)
- Bypasses RLS für administrative Operationen
- Zugriff auf alle Daten ohne Einschränkungen

---

### Optionale Variablen

#### 4. ANTHROPIC_API_KEY

**Was ist das?**
API-Schlüssel für Anthropic Claude, verwendet für AMY AI-Funktionalität.

**Wo finden?**
1. Besuchen Sie [console.anthropic.com](https://console.anthropic.com)
2. Erstellen Sie einen Account (falls nicht vorhanden)
3. Navigieren Sie zu "API Keys"
4. Erstellen Sie einen neuen API-Schlüssel

**Beispiel:**
```
ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Wenn nicht gesetzt:**
- AMY verwendet Fallback-Texte (siehe `lib/amyFallbacks.ts`)
- Keine API-Kosten
- Reduzierte Personalisierung der Bewertungen

**Sicherheit:** 🔒 **GEHEIM HALTEN!** Niemals committen!

**Alternative Namen (Legacy):**
```
ANTHROPIC_API_TOKEN=sk-ant-api03-...
```

---

#### 5. ANTHROPIC_MODEL

**Was ist das?**
Spezifiziert die Claude-Modellversion.

**Standard:** `claude-sonnet-4-5-20250929`

**Beispiel:**
```
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929
```

**Wann ändern?**
- Nur wenn eine neuere Modellversion verfügbar ist
- Standardwert funktioniert zuverlässig

---

### Feature Flags

Alle Feature Flags sind optional und standardmäßig aktiviert (`true`).

**Akzeptierte Werte:**
- **Aktiviert:** `true`, `1`, `yes` (case-insensitive)
- **Deaktiviert:** `false`, `0`, `no` (case-insensitive)

#### NEXT_PUBLIC_FEATURE_AMY_ENABLED

**Standard:** `true`

**Wenn aktiviert:**
- AMY AI-generierte Bewertungen werden angezeigt
- Anthropic API wird aufgerufen (falls `ANTHROPIC_API_KEY` gesetzt)
- Personalisierte Stress-Einschätzungen für Patienten

**Wenn deaktiviert:**
- AMY-Sektionen werden ausgeblendet
- Fallback zu generischen Bewertungen
- Keine Anthropic API-Calls

**Beispiel:**
```
NEXT_PUBLIC_FEATURE_AMY_ENABLED=true
```

---

#### NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED

**Standard:** `true`

**Wenn aktiviert:**
- `/clinician` Routes sind zugänglich
- Kliniker sehen Patienten-Übersicht und Details

**Wenn deaktiviert:**
- Middleware blockiert `/clinician` Routes
- Kliniker werden zur Patienten-Ansicht umgeleitet
- Fehlermeldung: "Das Kliniker-Dashboard ist derzeit nicht verfügbar"

**Beispiel:**
```
NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED=true
```

---

#### NEXT_PUBLIC_FEATURE_CHARTS_ENABLED

**Standard:** `true`

**Wenn aktiviert:**
- Stress-Verlauf Diagramme werden angezeigt
- Schlaf-Verlauf Diagramme werden angezeigt

**Wenn deaktiviert:**
- Diagramm-Sektionen ausgeblendet
- Patientendaten bleiben in anderen Formaten zugänglich

**Beispiel:**
```
NEXT_PUBLIC_FEATURE_CHARTS_ENABLED=true
```

**Siehe auch:** `docs/FEATURE_FLAGS.md` für detaillierte Feature-Flag-Dokumentation

---

## Vercel Deployment

### Erstmaliges Setup

#### 1. Vercel-Projekt erstellen

**Option A: Import über Vercel Dashboard**

1. Besuchen Sie [vercel.com/new](https://vercel.com/new)
2. Wählen Sie "Import Git Repository"
3. Autorisieren Sie Vercel für GitHub
4. Wählen Sie `adaefler-art/rhythmologicum-connect`
5. Framework Preset: **Next.js** (wird automatisch erkannt)
6. Root Directory: `.` (Standard)
7. Klicken Sie **NOCH NICHT** auf "Deploy"

**Option B: Vercel CLI**

```bash
npm i -g vercel
cd /pfad/zu/rhythmologicum-connect
vercel
```

Folgen Sie den Anweisungen im Terminal.

---

#### 2. Umgebungsvariablen konfigurieren

**Im Vercel Dashboard:**

1. Gehen Sie zu Ihrem Projekt
2. Navigieren Sie zu **Settings** → **Environment Variables**
3. Fügen Sie jede Variable einzeln hinzu:

**Für Production:**

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ihr-projekt.supabase.co` | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` | Production |
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | Production |

**Für Preview:**

Wiederholen Sie die gleichen Variablen für "Preview"-Umgebung:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ihr-projekt.supabase.co` | Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` | Preview |
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | Preview |

**Hinweis:** Sie können das gleiche Supabase-Projekt für Production und Preview verwenden, oder separate Projekte für bessere Isolation.

**Feature Flags (optional):**

Standardmäßig sind alle Features aktiviert. Nur hinzufügen, wenn Sie Features deaktivieren möchten:

```
NEXT_PUBLIC_FEATURE_AMY_ENABLED=true
NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED=true
NEXT_PUBLIC_FEATURE_CHARTS_ENABLED=true
```

---

#### 3. Deployment starten

**Automatisch via Git:**

```bash
git push origin main
```

Vercel deployed automatisch bei jedem Push auf `main`.

**Manuell via Vercel Dashboard:**

1. Gehen Sie zu "Deployments"
2. Klicken Sie "Deploy"
3. Wählen Sie Branch `main`

**Via CLI:**

```bash
vercel --prod
```

---

#### 4. Deployment verifizieren

Nach erfolgreichem Deployment:

1. Öffnen Sie die Vercel-URL (z.B. `rhythmologicum-connect.vercel.app`)
2. Überprüfen Sie, dass die Seite lädt
3. Führen Sie die Smoke-Tests durch (siehe unten)

---

### Umgebungs-spezifische Konfiguration

#### Production (main branch)

**Empfohlene Konfiguration:**

```bash
# Erforderlich
NEXT_PUBLIC_SUPABASE_URL=https://production-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=production-anon-key
SUPABASE_SERVICE_ROLE_KEY=production-service-key

# Empfohlen
ANTHROPIC_API_KEY=production-api-key

# Optional (alle Features aktiviert)
NEXT_PUBLIC_FEATURE_AMY_ENABLED=true
NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED=true
NEXT_PUBLIC_FEATURE_CHARTS_ENABLED=true
```

**Verwendung:**
- Echte Patientendaten
- Maximale Sicherheit erforderlich
- Vollständige Feature-Aktivierung

---

#### Preview (Pull Requests)

**Empfohlene Konfiguration:**

**Option 1: Separates Supabase-Projekt (empfohlen)**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://preview-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=preview-anon-key
SUPABASE_SERVICE_ROLE_KEY=preview-service-key
ANTHROPIC_API_KEY=preview-api-key
```

**Option 2: Gleiches Projekt wie Production (einfacher)**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://production-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=production-anon-key
SUPABASE_SERVICE_ROLE_KEY=production-service-key
ANTHROPIC_API_KEY=production-api-key
```

**Verwendung:**
- Test-Deployments für Pull Requests
- Feature-Testing vor Merge
- Kann Feature Flags zum Testen verwenden

---

#### Development (lokal)

**Konfiguration in `.env.local`:**

```bash
# .env.local (niemals committen!)
NEXT_PUBLIC_SUPABASE_URL=https://ihr-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ihr-anon-key
SUPABASE_SERVICE_ROLE_KEY=ihr-service-key

# Optional
ANTHROPIC_API_KEY=ihr-api-key

# Feature Flags nach Bedarf
NEXT_PUBLIC_FEATURE_AMY_ENABLED=true
```

**Setup:**

1. Kopieren Sie `.env.example` zu `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Füllen Sie die Werte aus

3. Starten Sie den Dev-Server:
   ```bash
   npm run dev
   ```

---

## Smoke-Tests

Nach jedem Deployment führen Sie diese Tests durch, um sicherzustellen, dass alle Kernfunktionen funktionieren.

### Test-Suite Übersicht

- ✅ **T1:** Homepage lädt
- ✅ **T2:** Patient kann sich registrieren
- ✅ **T3:** Patient kann sich anmelden
- ✅ **T4:** Patient kann Stress-Assessment durchführen
- ✅ **T5:** Ergebnisse werden korrekt angezeigt
- ✅ **T6:** AMY-Bericht wird generiert (wenn aktiviert)
- ✅ **T7:** Kliniker kann sich anmelden
- ✅ **T8:** Kliniker sieht Patienten-Liste
- ✅ **T9:** Kliniker kann Patienten-Details sehen
- ✅ **T10:** Diagramme werden angezeigt (wenn aktiviert)

---

### T1: Homepage lädt

**Schritte:**
1. Öffnen Sie `https://ihre-domain.vercel.app`

**Erwartetes Ergebnis:**
- ✅ Seite lädt ohne Fehler
- ✅ Login-Formular ist sichtbar
- ✅ "Rhythmologicum Connect" Titel angezeigt
- ✅ Keine Console-Errors im Browser

---

### T2: Patient-Registrierung

**Schritte:**
1. Klicken Sie auf "Noch kein Konto? Hier registrieren"
2. Geben Sie eine Test-E-Mail ein: `test-patient@example.com`
3. Geben Sie ein Passwort ein (mind. 6 Zeichen)
4. Klicken Sie "Registrieren"

**Erwartetes Ergebnis:**
- ✅ Erfolgs-Nachricht oder Weiterleitung zur Bestätigung
- ✅ E-Mail-Bestätigung erhalten (in Supabase Dashboard prüfen)

**Wichtig:** Bestätigen Sie die E-Mail über den Link in der E-Mail oder im Supabase Dashboard.

---

### T3: Patient-Login

**Schritte:**
1. Gehen Sie zur Login-Seite
2. Geben Sie die Test-Credentials ein
3. Klicken Sie "Anmelden"

**Erwartetes Ergebnis:**
- ✅ Erfolgreiche Anmeldung
- ✅ Weiterleitung zu `/patient`
- ✅ Patient-Portal wird angezeigt

---

### T4: Stress-Assessment durchführen

**Schritte:**
1. Navigieren Sie zu `/patient/stress-check`
2. Füllen Sie alle Fragen aus (5 Stress-Fragen + 3 Schlaf-Fragen)
3. Klicken Sie "Assessment abschließen"

**Erwartetes Ergebnis:**
- ✅ Alle Fragen müssen beantwortet werden
- ✅ Weiterleitung zur Ergebnis-Seite
- ✅ Keine Fehler während der Eingabe

---

### T5: Ergebnisse anzeigen

**Schritte:**
1. Auf der Ergebnis-Seite verbleiben (`/patient/stress-check/result`)

**Erwartetes Ergebnis:**
- ✅ Stress-Score wird angezeigt (z.B. "Stress-Level: 3.2/5")
- ✅ Schlaf-Score wird angezeigt
- ✅ Risiko-Level wird angezeigt (niedrig/mittel/hoch)
- ✅ Buttons "Zurück zum Dashboard" funktionieren

---

### T6: AMY-Bericht prüfen

**Nur wenn `NEXT_PUBLIC_FEATURE_AMY_ENABLED=true` und `ANTHROPIC_API_KEY` gesetzt**

**Schritte:**
1. Auf der Ergebnis-Seite nach unten scrollen

**Erwartetes Ergebnis:**
- ✅ Abschnitt "Deine persönliche Einordnung von AMY" ist sichtbar
- ✅ Personalisierter Text wird angezeigt
- ✅ Text ist relevant zu den Assessment-Antworten

**Wenn AMY deaktiviert:**
- ❌ Kein AMY-Abschnitt sichtbar (korrekt)
- ✅ Scores werden trotzdem angezeigt

---

### T7: Kliniker-Login

**Voraussetzung:** Kliniker-Rolle muss in Supabase gesetzt sein:

```sql
SELECT set_user_role('kliniker@example.com', 'clinician');
```

**Schritte:**
1. Melden Sie sich mit Kliniker-Account an
2. Erwarten Sie Weiterleitung zu `/clinician`

**Erwartetes Ergebnis:**
- ✅ Erfolgreiche Anmeldung
- ✅ Weiterleitung zu Kliniker-Dashboard
- ✅ Patienten-Übersicht wird angezeigt

**Wenn Kliniker-Dashboard deaktiviert:**
- ✅ Weiterleitung zu `/` mit Fehlermeldung
- ✅ Nachricht: "Das Kliniker-Dashboard ist derzeit nicht verfügbar"

---

### T8: Patienten-Liste anzeigen

**Schritte:**
1. Als Kliniker auf `/clinician`
2. Liste der Patienten ansehen

**Erwartetes Ergebnis:**
- ✅ Tabelle mit Patienten wird angezeigt
- ✅ Spalten: Name, Letztes Assessment, Stress-Level, etc.
- ✅ Klick auf Patient öffnet Details

---

### T9: Patienten-Details

**Schritte:**
1. Klicken Sie auf einen Patienten in der Liste
2. Navigieren Sie zu `/clinician/patient/[id]`

**Erwartetes Ergebnis:**
- ✅ Patienten-Profil wird angezeigt
- ✅ Assessment-Historie ist sichtbar
- ✅ AMY-Berichte werden angezeigt (wenn aktiviert)

---

### T10: Diagramme prüfen

**Nur wenn `NEXT_PUBLIC_FEATURE_CHARTS_ENABLED=true`**

**Schritte:**
1. Auf Patienten-Detail-Seite nach unten scrollen
2. Suchen Sie nach "Stress-Verlauf" und "Schlaf-Verlauf"

**Erwartetes Ergebnis:**
- ✅ Stress-Verlauf Diagramm wird angezeigt
- ✅ Schlaf-Verlauf Diagramm wird angezeigt
- ✅ Diagramme zeigen Datenpunkte korrekt

**Wenn Charts deaktiviert:**
- ❌ Keine Diagramm-Sektionen (korrekt)
- ✅ Andere Patientendaten weiterhin sichtbar

---

### Smoke-Test Checkliste (Zusammenfassung)

Kopieren Sie diese Checkliste für jedes Deployment:

```markdown
## Deployment Smoke-Test - [Datum]

**Umgebung:** [ ] Production [ ] Preview
**URL:** _______________________
**Tester:** _______________________

### Basis-Funktionen
- [ ] T1: Homepage lädt ohne Fehler
- [ ] T2: Patient-Registrierung funktioniert
- [ ] T3: Patient-Login funktioniert
- [ ] T4: Stress-Assessment kann durchgeführt werden
- [ ] T5: Ergebnisse werden korrekt angezeigt

### AMY-Features (wenn aktiviert)
- [ ] T6: AMY-Bericht wird generiert und angezeigt
- [ ] N/A: AMY ist deaktiviert

### Kliniker-Features
- [ ] T7: Kliniker-Login funktioniert
- [ ] T8: Patienten-Liste wird angezeigt
- [ ] T9: Patienten-Details sind zugänglich

### Diagramme (wenn aktiviert)
- [ ] T10: Stress- und Schlaf-Diagramme werden angezeigt
- [ ] N/A: Charts sind deaktiviert

### Fehlerbehandlung
- [ ] Keine Console-Errors im Browser
- [ ] Fehlerseiten werden korrekt angezeigt
- [ ] Unauthorized-Access wird blockiert

**Status:** [ ] ✅ Alle Tests bestanden [ ] ❌ Fehler gefunden

**Notizen:**
_______________________
```

---

## Troubleshooting

### Build-Fehler: "supabaseUrl is required"

**Symptom:**
```
Error: supabaseUrl is required.
Export encountered an error on /clinician/page
```

**Lösung:**
1. Prüfen Sie, dass `NEXT_PUBLIC_SUPABASE_URL` gesetzt ist
2. Prüfen Sie, dass `NEXT_PUBLIC_SUPABASE_ANON_KEY` gesetzt ist
3. Prüfen Sie, dass `SUPABASE_SERVICE_ROLE_KEY` gesetzt ist
4. Neu-deployen nach Setzen der Variablen

**Vercel-Check:**
```
Settings → Environment Variables → Production
```

Stellen Sie sicher, dass alle drei Variablen existieren.

---

### AMY zeigt keine personalisierten Texte

**Symptom:**
- AMY-Sektion wird angezeigt
- Aber nur generische Texte, keine personalisierten Bewertungen

**Mögliche Ursachen:**

1. **ANTHROPIC_API_KEY nicht gesetzt**
   - Lösung: Fügen Sie den API-Key in Vercel hinzu

2. **API-Key ungültig**
   - Lösung: Generieren Sie einen neuen Key in Anthropic Console

3. **Anthropic API-Rate-Limit erreicht**
   - Lösung: Warten Sie oder erhöhen Sie Ihr Limit

4. **Feature Flag deaktiviert**
   - Prüfen Sie `NEXT_PUBLIC_FEATURE_AMY_ENABLED`

**Fallback-Verhalten:**
Wenn Anthropic nicht verfügbar ist, verwendet die App automatisch generische Texte aus `lib/amyFallbacks.ts`. Das ist normales Verhalten.

---

### Kliniker-Dashboard nicht zugänglich

**Symptom:**
- Kliniker werden zu `/` umgeleitet
- Fehlermeldung: "Zugriff verweigert" oder "Feature nicht verfügbar"

**Mögliche Ursachen:**

1. **Kliniker-Rolle nicht gesetzt**
   - Lösung: SQL ausführen:
   ```sql
   SELECT set_user_role('kliniker@example.com', 'clinician');
   ```

2. **Feature Flag deaktiviert**
   - Prüfen Sie `NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED`
   - Setzen Sie auf `true` wenn gewünscht

3. **Session-Problem**
   - Logout und erneuter Login
   - Browser-Cache löschen

---

### Umgebungsvariablen werden nicht übernommen

**Symptom:**
- Variablen in Vercel gesetzt
- Aber App verwendet alte/keine Werte

**Lösung:**

1. **Redeploy triggern**
   - Vercel cached Environment-Variablen
   - Lösung: Neues Deployment starten
   ```bash
   git commit --allow-empty -m "Trigger redeploy"
   git push origin main
   ```

2. **Environment-Scope prüfen**
   - Stellen Sie sicher, dass Variablen für den richtigen Environment gesetzt sind
   - Production, Preview, Development haben separate Variablen

3. **Variable neu anlegen**
   - Manchmal hilft es, die Variable zu löschen und neu zu erstellen

---

### Preview-Deployments schlagen fehl

**Symptom:**
- Pull Request erstellt
- Preview-Deployment fehlgeschlagen

**Lösung:**

1. **Environment-Variablen für Preview setzen**
   - Gehen Sie zu Settings → Environment Variables
   - Stellen Sie sicher, dass alle erforderlichen Variablen auch für "Preview" gesetzt sind

2. **Build-Logs prüfen**
   - Klicken Sie auf das fehlerhafte Deployment
   - Überprüfen Sie die Logs auf spezifische Fehler

---

### Console-Errors im Browser

**Symptom:**
- Rote Fehler in Browser DevTools Console

**Häufige Fehler:**

1. **"Failed to fetch"**
   - API-Route nicht erreichbar
   - Prüfen Sie Network-Tab
   - Prüfen Sie Vercel Function-Logs

2. **"Unexpected token"**
   - JSON-Parsing-Fehler
   - Prüfen Sie API-Response-Format

3. **"Cannot read property 'x' of undefined"**
   - Fehlende Daten oder NULL-Werte
   - Prüfen Sie Supabase-Datenbank auf vollständige Daten

---

## Checkliste für Thomas

Diese Checkliste hilft dabei, v0.2 erfolgreich auf Vercel zu deployen.

### Vor dem Deployment

- [ ] **Supabase-Projekt erstellt/vorhanden**
  - [ ] Projekt-URL notiert
  - [ ] Anon Key notiert
  - [ ] Service Role Key notiert (geheim halten!)

- [ ] **Anthropic Account erstellt** (optional, aber empfohlen)
  - [ ] API-Key generiert
  - [ ] API-Key notiert (geheim halten!)

- [ ] **Vercel Account vorhanden**
  - [ ] GitHub mit Vercel verbunden
  - [ ] Berechtigung für `adaefler-art/rhythmologicum-connect` Repository

- [ ] **Lokaler Test erfolgreich**
  - [ ] `.env.local` erstellt mit allen Variablen
  - [ ] `npm install` ausgeführt
  - [ ] `npm run dev` funktioniert
  - [ ] Basis-Funktionen getestet

### Vercel Setup

- [ ] **Projekt in Vercel importiert**
  - [ ] Repository `adaefler-art/rhythmologicum-connect` ausgewählt
  - [ ] Framework: Next.js erkannt

- [ ] **Environment Variables gesetzt (Production)**
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `ANTHROPIC_API_KEY` (optional)

- [ ] **Environment Variables gesetzt (Preview)**
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `ANTHROPIC_API_KEY` (optional)

### Deployment

- [ ] **Initial Deployment durchgeführt**
  - [ ] Main-Branch gepusht oder manuell deployed
  - [ ] Build erfolgreich
  - [ ] Deployment-URL funktioniert

### Post-Deployment Tests

- [ ] **Smoke-Tests durchgeführt**
  - [ ] T1: Homepage lädt ✅
  - [ ] T2: Patient-Registrierung ✅
  - [ ] T3: Patient-Login ✅
  - [ ] T4: Stress-Assessment ✅
  - [ ] T5: Ergebnisse anzeigen ✅
  - [ ] T6: AMY-Bericht (wenn aktiviert) ✅
  - [ ] T7: Kliniker-Login ✅
  - [ ] T8: Patienten-Liste ✅
  - [ ] T9: Patienten-Details ✅
  - [ ] T10: Diagramme (wenn aktiviert) ✅

- [ ] **Fehlerbehandlung geprüft**
  - [ ] Unauthorized-Access wird blockiert
  - [ ] Fehlerseiten werden korrekt angezeigt
  - [ ] Keine Console-Errors

### Dokumentation

- [ ] **ENV-Variablen dokumentiert**
  - [ ] `.env.example` vorhanden und vollständig
  - [ ] README.md aktualisiert
  - [ ] Deployment-Guide gelesen

- [ ] **Team informiert**
  - [ ] Deployment-URL geteilt
  - [ ] Zugangsdaten für Test-Accounts bereitgestellt
  - [ ] Bekannte Einschränkungen kommuniziert

### Optional: Feature Flags konfigurieren

- [ ] **AMY deaktivieren** (falls gewünscht)
  - [ ] `NEXT_PUBLIC_FEATURE_AMY_ENABLED=false`

- [ ] **Kliniker-Dashboard deaktivieren** (falls gewünscht)
  - [ ] `NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED=false`

- [ ] **Charts deaktivieren** (falls gewünscht)
  - [ ] `NEXT_PUBLIC_FEATURE_CHARTS_ENABLED=false`

---

## Weitere Ressourcen

### Interne Dokumentation

- **`.env.example`** - Template für Umgebungsvariablen
- **`docs/FEATURE_FLAGS.md`** - Detaillierte Feature-Flag-Dokumentation
- **`docs/CLINICIAN_AUTH.md`** - Kliniker-Setup-Anleitung
- **`docs/RLS_QUICK_REFERENCE.md`** - Row Level Security Referenz
- **`README.md`** - Allgemeine Projektübersicht

### Externe Links

- **Vercel Docs:** [https://vercel.com/docs](https://vercel.com/docs)
- **Next.js Deployment:** [https://nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)
- **Supabase Docs:** [https://supabase.com/docs](https://supabase.com/docs)
- **Anthropic Docs:** [https://docs.anthropic.com](https://docs.anthropic.com)

### Support

Bei Problemen oder Fragen:

1. Überprüfen Sie die Troubleshooting-Sektion oben
2. Prüfen Sie Vercel Build-Logs
3. Prüfen Sie Browser Console für Fehler
4. Kontaktieren Sie das Entwicklungsteam mit:
   - Fehlerbeschreibung
   - Vercel Deployment-URL
   - Screenshots (falls UI-Problem)
   - Browser Console-Logs

---

**Version:** 1.0.0  
**Letzte Aktualisierung:** 2025-12-07  
**Status:** v0.2 Deployment-Ready
