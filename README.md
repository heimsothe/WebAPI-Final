# Personal Package Tracker

**Author:** Elijah Heimsoth
**Class:** CSCI 3916 Web API
**Date:** 05/02/26

## Description

Final project for CSCI 3916. A full-stack package tracker that scans a connected Gmail inbox for shipping tracking numbers, classifies them by carrier, and aggregates each carrier's tracking API into a single timeline. Users sign up, connect one or more Gmail accounts via OAuth, and the API imports detected tracking numbers from carrier-sender emails on demand. Each package's current status and event history are pulled from the carrier API (FedEx sandbox in this deployment) and surfaced through a unified REST surface and a React single-page app.

- `POST /auth/signup` and `POST /auth/signin` issue email + password JWT tokens.
- `POST /api/gmail/connect` and `GET /auth/google/callback` complete the Google OAuth handshake. Refresh tokens are encrypted at rest with AES-256-GCM.
- `POST /api/gmail/sync` scans every connected inbox, classifies tracking numbers by carrier with per-carrier regexes, and imports new packages while skipping any number already on the user's exclusion list.
- `GET /api/packages` and `POST /api/packages/:id/refresh` list tracked packages and refresh a single package's events from its carrier. `POST /api/packages/refresh-all` walks every row that has an adapter.
- `DELETE /api/packages/:id` atomically deletes the package and adds its tracking number to the per-user exclusion list, so a future Gmail sync cannot re-import it.
- The React SPA provides sign-in/sign-up, a dashboard with a per-row "Track" link to each carrier's tracking site, an Add Package modal with carrier auto-detect, a per-package detail view with event timeline + manual refresh, and a Settings area covering Gmail connections, Hidden packages, Exclusions, and Account.

## Tech Stack

### API (`api/`)

| Layer | Technology |
| ----- | ---------- |
| Runtime | Node.js |
| Framework | Express 5 |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma 6 |
| Auth | JWT (jsonwebtoken) + bcrypt |
| OAuth | `googleapis` (Gmail read-only scope) |
| Tracking API | FedEx Track API (sandbox) |
| Testing | Mocha + Chai + chai-http + Sinon |
| Deployment | Render (Web Service) |

### Web (`web/`)

| Layer | Technology |
| ----- | ---------- |
| Framework | React 19 |
| State | Redux Toolkit 2 + redux-thunk |
| Routing | react-router-dom 6 |
| UI | react-bootstrap 2.10 + Bootstrap 5.3 (SCSS) + react-icons |
| Build | Create React App (`react-scripts` 5) |
| Testing | Jest + React Testing Library + MSW v1 + Playwright |
| Deployment | Render (Static Site) |

## Project Structure

```
WebAPI-FinalProject/
├── api/                  # Node + Express + Prisma backend
│   ├── lib/              # PrismaClient, carrier adapters, helpers
│   ├── middleware/       # auth, error handler, async wrapper
│   ├── prisma/           # schema.prisma + migrations
│   ├── routes/           # /auth, /api/gmail, /api/packages, /api/exclusions
│   ├── postman/          # Collection + environment for the deployed API
│   ├── test/             # unit / integration / contract / data-layer suites
│   └── server.js
└── web/                  # React SPA
    ├── public/
    ├── src/
    │   ├── api/          # fetch wrapper + per-resource modules
    │   ├── components/   # auth, packages, settings, shared atoms
    │   ├── pages/        # Dashboard, PackageDetail, Settings, Sync, Sign in/up
    │   ├── store/        # Redux Toolkit slices + store
    │   └── test-utils/   # renderWithProviders, MSW handlers, factories
    └── e2e/              # Playwright specs
```

## Installation

```bash
git clone https://github.com/heimsothe/WebAPI-Final.git
cd WebAPI-Final
```

### API setup

```bash
cd api
npm install
```

Create `api/.env`:

```
# Database (Supabase Postgres)
DATABASE_URL=<Supabase pooled URL, port 6543>
DIRECT_URL=<Supabase direct URL, port 5432>

# Auth
JWT_SECRET=<JWT signing secret>
TOKEN_ENCRYPTION_KEY=<exactly 32 bytes, encrypts OAuth refresh tokens at rest>

# Google OAuth (Gmail read scope)
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
GOOGLE_REDIRECT_URI=http://localhost:8080/auth/google/callback

# Frontend (also drives the CORS allow origin)
FRONTEND_URL=http://localhost:3001

# FedEx Track API (sandbox)
FEDEX_API_BASE_URL=https://apis-sandbox.fedex.com
FEDEX_CLIENT_ID=<sandbox client id>
FEDEX_CLIENT_SECRET=<sandbox client secret>

PORT=8080
```

### Web setup

```bash
cd web
npm install
```

