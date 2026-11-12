# B2ME hub — Admin Console

## Live deployment
- URL: https://admin.b2me-hub.app/
- Cloudflare Worker: `b2me-admin` (same account and zone as B2ME hub)
- Cloudflare Access: application `B2ME hub Administration`, 8-hour sessions, one verified owner email permitted by policy.
- D1 database: `b2me-production` (shared with `b2me-api`).
- HTML UI: `admin/dashboard.html`
- Backend: `admin/worker.mjs` with `__DASHBOARD_HTML__` injected as a JSON string at deploy time.

## Available workflows
- Overview and counts from live production D1, last-14-days provider application trend.
- Initial application: approve and issue an email invitation, or reject.
- Provider profiles: approve, reject, suspend, return to review.
- Listings and offers: publish/approve, reject, archive, return to review.
- Verification: approve/reject requests, mark the corresponding approved company as verified.
- Inquiries: new/read/contacted/closed.
- Promotions: activate/pause/end.
- Change requests: review and apply approved edits to the provider record.
- Accounts: inspect account details and revoke active sessions (not permanent suspension).
- Audit trail in `moderation_log`.

## Security model
All routes, including API endpoints, require Cloudflare Access AND a verified RSA-signed Access JWT, the expected audience, issuer and exact owner email. The Worker rejects requests from hosts other than `admin.b2me-hub.app`. Mutations also require JSON and same-origin requests. No shared administrator password or API keys are exposed to the browser.

## Source of truth and limitations
- User and provider data are read from Cloudflare D1. Legacy Supabase files in this repository are not used.
- Account deletion and full account suspension are intentionally not exposed. Provider suspension is available on provider profiles.
- The console monitors D1 operational records, not website visits, network traffic or finances; these require separate analytics connectors.
- Provider application approval uses the established email-code invitation format; a new company begins in `pending` status and needs a separate approval.
- Do not skip the email-invitation workflow by directly setting an application to approved.
- Up to 250 recent records are shown per category; add server-side pagination as volume grows.

## Deployment and smoke tests
1. Keep Access policy restricted to owner-approved email identities.
2. Upload a Worker module using Cloudflare Workers Upload Worker API with the D1 and Email bindings. Replace `__DASHBOARD_HTML__` with JSON.stringify(contents of `dashboard.html`).
3. Attach `admin.b2me-hub.app` as a Worker Custom Domain.
4. Verify unauthenticated access redirects to the Cloudflare Access sign-in. Log in as owner to inspect all categories.
5. Test a new provider application with a separate real account, verify email, approve invitation, approve resulting company, and verify visibility in customer directory. Test rejection and session revocation. Never use existing production records for destructive tests.

Initial release tests: Worker deployed successfully; Cloudflare Access login redirect verified; D1 dashboard queries verified against actual production schema. Human login and live moderation write actions require owner testing.
