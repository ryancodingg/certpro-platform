# CertPro operations

## Required environment variables

Public client configuration: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID` (`certpro-ai`), `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, and `NEXT_PUBLIC_FIREBASE_APP_ID`. Server-only credentials: `FIREBASE_SERVICE_ACCOUNT_JSON`, `CERTPRO_OWNER_UID`, `CERTPRO_OWNER_EMAIL`, and `CERTPRO_REFRESH_SECRET`. Never expose the service account or refresh secret to the browser.

`CERTPRO_OWNER_UID` and `CERTPRO_OWNER_EMAIL` must both be explicitly configured. Authentication is fail-closed until the signed-in, verified Firebase user matches both values; there is no first-login auto-pinning.

## Firebase setup required

Set the public Firebase web configuration variables used by `lib/firebase.ts` and set `FIREBASE_SERVICE_ACCOUNT_JSON` for server routes. Deploy the checked-in `firestore.rules` through the Firebase console or CLI; the protected question, attempt, config, and audit paths intentionally deny direct client access. Set the verified owner account email in `lib/server/firebase.ts`, then sign in once so `certproConfig/owner` pins its UID. Real banks cannot load or change until the service-account credentials, deployed rules, and pinned owner UID are present.

## News refresh

The protected `POST /api/refresh` endpoint checks only the fixed official-source allowlist and stores candidates in `certproRefreshRuns`. It never publishes content or guesses coupons. Configure `CERTPRO_REFRESH_SECRET` in the deployment and configure the scheduler to send `Authorization: Bearer <secret>`; the included `vercel.json` cron schedule is only a schedule declaration and does not supply that header by itself. Review candidates as the owner before publishing. A run records `succeeded` or `failed` and its timestamp.

No production deploy, destructive migration, paid upgrade, or automatic coupon publication is performed by this change.
