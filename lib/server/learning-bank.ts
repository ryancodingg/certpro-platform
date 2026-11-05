import 'server-only'
import {unstable_cache,revalidateTag} from 'next/cache'
import {bankUnavailable,recoveredBank} from '@/lib/recovery-bank'
export {bankUnavailable,recoveredBank} from '@/lib/recovery-bank'
import {services} from './firebase'
import {normalizeQuestion,publication,questionSchema} from '@/lib/questions'
const readBank=unstable_cache(async(certification:string)=>{
 const readStarted=new Date().toISOString()
 try{const snapshot=await services().db.collection('questions').where('certification','==',certification).get();const published=snapshot.docs.map(d=>normalizeQuestion(d.data(),d.id)).filter(q=>publication(q)==='published');const questions=published.filter(q=>questionSchema.safeParse(q).success).sort((a,b)=>a.id.localeCompare(b.id));try{const ref=services().db.collection('certproMetadata').doc('catalogAvailability');await services().db.runTransaction(async tx=>{const current=await tx.get(ref);const previous=current.data()?.banks?.[certification];if(!previous?.updatedAt||previous.updatedAt<=readStarted)tx.set(ref,{banks:{[certification]:{count:questions.length,updatedAt:readStarted}}},{merge:true})});revalidateTag('certpro-catalog-counts',{expire:0})}catch{/* Availability indexing must never block learning. */}return {questions,invalid:published.length-questions.length,recovery:false}}
 catch(error){throw error}
},['certpro-published-bank-v3'],{revalidate:21600,tags:['certpro-question-bank']})
let unavailableUntil=0
export async function learningBank(certification:string){
 if(Date.now()<unavailableUntil)return recoveredBank(certification)
 try{return await readBank(certification)}catch(error){if(!bankUnavailable(error))throw error;unavailableUntil=Date.now()+60000;console.warn('Question bank unavailable',{code:(error as {code?:unknown}).code});return recoveredBank(certification)}
}
