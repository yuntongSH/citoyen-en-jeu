import { build } from 'esbuild-wasm';
import { writeFile } from 'node:fs/promises';
await build({entryPoints: ['src/accounts.js'], bundle: true, minify: true, format: 'iife', target: ['es2022'], outfile: 'dist/accounts.js', legalComments: 'linked'});
// GitHub repository variables are public configuration, not secrets.
if (process.env.CITOYEN_SUPABASE_URL && process.env.CITOYEN_SUPABASE_PUBLISHABLE_KEY) {
  const key = process.env.CITOYEN_SUPABASE_PUBLISHABLE_KEY;
  if (!key.startsWith('sb_publishable_')) throw new Error('Use a Supabase publishable key, never a secret/service-role key.');
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(process.env.CITOYEN_SUPABASE_URL)) throw new Error('Invalid project URL');
  const contact = process.env.CITOYEN_PRIVACY_CONTACT || '';
  const enabled = process.env.CITOYEN_ACCOUNTS_READY === 'true';
  if (enabled && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) throw new Error('A privacy contact is required before enabling accounts.');
  await writeFile('dist/config.js', 'window.CITOYEN_CONFIG = '+JSON.stringify({accountsEnabled:enabled,supabaseUrl:process.env.CITOYEN_SUPABASE_URL,supabasePublishableKey:key,privacyContact:contact,repository:'https://github.com/yuntongSH/citoyen-en-jeu',author:'https://github.com/yuntongSH'})+';\n');
}
await writeFile('dist/.nojekyll', '');
console.log('Citoyen built. Account activation requires a configured Supabase project.');
