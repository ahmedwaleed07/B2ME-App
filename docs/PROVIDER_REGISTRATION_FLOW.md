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

6. New accounts proceed through password creation and an email confirmation message. Account signup uses the verified Supabase Auth API and attaches preliminary registration data to user metadata. A protected trigger extracts these data and creates a `pending` company application associated with the new user. Company approval is blocked until the account email is verified.
7. Existing signed-in accounts can submit the same preliminary registration directly, which creates a pending company profile. They cannot self-approve it.
8. Provider dashboard is locked until there is at least one **approved** company for that account. Before approval, the dashboard displays the pending-status explanation and a link back to the app.

## Notes
- The user does **not** get an active provider dashboard solely from submitting the form or verifying email: B2ME admin approval is required.
- Admin approval uses the existing protected moderation RPC and audit trail.
- The old draft migrations in `supabase/migrations/0001_initial_schema.sql` must not be run against the live DB.
- The original approved B2ME logo and app identity have been preserved. No new brand asset has been generated.
- Verified on source code: syntax checks, required fields, exact form note, absence of guest button, verified-email approval guard, pending-only dashboard gate.
- Real account email delivery, SMTP, Auth URL redirects and full end-to-end account testing remain necessary before launch.
