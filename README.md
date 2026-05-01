# Personal Package Tracker

CSCI 3916 Final Project. A full-stack package tracker that gathers tracking numbers from a Gmail inbox, classifies them by carrier, and aggregates each carrier's tracking API into one timeline.

See `CLAUDE.md` for project context (excluded from this repo's history; lives in the docs repo at `$HOME/.webapi-final-docs.git`).

## Deployment (Render)

The project deploys two Render services from this repo:

| Service | Type | Root directory | Build command | Start command |
|---------|------|----------------|---------------|---------------|
| `<api-name>` | Web Service | `api/` | `npm install && npx prisma generate && npx prisma migrate deploy` | `node server.js` |
| `<frontend-name>` | Static Site | `web/` | (none) | (publish directory: `.`) |

Replace `<api-name>` and `<frontend-name>` with your chosen service names. The API service auto-runs `prisma migrate deploy` on every build, so pending migrations apply on push to `main`.

### Environment variables (API service)

Set these in Render's dashboard for the API web service. Most reuse values from your local `api/.env`:

| Var | Production value |
|-----|------------------|
| `DATABASE_URL` | Supabase pooled URL, port 6543 |
| `DIRECT_URL` | Supabase direct URL, port 5432 |
| `JWT_SECRET` | same as dev `.env` |
| `TOKEN_ENCRYPTION_KEY` | same as dev `.env` (must be exactly 32 bytes) |
| `GOOGLE_CLIENT_ID` | same as dev `.env` |
| `GOOGLE_CLIENT_SECRET` | same as dev `.env` |
| `GOOGLE_REDIRECT_URI` | `https://<api-name>.onrender.com/auth/google/callback` |
| `FRONTEND_URL` | `https://<frontend-name>.onrender.com` (also drives CORS) |
| `FEDEX_API_BASE_URL` | `https://apis-sandbox.fedex.com` |
| `FEDEX_CLIENT_ID` | same as dev `.env` |
| `FEDEX_CLIENT_SECRET` | same as dev `.env` |
| `NODE_ENV` | `production` |

Do NOT set `PORT` - Render injects it automatically.

### Google Cloud Console (manual one-time step)

After the API service is up and `<api-name>.onrender.com` is known:

1. Open Google Cloud Console > APIs & Services > Credentials > the OAuth 2.0 Client ID used for this project.
2. Under "Authorized redirect URIs", add: `https://<api-name>.onrender.com/auth/google/callback`.
3. Keep `http://localhost:8080/auth/google/callback` so local dev still works.
4. Save.

### Post-deploy smoke

```bash
# Health check
curl https://<api-name>.onrender.com/health
# expect: {"status":"ok","service":"webapi-final-api"}

# Auth wall
curl https://<api-name>.onrender.com/api/gmail/status
# expect: HTTP 401

# Demo signin (if a demo user exists on Supabase)
curl -X POST https://<api-name>.onrender.com/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@demo.com","password":"Demo1234"}'
# expect: 200 with token
```

The free-tier dyno spins down after ~15 minutes of inactivity. The first request to a sleeping dyno takes 30-60 seconds; subsequent requests are normal speed.

### Postman test collection

`api/postman/Package Tracker.postman_collection.json` exercises the chained workflow (auth, Gmail OAuth, packages, exclusions). See `api/postman/README.md` for import and run instructions.
