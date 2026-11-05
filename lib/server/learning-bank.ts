import 'server-only'
import {unstable_cache} from 'next/cache'
import {bankUnavailable,recoveredBank} from '@/lib/recovery-bank'
export {bankUnavailable,recoveredBank} from '@/lib/recovery-bank'
import {services} from './firebase'
import {normalizeQuestion,publication,questionSchema} from '@/lib/questions'
const readBank=unstable_cache(async(certification:string)=>{
 try{const snapshot=await services().db.collection('questions').where('certification','==',certification).get();const published=snapshot.docs.map(d=>normalizeQuestion(d.data(),d.id)).filter(q=>publication(q)==='published');const questions=published.filter(q=>questionSchema.safeParse(q).success).sort((a,b)=>a.id.localeCompare(b.id));return {questions,invalid:published.length-questions.length,recovery:false}}
 catch(error){throw error}
},['certpro-published-bank-v2'],{revalidate:21600,tags:['certpro-question-bank']})
let unavailableUntil=0
export async function learningBank(certification:string){
 if(Date.now()<unavailableUntil)return recoveredBank(certification)
 try{return await readBank(certification)}catch(error){if(!bankUnavailable(error))throw error;unavailableUntil=Date.now()+60000;console.warn('Question bank unavailable',{code:(error as {code?:unknown}).code});return recoveredBank(certification)}
}
