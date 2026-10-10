# B2ME Admin Account Provisioning & Release Checklist

## What is implemented
The real B2ME project `wlamwvhrcezhpbudfzhp` has a live schema, approval RPC and moderation log. UI pages use a **browser-safe publishable key** and Supabase Auth + REST:
- `index.html` — customer app; sign up, email login, browse public approved companies, company favorites, inquiries, provider signup.
- `provider-dashboard.html` — private provider console; company data, pending services and offers, stored customer inquiries and public image uploads.
- `admin-dashboard.html` — private administrator console; approve/reject/suspend providers, publish/reject/archive listings, approve/reject/archive provider offers.

All pages preserve the accepted B2ME original brand asset; admin page reuses the exact embedded logo from `index.html`.

## Bootstrapping an administrator

**Status at the end of the October 10, 2026 backend check: 0 registered users and 0 admins.** Therefore approval workflows are implemented, but no human can operate them yet.

1. Configure `Authentication > URL Configuration` for the eventual approved deployment origin and email confirmation/recovery redirects.
2. Configure `Authentication > Email` as appropriate; Supabase's default mail sender is restricted and unsuitable for real production traffic. Use an authorized transactional email service for production.
3. Create a **real** B2ME email account via `index.html` and verify the mailbox. Do not share passwords or credentials with a developer or assistant.
4. Use a **trusted server-only Supabase Auth Admin API** (`auth.admin.updateUserById`) to set **`app_metadata.b2me_admin = true`** on the **verified exact account ID**, after confirming the user is the account owner. This must be done using a securely stored server secret, never from JavaScript or in GitHub. Do not grant admin to all users or by email-domain matching.
5. Log out, log back in, and open `admin-dashboard.html` so the updated JWT includes the admin authorization claim.
6. Test the following with separate real test accounts: ordinary users cannot read pending providers or approve any item; providers can see only their own inquiries and cannot self-approve; the admin can approve, and the approved company and published listing become visible to anonymous visitors.
7. Check the `b2me_private.moderation_log` audit trail and company trial fields.

## Risk management
- **No email inquiry delivery** yet. Inquiries are stored in Supabase and cause internal provider notification records only. Real delivery must be through a rate-limited protected backend with verified addresses, opt-in where applicable and provider-managed SMTP/API secrets.
- **No real push notification delivery** yet.
- **No live payment or charging**. The 60-day trial is a recorded status only; paid subscriptions require additional implementation, plan/price approval and server-side enforcement.
- **No publicly deployed production site**. GitHub and third-party HTML previews are development demonstrations, not controlled production hosting; configure security headers, canonical redirect URLs and proper deployment before launch.
- Remote schema was applied by Supabase operations. Existing repository file `supabase/migrations/0001_initial_schema.sql` is an **obsolete never-applied draft** and must not be executed against this live project.
- Current auth/browser tests are smoke/syntax tests, not real production user-journey validation.
