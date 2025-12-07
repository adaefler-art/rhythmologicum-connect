# Kurzanleitung: Kliniker-Dashboard

**Version:** 0.2.1  
**Zielgruppe:** Ärzt:innen und klinisches Personal  
**Letzte Aktualisierung:** Dezember 2024

---

## 📊 Dashboard-Übersicht

Das Kliniker-Dashboard bietet einen vollständigen Überblick über alle Pilotpatient:innen und deren Stress- und Schlafmessungen.

### Zugang zum Dashboard
1. Anmeldung auf der Plattform mit Ihren Kliniker-Zugangsdaten
2. Automatische Weiterleitung zur Patientenübersicht: `/clinician`
3. **Hinweis:** Nur Nutzer:innen mit Kliniker-Rolle haben Zugriff

---

## 🗂️ Patientenübersicht

Die Hauptansicht zeigt eine **sortierbare Tabelle** mit allen Patient:innen:

### Tabellenspalten

| Spalte | Bedeutung | Details |
|--------|-----------|---------|
| **Patient:in** | Name des Patienten | Falls kein Name hinterlegt: "Unbekannt" |
| **StressScore** | Aktueller Stresswert | 0-100 Punkte (je höher, desto belasteter) |
| **RiskLevel** | Risikostufe | Niedrig (grün), Mittel (gelb), Hoch (rot) |
| **Letzte Messung** | Zeitpunkt | Datum und Uhrzeit der letzten Bewertung |
| **Messungen** | Anzahl | Gesamtzahl aller durchgeführten Assessments |

### Sortierung
- Klicken Sie auf eine **Spaltenüberschrift**, um zu sortieren
- Erneutes Klicken wechselt zwischen aufsteigend ↑ und absteigend ↓
- **Standard:** Sortierung nach RiskLevel (höchstes Risiko zuerst)

### Navigation
- **Klick auf eine Patientenzeile** → Detailansicht des Patienten

---

## 👤 Patienten-Detailansicht

### Kopfbereich (Header)
- **Name** des Patienten (oder "Patient:in" als Platzhalter)
- **Jahrgang** (falls vorhanden)
- **Geschlecht** (falls vorhanden)
- **Anzahl der Messungen** insgesamt

### 1. Verlaufsdiagramme (Charts)

**Zwei nebeneinander angezeigte Diagramme:**

