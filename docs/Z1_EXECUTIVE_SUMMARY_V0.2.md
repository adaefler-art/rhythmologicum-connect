# Executive Summary: Rhythmologicum Connect v0.2

**Für: Thomas & Pilotpraxis**  
**Version: 0.2.1**  
**Datum: Dezember 2024**  
**Status: Pilot-Version**

---

## 📋 Überblick

Rhythmologicum Connect ist eine webbasierte Plattform zur Erfassung und Auswertung von Stress- und Schlafbelastungen bei Patient:innen. Die Anwendung ermöglicht es Patient:innen, standardisierte Fragebögen auszufüllen und ihre Ergebnisse im Zeitverlauf zu verfolgen. Ärzt:innen erhalten Zugriff auf eine Dashboard-Übersicht aller Pilotpatient:innen mit detaillierten Verlaufsdiagrammen und KI-gestützten Einordnungen.

### Zielgruppe
- **Patient:innen**: Selbstständige Stress- und Schlafbewertung
- **Kliniker:innen**: Überwachung und Verlaufsbeobachtung der Pilotpatient:innen
- **Pilotpraxis**: Evaluation der Plattform im klinischen Alltag

---

## ✅ Was kann v0.2?

### Für Patient:innen

#### 1. **Registrierung & Anmeldung**
- Einfache Registrierung mit E-Mail und Passwort
- Sichere, datenschutzkonforme Authentifizierung über Supabase
- Einwilligungsverwaltung (Consent-Management) vor erster Nutzung
- Automatisches Login nach erfolgreicher Registrierung

#### 2. **Stress- & Schlaf-Assessment** 
- **8 validierte Fragen** zur Selbsteinschätzung:
  - 4 Fragen zu Stress und Überforderung
  - 4 Fragen zu Schlafqualität und Erholung
- **5-stufige Antwortskala** (0 = Nie bis 4 = Sehr häufig)
- Visueller Fortschrittsbalken während der Beantwortung
- Validierung: Alle Fragen müssen beantwortet werden
- Mobile-optimierte Bedienung

#### 3. **Sofortige Auswertung**
Nach dem Absenden erhalten Patient:innen:
- **Stress-Score** (0-100 Punkte)
- **Schlaf-Score** (0-100 Punkte)
- **Risiko-Level** (niedrig, mittel, hoch)
- **Personalisierte Einordnung** durch AMY (AI-gestützte Analyse)*
- Verständliche Darstellung der Ergebnisse

*Hinweis: AMY kann über Feature-Flag aktiviert/deaktiviert werden

#### 4. **Verlaufsansicht (Historie)**
- Chronologische Übersicht aller durchgeführten Assessments
- Anzeige von Datum, Stress-Score, Schlaf-Score und Risiko-Level
- Möglichkeit, frühere Ergebnisse einzusehen
- Optional: JSON-Export der eigenen Daten

### Für Kliniker:innen

#### 1. **Dashboard-Übersicht**
- **Patienten-Tabelle** mit Übersicht aller Pilotpatient:innen
- Sortierbare Spalten:
  - Name
  - Aktueller Stress-Score
  - Risiko-Level (farbcodiert: grün/gelb/rot)
  - Zeitpunkt der letzten Messung
  - Anzahl der Messungen
- Schneller Überblick über gefährdete Patient:innen (Risiko-Sortierung)

#### 2. **Detaillierte Patientenansicht**
Für jeden Patienten:
- **Profil-Informationen**: Name, Geburtsjahr, Geschlecht
- **Verlaufsdiagramme** für Stress und Schlaf*:
  - Chronologische Darstellung aller Messwerte
  - Übersichtliche SVG-Diagramme ohne externe Bibliotheken
  - Skalierung 0-100 für einfache Interpretation
- **AMY-Berichte Timeline**:
  - Chronologische Anzeige aller KI-generierten Einordnungen
  - Risiko-Level farblich gekennzeichnet
  - Vollständige AMY-Texte für jede Messung
- **Rohdaten-Ansicht**: Optional JSON-Format für technische Details

*Hinweis: Diagramme können über Feature-Flag aktiviert/deaktiviert werden

