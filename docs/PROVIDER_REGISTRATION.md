# B2ME provider onboarding (Iraq-first)

## Approved user-facing flow

1. The app starts at the **choice** screen:
   - **استكشف الشركات / Explore Companies** opens the business directory immediately; no account needed for browsing.
   - **تريد تعرض خدماتك؟ / Want to Offer Your Services?** opens the **preliminary provider registration form**.
2. The separate **Continue as Guest** button was removed. Browsing via Explore Companies still works without an account.
3. Preliminary form fields, in display order:
   - **الاسم الكامل / Full name** — required
   - **العنوان الوظيفي / Job title** — optional
   - **اسم الشركة / Company name** — optional; empty implies freelancer
   - **رقم الهاتف / Phone number** — required
   - **الايميل / Email address** — required
   - **الموقع الرسمي / Official website** — optional
   - **حسابات التواصل الاجتماعي / Social media accounts** — optional Facebook, Instagram, LinkedIn, X
4. The exact Arabic note is displayed:

   > ملاحظة : هذه الاستمارة تعد استمارة تسجيل اولية و بعد تأكيد التسجيل سيتم تزويدكم بمنصة خاصة بحسابكم لرفع معلومات و صور و نماذج اعمالكم مع وسائل التواصل معكم.

5. **New accounts:** Once the preliminary form passes validation, a second step requests a password and confirmation. The app calls Supabase Auth signup with `data.b2me_provider_registration`. The private `auth.users` trigger records a pending company using this data; default company type is freelancer if the company name is blank. On a configured Auth instance, the applicant verifies email via the confirmation link.
6. **Existing signed-in accounts:** The same form submits a pending provider company through authenticated Supabase REST; email is fixed to the authenticated account.
7. **Approval is separate from signup and email confirmation.** The database prevents management from approving a provider unless their email is confirmed. Unapproved providers never appear in the public directory.
8. **Provider workspace:** `provider-dashboard.html` uses the authenticated account to manage the user's company and uploaded logo/cover, listings, offers, job title, and social links. Further portfolio galleries / work sample functionality is not yet live.

## Release blockers and tests

- Test a real signup, email confirmation link, and redirect from the **final approved hosting domain**, which must be configured under Supabase Authentication URL Configuration.
- Configure transactional SMTP if production email delivery exceeds default restrictions.
- Create and verify a genuine administrator account and grant `app_metadata.b2me_admin` only via protected backend. Admin approval runs through the protected RPC.
- Test multiple accounts and row isolation, duplicate signup behavior, and provider onboarding in the browser before calling the system production-ready.
- Browser source/preview includes a Supabase **publishable key**, never server secret keys; public directory is RLS-limited to approved providers.

Other app identities and original B2ME approved brand assets are unchanged.
