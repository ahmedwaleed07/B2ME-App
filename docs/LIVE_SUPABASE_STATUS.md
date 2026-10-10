# B2ME Live Supabase Backend (2026-10-10)

This document describes the **actual** B2ME backend (not the old draft schema).

## Project
- Organization: B2ME (independent; do not use MIRA or VYRSIA).
- Project: B2ME
- Project reference: `wlamwvhrcezhpbudfzhp`
- Dashboard: https://supabase.com/dashboard/project/wlamwvhrcezhpbudfzhp
- Project URL (public configuration): `https://wlamwvhrcezhpbudfzhp.supabase.co`
- Region: `ap-south-1` (Mumbai, India)
- Current organization plan: Free.

## Deployed PostgreSQL tables (public schema — 14)
- `countries`: country options; Iraq initially enabled.
- `profiles`: private account profile tied to `auth.users`.
- `categories`: bilingual nested categories.
- `companies`: company/freelancer/professional profiles; admin approval required.
- `listings`: product and service offerings; separate publication status.
- `favorites`: user favorites.
- `user_interests`: user interests by category.
- `inquiries`: authenticated requests to an approved provider.
- `subscription_plans`: admin-maintained plans; none activated.
- `company_subscriptions`: provider subscription status.
- `promotions`: featured placements and advertising; admin managed.
- `notifications`: per-user in-app notifications.
- `company_favorites`: account-scoped bookmarked approved companies.
- `provider_offers`: provider-submitted offers requiring administrative approval.

## Security
- All 14 public tables have RLS enabled.
- Explicit grants limit Data API access. Public visitors only see approved providers, published listings, active countries/categories/plans and qualifying active promotions.
- Private profiles, inquiries, favorites, user interests, subscriptions and notifications are user-scoped through RLS.
- Provider signup creates a pending provider. Status and verification cannot be set from the authenticated client.
- Offering creation creates a pending listing. Its publication status cannot be set from the authenticated client.
- Inquiry status can be changed only by the recipient provider; ordinary users cannot alter the message.
- No payment collection or email-sending secrets are configured.

## Database automation
- On `auth.users` INSERT, a `profiles` row is created.
- On `companies` INSERT, a `company_subscriptions` row is created.
- On first company approval, a 60-day trial is recorded.
- On `inquiries` INSERT, the recipient provider gets an **internal** notification record; **email and push delivery are not implemented**.

## Storage
- Public asset bucket: `b2me-public-images`.
- Allowed types: JPEG, PNG, WebP; maximum file size 5 MiB.
- Upload path convention: `<auth-user-id>/<filename>`. Only that authenticated user can create, update, and remove items in their own folder.
- Public bucket files are intended as public-facing marketing images, not confidential documents.

## Applied remote migration history
1. `20261010172632_b2me_core_12_tables`
2. `20261010173954_b2me_rls_and_minimum_data_api_grants`
3. `20261010174050_b2me_auth_trial_notification_automation_indexes`
4. `20261010174215_b2me_public_image_storage_with_owner_scope`
5. `20261010183228_b2me_contact_company_favorites_review_categories`
6. `20261010183322_b2me_provider_dashboard_offer_review_category`
7. `20261010193800_b2me_private_admin_moderation_rpc`
8. `b2me_moderation_indexes_and_category_edit_review`
9. `b2me_admin_rls_jwt_once_per_statement`
10. `b2me_consolidate_admin_read_rls`

**IMPORTANT:** `supabase/migrations/0001_initial_schema.sql` was an older, never-applied draft. It does **not** match the live schema and must **not** be applied to this project. Before building a new local migration chain, reconcile the live schema into version-controlled migrations. Do not run the old draft or attempt to replay the already-applied remote migration history.

## Application integration (code completed, acceptance testing pending)
- `index.html` is connected in source to the B2ME publishable REST/Auth API through embedded JavaScript. No demo company records are shown as live.
- `provider-dashboard.html` manages real provider records, listings, offers and private inquiries via authenticated RLS-protected requests.
- `admin-dashboard.html` moderates companies, listings and provider offers using an authenticated RPC backed by a private definer function with an immutable server-issued `app_metadata.b2me_admin` claim.
- Moderation events are recorded in the private audit log, and provider field changes reset an approved provider to pending. Edited published listings and approved offers return to the approval queue.
- Last user count check: **0**. The first administrator must be bootstrapped securely **after** registration, as in [ADMIN_SETUP.md](ADMIN_SETUP.md).
- The code was syntax-checked and the API client tested with mock network responses. Authentication, email confirmations, redirects, browser interaction and multi-user RLS tests with **real accounts** remain pending.
- Configure production URL and Auth email settings. Transactional request emails, mobile push notifications, payments, enforced trial expiration and controlled production hosting are **not live**.
- Do not activate paid subscriptions or any financial workflow until costs, provider approvals and privacy/security requirements are agreed.