#### 3. **Sichere Zugriffskontrolle**
- **Rollenbasiertes System**: Nur Kliniker:innen haben Zugriff auf das Dashboard
- Automatische Zugriffsprüfung auf Middleware-Ebene
- Protokollierung unerlaubter Zugriffsversuche
- Session-Persistenz über sichere Cookies

### Technische Features

#### Datenschutz & Sicherheit
- ✅ **Row Level Security (RLS)**: Patient:innen sehen nur ihre eigenen Daten
- ✅ **Verschlüsselte Übertragung**: HTTPS/TLS für alle Verbindungen
- ✅ **Consent-Management**: Dokumentierte Einwilligungen in Datenbank
- ✅ **DSGVO-konform**: Hosting in Deutschland (Frankfurt)
- ✅ **Audit-Trail**: Logging aller kritischen Aktionen

#### Performance & Stabilität
- ✅ Seitenladezeiten < 3 Sekunden
- ✅ Assessment-Auswertung < 5 Sekunden
- ✅ Responsive Design für Desktop, Tablet und Mobile
- ✅ Browser-Kompatibilität: Chrome, Firefox, Safari, Edge
- ✅ Offline-Erkennung und Fehlerbehandlung

#### Deployment & Infrastruktur
- ✅ Hosting auf Vercel (EU-Region)
- ✅ Supabase PostgreSQL Datenbank
- ✅ Automatisches Deployment via Git
- ✅ Umgebungsvariablen-Management
- ✅ Feature-Flags für flexible Konfiguration

---

## ❌ Was kann v0.2 NICHT?

### Wichtige Einschränkungen

#### 1. **Keine Echtzeit-Benachrichtigungen**
- Kliniker:innen erhalten **keine** automatischen Benachrichtigungen bei:
  - Neuen Assessments
  - Kritischen Risiko-Levels
  - Verschlechterungen im Verlauf
- Aktive Überprüfung des Dashboards erforderlich

#### 2. **Keine Patienten-Kliniker-Kommunikation**
- **Kein Messaging-System** zwischen Patient:innen und Kliniker:innen
- Keine Kommentarfunktion
- Keine Möglichkeit, Rückmeldungen zu Assessments zu geben
- Kommunikation muss extern erfolgen (Telefon, E-Mail, persönlich)

#### 3. **Keine Behandlungsempfehlungen**
- AMY gibt **keine medizinischen Ratschläge**
- Keine automatischen Therapievorschläge
- Keine Medikationsempfehlungen
- Einordnung ist **nicht-diagnostisch** und ersetzt keine ärztliche Beurteilung

#### 4. **Keine Integration in Praxissoftware**
- **Kein Export** zu gängigen Praxisverwaltungssystemen (PVS)
- Keine Schnittstelle zu Laborsystemen
- Keine ICD-10 Diagnose-Codierung
- Keine Abrechnungsfunktion (GOÄ/EBM)

#### 5. **Eingeschränkte Administrationstools**
- **Keine UI** für Rollenverwaltung (muss via SQL erfolgen)
- Keine Möglichkeit, Patient:innen im Frontend zu deaktivieren
- Keine Bulk-Operationen (z.B. mehrere Patient:innen exportieren)
- Kein Admin-Dashboard für Systemüberwachung

#### 6. **Eingeschränkte Datenauswertung**
- **Keine statistischen Auswertungen** über alle Patient:innen
- Keine Vergleichswerte oder Benchmarks
- Keine Kohortenanalysen
- Keine automatischen Reports oder Zusammenfassungen

#### 7. **AMY-Einschränkungen**
- KI-generierte Texte sind **nicht immer perfekt**
- Bei API-Ausfällen: Fallback zu generischen Texten
- Keine Garantie für spezifische Empfehlungen
- Maximal 5-10 Sekunden Wartezeit bei hoher Last

#### 8. **Fehlende Features für Forschung**
- Keine Anonymisierungsfunktion für Forschungsdaten
- Keine Studien-Randomisierung
- Keine Kontrollgruppen-Verwaltung
- Kein Ethikkommission-Workflow

---

## 🖼️ Wichtige Screens (Beschreibung)

