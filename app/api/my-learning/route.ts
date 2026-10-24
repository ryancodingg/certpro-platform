import {learner} from '@/lib/server/learner'
import {services,failure} from '@/lib/server/firebase'
import {isCorrect,validAnswer,type Question} from '@/lib/questions'
export const runtime='nodejs'
export async function GET(request:Request){try{
 const uid=await learner(request,true)
 const snapshot=await services().db.collection('certproAttempts').where('uid','==',uid).get()
 const events=snapshot.docs.filter(doc=>['practice','exam'].includes(doc.data().mode)).sort((a,b)=>String(b.data().createdAt||'').localeCompare(String(a.data().createdAt||''))).slice(0,100).flatMap(doc=>{
  const a=doc.data();if(a.mode!=='practice'&&!a.submitted)return []
  try{const questions:Question[]=JSON.parse(a.questions),answers=JSON.parse(a.answers)
   return questions.filter(q=>validAnswer(q,answers[q.id])).map(q=>({id:doc.id+':'+q.id,certification:a.certification,question:q,answer:answers[q.id],correct:isCorrect(q,answers[q.id]),at:a.submittedAt||a.createdAt}))
  }catch{return []}
 })
 return Response.json({events,limit:100},{headers:{'Cache-Control':'private, no-store'}})
}catch(e){return failure(e)}}
