# B2ME — Business to Me

B2ME is an **Iraq-first B2B business-solutions discovery** project, built separately from MIRA and VYRSIA.

## Current status — UI prototype only
- `index.html`: self-contained, responsive Arabic/English app prototype, designed for convenient preview on mobile.
- `provider-dashboard.html`: **separate web dashboard** prototype for providers (including freelancers).
- Login, Remember Me, lead requests, favorites, promotions, and notifications are **demonstrations** until a backend is connected.
- No real accounts, customer data, payment processing, push messages, or emails are live.
- No Supabase project or migration has been deployed for B2ME.

## Approved experience
- First screen: email-only Sign In / Sign Up, Remember Me, and the single slogan: **كل الحلول اليحتاجها عملك بمكان واحد** / **All the solutions your business needs in one place**.
- Footer **only on the first screen**: Powered by + approved ASAS 360° shield and wordmark in B2ME pink-purple tones on one line.
- B2ME logo is the approved **B2/ME lettering without a square frame**.
- Next screen: Explore Companies as main button; secondary “Want to offer your services?” text link.
- Customers search for services/products/companies, browse categories, favorites, recently added, recommendations, and promoted offers.
- Company profiles include cover, logo, sector, contact information and external social links.
- Providers manage profiles, offers, covers and contact details **in the separate web dashboard, not in the consumer application**.

## Local preview
The two HTML files are self-contained and require no build step. Open them in a modern browser. For a mobile HTTPS preview, deploy to a suitable static hosting provider such as Cloudflare Pages.

## GitHub visibility
This repository is currently **public for development and review**. Never commit API secrets, database keys, private contact information, or customer records. `config.example.env` contains placeholders only. Hosting a commercial marketplace directly on GitHub Pages is not the intended production setup.

## Next development work
1. Set up a **new independent B2ME Supabase project** after verifying plan costs and the correct organization.
2. Review and apply database migration, grants, and row-level security on B2ME only (migration currently held in the prepared project ZIP, **not yet uploaded to this repository**).
3. Implement email verification, safe session persistence and secure provider approvals.
4. Send provider lead emails from a protected backend, with rate limiting, form validation and consent.
5. Manage paid placements/subscriptions centrally. Publish offers only after required approvals.
6. Browser and accessibility testing, iOS/Android checks and deployment.

## Resource separation
GitHub code is isolated in this repository; shared GitHub Actions quotas remain account-level. Supabase data must never be placed in the MIRA or VYRSIA projects.

No CI workflow has been activated here, and no changes were made to MIRA/VYRSIA.
