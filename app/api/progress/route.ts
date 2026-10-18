import { progressSummary } from '@/lib/progress-summary'
import { createHash } from 'node:crypto'
import { body, failure, HttpError, sameOrigin, services } from '@/lib/server/firebase'
import { learner } from '@/lib/server/learner'
import { certificationById } from '@/lib/catalog'
import { guideFor } from '@/lib/exam-guide'
export const runtime='nodejs'
export async function GET(request:Request){try{
 const uid=await learner(request,true);const snapshot=await services().db.collection('certproAttempts').where('uid','==',uid).get()
 return Response.json(progressSummary(snapshot.docs.map(d=>({id:d.id,data:d.data()})),uid!),{headers:{'Cache-Control':'private, no-store'}})
 }catch(e){return failure(e)}}
export async function POST(request:Request){try{
 sameOrigin(request);const uid=await learner(request,true);const input=await body(request);const cert=typeof input.certification==='string'?certificationById(input.certification):null
 if(!cert)throw new HttpError(400,'Unknown certification.')
 const bankId=cert.aliases[0]||cert.id;const ref=services().db.collection('certproAttempts').doc('saved_'+createHash('sha256').update(uid+'|'+bankId).digest('hex'))
 if(input.action==='save'){await ref.set({kind:'saved',uid,certification:bankId,savedAt:new Date().toISOString()},{merge:true})}
 else if(input.action==='study'){
 if(typeof input.section!=='string'||!guideFor(bankId).domains.some(d=>d.id===input.section)||typeof input.completed!=='boolean')throw new HttpError(400,'Invalid exam section.')
 await services().db.runTransaction(async tx=>{const old=(await tx.get(ref)).data();const studied=new Set<string>(old?.studiedSections||[]);input.completed?studied.add(input.section):studied.delete(input.section);tx.set(ref,{kind:'saved',uid,certification:bankId,savedAt:old?.savedAt||new Date().toISOString(),studiedSections:[...studied]},{merge:true})})
 }else throw new HttpError(400,'Unknown progress action.')
 return Response.json({ok:true})
 }catch(e){return failure(e)}}
