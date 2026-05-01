# WebAPI Final Project - Frontend

React SPA for the Personal Package Tracker. Consumes the API at `webapi-final.onrender.com`.

## Quick start

```bash
cd web
npm install
npm start
```

The app runs on http://localhost:3000 in development. The API base URL comes from `REACT_APP_API_BASE_URL` in `.env.development` (`http://localhost:3000` for local dev) and `.env.production` (`https://webapi-final.onrender.com` for the production build).

## Scripts

- `npm start` - dev server with hot reload.
- `npm test` - Jest test runner in watch mode.
- `CI=true npm test` - run tests once and exit.
- `npm run build` - produce a production bundle in `build/`.
- `npm run format` - run Prettier on `src/`.
- `npm run format:check` - verify formatting without writing.

## Architecture

See `docs/superpowers/specs/2026-05-01-web-frontend-design.md` for the full design spec, and `docs/superpowers/plans/2026-05-01-web-frontend-slice-1-implementation.md` (and subsequent per-slice plans) for the implementation plan.

## Tech stack

React 19, react-scripts 5, Redux Toolkit 2, react-router-dom 6, react-bootstrap 2.10. Testing via Jest, React Testing Library, MSW v1. End-to-end Playwright tests added in Slice 5.

## Slice status

Slice 1 (Skeleton): in progress / complete pending the rest of this milestone.
