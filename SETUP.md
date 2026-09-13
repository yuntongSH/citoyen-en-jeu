# Activate email accounts

## Hosted project status — 13 September 2026

The dedicated `citoyen-en-jeu` project has been provisioned in Paris (`eu-west-3`). The progress migration and `delete-account` function are deployed. The site URL and deletion origin use the GitHub Pages site. Email confirmation is enabled; anonymous sign-in is off. Email codes are eight digits and expire after 600 seconds. New-user signup is disabled on Supabase while public email delivery is pending.

Live database checks passed for anonymous rejection, account isolation, direct-write rejection, stale revisions and deletion cascade; the temporary test data was rolled back. The deployed function rejects unknown origins, absent tokens and invalid tokens, and its allowed-origin preflight succeeds. The public API key cannot read or save progress anonymously.

Still required: verified email delivery, the code email template, a public privacy contact and completed provider information, followed by real login/sync/deletion checks. Supabase currently requires custom SMTP before the template can be edited. No real email login has been tested. Do not enable the website account switch yet.

## Set up a fork or finish activation

For a new fork, follow all steps below. For the hosted project, complete the pending steps above; do not create a second database.

1. Create a dedicated Supabase project in your own account. Prefer an EU database region for the intended audience. Keep the database password in your password manager.
2. Apply `supabase/migrations/202609130001_learning_progress.sql` in the SQL editor. It enables row-level security and the version-checked save function. This is a new schema, not a migration for another app’s database.
3. In Authentication, enable email verification. Set the site URL to the actual GitHub Pages URL. In the **Magic Link** email template, use `{{ .Token }}` to send a verification code. The website uses code entry, not a redirect link. Use the provided `supabase/email-template.html`, with subject “Votre code de connexion Citoyen”. Keep email verification enabled. The hosted project uses eight-digit codes with 600-second expiry. Configure and verify the signup confirmation template as required for the first-login flow, as well as the returning-login template.
4. Configure a transactional email provider via custom SMTP. Verify its sending domain. Supabase’s built-in sender only serves project-team addresses and is not a public email service. Put SMTP credentials in Supabase settings only, never in GitHub or frontend files.
5. Deploy `supabase/functions/delete-account` using the Supabase CLI or the dashboard editor. Set its `ALLOWED_ORIGINS` secret to `https://yuntongsh.github.io` (comma-separated exact origins if needed). The included config disables gateway JWT handling because the function explicitly verifies the bearer token with `auth.getUser`. Never remove that verification.
6. Complete `dist/privacy.html` with the responsible publisher/contact, database region, email provider and applicable transfer/retention information. Review the processors’ terms and security settings. Set up a real contact method before collecting emails.
7. In GitHub **Settings → Secrets and variables → Actions → Variables**, add `CITOYEN_SUPABASE_URL`, `CITOYEN_SUPABASE_PUBLISHABLE_KEY` (starts with `sb_publishable_`) and `CITOYEN_PRIVACY_CONTACT`. These values are public. Keep `CITOYEN_ACCOUNTS_READY` unset until all checks below pass in a controlled preview. Never place a secret/service-role key in these variables.
8. Verify delivery to a non-team email, code expiry/reuse, failed login, returning login, two-device progress merge, offline recovery, account switching, export and deletion. Verify anonymous rejection, A/B record isolation, wrong-owner writes and stale-write rejection against the live database. Do not infer live security from local unit tests.
9. Enable new-user signup in Supabase after the controlled checks pass, set `CITOYEN_ACCOUNTS_READY=true`, then rerun the Pages workflow. Verify the deployed version. Enabling a button alone is not completion of setup.

For local testing, edit the public settings in `dist/config.js` in a private working copy. Do not use real learner records as test fixtures. For a self-hosted fork, change author/repository links and all allowed origins.

Sources: [Supabase email codes](https://supabase.com/docs/guides/auth/auth-email-passwordless), [SMTP requirements](https://supabase.com/docs/guides/auth/auth-smtp), [row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security), [GitHub Pages](https://docs.github.com/en/pages), [CNIL information notices](https://www.cnil.fr/fr/passer-laction/rgpd-exemples-de-mentions-dinformation).
