import { createHash } from "node:crypto"
import { body, failure, HttpError, requireOwner, sameOrigin, services } from "@/lib/server/firebase"
import { fingerprint, normalizeQuestion, questionSchema, publication } from "@/lib/questions"
import { previewImport } from "@/lib/import-questions"
export const runtime = "nodejs"
export async function GET(request: Request) {
  try {
    await requireOwner()
    const snap = await services().db.collection("questions").get()
    const questions = snap.docs.map(d => normalizeQuestion(d.data(), d.id))
    if (new URL(request.url).searchParams.get("export") === "json") return new Response(JSON.stringify(questions,null,2), {headers:{"Content-Type":"application/json", "Content-Disposition":"attachment; filename=certpro-questions.json", "Cache-Control":"no-store"}})
    return Response.json({questions}, {headers:{"Cache-Control":"no-store"}})
  } catch(e) { return failure(e) }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request)
    const uid = await requireOwner()
    const input = await body(request)
    const {db} = services()
    if (["preview", "import"].includes(input.action)) {
      if (typeof input.text !== "string" || !["csv","json"].includes(input.format)) throw new HttpError(400,"Choose CSV or JSON and supply question data.")
      return await db.runTransaction(async tx => {
        const snap = await tx.get(db.collection("questions"))
        let preview
        try { preview = previewImport(input.text, input.format, snap.docs.map(d => normalizeQuestion(d.data(),d.id))) } catch(e) { throw new HttpError(400, (e as Error).message) }
        const digest = createHash("sha256").update(JSON.stringify(preview)).digest("hex")
        if (input.action === "preview") return Response.json({...preview,digest})
        if (input.digest !== digest) throw new HttpError(409,"The bank or import changed. Preview again before importing.")
        if (preview.errors.length || !preview.valid.length) throw new HttpError(400,"Fix invalid rows before importing. Duplicates will be skipped.")
        const now = new Date().toISOString()
        for (const question of preview.valid) {
          const stored: Record<string,unknown> = {...question, createdAt:now, createdBy:uid, updatedAt:now, updatedBy:uid}
          if (question.dropdownOptions) {stored.dropdownOptionsFlat=question.dropdownOptions.flatMap((opts,i)=>i ? ["",...opts] : opts); delete stored.dropdownOptions}
          tx.create(db.collection("questions").doc(), JSON.parse(JSON.stringify(stored)))
        }
        tx.create(db.collection("certproAudit").doc(), {action:"import", actor:uid, at:now, count:preview.valid.length, skipped:preview.duplicates.length})
        return Response.json({imported:preview.valid.length, skipped:preview.duplicates.length})
      })
    }
    if (!/^[^/]{1,200}$/.test(input.id ?? "")) throw new HttpError(400,"A valid question ID is required.")
    if (!["draft","published","archived"].includes(input.status)) throw new HttpError(400,"Invalid publication state.")
    await db.runTransaction(async tx => {
      const ref = db.collection("questions").doc(input.id)
      const doc = await tx.get(ref)
      if (!doc.exists) throw new HttpError(404,"Question not found.")
      const existing = normalizeQuestion(doc.data()!,doc.id)
      if (input.status === "published") questionSchema.parse(existing)
      const now = new Date().toISOString()
      tx.update(ref, {status:input.status, isActive:input.status === "published", updatedAt:now, updatedBy:uid, archivedAt:input.status === "archived" ? now : null})
      tx.create(db.collection("certproAudit").doc(), {questionId:doc.id, action:input.status, previousStatus:publication(existing), actor:uid, at:now})
    })
    return Response.json({ok:true})
  } catch(e) { return failure(e) }
}