### Screen 1: Patient-Assessment
**Was sieht man:**
- Überschrift: "Ihr persönlicher Stress- & Schlaf-Check"
- Fortschrittsbalken (z.B. "Frage 3 von 8")
- Zwei Bereiche: "Umgang mit Stress" und "Schlaf & Erholung"
- Jede Frage mit 5 Antwortoptionen (0 = Nie bis 4 = Sehr häufig)
- Große, gut klickbare Buttons
- Am Ende: "Antworten speichern & weiter" Button

**Zweck:** Erfassung der Selbsteinschätzung

---

### Screen 2: Ergebnisse (Patient)
**Was sieht man:**
- Stress-Score: z.B. "68/100"
- Schlaf-Score: z.B. "45/100"
- Risiko-Level: Farblich markiert (grün/gelb/rot)
- AMY-Abschnitt (falls aktiviert): 
  - Personalisierte Einordnung
  - Tipps und Hinweise
  - Gut formatierter Fließtext

**Zweck:** Sofortiges Feedback für Patient:innen

---

### Screen 3: Kliniker-Dashboard
**Was sieht man:**
- Überschrift: "Patientenübersicht"
- Tabelle mit Spalten:
  - Patient:in (Name)
  - StressScore (numerisch)
  - RiskLevel (farbiger Badge)
  - Letzte Messung (Datum/Zeit)
  - Messungen (Anzahl)
- Sortier-Icons in Spaltenköpfen
- Klickbare Zeilen

**Zweck:** Schnellübersicht aller Pilotpatient:innen

---

### Screen 4: Patienten-Details (Kliniker)
**Was sieht man:**
- Patienten-Header: Name, Geburtsjahr, Geschlecht
- Zwei Diagramme nebeneinander:
  - Stress-Verlauf (blaue Linie)
  - Schlaf-Verlauf (lila Linie)
- Timeline der AMY-Berichte:
  - Datum
  - Scores
  - Risiko-Level (farbig umrandet)
  - Vollständiger AMY-Text
- Toggle für JSON-Rohdaten

**Zweck:** Detaillierte Verlaufsbeobachtung

---

## 🎯 Fokus: Klinischer Einsatz im Pilot

### Was bedeutet "Pilot"?

v0.2 ist eine **Testversion** für die Evaluation in der Pilotpraxis. Das bedeutet:

#### Ziele des Pilots:
1. **Funktionalität testen**: Läuft die Plattform stabil im Praxisalltag?
2. **Usability evaluieren**: Ist die Bedienung intuitiv für Patient:innen und Kliniker:innen?
3. **Datenschutz verifizieren**: Funktioniert die Zugriffskontrolle wie gewünscht?
4. **Feedback sammeln**: Welche Features fehlen? Was muss verbessert werden?

#### Erwartungen an Pilotphase:
- ✅ Regelmäßiges Feedback von Thomas & Team
- ✅ Dokumentation von Problemen und Wünschen
- ✅ Gemeinsame Priorisierung neuer Features
- ✅ Iterative Verbesserungen basierend auf Praxis-Erfahrung

#### Was sollten Pilotnutzer wissen:
- ⚠️ **Nicht alle Features** sind vollständig ausgereift
- ⚠️ **Änderungen möglich**: Features können sich zwischen Updates ändern
- ⚠️ **Keine Garantie**: Keine SLA (Service Level Agreement) während Pilotphase
- ⚠️ **Limitierte Nutzerzahl**: Optimiert für kleine Anzahl Pilotpatient:innen (< 50)

---

## 📊 Empfohlener Pilot-Workflow

### Für Kliniker:innen (Thomas)

1. **Initiales Setup:**
   - Kliniker-Account erstellen lassen (über Admin/Entwickler)
   - Login testen und Dashboard aufrufen
   - Vertraut machen mit Navigation

2. **Patient:innen onboarden:**
   - Patient:innen über Plattform informieren
   - Registrierungs-Link bereitstellen
   - Bei Bedarf bei Registrierung helfen

3. **Tägliche Nutzung:**
   - Einmal täglich Dashboard aufrufen
   - Nach kritischen Risiko-Levels (rot) suchen
   - Bei Auffälligkeiten: Patient:in extern kontaktieren

4. **Wöchentliche Review:**
   - Verlaufsdiagramme einzelner Patient:innen ansehen
   - Trends identifizieren (Verbesserung/Verschlechterung)
   - Dokumentation für Feedback

### Für Patient:innen

