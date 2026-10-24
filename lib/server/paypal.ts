import 'server-only'
import {hasPaidAccess,isUnpaidPendingCheckout} from '@/lib/subscription-access'
import {createHash,randomUUID} from 'node:crypto'
import {HttpError,services} from './firebase'
export const plans={monthly:{amount:'3.99',interval:'MONTH'},yearly:{amount:'19.99',interval:'YEAR'}} as const
export type Plan=keyof typeof plans
const base=()=>process.env.PAYPAL_MODE==='live'?'https://api-m.paypal.com':'https://api-m.sandbox.paypal.com'
export const billingReady=()=>!!(process.env.PAYPAL_CLIENT_ID&&process.env.PAYPAL_CLIENT_SECRET&&process.env.PAYPAL_MONTHLY_PLAN_ID&&process.env.PAYPAL_YEARLY_PLAN_ID&&process.env.PAYPAL_WEBHOOK_ID)
export const billingRef=(uid:string)=>services().db.collection('certproAttempts').doc('billing_'+(process.env.PAYPAL_MODE==='live'?'live_':'sandbox_')+createHash('sha256').update(uid).digest('hex'))
const planId=(plan:Plan)=>plan==='monthly'?process.env.PAYPAL_MONTHLY_PLAN_ID:process.env.PAYPAL_YEARLY_PLAN_ID
export async function paypal(path:string,method='GET',data?:unknown,requestId?:string){
 if(!billingReady())throw new HttpError(503,'Subscriptions are being configured. No payment was taken.')
 const token=await fetch(base()+'/v1/oauth2/token',{method:'POST',headers:{Authorization:'Basic '+Buffer.from(process.env.PAYPAL_CLIENT_ID+':'+process.env.PAYPAL_CLIENT_SECRET).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials',cache:'no-store',signal:AbortSignal.timeout(15000)})
 if(!token.ok)throw new HttpError(503,'Payment provider connection unavailable.')
 const auth=await token.json()
 const r=await fetch(base()+path,{method,headers:{Authorization:'Bearer '+auth.access_token,'Content-Type':'application/json',...(requestId?{'PayPal-Request-Id':requestId}:{})},body:data?JSON.stringify(data):undefined,cache:'no-store',signal:AbortSignal.timeout(15000)})
 if(!r.ok)throw new HttpError(503,'PayPal could not complete this request. Please retry; do not submit a second payment.')
 return r.status===204?{}:r.json()
}
export async function syncSubscription(uid:string){
 const ref=billingRef(uid);const old=(await ref.get()).data();if(!old?.subscriptionId)return {premium:false,status:'FREE'}
 const sub=await paypal('/v1/billing/subscriptions/'+encodeURIComponent(old.subscriptionId))
 const plan=(Object.keys(plans) as Plan[]).find(p=>planId(p)===sub.plan_id)
 if(!plan||sub.custom_id!==old.binding)throw new HttpError(403,'Subscription account verification failed.')
 const last=sub.billing_info?.last_payment;const next=sub.billing_info?.next_billing_time
 const paid=last?.amount?.currency_code==='USD'&&Number(last.amount.value)>=Number(plans[plan].amount)
 const paidThrough=paid&&next?next:old.paidThrough||null
 const premium=hasPaidAccess(sub,old,plans[plan].amount)
 const result={kind:'billing',environment:process.env.PAYPAL_MODE==='live'?'live':'sandbox',uid,subscriptionId:sub.id,binding:old.binding,plan,status:sub.status,premium,paidThrough,checkedAt:Date.now()}
 await ref.set(result,{merge:true});return {premium,status:sub.status,plan,paidThrough}
}
export async function premiumAccess(uid:string){const old=(await billingRef(uid).get()).data();if(!old?.subscriptionId||isUnpaidPendingCheckout(old))return false;if(!billingReady())throw new HttpError(503,'Subscription verification is temporarily unavailable. Your free allowance has not been used.');return (await syncSubscription(uid)).premium}
export async function createSubscription(uid:string,plan:Plan,origin:string){
 if(!billingReady())throw new HttpError(503,'Subscriptions are being configured. No payment was taken.');
 const ref=billingRef(uid);const lock=randomUUID();const now=Date.now();let old:any
 await services().db.runTransaction(async tx=>{old=(await tx.get(ref)).data();if(old?.lockUntil>now)throw new HttpError(409,'A subscription request is already being processed.');if(old?.pendingPlan&&old.pendingPlan!==plan)throw new HttpError(409,'Retry your pending plan request before changing plans.');tx.set(ref,{kind:'billing',environment:process.env.PAYPAL_MODE==='live'?'live':'sandbox',uid,lock,creationRequestId:old?.creationRequestId||lock,pendingPlan:plan,lockUntil:now+120000},{merge:true})})
 try{
 if(old?.subscriptionId){const current=await syncSubscription(uid);if(current.premium||['ACTIVE','SUSPENDED','APPROVED'].includes(current.status))throw new HttpError(409,'You already have a subscription. Manage it from My Progress.');if(current.status==='APPROVAL_PENDING'&&old.approvalUrl){if(old.plan!==plan)throw new HttpError(409,'You already have a pending '+old.plan+' checkout. Resume that checkout before changing plans.');return {url:old.approvalUrl}}}
 const product=await paypal('/v1/billing/plans/'+encodeURIComponent(planId(plan)!));const regular=product.billing_cycles?.filter((c:any)=>c.tenure_type==='REGULAR')||[]
 if(Number(product.payment_preferences?.setup_fee?.value||0)!==0||Number(product.taxes?.percentage||0)!==0||product.status!=='ACTIVE'||regular.length!==1||product.billing_cycles.length!==1||regular[0].frequency.interval_unit!==plans[plan].interval||regular[0].frequency.interval_count!==1||regular[0].pricing_scheme.fixed_price.currency_code!=='USD'||Number(regular[0].pricing_scheme.fixed_price.value)!==Number(plans[plan].amount))throw new HttpError(503,'Subscription price configuration needs review.')
 const binding=createHash('sha256').update(uid).digest('hex');const sub=await paypal('/v1/billing/subscriptions','POST',{plan_id:planId(plan),custom_id:binding,application_context:{brand_name:'CertPro',shipping_preference:'NO_SHIPPING',user_action:'SUBSCRIBE_NOW',return_url:origin+'/pricing?subscription=return',cancel_url:origin+'/pricing?subscription=cancel'}},old?.creationRequestId||lock)
 const url=sub.links?.find((l:any)=>l.rel==='approve')?.href;const host=url?new URL(url).hostname:''
 if(!['www.paypal.com','www.sandbox.paypal.com'].includes(host))throw new HttpError(503,'No valid PayPal approval link was returned.')
 await ref.set({kind:'billing',environment:process.env.PAYPAL_MODE==='live'?'live':'sandbox',uid,binding,subscriptionId:sub.id,approvalUrl:url,plan,status:sub.status,premium:false,paidThrough:null,refundedAt:null,creationRequestId:null,pendingPlan:null},{merge:true});return {url}
 }finally{await services().db.runTransaction(async tx=>{const current=(await tx.get(ref)).data();if(current?.lock===lock)tx.set(ref,{lockUntil:0,...(old?.subscriptionId?{pendingPlan:null,creationRequestId:null}:{})},{merge:true})})}
}
