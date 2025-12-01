# scripts/setup-v0.2.ps1

# -----------------------------------------
# Basis-Konfiguration
# -----------------------------------------
$repo      = "adaefler-art/rhythmologicum-connect"
$projectId = "PVT_kwHODrgmu84BJj02"   # Rhythm v0.2 Project

Write-Host "=== Rhythm v0.2 Setup startet ==="
Write-Host "Repo: $repo"
Write-Host "Project ID: $projectId"
Write-Host ""

# -----------------------------------------
# 0) Labels sicherstellen
# -----------------------------------------
$allLabels = @('v0.2', 'epic', 'backend', 'frontend', 'devops', 'docs')

Write-Host "=== Stelle Labels im Repo sicher ==="
foreach ($label in $allLabels) {
    Write-Host "-> Label '$label' anlegen (falls nicht vorhanden)..."
    gh label create $label --repo $repo --color "ededed" 2>$null
}
Write-Host ""

# -----------------------------------------
# 1) v0.2-Issue-Definitionen
# -----------------------------------------
$issues = @(
    @{
        title  = 'v0.2 EPIC: Stress & Resilienz MVP - kompletter Patient-Flow'
        labels = @('v0.2', 'epic')
        body   = @'
Beschreibung
- Vollstaendiger Flow: Login -> Stress-Check -> Speicherung der Antworten -> AMY-Auswertung -> Ergebnisanzeige
- Ziel: Funktionierender, stabiler MVP-Flow, den Thomas fachlich reviewen kann.

Akzeptanzkriterien
- Patient kann sich mit einer simplen ID/E-Mail einloggen
- Stress-Check-Fragebogen durchlaufen und Antworten werden in Supabase gespeichert
- AMY generiert einen Kurz-Report (stressScore, sleepScore, riskLevel, report_text_short)
- Stress-Result-Seite zeigt Score + AMY-Text konsistent an
- Fehlerzustaende werden sinnvoll gehandhabt (Fallback-Texte, wenn AMY nicht laeuft)
'@
    },
    @{
        title  = 'Backend: Stabiler AMY-Stress-Report-Endpunkt (Supabase + Anthropic)'
        labels = @('v0.2', 'backend')
        body   = @'
Beschreibung
- /api/amy/stress-report als stabiler Endpunkt fuer den Stress & Resilienz Report.
- Supabase-Abfrage aus assessment_answers
- Berechnung von stressScore, sleepScore und riskLevel
- Speicherung/Update in stress_reports inkl. report_text_short (AMY-Text)

Akzeptanzkriterien
- Endpunkt gibt bei gueltigem assessmentId-Input ein JSON mit Scores + Report zurueck
- Bei fehlendem Anthropic-Key wird ein sinnvoller Fallback-Text erzeugt
- Fehler werden geloggt, aber das System crasht nicht
'@
    },
    @{
        title  = 'Backend: Auth & einfache Patient-Identifikation fuer MVP'
        labels = @('v0.2', 'backend')
        body   = @'
Beschreibung
- Einfache, MVP-taugliche Login-Loesung (z. B. E-Mail + Magic Link oder einfacher Token).
- Patientenprofil wird in patient_profiles gespeichert und mit Assessments verknuepft.

Akzeptanzkriterien
- Ein Patient kann sich wiederkehrend identifizieren (kein anonymer Zufallsnutzer)
- Assessments sind eindeutig einem patient_profile zugeordnet
- Minimal-Datenstruktur (kein Overengineering, nur das Noetigste)
'@
    },
    @{
        title  = 'Frontend: Stress-Check-Formular UX (Fragen, Skalen, Validierung)'
        labels = @('v0.2', 'frontend')
        body   = @'
Beschreibung
- Cleanes, ruhiges UI fuer den Stress-Check (Fragen, Likert-Skala etc.).
- Fokus auf Verstaendlichkeit und geringe kognitive Belastung fuer 50+ Zielgruppe.

Akzeptanzkriterien
- Alle relevanten Stress- & Schlaf-Fragen sind im UI sichtbar und bedienbar
- Pflichtfragen sind validiert, der Nutzer kann nicht mit unvollstaendigem Formular weiter
- Responsive Darstellung auf Desktop/Tablet
'@
    },
    @{
        title  = 'Frontend: Stress-Result-Seite (Scores, AMY-Text, Fallbacks)'
        labels = @('v0.2', 'frontend')
        body   = @'
Beschreibung
- Ergebnisseite zeigt Datum, Stress-Score, Schlaf-Score, Risk-Level und AMY-Text.
- Fallback-Texte bei Backend-/AMY-Fehlern sind verstaendlich und beruhigend formuliert.

Akzeptanzkriterien
- Bereich "Dein Stress & Resilienz-Report" zeigt Score-Werte an, wenn verfuegbar
- Wenn kein Report vorhanden: sinnvoller "noch nicht verfuegbar"-Hinweis
- Loading- und Error-State klar erkennbar
'@
    },
    @{
        title  = 'DevOps: Deploy v0.2 auf Vercel inkl. ENV-Dokumentation'
        labels = @('v0.2', 'backend', 'devops')
        body   = @'
Beschreibung
- Laufender Deploy von v0.2 (gleicher Stand wie lokal funktionierender MVP).
- Alle benoetigten Env-Variablen fuer Supabase + Anthropic sind dokumentiert.

Akzeptanzkriterien
- Produktiv-URL ist erreichbar und zeigt den v0.2 MVP-Flow
- env.local / Vercel-Env sind konsistent dokumentiert (README oder docs/deploy.md)
- Check: AMY-Endpoint funktioniert auch in der Deploy-Umgebung (oder Fallback greift sauber)
'@
    },
    @{
        title  = 'Monitoring & Logging: Basis-Fehler-Transparenz'
        labels = @('v0.2', 'backend')
        body   = @'
Beschreibung
- Fehler im AMY-Endpunkt und im Patient-Flow sollen besser sichtbar sein.
- Mindestens Konsolen-Logging mit klaren Prefixes, optional Vorbereitung fuer externes Monitoring.

Akzeptanzkriterien
- Alle kritischen Pfade (Supabase-Queries, AMY-Call, Insert/Update in stress_reports) loggen Errors mit erkennbarem Prefix
- README enthaelt kurzen Abschnitt: "Troubleshooting / wo sehe ich Fehler?"
'@
    },
    @{
        title  = 'Dokumentation: v0.2 Release-Uebersicht fuer Thomas'
        labels = @('v0.2', 'docs')
        body   = @'
Beschreibung
- Kurze, verstaendliche Zusammenfassung von Scope und Status des v0.2-MVP fuer Thomas.
- Fokus: Was funktioniert? Was ist bewusst noch offen? Wie geht es mit v0.3 weiter?

Akzeptanzkriterien
- Markdown/PDF mit Executive Summary, Featureliste und bekannten Limitierungen
- Im Repo verlinkt, z. B. unter docs/releases/v0.2.md
'@
    }
)

