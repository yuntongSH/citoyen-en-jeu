# Security

Do not post authentication tokens, email addresses or database records in public issues. Use GitHub’s private vulnerability reporting feature when enabled. If it is unavailable, report only that you need a private security contact; do not disclose exploit details or personal data publicly.

Before enabling accounts, verify the Supabase migration with two separate users and an anonymous request. No anonymous user may read or write progress. User A must not be able to access or modify user B’s data. The deletion endpoint derives the account from a verified token and accepts no target user identifier.

Service-role keys are used only inside the account-deletion function. Browser configuration accepts publishable keys. Keep email confirmation enabled, configure appropriate authentication rate limits and monitor delivery. Supabase’s default test SMTP service does not support a public launch.
