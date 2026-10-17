import { cookies } from "next/headers"
import { body, failure, HttpError, requireOwner, sameOrigin, services } from "@/lib/server/firebase"
export async function POST(request: Request) {
  try {
    sameOrigin(request)
    const {idToken} = await body(request)
    if (typeof idToken !== "string") throw new HttpError(400, "An identity token is required.")
    const {auth} = services()
    let decoded
    try { decoded = await auth.verifyIdToken(idToken, true) } catch { throw new HttpError(401, "Invalid sign-in token.") }
    if (Date.now()/1000 - decoded.auth_time > 300) throw new HttpError(401, "Please sign in again to establish a session.")
    const expiresIn = 5 * 24 * 60 * 60 * 1000
    const session = await auth.createSessionCookie(idToken, {expiresIn})
    ;(await cookies()).set("__session", session, {httpOnly: true, secure: true, sameSite: "none", path: "/", maxAge: expiresIn/1000})
    return Response.json({ok: true})
  } catch(e) { return failure(e) }
}
export async function GET() {
  try { await requireOwner(); return Response.json({isOwner: true}, {headers: {"Cache-Control":"no-store"}}) }
  catch(e) { return failure(e) }
}
export async function DELETE(request: Request) {
  try { sameOrigin(request); (await cookies()).delete("__session"); return Response.json({ok: true}) } catch(e) { return failure(e) }
}
