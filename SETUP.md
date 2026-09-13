# Activate email accounts

The integration is prepared. It is deliberately disabled until a real project and public email delivery exist. No account has been provisioned by this repository.

1. Create a dedicated Supabase project in your own account. Prefer an EU database region for the intended audience. Keep the database password in your password manager.
2. Apply `supabase/migrations/202609130001_learning_progress.sql` in the SQL editor. It enables row-level security and the version-checked save function. This is a new schema, not a migration for another app’s database.
3. In Authentication, enable email verification. Set the site URL to the actual GitHub Pages URL. In the **Magic Link** email template, use `{{ .Token }}` to send a verification code. The website uses code entry, not a redirect link. Use the provided `supabase/email-template.html` and keep code expiry and rate limits suitably short.
4. Configure a transactional email provider via custom SMTP. Verify its sending domain. Supabase’s built-in sender only serves project-team addresses and is not a public email service. Put SMTP credentials in Supabase settings only, never in GitHub or frontend files.
5. Deploy `supabase/functions/delete-account` using the Supabase CLI. Set its `ALLOWED_ORIGINS` secret to `https://yuntongsh.github.io` (comma-separated exact origins if needed). The included config disables gateway JWT handling because the function explicitly verifies the bearer token with `auth.getUser`. Never remove that verification.
6. Complete `dist/privacy.html` with the responsible publisher/contact, database region, email provider and applicable transfer/retention information. Review the processors’ terms and security settings. Set up a real contact method before collecting emails.
7. In GitHub **Settings → Secrets and variables → Actions → Variables**, add `CITOYEN_SUPABASE_URL`, `CITOYEN_SUPABASE_PUBLISHABLE_KEY` (starts with `sb_publishable_`) and `CITOYEN_PRIVACY_CONTACT`. These values are public. Keep `CITOYEN_ACCOUNTS_READY` unset until all checks below pass in a controlled preview. Never place a secret/service-role key in these variables.
8. Verify delivery to a non-team email, code expiry/reuse, failed login, returning login, two-device progress merge, offline recovery, account switching, export and deletion. Verify anonymous rejection, A/B record isolation, wrong-owner writes and stale-write rejection against the live database. Do not infer live security from local unit tests.
9. Set `CITOYEN_ACCOUNTS_READY=true`, then rerun the Pages workflow. Verify the deployed version. Enabling a button alone is not completion of setup.

For local testing, edit the public settings in `dist/config.js` in a private working copy. Do not use real learner records as test fixtures. For a self-hosted fork, change author/repository links and all allowed origins.

Sources: [Supabase email codes](https://supabase.com/docs/guides/auth/auth-email-passwordless), [SMTP requirements](https://supabase.com/docs/guides/auth/auth-smtp), [row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security), [GitHub Pages](https://docs.github.com/en/pages), [CNIL information notices](https://www.cnil.fr/fr/passer-laction/rgpd-exemples-de-mentions-dinformation).
