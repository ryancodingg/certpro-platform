import {certificationById} from '@/lib/catalog'
import {bankAvailability,unknownAvailability} from '@/lib/catalog-availability'
import {learningBank} from '@/lib/server/learning-bank'
export const runtime='nodejs'
export const maxDuration=30
export async function GET(request:Request){
 const ids=[...new Set((new URL(request.url).searchParams.get('ids')||'').split(',').filter(Boolean))]
 if(!ids.length||ids.length>12||ids.some(id=>!certificationById(id)))return Response.json({error:'Choose up to 12 catalog certifications.'},{status:400})
 const entries=await Promise.all(ids.map(async id=>{
  const cert=certificationById(id)!
  let timer:ReturnType<typeof setTimeout>|undefined
  try{
   const result=await Promise.race([learningBank(cert.aliases[0]||cert.id).then(bank=>bankAvailability(bank.questions.length,bank.recovery)),new Promise<typeof unknownAvailability>(resolve=>{timer=setTimeout(()=>resolve(unknownAvailability),2500)})])
   return [id,result]
  }catch{return [id,unknownAvailability]}finally{clearTimeout(timer)}
 }))
 // Counts only: question text, answer keys and account data never leave this endpoint.
 return Response.json({items:Object.fromEntries(entries)},{headers:{'Cache-Control':'no-store'}})
}
