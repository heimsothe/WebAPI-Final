# Postman Test Collection

Demonstrates the chained user workflow against the deployed Package Tracker API.

## Files

- `PackageTracker.postman_collection.json` - the collection (4 folders, 18 requests).
- `PackageTracker.postman_environment.json` - environment variables (host).

## How to import

1. Open Postman.
2. File > Import. Select both JSON files.
3. In the top-right environment selector, choose "Package Tracker (Production)".
4. If running against local dev, override `host` to `http://localhost:8080`.

## How to run

### Manual demo run

Click "Run Collection" in Postman, step through each request. At "Gmail > POST /api/gmail/connect", copy the returned `auth_url` into a browser, complete Google's consent flow, then continue running the collection.

### Newman CLI (optional)

```bash
npx newman run PackageTracker.postman_collection.json \
    -e PackageTracker.postman_environment.json \
    --folder Auth
```

Skips the Gmail folder because the OAuth callback requires a browser. Useful for CI.

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
