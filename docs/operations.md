# CertPro operations

## Firebase setup required

Set the public Firebase web configuration variables used by `lib/firebase.ts` and set `FIREBASE_SERVICE_ACCOUNT_JSON` for server routes. Deploy the checked-in `firestore.rules` through the Firebase console or CLI; the protected question, attempt, config, and audit paths intentionally deny direct client access. Set the verified owner account email in `lib/server/firebase.ts`, then sign in once so `certproConfig/owner` pins its UID. Real banks cannot load or change until the service-account credentials, deployed rules, and pinned owner UID are present.

## News refresh

The protected `POST /api/refresh` endpoint checks only the fixed official-source allowlist and stores candidates in `certproRefreshRuns`. It never publishes content or guesses coupons. Configure `CERTPRO_REFRESH_SECRET` in the deployment and configure the scheduler to send `Authorization: Bearer <secret>`; the included `vercel.json` cron schedule is only a schedule declaration and does not supply that header by itself. Review candidates as the owner before publishing. A run records `succeeded` or `failed` and its timestamp.

No production deploy, destructive migration, paid upgrade, or automatic coupon publication is performed by this change.
