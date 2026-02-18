# Rhythmologicum Connect – iOS Shell (Capacitor)

Hybrid iOS shell for the deployed patient web UI.

## MVP Scope

- Loads deployed patient UI in an iOS `WKWebView` via Capacitor `server.url`
- Starts at `/patient/start` (UC1 entry)
- Preserves cookie/session behavior by using the first-party deployed domain
- Adds lightweight diagnostics via query marker + user-agent suffix (no PHI)
- Supports deep links for `/patient/**` (Universal Links + custom scheme fallback)

## 1) Prerequisites

- macOS + Xcode installed
- Apple Developer Team configured in Xcode
- From repo root: `npm install`

## 2) Configure environment

Set deployed patient UI base URL (no trailing slash):

```bash
export PATIENT_BASE_URL="https://<your-deployed-patient-host>"
```

Falls `PATIENT_BASE_URL` nicht gesetzt ist, verwendet die Shell als sicheren Fallback automatisch:

```bash
https://rhythm-patient.vercel.app
```

Damit wird ein Startup auf `example.invalid` (Black-Screen-Risiko) vermieden.

`capacitor.config.ts` builds:

- base: `PATIENT_BASE_URL`
- start route: `/patient/start`
- full startup URL: `${PATIENT_BASE_URL}/patient/start?rc_platform=ios_shell`

## 3) Generate iOS project

```bash
npm run --workspace apps/rhythm-patient-ios cap:add:ios
npm run --workspace apps/rhythm-patient-ios cap:sync
npm run --workspace apps/rhythm-patient-ios ios:open
```

## 4) Xcode signing + run on device

In Xcode (`ios/App/App.xcworkspace`):

1. Select target `App`
2. Open **Signing & Capabilities**
3. Set **Team** and unique **Bundle Identifier**
4. Connect iPhone, trust developer profile
5. Press **Run**

## 5) Deep links for `/patient/**`

### Universal Links (preferred)

1. In Xcode, add capability **Associated Domains**
2. Add domain entry:

   ```
   applinks:<your-deployed-patient-host>
   ```

3. Ensure the deployed host serves valid `apple-app-site-association` that includes:

   - `"/patient/*"`

When users open `https://<your-deployed-patient-host>/patient/**`, iOS opens the app and keeps navigation in-app.

### Custom scheme fallback

Optionally register URL scheme `rhythmconnect` in Xcode URL Types.

Then links like:

```
rhythmconnect://patient/dashboard
```

can open the same in-app destination.

## 6) Diagnostics (minimal, no PHI)

- Query marker: `rc_platform=ios_shell`
- User-Agent suffix: `RhythmPatientiOSShell/0.1`

Use backend access logs to verify shell traffic and auth redirects without logging PHI.

## 7) Acceptance checklist

On real iOS device, verify:

1. Login succeeds in webview
2. Post-login lands on `/patient/start`
3. Start assessment flow and complete normal step progression
4. App relaunch keeps session as expected
5. Open `/patient/**` universal link and confirm app opens in the shell