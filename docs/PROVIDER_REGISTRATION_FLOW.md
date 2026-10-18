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
8. The admin can mark a request suitable or reject it. Creating the Auth account and sending the applicant an invitation must happen after this review. Email alerts to the B2ME admin are not configured yet; the request is available in the admin inbox after refresh.
9. The provider dashboard remains locked until a provider account and approved company record are created.

## Notes
- A preliminary application does **not** create an Auth user or company record.
- Company/listing moderation continues to use the existing protected moderation RPC and audit trail.
- The first stage of the preliminary-application flow is live in the B2ME database and app source. Admin email notification and post-approval account invitation still need to be configured and tested.
- The old draft migrations in `supabase/migrations/0001_initial_schema.sql` must not be run against the live DB.
- The original approved B2ME logo and app identity have been preserved. No new brand asset has been generated.
- Verified on source code: syntax checks, required fields, exact form note, no account-creation step in the initial form, and an admin-only application inbox.
- Real account email delivery, SMTP, Auth URL redirects and full end-to-end account testing remain necessary before launch.