1. **Onboarding:**
   - Registrierung durchführen
   - Einwilligung bestätigen
   - Erstes Assessment durchführen

2. **Regelmäßige Nutzung:**
   - **Empfehlung**: Wöchentliches Assessment
   - Immer zur gleichen Tageszeit ausfüllen (z.B. abends)
   - Ehrliche Selbsteinschätzung

3. **Verlauf beobachten:**
   - Regelmäßig Historie ansehen
   - Eigene Trends erkennen
   - Bei Fragen: Kliniker:in in nächstem Termin ansprechen

---

## 🔧 Technische Voraussetzungen

### Für Nutzung:
- **Browser**: Chrome, Firefox, Safari oder Edge (aktuelle Version)
- **Internet**: Stabile Verbindung (min. 1 Mbit/s)
- **Gerät**: Desktop, Laptop, Tablet oder Smartphone
- **JavaScript**: Muss aktiviert sein
- **Cookies**: Müssen erlaubt sein (für Session-Verwaltung)

### Für Administration:
- **Supabase-Zugang**: Für Rollenverwaltung
- **Vercel-Zugang**: Für Deployment und Logs
- **GitHub-Zugang**: Für Code-Updates (optional)

---

## 📞 Support & Feedback

### Bei Problemen:
1. **Technische Probleme**: Entwicklerteam kontaktieren (GitHub Issues)
2. **Fachliche Fragen**: Thomas in der Pilotpraxis
3. **Notfälle**: Externe Kommunikationswege nutzen (Telefon)

### Feedback einreichen:
- **Was funktioniert gut?** → Bitte dokumentieren
- **Was funktioniert nicht?** → Mit Screenshots und Beschreibung melden
- **Was fehlt?** → Feature-Wünsche sammeln

**Feedback-Kanäle:**
- E-Mail an Entwicklerteam
- GitHub Issues: `adaefler-art/rhythmologicum-connect`
- Persönliche Besprechungen mit Thomas

---

## 🚀 Nächste Schritte (nach Pilot)

### Geplante Features v0.3+:
- ✨ Push-Benachrichtigungen für Kliniker:innen
- ✨ Export zu Praxissoftware (HL7/FHIR)
- ✨ Erweiterte Statistiken und Reports
- ✨ Admin-UI für Benutzerverwaltung
- ✨ Mehrstufige Risiko-Algorithmen
- ✨ Patienten-Kliniker-Messaging (sicher & DSGVO-konform)

### Abhängig von Pilot-Feedback:
- Anpassung der Fragebogen-Items
- Optimierung der AMY-Prompts
- UI/UX Verbesserungen
- Performance-Optimierungen

---

## ✍️ Zusammenfassung

**v0.2 ist eine solide Pilotversion** mit allen Kernfunktionen für Stress- und Schlafbewertung:

✅ **Was funktioniert:**
- Patient:innen können selbstständig Assessments durchführen
- Kliniker:innen haben Überblick über alle Pilotpatient:innen
- Verlaufsbeobachtung über Diagramme
- Datenschutz durch RLS und Zugriffskontrolle
- Stabile Performance und responsive Design

❌ **Was noch fehlt:**
- Echtzeit-Benachrichtigungen
- Praxissoftware-Integration
- Erweiterte Admin-Tools
- Statistische Auswertungen

🎯 **Ziel des Pilots:**
Praktische Erprobung im klinischen Alltag, um fundierte Entscheidungen für v0.3 und darüber hinaus zu treffen.

---

**Weiterführende Dokumentation:**
- 📖 [Vollständige README](../README.md)
- ✅ [Pilot Readiness Checklist](Z2_PILOT_READINESS_CHECKLIST.md) - Kompletter Leitfaden zur Pilot-Vorbereitung
- 🔐 [Clinician Auth Setup](CLINICIAN_AUTH.md)
- 🧪 [Smoke Test Guide](E4_SMOKE_TEST.md)
- 🚀 [Deployment Guide](DEPLOYMENT_GUIDE.md)
- 📊 [Feature Flags](FEATURE_FLAGS.md)

---

**Kontakt:**  
Bei Fragen zur v0.2 Executive Summary bitte an das Entwicklerteam wenden.

**Viel Erfolg mit der Pilotphase! 🚀**
