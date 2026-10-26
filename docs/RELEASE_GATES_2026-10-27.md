# B2ME production release gates — 27 October 2026

This checklist is deliberately separate from the obsolete 0001 migration. Never replay that migration on the live B2ME project.

## Verified baseline
- Supabase project wlamwvhrcezhpbudfzhp: ACTIVE_HEALTHY.
- Live database: 0 Auth users, 0 providers, 0 applications, 0 inquiries, 0 listings; 9 categories.
- Edge function create-provider-account: deployed, JWT verification enabled.
- Security advisor: no findings. Performance advisor: provider_applications reviewed_by foreign key needs an index; two admin application RLS policies should cache auth lookups.
- GitHub Pages workflow succeeded on 22 October. This does not prove production readiness.

## P0 — blocked until an authorized operator completes setup
- [ ] Configure production origin, Auth redirect allow-list, verified sender and SMTP.
- [ ] Register and verify the exact first admin account. Grant app_metadata.b2me_admin server-side to that account ID only; never store privileged keys in browser/GitHub.
- [ ] Exercise actual application submission -> admin inbox -> invitation -> provider pending workspace -> moderation -> public discovery with distinct test accounts.
- [ ] Exercise user inquiry -> private provider inbox -> status update; test cross-tenant denial.
- [ ] Test login, recovery, logout, mobile layouts, Arabic/English, provider type toggle, empty/error states.
- [ ] Add protected rate-limited inquiry email delivery, delivery logs and idempotency; avoid exposing customer information.
- [ ] Publish privacy policy, terms, contact details, and complaint process; check local operating requirements.
- [ ] Configure controlled production hosting, HTTPS, monitoring, backups and recovery drills.

## P1 — launch improvements
- [ ] Resolve performance advisor findings after reviewing existing policies and indexes; avoid deleting indexes just because usage is currently zero.
- [ ] Reconcile version-controlled migrations with deployed live schema. Do not run obsolete 0001.
- [ ] Add repeatable real-user acceptance tests and deployment smoke checks.
- [ ] Confirm exact Arabic/English labels, Companies/Freelancers selected-state styling, and no demo content presented as live.
- [ ] Recruit and approve a small pilot provider cohort before opening to public traffic.

## Deferred, not a blocker for a free pilot
- [ ] Paid plans, payment provider, featured promotions and push notifications require separate commercial and compliance decisions.
