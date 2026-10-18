import {body,failure,HttpError,services} from '@/lib/server/firebase'
import {billingRef,paypal,syncSubscription} from '@/lib/server/paypal'
export const runtime='nodejs'
export async function POST(request:Request){try{
 const event=await body(request);const h=request.headers
 const check=await paypal('/v1/notifications/verify-webhook-signature','POST',{auth_algo:h.get('paypal-auth-algo'),cert_url:h.get('paypal-cert-url'),transmission_id:h.get('paypal-transmission-id'),transmission_sig:h.get('paypal-transmission-sig'),transmission_time:h.get('paypal-transmission-time'),webhook_id:process.env.PAYPAL_WEBHOOK_ID,webhook_event:event})
 if(check.verification_status!=='SUCCESS')throw new HttpError(401,'Webhook signature rejected.')
 const subscriptionId=event.resource?.billing_agreement_id||(event.event_type?.startsWith('BILLING.SUBSCRIPTION.')?event.resource?.id:null)
 if(!subscriptionId)return Response.json({received:true})
 const records=await services().db.collection('certproAttempts').where('subscriptionId','==',subscriptionId).get()
 for(const doc of records.docs){const a=doc.data();if(a.kind!=='billing'||!a.uid)continue
 if(['PAYMENT.SALE.REFUNDED','PAYMENT.SALE.REVERSED'].includes(event.event_type)){const time=Date.parse(event.create_time);if(Number.isFinite(time)&&(!a.refundedAt||time>Date.parse(a.refundedAt)))await billingRef(a.uid).set({refundedAt:event.create_time,premium:false},{merge:true})}
 await syncSubscription(a.uid)
 }
 return Response.json({received:true})
 }catch(e){return failure(e)}}
