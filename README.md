# Citoyen — Le livret en jeu

Learn French civic knowledge one small step at a time. A free, independent learning project by [yuntongSH](https://github.com/yuntongSH).

**[Open the website](https://yuntongsh.github.io/citoyen-en-jeu/)** · [Official learning resources](https://formation-civique.interieur.gouv.fr/) · [Contribute](CONTRIBUTING.md)

## What you can learn

- 50 short lessons across republican values, institutions, rights, history and daily life.
- Memory cards, original 10-question practice quizzes, a timeline and institution activities.
- Optional English explanations alongside the French learning material.
- Local progress without an account.
- Email-code accounts and private progress synchronization, ready to connect to a dedicated Supabase project.

**Current account status:** disabled until Supabase, delivery of authentication emails, privacy details and live security checks have been configured. The public site does not collect login emails in this state. A local-only progress record is not a cloud account.

## Scope and official sources

This is an introductory course, **not comprehensive exam preparation, an official mock examination, an exam registration service or a certificate**. Course completion and quiz points are not a predicted exam score. Naturalisation and Carte de résident need separately mapped preparation.

The 2026 editorial audit identified missing and partial topics, imprecise page references, and the need for a properly reviewed exam-mode question bank. Contributions addressing those gaps are welcome. The official handbook itself is not exhaustive. See [SOURCES.md](SOURCES.md).

The project links to government publications; it does not redistribute the PDFs, official question bank, government logos, photographs, or the creator’s personal documents. MIT covers this repository’s original software and original teaching expression, not third-party material or rights held by official publishers. Bundled dependencies retain their own notices.

## Run locally

Requires Node.js 22 or later.

```sh
npm ci
npm test
npm run build
npm start
```

Open the address printed by the server. `dist/` contains the static website; `src/accounts.js` contains account integration; `supabase/` contains the private database migration and account-deletion endpoint. The account integration is built into `dist/accounts.js` without a third-party JavaScript CDN.

## Publish from your GitHub

This repository includes a GitHub Pages workflow. In **Settings → Pages**, choose **GitHub Actions** as the source. A push to `main` tests, builds and publishes the site. GitHub hosts the public files; it does not store private learner records.

To activate accounts, complete [SETUP.md](SETUP.md). Only the Supabase project URL and **publishable** key belong in browser configuration. Never commit a service-role key, management token, SMTP credential, user export or `.env` file.

## How accounts work

Visitors enter their email and verify the one-time code. The session can persist on the device; if it expires, the same email reopens the same account. Completed lessons, revision cards, highest practice score, language preference and last lesson/step are stored privately. An unfinished quiz attempt is not synchronized.

Users can explicitly import progress made without an account, export their own data, sign out, and delete their account. Signing out removes that account’s cached progress from the device. Guest progress and different accounts have separate storage keys.

Database policies allow a signed-in user to read only their own row. A server function derives identity from the verified session and rejects stale writes, allowing the client to merge progress across devices. Email addresses stay in Supabase Auth. Deleting an account cascades to its progress row.

## Contribute and follow

Please star the repository if it helps, share the project link and propose sourced improvements. See [CONTRIBUTING.md](CONTRIBUTING.md). For security reports, see [SECURITY.md](SECURITY.md). Do not post personal data in public issues.

Code and original teaching material: [MIT License](LICENSE). Independent project, unaffiliated with the French administration.
