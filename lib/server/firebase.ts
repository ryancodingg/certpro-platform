import "server-only"
import { cert, getApps, initializeApp } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"
import { cookies } from "next/headers"

export class HttpError extends Error { constructor(public status: number, message: string) { super(message) } }
export function services() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) throw new HttpError(503, "Firebase server access is not configured. Existing bank data has not been changed.")
  let app = getApps().find(a => a.name === "certpro-server")
  if (!app) {
    try {
      const account = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
      if (account.project_id !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) throw new Error("Project mismatch")
      app = initializeApp({credential: cert(account)}, "certpro-server")
    } catch { throw new HttpError(503, "Firebase server configuration is invalid.") }
  }
  return {auth: getAuth(app), db: getFirestore(app)}
}
export const OWNER_EMAIL = "nglongvu10022k@gmail.com"
export async function requireOwner() {
  const session = (await cookies()).get("__session")?.value
  if (!session) throw new HttpError(401, "Sign in with the verified owner account to manage question banks.")
  const {auth, db} = services()
  let identity
  try { identity = await auth.verifySessionCookie(session, true) } catch { throw new HttpError(401, "Your session has expired. Sign in again.") }
  const account = await auth.getUser(identity.uid)
  if (account.disabled || !account.emailVerified || account.email?.toLowerCase() !== OWNER_EMAIL || !identity.email_verified) throw new HttpError(403, "Only the verified bank owner can manage questions.")
  const ref = db.doc("certproConfig/owner")
  await db.runTransaction(async tx => {
    const owner = await tx.get(ref)
    if (owner.exists && owner.data()?.uid !== account.uid) throw new HttpError(403, "Owner identity does not match the pinned account.")
    if (!owner.exists) tx.create(ref, {uid: account.uid, resolvedAt: new Date().toISOString()})
  })
  return account.uid
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin")
  if (origin !== new URL(request.url).origin) throw new HttpError(403, "Cross-origin request rejected.")
}
export async function body(request: Request) {
  if (Number(request.headers.get("content-length")) > 2_000_000) throw new HttpError(413, "Request is too large.")
  const raw = await request.text()
  if (raw.length > 2_000_000) throw new HttpError(413, "Request is too large.")
  try { return JSON.parse(raw) } catch { throw new HttpError(400, "Invalid JSON request.") }
}
export function failure(error: unknown) {
  if (error instanceof HttpError) return Response.json({error: error.message}, {status: error.status})
  if (error && typeof error === "object" && "issues" in error) return Response.json({error: "Invalid question data", issues: error.issues}, {status: 400})
  console.error("CertPro server request failed", error instanceof Error ? error.name : "Unknown error")
  return Response.json({error: "The bank service is unavailable. Please retry; no fallback data was used."}, {status: 503})
}
