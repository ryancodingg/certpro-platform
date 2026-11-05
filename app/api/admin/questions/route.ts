import {certifications as catalogCertifications} from '@/lib/catalog'
import {revalidateTag} from 'next/cache'
import { createHash } from "node:crypto"
import { body, failure, HttpError, requireOwner, sameOrigin, services } from "@/lib/server/firebase"
import { fingerprint, normalizeQuestion, questionSchema, publication } from "@/lib/questions"
import { previewImport } from "@/lib/import-questions"
export const runtime = "nodejs"
export async function GET(request: Request) {
  try {
    await requireOwner()
    const certification = new URL(request.url).searchParams.get("certification")
    if (certification !== null && !/^[a-z0-9-]{1,100}$/.test(certification)) throw new HttpError(400,"Invalid certification.")
    const collection = services().db.collection("questions")
    const readStarted=new Date().toISOString()
    const snap = await (certification ? collection.where("certification","==",certification) : collection).get()
    const questions = snap.docs.map(d => normalizeQuestion(d.data(), d.id))
    // Reuse the already authorized snapshot; never scan banks for public catalog visits.
    // Seed explicit zeros only for the banks this successful query actually covered.
    const bankIds=certification?[certification]:[...new Set(catalogCertifications.map(c=>c.aliases[0]||c.id))]
    const counts:Record<string,number>=Object.fromEntries(bankIds.map(id=>[id,0]))
    for(const q of questions)if(publication(q)==='published'&&questionSchema.safeParse(q).success)counts[q.certification]=(counts[q.certification]||0)+1
    try{
      const db=services().db,ref=db.collection('certproMetadata').doc('catalogAvailability')
      await db.runTransaction(async tx=>{
        const current=await tx.get(ref),previous=current.data()?.banks||{}
        const banks=Object.fromEntries(Object.entries(counts).filter(([id])=>!previous[id]?.updatedAt||previous[id].updatedAt<=readStarted).map(([id,count])=>[id,{count,updatedAt:readStarted}]))
        if(Object.keys(banks).length)tx.set(ref,{banks},{merge:true})
      })
      revalidateTag('certpro-catalog-counts',{expire:0})
    }catch{/* An index write failure must not block the owner's question export. */}
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
      let preflight
      try { preflight = previewImport(input.text,input.format,[]) } catch(e) { throw new HttpError(400,(e as Error).message) }
      const certifications = [...new Set(preflight.valid.map(q=>q.certification))]
      const result=await db.runTransaction(async tx => {
        // Fingerprints include certification, so other banks cannot be duplicates.
        // Keep all reads in the import transaction to retain concurrent-import checks.
        const existing = []
        for (let i=0;i<certifications.length;i+=30) {
          const snap = await tx.get(db.collection("questions").where("certification","in",certifications.slice(i,i+30)))
          existing.push(...snap.docs.map(d=>normalizeQuestion(d.data(),d.id)))
        }
        let preview
        try { preview = previewImport(input.text, input.format, existing) } catch(e) { throw new HttpError(400, (e as Error).message) }
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
        for(const certification of certifications){const count=[...existing,...preview.valid].filter(q=>q.certification===certification&&publication(q)==='published'&&questionSchema.safeParse(q).success).length;tx.set(db.collection('certproMetadata').doc('catalogAvailability'),{banks:{[certification]:{count,updatedAt:now}}},{merge:true})}
        tx.create(db.collection("certproAudit").doc(), {action:"import", actor:uid, at:now, count:preview.valid.length, skipped:preview.duplicates.length})
        return Response.json({imported:preview.valid.length, skipped:preview.duplicates.length})
      })
      if(input.action==='import')revalidateTag('certpro-question-bank',{expire:0})
      return result
    }
    if (input.action === "publish-reviewed-bank") {
      const ids: unknown = input.ids
      if (!Array.isArray(ids) || ids.length < 1 || ids.length > 200 || ids.some(id => typeof id !== "string" || !/^[^/]{1,200}$/.test(id)) || new Set(ids).size !== ids.length || typeof input.certification !== "string" || !input.certification) throw new HttpError(400,"Choose 1–200 unique draft IDs for one certification.")
      const reviewedIds = ids as string[]
      await db.runTransaction(async tx => {
        const refs = reviewedIds.map(id => db.collection("questions").doc(id))
        const docs = await tx.getAll(...refs)
        for (const doc of docs) {
          if (!doc.exists) throw new HttpError(409,"A selected draft no longer exists. Reload and review again.")
          const q = normalizeQuestion(doc.data()!,doc.id)
          if (q.certification !== input.certification || publication(q) !== "draft") throw new HttpError(409,"The selected bank changed. Only drafts from one certification can be published together.")
          questionSchema.parse(q)
        }
        const bank=await tx.get(db.collection('questions').where('certification','==',input.certification))
        const count=bank.docs.filter(d=>{const q=normalizeQuestion(d.data(),d.id);return reviewedIds.includes(d.id)||(publication(q)==='published'&&questionSchema.safeParse(q).success)}).length
        const now = new Date().toISOString()
        tx.set(db.collection('certproMetadata').doc('catalogAvailability'),{banks:{[input.certification]:{count,updatedAt:now}}},{merge:true})
        for (const ref of refs) tx.update(ref,{status:"published",isActive:true,updatedAt:now,updatedBy:uid,archivedAt:null})
        tx.create(db.collection("certproAudit").doc(),{action:"publish-reviewed-bank",actor:uid,at:now,certification:input.certification,questionIds:reviewedIds,count:reviewedIds.length})
      })
      revalidateTag('certpro-question-bank',{expire:0})
      return Response.json({published:reviewedIds.length})
    }
    if (!/^[^/]{1,200}$/.test(input.id ?? "")) throw new HttpError(400,"A valid question ID is required.")
    if (!["draft","published","archived"].includes(input.status)) throw new HttpError(400,"Invalid publication state.")
    await db.runTransaction(async tx => {
      const ref = db.collection("questions").doc(input.id)
      const doc = await tx.get(ref)
      if (!doc.exists) throw new HttpError(404,"Question not found.")
      const existing = normalizeQuestion(doc.data()!,doc.id)
      if (input.status === "published") questionSchema.parse(existing)
      const bank=await tx.get(db.collection('questions').where('certification','==',existing.certification))
      const count=bank.docs.filter(d=>{const q=normalizeQuestion(d.data(),d.id);return (d.id===doc.id?input.status==='published':publication(q)==='published')&&questionSchema.safeParse(q).success}).length
      const now = new Date().toISOString()
      tx.set(db.collection('certproMetadata').doc('catalogAvailability'),{banks:{[existing.certification]:{count,updatedAt:now}}},{merge:true})
      tx.update(ref, {status:input.status, isActive:input.status === "published", updatedAt:now, updatedBy:uid, archivedAt:input.status === "archived" ? now : null})
      tx.create(db.collection("certproAudit").doc(), {questionId:doc.id, action:input.status, previousStatus:publication(existing), actor:uid, at:now})
    })
    revalidateTag('certpro-question-bank',{expire:0})
    return Response.json({ok:true})
  } catch(e) { return failure(e) }
}
