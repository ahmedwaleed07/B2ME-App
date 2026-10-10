# B2ME — Iraq-first B2B marketplace (foundation 01)

## Status
- Working interactive **UI prototype** (Arabic + English): `index.html`.
- Separate **provider web dashboard UI prototype**: `provider-dashboard.html`.
- No actual user accounts, live mail delivery, push notifications, payments, database connections or real suppliers yet. Demo data only.
- No edits made to MIRA or VYRSIA.

## Run locally
You can open `index.html` in a modern desktop browser. On iPhone, serve the whole folder as an HTTPS web site: iOS file viewers may block scripts or relative assets. For local development:

```bash
cd B2ME_Starter_01
python3 -m http.server 8080
# Open http://localhost:8080 in your browser
```

## Brand assets
- `assets/b2me-approved-letters.png`: isolated original accepted B2ME logo lettering (not AI-regenerated); no square frame. Source: user's approved reference.
- `assets/asas-shield-approved-neon.png`, `assets/asas-wordmark-approved-neon.png`: direct non-redrawn crops of the recently approved **outlined / hollow ASAS shield** and original-styled wordmark with a pink-to-purple neon gradient. Display side by side following “Powered by” only on the first authentication screen. The approved full artwork is saved unchanged as `assets/asas-approved-neon-full-reference.png`; crops preserve its pixels without regenerating the artwork.
- `assets/asas-logo-original.png`: unchanged ASAS logo used in sample business card.

## Planned production separation
- **Consumer mobile/web app**: sign in/up with email only + Remember me, discovery, categories, favorites, notification feed, lead forms.
- **Provider dashboard (web only)**: manage company/freelancer profile, services, cover/logo, offers, contact info, request inbox, billing overview.
- **Admin console (future)**: approve providers, verify identities, subscriptions, campaigns and broadcasts.
- **Supabase**: independent project; migration at `supabase/migrations/0001_initial_schema.sql` is a proposed schema; **not executed**.
- **Emails**: require SMTP/email provider and a protected server-side edge function; user data must not be sent to any browser-exposed service-role key.

## Launch checklist
1. Use the dedicated **B2ME-App** GitHub repository, separate from `MIRA-App`.
2. Confirm Supabase organization and available project slot (do not reuse MIRA's database).
3. Apply and review migrations on the B2ME project only.
4. Implement Supabase Auth email verification and session persistence. Add CAPTCHA/rate limits to lead form.
5. Build protected server-side lead email sender, provider verification, admin console, approved offer publishing, and consent-managed marketing notifications.
6. Test both languages on Safari/Android, secure RLS, then deploy.

## Connected-services status (2026-10-10)
- GitHub connector has access to the existing independent `B2ME-App` repository. The **B2ME-App** repository was created as public for initial code review; never commit secrets or real customer data. Do not modify MIRA.
- Supabase connector exposes the existing `ASAS 360°` Free organization and one active project, but **does not expose creation of a new organization**. Create/confirm a separate Free organization in Supabase web UI (subject to free-project limits), then check project cost before creation. No Supabase project has been created or modified.
- This archive is a demo scaffold; SQL is a **draft** and must not be run on MIRA. Never commit real keys.

## Upload instructions (when repository is created)
1. Open https://github.com/new and create a **Private** repository named `B2ME-App`, ideally without initializing README/license/.gitignore (they are already in this bundle).
2. Ensure the connected GitHub integration can access the new repository. After that, return here and ask to publish the ready files.
3. In Supabase, create/confirm a separate Free organization and check remaining project quota. Creating a new organization or Supabase project is **not part of this package**, and no production database is modified.

## Testing limits
- Static JavaScript syntax and local asset presence checked.
- Browser automation in the available container could not navigate to `file://` or `localhost` because those URLs were blocked by administrator policy. This is *not* a deployment or Safari test.
## Public repository safety
- This is a prototype only; no live authentication or email delivery yet.
- A public repository exposes all source files. Never commit credentials or customer information.
- GitHub Pages is not intended as free hosting for a commercial marketplace. Choose a suitable host such as Cloudflare Pages for public testing and a production deployment later.
