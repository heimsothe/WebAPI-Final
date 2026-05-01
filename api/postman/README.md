# Postman Test Collection

Demonstrates the chained user workflow against the deployed Package Tracker API.

## Files

- `Package Tracker.postman_collection.json` - the collection (18 requests, prefixed `[Auth]` / `[Gmail]` / `[Packages]` / `[Exclusions]`).
- `Package Tracker (Production).postman_environment.json` - environment variables (host).

Both files are byte-identical to what Postman exports from the cloud collection at https://go.postman.co/collection/49915090-f269da5e-473f-47cc-8ceb-537bfa4d85d9 . Re-exporting from Postman should produce a zero-diff against these files.

## How to import

1. Open Postman.
2. File > Import. Select both JSON files.
3. In the top-right environment selector, choose "Package Tracker (Production)".
4. If running against local dev, override `host` to `http://localhost:8080`.

## How to run

### Manual demo run

Click "Run Collection" in Postman, step through each request. At "[Gmail] POST /api/gmail/connect", copy the returned `authorization_url` into a browser, complete Google's consent flow, then continue running the collection.

### Newman CLI

```bash
npx newman run "Package Tracker.postman_collection.json" \
    -e "Package Tracker (Production).postman_environment.json"
```

Runs all 18 requests end-to-end against the deployed API. Expected outcome: 35/35 assertions pass.

## Variables captured at runtime

| Variable | Set by | Used by |
|----------|--------|---------|
| `token` | `POST /auth/signup` test script | every authenticated request |
| `connection_id` | `GET /api/gmail/status` test script | (reserved; not currently exercised by a request) |
| `package_id` | `POST /api/packages` (FedEx) test script | GET-detail, PATCH, refresh |
| `ups_package_id` | `POST /api/packages` (UPS) test script | DELETE for the UPS package |
| `exclusion_id` | `GET /api/exclusions` test script | DELETE exclusion |

## Known caveats

- The `POST /api/packages/:id/refresh` request typically returns 200 with `skip_reason: "rate_limited"` because the FedEx adapter's cooldown is 5 minutes from the prior POST.
- FedEx sandbox tracking number `522005684672` returns deterministic data; if FedEx rotates their sandbox responses, the "events populated" assertion may fail. Swap in another sandbox number from `api/test/helpers/fixtures.js` if needed.
