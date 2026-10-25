# Study document connections setup

The document editor, account saving, Word export and Print / Save as PDF work without provider credentials. Google Docs and Notion connection controls remain inactive until the following configuration is installed privately in Vercel Production. Do not commit secrets or put them in NEXT_PUBLIC variables.

## Google Docs

1. In the CertPro Google Cloud project, enable Google Docs API and Google Drive API.
2. Configure the OAuth consent screen for CertPro and a Web application OAuth client. Use only the `https://www.googleapis.com/auth/drive.file` scope, so CertPro can manage documents it creates rather than the user's entire Drive.
3. Exact authorized redirect URI: `https://certpro.vercel.app/api/study-connections?callback=google`.
4. Privately configure `GOOGLE_DOCS_CLIENT_ID` and `GOOGLE_DOCS_CLIENT_SECRET`. Complete any Google publishing/verification requirements before offering this publicly. Testing mode restricts access to configured test users and refresh-token lifetime.

## Notion

1. Create a public OAuth connection for CertPro, with read, insert and update content capabilities. Users explicitly choose pages to share with the connection.
2. Exact redirect URI: `https://certpro.vercel.app/api/study-connections?callback=notion`.
3. Privately configure `NOTION_CLIENT_ID` and `NOTION_CLIENT_SECRET`.
4. Users connect their account and enter the ID of a parent page shared with CertPro. CertPro creates one child page for each linked study page and updates that same page subsequently.

## Credential encryption

Configure `DOCUMENT_CONNECTION_KEY` as a cryptographically random 32-byte key encoded as 64 hexadecimal characters. Generate and store it in a secret manager; do not paste it into chat. Provider credentials are encrypted with AES-256-GCM and stored only in server-protected Firestore documents. Rotating this key requires users to reconnect, unless credentials are migrated first.

## Behavior and release checks

Sync is one-way from the account-saved CertPro page into the linked external document. It is not collaborative or two-way sync. Manual Sync is supported, plus opt-in automatic sync while the study page is open. Disconnect removes CertPro's saved credentials without deleting the external document; users can separately revoke the provider grant.

Google uses revision-controlled batch updates. Notion has no equivalent atomic revision precondition: the app checks managed blocks before writing and stops on detected outside edits or partial sync failures. A Notion failure after appending may leave extra blocks; inspect the provider page before reconnecting. Notion sync is capped at 90 blocks per page. It preserves supported text annotations; custom colors and comments are not exported to Notion. Google exports text, core formatting and headings; the Word/PDF exports offer the closest visual match.

Before enabling public connections: verify per-user OAuth cancellation/state rejection, token refresh, initial document creation, repeated update to the same document, disconnect, edited-external-document conflict handling, revoked grants, provider rate limits and account isolation using dedicated test accounts. These provider end-to-end tests require the configured apps and user consent; they cannot be represented as passed before setup.
