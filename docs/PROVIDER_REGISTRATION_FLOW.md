# B2ME — Preliminary Provider Registration (Iraq-first)

## Approved user flow
1. The B2ME entry screen offers **استكشف الشركات / Explore Companies** and **تريد تعرض خدماتك؟ / Want to Offer Your Services?**.
2. Exploring the directory does **not** require an account. There is **no Continue as Guest button**.
3. The provider option opens the initial registration form directly. The initial registration is **not skippable**.
4. The initial form contains:
   - **Required:** Full Name (الاسم الكامل), Phone (رقم الهاتف), Email (الايميل).
   - **Optional:** Job Title (العنوان الوظيفي), Company Name (اسم الشركة), Official Website (الموقع الرسمي), Facebook/Instagram/LinkedIn/X (حسابات التواصل الاجتماعي).
5. The exact approved note is shown below the fields:

> هذه الاستمارة تعد استمارة تسجيل اولية و بعد تأكيد التسجيل سيتم تزويدكم بمنصة خاصة بحسابكم لرفع معلومات و صور و نماذج اعمالكم مع وسائل التواصل معكم.

6. The app inserts the form fields into `public.provider_applications`. It does not sign the visitor up, ask them to choose a password, or create a company.
7. The B2ME admin dashboard shows new requests in its **طلبات مقدمي الخدمات الأولية** inbox. Only an account with the server-issued `app_metadata.b2me_admin` role can read or review the rows. Visitors can submit form fields but cannot read, edit or approve any application.
8. The app stores the request in the B2ME admin inbox; no Auth account is created. The admin can invite a suitable applicant or reject the request. A protected function checks the caller's `app_metadata.b2me_admin` role, sends the Auth invitation, creates a pending company workspace, and records the review. The invitation redirects to the provider dashboard, where the applicant can complete the profile while it remains unpublished.
9. The provider dashboard stays locked for visitors without an account. Invited providers can edit their own pending workspace; the company and its content remain subject to B2ME moderation.

## Notes
- A preliminary application does **not** create an Auth user or company record.
- Company/listing moderation continues to use the existing protected moderation RPC and audit trail.
- The application inbox and `create-provider-account` Edge Function are deployed. The function requires the existing `b2me_admin` Auth role. Supabase Auth must allow the deployed site's `/provider-dashboard.html` redirect, and production SMTP/email delivery needs an end-to-end check.
- The admin inbox checks for new requests every 45 seconds while the dashboard is open and reports the number of new requests. Email alerts are still pending: no administrator recipient or verified sending setup has been supplied, so no public mail-sending endpoint was deployed.
- The old draft migrations in `supabase/migrations/0001_initial_schema.sql` must not be run against the live DB.
- The original approved B2ME logo and app identity have been preserved. No new brand asset has been generated.
- Verified on source code: syntax checks, required fields, exact form note, no account-creation step in the initial form, and an admin-only application inbox.
- Real account email delivery, SMTP, Auth URL redirects and full end-to-end account testing remain necessary before launch.
