# B2ME — Business to Me

An Iraq-first B2B discovery app for companies, freelance providers and business customers. This GitHub repository and its Supabase organization/project are **independent of MIRA, VYRSIA and other projects**.

## Current implementation (October 10, 2026)

| Component | Actual status |
| --- | --- |
| `index.html` | Existing Arabic/English branded app UI **integrated in code** with live Supabase Auth and REST for company directory, search, favorites, provider applications and inquiries |
| `provider-dashboard.html` | Separate provider web console integrated in code with live provider profiles, products/services, offers, inquiries, image uploads |
| `admin-dashboard.html` | Separate admin approval console integrated with protected moderation RPC and immutable server-issued admin role |
| `b2me-api.js` | Shared browser-safe Supabase REST, Auth and storage client; also embedded in the standalone HTML preview files |
| `b2me-app-live.js`, `b2me-provider-live.js` | Readable live integration logic for each UI; copies embedded in the respective HTML files |
| Supabase database | **14 public tables**, RLS, admin approval auditing, company subscription triggers and image storage |
| Supabase Auth user accounts | **0 actual accounts at last inspection**; first admin still needs provisioning |
| Transactional email, push, paid plans | **Not enabled** |
| Production deployment and true multi-user end-to-end testing | **Not done yet** |

The browser screens have their original approved identity and embedded brand image. The backend key included in public client code is a **publishable key**, not a service role or secret. The GitHub repository is publicly readable.

## Product decisions
- **Iraq only at first**, extensible to other countries.
- Email-based sign-up/login with a Remember Me option. Browsing may be done as a guest; sending inquiries and saving favorites require a real authenticated account.
- The approved original B2ME logo is never regenerated, redrawn or recolored.
- Slogan only on first screen: **كل الحلول اليحتاجها عملك بمكان واحد** / **All the solutions your business needs in one place**.
- First-screen footer: **Powered by** the approved ASAS 360° logo.
- Providers edit services, business profiles and offers in the **separate provider dashboard**, not the consumer app.
- Approval workflow: company profiles, listings and promotional offers must be approved by B2ME admin.
- Contact requests are currently saved privately inside B2ME. Sending provider emails will require a protected delivery backend.
- No payment collection has been activated.

## Operational setup
- Backend project: https://supabase.com/dashboard/project/wlamwvhrcezhpbudfzhp
- [Live Supabase schema/status](docs/LIVE_SUPABASE_STATUS.md)
- [Secure first admin setup and release checklist](docs/ADMIN_SETUP.md)
- [Implementation checklist](docs/IMPLEMENTATION.md)
- Legacy `supabase/migrations/0001_initial_schema.sql` is **obsolete and unexecuted**. Never run it against the live project.

## What has been tested
- Source-code JavaScript syntax for standalone HTML, Auth and admin UI.
- Simulated HTTP login, Remember Me persistence, privileged request headers, session availability, REST writes, and sign-out.
- DB catalog, RLS enabled across exposed public tables, SQL privileges, admin role gating and Supabase security advisor.
- **Not** a real multi-account auth/approval/inquiry/browser test yet. All first-user tests are pending.

## Next release tasks
1. Configure confirmed production web address, Supabase Auth URL allow-list and email confirmation/SMTP.
2. Create and verify the first account; assign the appropriate **server-side app_metadata** admin claim on the verified exact account only.
3. Test consumer browsing, provider applications, approvals, inquiry routing and cross-account access with separate real accounts.
4. Build rate-limited transactional email delivery, push notifications where appropriate, proper logout/error states and password reset.
5. Decide approved plan rates, production hosting, privacy policies and payment provider before launch.

Nothing in MIRA or VYRSIA was changed.
