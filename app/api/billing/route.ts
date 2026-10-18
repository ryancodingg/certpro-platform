import {body,failure,HttpError,sameOrigin} from '@/lib/server/firebase'
import {learner} from '@/lib/server/learner'
import {billingReady,createSubscription,syncSubscription} from '@/lib/server/paypal'
export const runtime='nodejs'
export async function GET(request:Request){try{const uid=await learner(request,true);return Response.json({ready:billingReady(),...(billingReady()?await syncSubscription(uid!):{premium:false,status:'FREE'})},{headers:{'Cache-Control':'private, no-store'}})}catch(e){return failure(e)}}
export async function POST(request:Request){try{sameOrigin(request);const uid=await learner(request,true);const input=await body(request);if(!['monthly','yearly'].includes(input.plan))throw new HttpError(400,'Choose monthly or yearly.');return Response.json(await createSubscription(uid!,input.plan,new URL(request.url).origin))}catch(e){return failure(e)}}