`web/.env.development` already points at the local API at `http://localhost:8080`. The web dev server runs on port 3001 (set in `.env.development` so Playwright and the API's `FRONTEND_URL` agree).

## Usage

### Run the API

```bash
cd api
npm start                 # serves on http://localhost:8080
```

Run the test suite (uses a separate local Postgres database, never Supabase):

```bash
cd api
npm run test:db:setup     # one-time: deploy migrations to package_tracker_test
npm test                  # full suite
npm run test:unit         # subsets also available: :integration, :contract, :data-layer
```

### Run the web app

```bash
cd web
npm start                 # http://localhost:3001
npm test                  # Jest in watch mode
CI=true npm test          # run once and exit
npm run e2e               # Playwright (boots its own dev server)
npm run build             # production bundle to web/build/
```

### Authentication

1. `POST /auth/signup` with `{ email, password }` to create an account and receive a JWT token in the response.
2. `POST /auth/signin` with `{ email, password }` to receive a fresh token.
3. Include the token as `Authorization: Bearer <token>` on every `/api/...` request.

The web app handles all three steps for you and stores the token in `localStorage` under `pkg_tracker_token`.

## Deployed Endpoints

- **API:** [https://webapi-final.onrender.com](https://webapi-final.onrender.com)
- **React App:** [https://webapi-final-react.onrender.com](https://webapi-final-react.onrender.com)

> **Note:** The first request after an idle period may take up to 60 seconds due to Render free-tier cold starts. The Static Site currently serves a placeholder until the Slice 7 SPA deploy lands; the React build runs end-to-end locally today.

## API Routes

| Route | GET | POST | PATCH | DELETE |
| ----- | --- | ---- | ----- | ------ |
| `/health` | Liveness check | | | |
| `/auth/signup` | | Create account, return JWT | | |
| `/auth/signin` | | Authenticate, return JWT | | |
| `/auth/google/callback` | OAuth redirect target (Google) | | | |
| `/api/gmail/connect` | | Begin Google OAuth handshake | | |
| `/api/gmail/status` | List connected Gmail accounts | | | |
| `/api/gmail/sync` | | Scan connected inboxes, import new packages | | |
| `/api/gmail/connection/:id` | | | | Disconnect a Gmail account |
| `/api/packages` | List packages (`?hidden=all` includes excluded) | Create package | | |
| `/api/packages/:id` | Package detail with events | | Update display fields | Delete and add to exclusions |
| `/api/packages/:id/refresh` | | Re-fetch events from the carrier API | | |
| `/api/packages/refresh-all` | | Refresh every package that has a carrier adapter | | |
| `/api/exclusions` | List excluded tracking numbers | | | |
| `/api/exclusions/:id` | | | | Remove from exclusion list |

All `/api/...` routes require JWT authentication. Obtain a token via `POST /auth/signin`.

## Postman Collection

- [Collection JSON](api/postman/Package%20Tracker.postman_collection.json)
- [Environment JSON](api/postman/Package%20Tracker%20%28Production%29.postman_environment.json)
- [Collection Postman Link](https://go.postman.co/collection/49915090-d691edcd-2f21-4af2-838c-08591838653b)

### Collection Details

| #  | Request                              | Method                                | Expected Status |
| -- | ------------------------------------ | ------------------------------------- | --------------- |
| 1  | Health check                         | GET /health                           | 200             |
| 2  | Auth wall (no token)                 | GET /api/packages                     | 401             |
| 3  | Signup (random user)                 | POST /auth/signup                     | 201             |
| 4  | Signin (get JWT token)               | POST /auth/signin                     | 200             |
| 5  | Error: Wrong password                | POST /auth/signin                     | 401             |
| 6  | Gmail status (not connected)         | GET /api/gmail/status                 | 200             |
| 7  | Begin OAuth handshake                | POST /api/gmail/connect               | 200             |
| 8  | Gmail status (after auth)            | GET /api/gmail/status                 | 200             |
| 9  | Trigger Gmail sync                   | POST /api/gmail/sync                  | 200             |
| 10 | List packages                        | GET /api/packages                     | 200             |
| 11 | Add a FedEx package                  | POST /api/packages                    | 201             |
| 12 | Add a UPS package (no adapter)       | POST /api/packages                    | 201             |
| 13 | Get package detail                   | GET /api/packages/:id                 | 200             |
| 14 | Update package label                 | PATCH /api/packages/:id               | 200             |
| 15 | Refresh from carrier                 | POST /api/packages/:id/refresh        | 200             |
| 16 | List with hidden                     | GET /api/packages?hidden=all          | 200             |
| 17 | Delete a package                     | DELETE /api/packages/:id              | 204             |
| 18 | List exclusions                      | GET /api/exclusions                   | 200             |
| 19 | Re-add deleted package: 409 EXCLUDED | POST /api/packages                    | 409             |
| 20 | Remove an exclusion                  | DELETE /api/exclusions/:id            | 204             |

### How to Run

1. Import the Collection JSON and Environment JSON into Postman (or use the Postman link above).
2. Select the **Package Tracker (Production)** environment.
3. Click "Run Collection". At step 7, copy the returned `authorization_url` into a browser, complete Google's consent flow, then continue from step 8.
4. All 20 requests should pass (46/46 assertions).
