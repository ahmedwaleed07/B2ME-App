# ASAS 360° as a service supplier on B2ME

**Implementation:** The supplier profile is ready in `data/asas360-provider.json`. Multi-category discovery and per-service category selection are now implemented in the B2ME app and provider dashboard. **The supplier is not yet inserted into the live B2ME database**, because database access is not authorized in the current session.

## Directory profile

- Official name: ASAS 360° (do not alter its existing brand/logo)
- Location: Baghdad, Iraq
- Main category: `tech` (technology and automation)
- Additional service categories: `security` (security and safety), `ads` (marketing and advertising), `design` (design and photography), `consult` (consulting)
- Website: https://asas360.com
- Contact: info@asas360.com, +9647817262800
- Service catalogue: 16 entries in five existing B2ME categories; see the JSON source.

## Required production steps

1. In **B2ME** Supabase project `wlamwvhrcezhpbudfzhp`, confirm which existing **email-verified Auth account** legitimately owns the ASAS 360° supplier profile. Do not create or attach a supplier to an unrelated identity.
2. In the trusted SQL Editor, review `scripts/seed-asas360-provider.sql` against the **live** `companies`, `categories` and `listings` column schemas. Replace `REPLACE_WITH_VERIFIED_B2ME_OWNER_EMAIL` with that account's verified login. Do not run the obsolete `0001_initial_schema.sql`.
3. Run the seed only after confirming live schema compatibility. It is deliberately idempotent and leaves the provider/listings pending; run normal **B2ME Admin** moderation to approve the company and publish each service. Do not change their status from the public browser.
4. Upload the genuine original ASAS 360° logo into the approved provider's dashboard. Do not use a generated substitute.
5. Verify in a guest browser that ASAS appears when filtering Technology, Security, Advertising, Design, and Consulting, with the relevant services visible; verify other suppliers remain unchanged.

**Important:** A company alone is only searchable under its primary category; multiple category visibility requires published category-tagged service listings. The app now supports that behavior.

## Security and scope

This does not create a new B2ME category, change the first-screen 'Powered by ASAS 360°' mark, modify the official identity, or bypass provider approval and access controls. Do not confuse ASAS (supplier) with B2ME (marketplace operator).
