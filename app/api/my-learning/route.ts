import {explainPractice,requireTutorAcknowledgement} from '@/lib/server/tutor'
import {tutorModes} from '@/lib/tutor'
import {learner} from '@/lib/server/learner'
import {services,failure,HttpError} from '@/lib/server/firebase'
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

// Only explain a server-owned checked practice question or a submitted mock answer.
export async function POST(request:Request){try{
 const uid=await learner(request,true)
 const input=await request.json()
 requireTutorAcknowledgement(input.aiAcknowledged)
 if(input.action!=='explain'||!tutorModes.includes(input.style)||typeof input.id!=='string'||!/^[a-zA-Z0-9_-]{1,160}$/.test(input.id)||typeof input.questionId!=='string')throw new HttpError(400,'Choose a recorded answer and explanation style.')
 const attempt=(await services().db.collection('certproAttempts').doc(input.id).get()).data()
 if(!attempt||attempt.uid!==uid)throw new HttpError(404,'This answer is not available in account history. For device-only reviews, use the saved explanation or start a new Practical Mode session.')
 if(attempt.mode!=='practice'&&!(attempt.mode==='exam'&&attempt.submitted))throw new HttpError(403,'Submit the Mock Exam before requesting explanations.')
 const questions:Question[]=JSON.parse(attempt.questions||'[]'),answers=JSON.parse(attempt.answers||'{}')
 const question=questions.find(q=>q.id===input.questionId)
 if(!question||!validAnswer(question,answers[question.id]))throw new HttpError(403,'Check an answer before asking C-Fox.')
 return Response.json(await explainPractice(uid!,question,answers[question.id],input.style),{headers:{'Cache-Control':'private, no-store'}})
}catch(e){return failure(e)}}
