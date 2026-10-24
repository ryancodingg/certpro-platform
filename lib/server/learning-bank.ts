import 'server-only'
import {unstable_cache} from 'next/cache'
import {bankUnavailable,recoveredBank} from '@/lib/recovery-bank'
export {bankUnavailable,recoveredBank} from '@/lib/recovery-bank'
import {services} from './firebase'
import {normalizeQuestion,publication,questionSchema} from '@/lib/questions'
const readBank=unstable_cache(async(certification:string)=>{
 try{const snapshot=await services().db.collection('questions').where('certification','==',certification).get();const published=snapshot.docs.map(d=>normalizeQuestion(d.data(),d.id)).filter(q=>publication(q)==='published');const questions=published.filter(q=>questionSchema.safeParse(q).success).sort((a,b)=>a.id.localeCompare(b.id));return {questions,invalid:published.length-questions.length,recovery:false}}
 catch(error){if(!bankUnavailable(error))throw error;return recoveredBank(certification)}
},['certpro-published-bank-v1'],{revalidate:300})
export async function learningBank(certification:string){return readBank(certification)}
