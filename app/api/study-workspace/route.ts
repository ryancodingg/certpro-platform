import {createHash} from 'node:crypto'
import {body,HttpError,sameOrigin,services} from '@/lib/server/firebase'
import {learner} from '@/lib/server/learner'
import {validate} from '@/lib/study-workspace'
export const runtime='nodejs'
const headers={'Cache-Control':'private, no-store'}
const reference=(uid:string)=>services().db.collection('certproAttempts').doc('workspace_'+createHash('sha256').update(uid).digest('hex'))
function fail(e:unknown){return Response.json({error:e instanceof HttpError?e.message:'Account sync is temporarily unavailable. Local notes are kept.'},{status:e instanceof HttpError?e.status:503,headers})}
export async function GET(request:Request){try{
 const uid=(await learner(request,true))!;const data=(await reference(uid).get()).data()
 if(data&&(data.uid!==uid||data.kind!=='study-workspace'))throw new HttpError(403,'This workspace is not available.')
 return Response.json({workspace:data?JSON.parse(data.workspace):null,revision:data?.revision??0},{headers})
}catch(e){return fail(e)}}
export async function PUT(request:Request){try{
 sameOrigin(request);const uid=(await learner(request,true))!;const input=await body(request)
 if(!validate(input.workspace)||!Number.isSafeInteger(input.expectedRevision)||input.expectedRevision<0)throw new HttpError(400,'Invalid workspace.')
 const serialized=JSON.stringify(input.workspace)
 if(Buffer.byteLength(serialized,'utf8')>900000)throw new HttpError(413,'Workspace is too large to sync.')
 const ref=reference(uid)
 const revision=await services().db.runTransaction(async tx=>{
  const current=(await tx.get(ref)).data()
  if(current&&(current.uid!==uid||current.kind!=='study-workspace'))throw new HttpError(403,'Workspace is not available.')
  if((current?.revision??0)!==input.expectedRevision)throw new HttpError(409,'Your workspace changed on another device. Retry sync to combine the changes.')
  const revision=(current?.revision??0)+1
  tx.set(ref,{uid,kind:'study-workspace',workspace:serialized,revision,updatedAt:new Date().toISOString()})
  return revision
 })
 return Response.json({workspace:input.workspace,revision},{headers})
}catch(e){return fail(e)}}
