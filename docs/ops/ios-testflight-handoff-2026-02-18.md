# Briefing: iOS/TestFlight Handoff (2026-02-18)

## Ziel
Stabile iOS-Archive-Pipeline über Xcode Cloud für die App PAT_Anamnesis und reibungslose TestFlight-Distribution.

## Aktueller Status
- Xcode Cloud Build 19 war erfolgreich (Archive - iOS grün).
- Lokales iOS-Archiv ist ebenfalls erfolgreich.
- Repository ist synchron mit origin/main.
- Letzter bestätigter Stand: Commit db330eb5ecf3e168a9a03d29151340b49579cba2.

## Wichtigste zuletzt umgesetzte Fixes
1. CI-Pfadfix im app-lokalen Prebuild-Skript
   - Fehlerbild vorher: `cd: apps/rhythm-patient-ios/ios/App: No such file or directory`
   - Fix: robuste absolute Pfade über REPO_ROOT/APP_ROOT/IOS_APP_ROOT.
   - Commit: db330eb5 (fix(ci): correct app-local prebuild working directories)

2. Capacitor Sync vor iOS Archive in CI
   - Sicherstellung der generierten Dateien vor Build:
     - ios/App/App/public
     - ios/App/App/config.xml
     - ios/App/App/capacitor.config.json
   - Commit: e465b425 (fix(ci): run capacitor sync before ios archive)

3. Frühere Stabilisierungsschritte (bereits enthalten)
   - npm/node bootstrap in CI scripts
   - pod install in CI scripts
   - resilientere PATH/Arbeitsverzeichnis-Logik
   - Bundle-ID Alignment auf com.pat.connect.patient

## Relevante Dateien
- [apps/rhythm-patient-ios/ios/App/ci_scripts/ci_pre_xcodebuild.sh](apps/rhythm-patient-ios/ios/App/ci_scripts/ci_pre_xcodebuild.sh)
- [apps/rhythm-patient-ios/ios/App/ci_scripts/ci_post_clone.sh](apps/rhythm-patient-ios/ios/App/ci_scripts/ci_post_clone.sh)
- [ci_scripts/ci_pre_xcodebuild.sh](ci_scripts/ci_pre_xcodebuild.sh)
- [ci_scripts/ci_post_clone.sh](ci_scripts/ci_post_clone.sh)
- [apps/rhythm-patient-ios/capacitor.config.ts](apps/rhythm-patient-ios/capacitor.config.ts)
- [apps/rhythm-patient-ios/ios/App/App/Info.plist](apps/rhythm-patient-ios/ios/App/App/Info.plist)

## Aktuelle Warnungen (nicht blockierend)
- [CP] Embed Pods Frameworks läuft bei jedem Build (Output-Dependencies fehlen).
- WKProcessPool deprecated Warnungen aus WebView/Plugin-Kontext.
- Search path Hinweis auf Metal.xctoolchain/iphoneos not found (Cloud-Toolchain-Warnung).

## Native Chat Konfiguration (bereits gesetzt)
In Info.plist:
- NATIVE_CHAT_ENABLED = true
- NATIVE_CHAT_BASE_URL = https://rhythm-patient.vercel.app
- NATIVE_CHAT_AUTH_TOKEN = (derzeit leer/optional je nach Backend-Strategie)

## Falls der nächste Cloud-Build wieder fehlschlägt
1. In Xcode Cloud nur den ersten roten Fehlerblock aus dem fehlgeschlagenen Step teilen.
2. Priorität auf Step „Run ci_pre_xcodebuild.sh script“ und/oder „Run xcodebuild archive“.
3. Nicht den kompletten Log posten, nur:
   - ersten ERROR-Block
   - 20–40 Zeilen Kontext davor/danach

## Schneller Operativer Ablauf für den nächsten Bearbeiter
1. Prüfen, ob Build auf aktuellem main-Commit läuft.
2. Falls rot: ersten roten Block extrahieren.
3. Nur Root-Cause patchen, minimaler Diff.
4. Lokal Script-Syntaxcheck: `bash -n apps/rhythm-patient-ios/ios/App/ci_scripts/ci_pre_xcodebuild.sh`.
5. Commit + Push, Build neu starten.

## Repo-Sync Check (bereits verifiziert)
- main ist gleich origin/main.
- Kein lokaler uncommitted Stand offen zum Zeitpunkt der Übergabe.