# -----------------------------------------
# 2) Issues erstellen
# -----------------------------------------
Write-Host ""
Write-Host "=== Erzeuge v0.2-Issues im Repo $repo ==="

foreach ($issue in $issues) {
    $title  = $issue.title
    $labels = $issue.labels
    $body   = $issue.body

    Write-Host "-> Erzeuge Issue: $title"

    # temp-Datei fuer Body
    $tmpFile = New-TemporaryFile
    Set-Content -Path $tmpFile.FullName -Value $body -Encoding UTF8

    # WICHTIG: Labels zu einem String joinen (CSV) -> PowerShell Array -> "v0.2,epic"
    $labelArg = $labels -join ','

    gh issue create `
        --repo $repo `
        --title $title `
        --body-file $tmpFile.FullName `
        --label $labelArg `
        --assignee "@me" | Out-Null

    Remove-Item $tmpFile.FullName -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "=== Alle v0.2-Issues angelegt. Hole Liste fuer Project-Befuellung... ==="

# -----------------------------------------
# 3) Alle v0.2-Issues ins Project 'Rhythm v0.2' ziehen
# -----------------------------------------

# WICHTIG: Das ist die Projektnummer aus deiner JSON ("number": 3)
$projectNumber = 3
$projectOwner  = "adaefler-art"

$issuesV02Json = gh issue list --repo $repo --label "v0.2" --limit 100 --json number
$issuesV02     = $issuesV02Json | ConvertFrom-Json

foreach ($i in $issuesV02) {
    $num = $i.number
    $url = "https://github.com/$repo/issues/$num"

    Write-Host "-> Fuege Issue #$num ins Project ein..."

    gh project item-add `
        $projectNumber `
        --owner $projectOwner `
        --url $url | Out-Null
}

Write-Host ""
Write-Host "=== Fertig! Alle v0.2-Issues wurden erstellt und ins Project 'Rhythm v0.2' geschoben. ==="

