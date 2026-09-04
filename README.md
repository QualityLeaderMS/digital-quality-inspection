# Digital Quality Inspection — PWA

This project converts the current Digital Quality Inspection HTML application into an installable Progressive Web App for iOS and Android.

## Included

- Responsive mobile-first UI
- PWA manifest
- Service worker / app-shell caching
- iOS Add to Home Screen support
- Android install prompt where supported
- Offline persistence using localStorage
- Camera/gallery photo capture using mobile file input
- Inspection findings by trade and comment type
- AI observation enhancement hooks
- AI corrective-action hooks
- AI executive-summary hook
- Excel export
- Print/PDF workflow
- Sample data and reset

## Important: AI security

The browser must NOT contain a Gemini API key.

The JavaScript calls:

`POST /api/gemini`

Your server should receive `{ "prompt": "..." }`, call Gemini securely using a server-side API key, then return:

`{ "text": "..." }`

This keeps the API key out of the PWA and out of the browser source.

## Run locally

A PWA must be served over HTTPS (or localhost). Do not simply double-click index.html.

### Option A — Python

From this project folder:

`python -m http.server 8080`

Then open:

`http://localhost:8080`

For phone testing on the same Wi-Fi, use your computer's local IP, e.g.:

`http://192.168.x.x:8080`

Note: service-worker installation generally requires HTTPS except for localhost. For real phone testing, deploy to an HTTPS host.

### Option B — Any static HTTPS host

Upload the complete folder to a static hosting provider. The root must contain:

- index.html
- manifest.json
- service-worker.js
- css/
- js/
- icons/

## iPhone installation

Open the HTTPS app URL in Safari:

1. Share
2. Add to Home Screen
3. Add

The app then opens in standalone PWA mode.

## Android installation

Open the HTTPS URL in Chrome. Use the Install App / Add to Home Screen option when offered.

## Production roadmap

The current version is intentionally a PWA-first foundation. Recommended next upgrades:

1. IndexedDB for larger offline records and photos
2. Background sync
3. Cloud authentication
4. Central project/unit database
5. Multi-user roles
6. Secure Gemini backend
7. Real PDF generation rather than print-only output
8. Native share/export
9. Finding severity, SLA, assignee, target date and closure status
10. Management dashboard
11. Central cloud database and audit trail

## Note about external libraries

The current app preserves the original browser/CDN approach for Tailwind, Font Awesome, Google Fonts and SheetJS so the first PWA can be tested quickly. For a production offline-first deployment, these dependencies should be bundled locally.
