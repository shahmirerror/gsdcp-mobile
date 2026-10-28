# Deep-link association files (host on gsdcp.org)

These two files make shared `https://gsdcp.org/view_dogs/…` links open **inside the
GSDCP app** when it's installed (iOS Universal Links + Android App Links). The
app side (Associated Domains / intent filters + link routing) is already wired
in `app.json` and `src/lib/deepLinks.ts` — these files are the matching half that
must be served from the **gsdcp.org web server**.

## Where to host (exact paths — must be HTTPS, no redirects)

| File | Must be served at |
|------|-------------------|
| `apple-app-site-association` | `https://gsdcp.org/.well-known/apple-app-site-association` |
| `assetlinks.json` | `https://gsdcp.org/.well-known/assetlinks.json` |

Requirements:
- Served over **HTTPS**, returning **HTTP 200** directly (no 301/302 redirects).
- `Content-Type: application/json` for **both** (the Apple file has **no `.json`
  extension** but must still be served as JSON).
- Reachable with no authentication.

## Fill in the placeholders first

### `apple-app-site-association`
Replace `REPLACE_WITH_APPLE_TEAM_ID` with the Apple **Team ID** (10 chars, e.g.
`A1B2C3D4E5`). Find it in App Store Connect → **Membership**, or the Apple
Developer portal → Membership details. Final `appID` looks like
`A1B2C3D4E5.com.gsdcp.ccms.inspedium`.

### `assetlinks.json`
Replace `REPLACE_WITH_PLAY_APP_SIGNING_SHA256` with the **Play App Signing**
SHA-256 fingerprint — **not** the local upload keystore. Get it from:
**Play Console → (your app) → Test and release → Setup → App signing →
“App signing key certificate” → SHA-256 certificate fingerprint**.

Keep the second entry (upload key SHA-256) too if you want links verified for
builds signed only by the upload key (e.g. internal testing APKs); otherwise
delete that line. Each fingerprint is 32 colon-separated hex bytes, e.g.
`AB:CD:…:EF`.

## Verify after hosting
- iOS: `https://gsdcp.org/.well-known/apple-app-site-association` loads as JSON.
- Android: paste your domain + package into Google's Statement List Tester, or
  run `adb shell pm verify-app-links --re-verify com.gsdcp.ccms.inspedium` after
  install and check `pm get-app-links com.gsdcp.ccms.inspedium` shows `verified`.
- A fresh **native build** (EAS) is required after the `app.json` changes.

## Note on "download if not installed"
Universal/App Links only open the app when it **is** installed. For a visitor
**without** the app, the link just opens the web `view_dogs` page. To prompt a
download there, add a smart app banner / "Get the app" button on that web page
pointing to `https://gsdcp.org/mobile-app` (that page already has both store
links). That banner is a change on the gsdcp.org website, not this app.
