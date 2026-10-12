# MeMail.net

**Your mail, together.** A responsive, single-page email workspace prototype.

## Current features
- Inbox, Starred, Sent, Drafts, Archive and Trash views
- Search across sample messages
- All mail / unread / support / personal / work filters
- Read messages, toggle stars, archive and move messages to trash
- Compose preview messages and save drafts
- Add local provider/account labels
- Export preview data to JSON
- Browser-local persistence via `localStorage`
- Responsive layout for desktop and mobile

## Important: current status
This is a **front-end preview** until the backend is deployed and provider OAuth credentials are configured. The inbox starts empty rather than showing fake emails or placeholder accounts. GitHub Pages alone cannot run the API. Never enter provider passwords into the preview.

A production release needs a secure backend, OAuth-based provider authorization, token storage and refresh, provider API integration, sending/receiving, and appropriate privacy/security controls. Provider accounts do not provide unlimited storage automatically.

## Run
Open `index.html` in a modern browser. No build step or third-party dependencies are required.


## Website and downloads

- **Website version:** https://zaboylah-cell.github.io/MeMail.net/ (available after GitHub Pages is enabled in repository Settings → Pages)
- **Download ZIP source:** https://github.com/zaboylah-cell/MeMail.net/archive/refs/heads/main.zip
- **Download TAR.GZ source:** https://github.com/zaboylah-cell/MeMail.net/archive/refs/heads/main.tar.gz
- **Repository:** https://github.com/zaboylah-cell/MeMail.net

### Platform availability

| Platform | Current option | Native installer |
|---|---|---|
| Windows | Website in a modern browser; source ZIP | Not built yet |
| macOS | Website in Safari/Chrome; source ZIP | Not built yet |
| Linux | Website in a modern browser; source TAR.GZ/ZIP | Not built yet |
| Android | Website in Chrome or another browser | Android package not built |
| iPhone / iPad | Website in Safari | iOS app not built |
| ChromeOS | Website in Chrome | ChromeOS package not built |
| Other systems | Website in a modern browser | Not built yet |

The source archives are provided by GitHub and contain the project source, not a signed native installer. Do not treat a platform as having an installer until an actual release asset is published and tested. Enable GitHub Pages for the `main` branch and repository root to make the website URL live.
\n## GitHub Pages
This repository can be published as a static project site by enabling Pages for the `main` branch and repository root in Settings → Pages. GitHub Pages supports top-level `index.html` entry files; publishing may take several minutes.


## Email-provider support: current status

MeMail.net is currently a **front-end preview**, not yet a connected mail client. It includes a provider directory for Gmail/Google Workspace, Outlook.com/Hotmail/Live, Microsoft 365/Exchange, Yahoo, iCloud, AOL, Proton Mail, Zoho, Fastmail, GMX, Mail.com, Yandex, Tuta, Mailbox.org, Runbox, StartMail, Posteo, Hushmail, ISP/university accounts, custom IMAP/SMTP, and support inboxes. At this stage, adding a provider saves a local label only; it does **not** sign in, sync messages, or send real email.

### What is required for real email

A secure multi-provider client needs provider-authorized sign-in (OAuth where supported), a backend for secure token handling and mailbox synchronization, and provider-specific adapters. IMAP/SMTP support also needs a secure server-side connection layer; browser-only HTML must never ask users for provider passwords. Some encrypted providers (such as Proton Mail and Tuta) may require their own supported bridge/API or provider-specific integration rather than generic IMAP.

### Planned build order

1. Keep improving the Gmail/Outlook-style inbox UI: folders, labels, search, selection, bulk actions, attachments, drafts, and message details.
2. Implement OAuth and read-only mailbox sync for Gmail and Microsoft first.
3. Add Yahoo and iCloud where their authorization/configuration permits.
4. Add standards-based IMAP/SMTP for compatible providers through a secure backend.
5. Add provider-specific integrations and package desktop/mobile apps only after the core sync is tested.

Do not enter email passwords into the current preview. The native installer links are placeholders until real packages are built.


## Backend prototype (Google + Microsoft)

A Node.js API prototype now lives in `server/index.js`. It provides OAuth entry points for Google and Microsoft, inbox-list endpoints, send-message endpoints, a connection status endpoint, and disconnect routes. The frontend hosted on GitHub Pages remains a static preview; it does not automatically run this API.

### Run locally

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env` and set a long random `SESSION_SECRET`.
3. Register a Google OAuth web client in Google Cloud, enable the Gmail API, and set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Add `http://localhost:3000/auth/google/callback` as an authorized redirect URI.
4. In Microsoft Entra, register a web app and add `http://localhost:3000/auth/microsoft/callback` as a redirect URI. Configure delegated `Mail.Read`, `Mail.Send`, and `User.Read` permissions and set the three Microsoft environment variables.
5. Run `npm install`, then `npm start`. Visit `http://localhost:3000/auth/google` or `/auth/microsoft` to start sign-in.

API routes include `GET /api/status`, `GET /api/google/messages`, `POST /api/google/send`, `GET /api/microsoft/messages`, and `POST /api/microsoft/send`.

**Not production-ready yet:** OAuth tokens are kept in server memory and are lost on restart; the default Express session store is also memory-only. Before public use, replace both with secure persistent stores, add rate limiting, CSRF/origin protection, token encryption/rotation, attachment and MIME handling, refresh-token renewal, tests, and a production hosting configuration. Never commit `.env` or real credentials. The GitHub Pages site alone cannot run this backend.


## Deploy the unified app backend

A Render Blueprint is included as `render.yaml`. It deploys the Node server and serves the same UI and API from one origin, which is required for the current session-based OAuth prototype.

1. Open [Render](https://render.com/) and choose **New → Blueprint**.
2. Connect this repository and let Render read `render.yaml`.
3. In the Google Cloud Console, enable the Gmail API and create a **Web application** OAuth client. Add the exact Render URL plus `/auth/google/callback` as an authorized redirect URI.
4. In Microsoft Entra, register a web app and add the exact Render URL plus `/auth/microsoft/callback` as a redirect URI. Set delegated permissions for `User.Read`, `Mail.Read`, and `Mail.Send`.
5. Enter the Google and Microsoft client IDs/secrets in the Render service environment. Do not put secrets in GitHub files. Use the Render URL as the main app URL after deployment.

**Important limitations:** this is still a prototype, not ready for public production use. Its current session/token stores are in memory and are not durable or production-hardened. Google and Microsoft are the only provider adapters implemented in the backend right now. Yahoo and iCloud need their own supported auth/mail integrations; Proton Mail requires a supported Proton-specific approach (often Proton Mail Bridge in compatible desktop setups). They will not connect just because a button exists. The UI explains when those providers are not configured rather than adding fake accounts.
