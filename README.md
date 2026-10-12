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
This is a **front-end demo** with sample messages. It does not log in to Gmail, Yahoo, Outlook, iCloud, or any mail provider. It does not send real email or fetch live messages. The compose action creates a local preview item only. Never enter provider passwords into this demo.

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