#### Stress-Verlauf (blau)
- Zeigt alle **Stress-Scores** im zeitlichen Verlauf
- **X-Achse:** Chronologisch von ältester zu neuester Messung
- **Y-Achse:** 0-100 Punkte (Gitterlinien bei 0, 25, 50, 75, 100)
- **Farbe:** Himmelblau (#0ea5e9)

#### Schlaf-Verlauf (lila)
- Zeigt alle **Schlaf-Scores** im zeitlichen Verlauf
- Gleiche Achsen wie Stress-Diagramm
- **Farbe:** Violett (#8b5cf6)

**Interpretation:**
- **Aufwärtstrend:** Verbesserung der Werte
- **Abwärtstrend:** Verschlechterung der Werte
- **Schwankungen:** Mögliche situative Faktoren

### 2. AMY-Berichte Timeline

**AMY** (Assessment Management Yielder) generiert KI-gestützte Einschätzungen:

#### Was sind AMY-Texte?
- **Automatische Analyse** der Fragebogenantworten
- **Personalisierte Einordnung** der Stress- und Schlafsituation
- **Empfehlungen** für Patient:in (allgemein, nicht diagnostisch)
- **Farbcodierung** nach Risikostufe:
  - 🟢 **Grün** (links): Niedriges Risiko
  - 🟡 **Gelb/Amber** (links): Mittleres Risiko
  - 🔴 **Rot** (links): Hohes Risiko

#### Aufbau eines AMY-Berichts
- **Zeitstempel:** Datum und Uhrzeit der Messung
- **Risikostufe:** Niedrig / Mittel / Hoch
- **Scores:** Stress-Score und Schlaf-Score
- **Text:** Vollständige KI-generierte Einschätzung

**Beispieltext (vereinfacht):**
```
Basierend auf deinen Antworten ergibt sich ein Stress-Score 
von etwa 68 von 100 und ein Schlaf-Score von etwa 45 von 100.

Dein aktuelles Stressniveau liegt im mittleren Bereich. Es kann 
hilfreich sein, jetzt auf ausreichend Erholung und klare Grenzen 
zu achten...
```

#### Was AMY NICHT ist:
- ❌ Keine medizinische Diagnose
- ❌ Keine Therapieempfehlung
- ❌ Ersetzt keine ärztliche Beurteilung
- ✅ Orientierungshilfe für Patient:in und Kliniker:in

### 3. Rohdaten (JSON)

- **Toggle-Button** "Anzeigen" / "Verbergen"
- Zeigt technische Rohdaten im JSON-Format
- **Verwendung:** Für technische Prüfungen oder Debugging
- **Normalerweise nicht erforderlich** für klinische Bewertung

---

## 🎯 Scores verstehen

### Stress-Score (0-100)
- **Berechnung:** Basiert auf 4 Fragen zu Stress und Überforderung
- **Skala:** 
  - 0-30: Niedrig
  - 31-60: Mittel
  - 61-100: Hoch
- **Interpretation:** Selbsteinschätzung des Patienten, keine objektive Messung

### Schlaf-Score (0-100)
- **Berechnung:** Basiert auf 4 Fragen zu Schlafqualität und Erholung
- **Skala:** Gleich wie Stress-Score
- **Interpretation:** Subjektive Bewertung der Schlafqualität

### RiskLevel (Risikostufe)
- **Niedrig (grün):** Keine akuten Belastungshinweise
- **Mittel (gelb):** Moderate Belastung, Beobachtung empfohlen
- **Hoch (rot):** Erhöhte Belastung, ggf. Rücksprache mit Patient:in sinnvoll

**Wichtig:** Das RiskLevel ist eine **automatische Kategorisierung** und ersetzt nicht Ihre klinische Beurteilung!

---

## 🔍 Empfohlener Workflow

### Tägliche Nutzung (5 Minuten)
1. Dashboard aufrufen: `/clinician`
2. Nach **roten RiskLevels** (Hoch) suchen
3. Bei Auffälligkeiten: Patientendetails öffnen
4. **Optional:** Patient:in extern kontaktieren (Telefon, Termin)

### Wöchentliche Review (15-30 Minuten)
1. Alle Patient:innen durchgehen
2. **Verlaufsdiagramme** ansehen: Trends erkennen
3. **AMY-Berichte** überfliegen: Veränderungen dokumentieren
4. Bei Verschlechterungen: Gesprächsbedarf notieren

### Bei kritischen Fällen
- **RiskLevel "Hoch"** bedeutet **nicht** automatisch Notfall
- Nutzen Sie die Plattform als **zusätzliche Informationsquelle**
- **Persönlicher Kontakt** bleibt wichtigste Maßnahme
- Kein Ersatz für klinische Untersuchung

---

## ⚙️ Technische Hinweise

### Browser-Anforderungen
- **Empfohlen:** Chrome, Firefox, Safari, Edge (aktuelle Versionen)
- **JavaScript** muss aktiviert sein
- **Cookies** müssen erlaubt sein (für Session-Verwaltung)

### Problembehebung

#### Problem: "Patientenübersicht wird geladen…" bleibt stehen
**Lösung:**
1. Seite neu laden (F5 oder ⌘+R)
2. Browser-Cache leeren
3. Prüfen: Internetverbindung stabil?
4. Falls weiterhin Problem: Entwicklerteam kontaktieren

#### Problem: "Fehler beim Laden der Patientendaten"
**Lösung:**
1. Auf "Neu laden" Button klicken
2. Prüfen: Sind Sie angemeldet?
3. Ausloggen und neu einloggen
4. Falls weiterhin Problem: Entwicklerteam kontaktieren

#### Problem: Dashboard zeigt keine Daten
**Mögliche Ursachen:**
- Noch keine Patient:innen haben Assessments durchgeführt
- RLS (Row Level Security) Berechtigungen prüfen
- Kliniker-Rolle korrekt zugewiesen?

#### Problem: AMY-Berichte fehlen
**Mögliche Ursachen:**
- AMY über Feature-Flag deaktiviert
- API-Fehler bei Auswertung → Fallback-Text wird angezeigt
- **Hinweis:** Scores werden trotzdem korrekt berechnet

#### Problem: Diagramme werden nicht angezeigt
**Mögliche Ursachen:**
- Charts über Feature-Flag deaktiviert
- Browser unterstützt SVG nicht (sehr selten)
- **Workaround:** AMY-Berichte Timeline enthält alle Scores

### Session-Verwaltung
- **Automatisches Logout** nach Inaktivität (Sicherheit)
- Einfach neu einloggen bei Bedarf
- **Keine Daten gehen verloren** durch Session-Timeout

### Performance
- **Ladezeiten:** < 3 Sekunden für Übersicht
- **Detailansicht:** < 2 Sekunden
- Bei langsamer Verbindung: Geduld, Seite lädt vollständig

---

## 📱 Mobile Nutzung

Das Dashboard ist **responsiv** und kann auf Tablets/Smartphones genutzt werden:

- **Tablet:** Volle Funktionalität, optimiertes Layout
- **Smartphone:** Tabelle scrollbar, gestapelte Diagramme
- **Empfehlung:** Desktop für ausführliche Reviews, Mobile für schnelle Checks

---

## 🔐 Datenschutz & Sicherheit

### Was Sie beachten sollten
- ✅ **Immer ausloggen** nach Nutzung (öffentliche Geräte!)
- ✅ **Keine Screenshots** mit Patientendaten teilen
- ✅ **Sichere Passwörter** verwenden
- ✅ **DSGVO-konform:** Alle Daten werden verschlüsselt übertragen

### Row Level Security (RLS)
- Patient:innen sehen **nur ihre eigenen Daten**
- Kliniker:innen sehen **alle Patientendaten**
- Technisch auf Datenbank-Ebene abgesichert

---

## 📞 Support

### Bei technischen Problemen
- **GitHub Issues:** `adaefler-art/rhythmologicum-connect`
- **E-Mail:** Entwicklerteam kontaktieren
- **Dokumentation:** `/docs` Verzeichnis im Repository

### Bei fachlichen Fragen
- Pilotpraxis: Thomas ansprechbar
- Feedback zur Plattform jederzeit willkommen

### Notfälle
- **Wichtig:** Diese Plattform ist **kein Notfallsystem**
- Bei klinischen Notfällen: Reguläre Notfallwege nutzen (112, Klinik)

---

## ✅ Quick Reference (Spickzettel)

| Was will ich tun? | Wie geht's? |
|-------------------|-------------|
| Übersicht öffnen | Auf `/clinician` navigieren |
| Nach Risiko sortieren | Spalte "RiskLevel" anklicken |
| Patient:in Details | Zeile in Tabelle anklicken |
| Trend erkennen | Diagramme in Detailansicht ansehen |
| AMY-Text lesen | Timeline in Detailansicht scrollen |
| Zurück zur Übersicht | "← Zurück zur Übersicht" Button |
| Rohdaten ansehen | "Anzeigen" Button im JSON-Bereich |
| Ausloggen | Logout-Button (je nach Layout) |

---

## 📚 Weiterführende Dokumentation

Für vertiefte Informationen siehe:

- [**Z1_EXECUTIVE_SUMMARY_V0.2.md**](Z1_EXECUTIVE_SUMMARY_V0.2.md) - Gesamtübersicht v0.2
- [**Z2_PILOT_READINESS_CHECKLIST.md**](Z2_PILOT_READINESS_CHECKLIST.md) - Pilot-Vorbereitung
- [**C3_PATIENT_DETAIL.md**](C3_PATIENT_DETAIL.md) - Technische Details Patientenansicht
- [**CLINICIAN_AUTH.md**](CLINICIAN_AUTH.md) - Kliniker-Setup und Authentifizierung
- [**E4_SMOKE_TEST.md**](E4_SMOKE_TEST.md) - Funktionstest der Plattform

---

**Stand:** Dezember 2024 | **Version:** 0.2.1 | **Pilot-Phase**

*Diese Anleitung wird basierend auf Feedback aus der Pilotphase fortlaufend aktualisiert.*
