# B2ME implementation / go-live checklist

## Project isolation
- **Only** deploy to a newly created Supabase project specifically reserved for B2ME. Do not run B2ME SQL against MIRA/VYRSIA or any currently existing unidentified project.
- Create a new GitHub repository for B2ME (already exists as `ahmedwaleed07/B2ME-App`).
- Keep live provider dashboard separate from the consumer browsing app. No provider editing inside the mobile app.

## Authentication
- Email-only signup/signin, **email confirmation required**.
- Use Supabase Auth user sessions; `Remember me` must persist only approved sessions, not raw passwords. Non-remembered sessions should be cleared when app is closed (requires testing on each platform).
- Configure custom SMTP before public launch: the built-in sender is limited and not intended for a production marketplace.
- Don't disclose whether an email belongs to an account in password-reset responses.

## Provider approval and content
- New providers start in `pending`; only administrators may activate providers.
- New offers start as `draft`; suppliers submit to the review queue through the `submit_offer_for_review()` RPC.
- A change to an active provider's publicly visible details moves it back to `pending` for reapproval.
- Edits to reviewed offers mark them `pending_review` to prevent silent modification of live content.
- Only a server-side admin may publish/reject offers or assign paid subscriptions and placements.
- Public listings exclude suspended providers and their published offers.

## Contact requests
- All inquiry submissions require a logged-in authenticated user and explicit contact consent.
- The inquiry email must match the signed-in user's email in the JWT.
- The request is stored privately and only visible to the requester and the receiving provider.
- Email lead delivery is **not yet implemented**. Build a secure Edge Function that validates user identity, inquiry ownership, provider destination, and rate limits before sending email. Avoid duplicate sends (idempotency key / delivery log).
- Provider must not see any other supplier's inquiries.

## Notifications and marketing
- Distinguish service notifications from marketing campaigns.
- Marketing notifications and emails need an opt-in flag and working unsubscribe.
- Do not send bulk offers until provider plans and explicit campaign approval are implemented.
- A distinctive notification sound is a UI preview feature; actual device push delivery still needs notification permissions and native push setup.

## Storage
- Approve uploaded business logos/covers, validate MIME and dimensions, enforce object ownership via Supabase Storage policies. Avoid public write buckets.
- Do not store any keys, SMTP credentials, customer info, or privileged tokens in the public GitHub repository.

## Tests before publishing
- Create a B2ME-only test user A, supplier B, and admin C; verify all cross-account RLS paths.
- Confirm unapproved provider cannot appear publicly or publish offers.
- Confirm clients cannot update `provider_subscriptions`, `featured_placements`, or any status field.
- Test mobile Arabic/English, sign-in, sign-out, forgotten password, Remember Me, contact email deliverability and anti-spam.
- GitHub Pages is for code previews, not for production commercial marketplace hosting. Use a suitable static hosting provider (for example Cloudflare Pages) before real launch.

**Current stage:** migration prepared and statically checked; not deployed on Supabase, backend flows not active.