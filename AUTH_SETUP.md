# Enable real MeMail accounts (one-time setup)

The sign-in page now supports Supabase email/password registration, email verification, sign-in, and Google/Microsoft OAuth. It will not authenticate until a Supabase project is connected.

## 1. Create the free auth project
1. Open https://supabase.com/dashboard and sign in.
2. Create a new project and save its database password privately (MeMail does not need that password).
3. In Project Settings → API (or Data API), copy the **Project URL** and the **anon/public publishable key**.
4. Edit `auth-config.js` in this repository and replace `YOUR_SUPABASE_PROJECT_URL` and `YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY` with those two public values. Never use a `service_role` or secret key in browser code.

## 2. Configure allowed website URLs
In Supabase → Authentication → URL Configuration:
- Site URL: `https://zaboylah-cell.github.io`
- Add redirect URL: `https://zaboylah-cell.github.io/MeMail.net/index.html`
- Add redirect URL: `https://zaboylah-cell.github.io/MeMail.net/signin.html`

If the dashboard requires a more specific site URL, use the project Pages URL as the Site URL and retain the redirect URLs above.

## 3. Enable sign-in providers
- Email: enable email/password sign-ups and email confirmation. Configure SMTP before expecting reliable verification emails at scale.
- Google: enable Google in Supabase Authentication → Sign In / Providers, then follow Supabase's Google OAuth setup. Add the callback URL shown by Supabase to Google Cloud Console.
- Microsoft: enable Azure in Supabase Authentication → Sign In / Providers, configure the Microsoft app, and use the callback URL shown by Supabase.

OAuth providers require their own client IDs/secrets configured in Supabase's dashboard. Never commit those secrets to GitHub.

## 4. Test
After GitHub Pages redeploys, open `https://zaboylah-cell.github.io/MeMail.net/signin.html`, create an account with an email you control, verify the message if requested, then sign in. Test Google/Microsoft only after their providers are configured.

## Important current limitations
- The sign-in page uses Supabase Auth for identity. The main MeMail inbox's existing Gmail/Outlook mailbox-reading code still uses the separate Express backend and is not automatically connected just by creating a MeMail account.
- GitHub Pages is static hosting. It cannot run `server/index.js`; deploy the existing Node service separately for live mailbox access. The current server uses in-memory OAuth tokens and is a prototype, not production-grade persistent token storage.
- Do not collect or enter your Gmail/Outlook mailbox password into MeMail. Use official OAuth provider screens only.
