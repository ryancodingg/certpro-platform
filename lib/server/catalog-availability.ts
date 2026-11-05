import 'server-only'
import {unstable_cache} from 'next/cache'
import {certifications} from '@/lib/catalog'
import recovery from '@/data/published-bank-recovery.json'
import {normalizeQuestion,publication,questionSchema} from '@/lib/questions'
import {bankAvailability,type CatalogAvailability} from '@/lib/catalog-availability'
import {services} from './firebase'

// A single summary document avoids charging a question read for every catalog visit.
const readCounts=unstable_cache(async()=>{
 const snapshot=await services().db.collection('certproMetadata').doc('catalogAvailability').get()
 return (snapshot.data()?.banks||{}) as Record<string,{count:number;updatedAt:string}>
},['certpro-catalog-counts-v2'],{revalidate:60,tags:['certpro-question-bank','certpro-catalog-counts']})
const recoveryCounts:Record<string,number>={}
for(const raw of recovery.questions){const q=normalizeQuestion(raw,raw.id);if(publication(q)==='published'&&questionSchema.safeParse(q).success)recoveryCounts[q.certification]=(recoveryCounts[q.certification]||0)+1}
let pending:Promise<Record<string,{count:number;updatedAt:string}>>|undefined
let retryAfter=0
let lastKnown:Record<string,{count:number;updatedAt:string}>={}
export async function catalogAvailability():Promise<Record<string,CatalogAvailability>>{
 let counts=lastKnown
 if(Date.now()>=retryAfter){
  let timer:ReturnType<typeof setTimeout>|undefined
  try{
   if(!pending)pending=readCounts().finally(()=>{pending=undefined})
   counts=await Promise.race([pending,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('Count check timed out')),2500)})])
   lastKnown=counts
  }catch{retryAfter=Date.now()+60000}finally{clearTimeout(timer)}
 }
 return Object.fromEntries(certifications.map(cert=>{
  const id=cert.aliases[0]||cert.id,live=counts[id]
  if(live&&Number.isSafeInteger(live.count)&&live.count>=0)return [cert.id,{...bankAvailability(live.count,false),source:'verified' as const}]
  return [cert.id,{...bankAvailability(recoveryCounts[id]||0,true),source:'backup' as const}]
 }))
}
