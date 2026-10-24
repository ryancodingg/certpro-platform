import {TESTING_ACCESS} from '@/lib/testing-access'
import {body,failure,HttpError,sameOrigin} from '@/lib/server/firebase'
import {learner} from '@/lib/server/learner'
import {billingReady,createSubscription,syncSubscription} from '@/lib/server/paypal'
export const runtime='nodejs'
export async function GET(request:Request){try{const uid=await learner(request,true);if(TESTING_ACCESS)return Response.json({testing:true,mode:process.env.PAYPAL_MODE==='live'?'live':'sandbox',ready:false,premium:false,status:'TESTING'},{headers:{'Cache-Control':'private, no-store'}});return Response.json({mode:process.env.PAYPAL_MODE==='live'?'live':'sandbox',ready:billingReady(),...(billingReady()?await syncSubscription(uid!):{premium:false,status:'FREE'})},{headers:{'Cache-Control':'private, no-store'}})}catch(e){return failure(e)}}
export async function POST(request:Request){try{sameOrigin(request);const uid=await learner(request,true);if(TESTING_ACCESS)throw new HttpError(409,'New subscriptions are paused during testing. All published questions and Mock Exams are available free.');const input=await body(request);if(!['monthly','yearly'].includes(input.plan))throw new HttpError(400,'Choose monthly or yearly.');return Response.json(await createSubscription(uid!,input.plan,new URL(request.url).origin))}catch(e){return failure(e)}}
