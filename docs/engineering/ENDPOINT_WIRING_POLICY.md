# Endpoint Wiring Policy (Vertical Slices)

## Ziel
Jeder PR muss eine funktionale, minimale Verdrahtung (Vertical Slice) für neue interne Endpoints enthalten.
So verhindern wir Orphans und stellen sicher, dass Endpoints real genutzt werden.

## Regeln
### Interne Endpoints
- Jeder neue interne Endpoint MUSS in demselben PR mindestens einmal im Repo aufgerufen werden.
- Der Callsite muss eine **literal** Endpoint-URL enthalten (z. B. `'/api/...'`), damit der Wiring‑Gate sie erkennen kann.
- Die Verdrahtung darf minimal sein und hinter einem Feature‑Flag liegen, muss aber ausführbar bleiben.

### Externe Endpoints
- Externe Endpoints (Webhooks/Partner/Backend‑zu‑Backend) dürfen keine interne Callsite haben.
- Sie müssen **explizit** in der Allowlist stehen:
  - Datei: `docs/api/endpoint-allowlist.json`
  - Mit kurzer Begründung, warum der Endpoint extern ist.

## Konsequenz im Merge-Prozess
- PRs mit neuen **internen** Orphan‑Endpoints sind nicht mergebar.
- Orphan‑Endpoints sind nur zulässig, wenn sie als **extern** allowlisted sind.

## Hinweise
- Feature‑Flagging ist erlaubt, solange die Callsite im Code vorhanden bleibt.
- Keine Refactors der Generatoren notwendig.
