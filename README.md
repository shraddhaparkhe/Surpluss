# Surpluss Catalogue QA Prototype

This is a local prototype reconstructed from the assessment brief and the supplied product README. The original application source was not available in the workspace, so this project is not a copy of the bug-seeded assessment build and cannot establish findings against it.

## Run locally

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev -- --port 3001
```

Open <http://localhost:3001>. The seeded buyer catalogue is `/catalogue/premium-corporate-essentials`.

Local sign-in accounts:

| Email | Password | Role |
| --- | --- | --- |
| `admin@catalogue.test` | `Admin#2026` | admin |
| `staff@catalogue.test` | `Staff#2026` | staff |

These credentials work only outside production. The app uses a signed, HttpOnly session cookie; production mode requires `SESSION_SECRET` and intentionally disables the demo credentials.

## Checks

```bash
npm test
npm run typecheck
npm run lint
npm run test:e2e
```

Playwright starts the app on port 3001. Install Chromium once with `npx playwright install chromium`.

## Scope and limitations

- Catalogue visibility, price display, enquiry validation, lead inbox, seeded roles, API routes, and catalogue server actions are implemented.
- Data is held in process memory. It resets when the server restarts and is not safe for concurrent production use.
- Prisma, PostgreSQL, spreadsheet file upload/commit, image storage, email, and WhatsApp integrations are not implemented.
- The supplied assessment asks for tests against an existing application. These tests exercise this reconstruction, not the absent original routes or business logic.

See [FINDINGS.md](FINDINGS.md), [WRITEUP.md](WRITEUP.md), and [SETUP_NOTES.md](SETUP_NOTES.md) for the assessment scope and gaps.