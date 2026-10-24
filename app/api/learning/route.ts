import {TESTING_ACCESS} from '@/lib/testing-access'
import {examPolicy} from '@/lib/exam-policy'
import {learningBank,bankUnavailable,recoveredBank} from '@/lib/server/learning-bank'
import {explainPractice,requireTutorAcknowledgement} from '@/lib/server/tutor'
import {checkedPracticeQuestion,tutorModes} from '@/lib/tutor'
import {certificationById} from '@/lib/catalog'
import {premiumAccess} from '@/lib/server/paypal'
import {freeQuestions} from '@/lib/learning-access'
import {createHash} from 'node:crypto'
import { learner } from '@/lib/server/learner'
import { guideFor, questionSection } from '@/lib/exam-guide'
import { randomBytes, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"
import { body, failure, HttpError, sameOrigin, services } from "@/lib/server/firebase"
import { normalizeQuestion, publication, publicQuestion, questionSchema, scoreQuestions, validAnswer, isCorrect, type Question } from "@/lib/questions"
export const runtime = "nodejs"
function bankId(id:string){const cert=certificationById(id);return cert?.aliases[0]||cert?.id||id}
async function bank(certification:string){return learningBank(bankId(certification))}
export async function GET(request: Request) {
  try {
    const certification = bankId(new URL(request.url).searchParams.get("certification") ?? "")
    if (!/^[a-z0-9-]{1,100}$/.test(certification)) throw new HttpError(400,"Invalid certification.")
    const {questions,invalid,recovery} = await bank(certification)
    const guide=guideFor(certification)
    const sections=guide.domains.map(d=>({...d,count:questions.filter(q=>questionSection(certification,q)===d.id).length}))
    const additional=questions.filter(q=>questionSection(certification,q)==='additional').length
    if(additional)sections.push({id:'additional',title:'Additional bank topics',count:additional})
    return Response.json({count:questions.length, invalid, sections, recovery}, {headers:{"Cache-Control":"no-store"}})
  } catch(e) { return failure(e) }
}
export async function POST(request: Request) {
  let input:any
  try {
    sameOrigin(request)
    input = await body(request)
    const {db} = services()
    if (input.action === "start") {
      if (!/^[a-z0-9-]{1,100}$/.test(input.certification ?? "") || !["practice","exam"].includes(input.mode)) throw new HttpError(400,"Invalid learning mode or certification.")
      input.certification=bankId(input.certification)
      const uid=await learner(request,true)
      const all=await bank(input.certification); const invalid=all.invalid
      if(input.section && (input.mode!=='practice'||!['additional',...guideFor(input.certification).domains.map(d=>d.id)].includes(input.section)))throw new HttpError(400,'Invalid practice section.')
      const premium=TESTING_ACCESS||await premiumAccess(uid!);const eligible=input.mode==='practice'&&!premium?freeQuestions(input.certification,all.questions):all.questions
      const questions=input.section?eligible.filter(q=>questionSection(input.certification,q)===input.section):eligible
      if (!questions.length) return Response.json({questions:[], invalid})
      const id = randomBytes(16).toString("hex")
      const secret = randomBytes(32).toString("hex")
      const duration=examPolicy(input.certification).durationMinutes ?? 90
      const deadline = input.mode === "exam" ? Date.now() + duration!*60*1000 : null
      const attempt={secret,uid,certification:input.certification,section:input.section||null,mode:input.mode,questions:JSON.stringify(questions),answers:"{}",deadline,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),expiresAt:Date.now()+24*60*60*1000,submitted:false}
      if(input.mode==='exam'&&!premium){
        const quota=db.collection('certproAttempts').doc('quota_'+createHash('sha256').update(uid+'|'+input.certification).digest('hex'))
        const resumed=await db.runTransaction(async tx=>{const used=(await tx.get(quota)).data();if(used?.attemptId){const previous=(await tx.get(db.collection('certproAttempts').doc(used.attemptId))).data();if(previous&&!previous.submitted&&previous.expiresAt>Date.now())return {id:used.attemptId,...previous};throw new HttpError(403,'Your free Mock Exam for this certification has been used. Premium unlocks unlimited Mock Exams.')};tx.create(db.collection('certproAttempts').doc(id),attempt);tx.set(quota,{kind:'quota',uid,attemptId:id});return null})
        if(resumed){const previous=resumed as any;(await cookies()).set(`cp_${previous.id}`,previous.secret,{httpOnly:true,secure:true,sameSite:'none',path:'/api/learning',maxAge:Math.max(1,Math.floor((previous.expiresAt-Date.now())/1000))});return Response.json({id:previous.id,mode:previous.mode,deadline:previous.deadline,questions:JSON.parse(previous.questions).map(publicQuestion),answers:JSON.parse(previous.answers),invalid,resumed:true})}
      }else await db.collection('certproAttempts').doc(id).create(attempt)
      ;(await cookies()).set(`cp_${id}`, secret, {httpOnly:true, secure:true, sameSite:"none", path:"/api/learning", maxAge:24*60*60})
      return Response.json({id, mode:input.mode, deadline, questions:questions.map(publicQuestion), invalid})
    }
    if (!/^[a-f0-9]{32}$/.test(input.id ?? "")) throw new HttpError(400,"Invalid attempt.")
    if(input.action==='resume'){
      const uid=await learner(request,true)
      const ref=db.collection('certproAttempts').doc(input.id)
      const previous=(await ref.get()).data()
      if(!previous||previous.uid!==uid||previous.mode!=='practice'||previous.abandoned)throw new HttpError(403,'Practice session is not available for this account.')
      if(input.certification&&bankId(input.certification)!==bankId(previous.certification))throw new HttpError(409,'This practice session belongs to a different certification.')
      if(Object.hasOwn(input,'section')&&(input.section||null)!==(previous.section||null))throw new HttpError(409,'This practice session belongs to a different topic.')
      const snapshot={id:input.id,certification:previous.certification,section:previous.section||null,questions:JSON.parse(previous.questions).map(publicQuestion),deadline:null,invalid:0}
      if(previous.submitted)return Response.json({...snapshot,result:JSON.parse(previous.result)},{headers:{'Cache-Control':'private, no-store'}})
      const questions:Question[]=JSON.parse(previous.questions),answers=JSON.parse(previous.answers)
      const feedback=Object.fromEntries(questions.filter(q=>q.id in answers).map(q=>[q.id,{correct:isCorrect(q,answers[q.id]),correctAnswer:q.correctAnswer,explanation:q.explanation,sourceUrl:q.sourceUrl??null}]))
      await ref.update({expiresAt:Date.now()+30*86400000,updatedAt:new Date().toISOString()})
      ;(await cookies()).set(`cp_${input.id}`,previous.secret,{httpOnly:true,secure:true,sameSite:'none',path:'/api/learning',maxAge:30*86400})
      return Response.json({...snapshot,answers,feedback},{headers:{'Cache-Control':'private, no-store'}})
    }
    const secret = (await cookies()).get(`cp_${input.id}`)?.value
    if (!secret) throw new HttpError(401,"Attempt session missing. Restart the quiz.")
    const uid=await learner(request,true)
    if(input.action==='explain'){
      requireTutorAcknowledgement(input.aiAcknowledged)
      if(!tutorModes.includes(input.style))throw new HttpError(400,'Choose an explanation style.')
      const attempt=(await db.collection('certproAttempts').doc(input.id).get()).data()
      if(!attempt||typeof attempt.secret!=='string'||secret.length!==attempt.secret.length||!timingSafeEqual(Buffer.from(secret),Buffer.from(attempt.secret)))throw new HttpError(403,'Attempt access denied.')
      let checked;try{checked=checkedPracticeQuestion(attempt,uid!,input.questionId)}catch(e){throw new HttpError(403,(e as Error).message)}
      return Response.json(await explainPractice(uid!,checked.question,checked.answer,input.style),{headers:{'Cache-Control':'private, no-store'}})
    }
    return await db.runTransaction(async tx => {
      const ref = db.collection("certproAttempts").doc(input.id)
      const snap = await tx.get(ref)
      const attempt = snap.data()
      if (!attempt || secret.length !== attempt.secret.length || !timingSafeEqual(Buffer.from(secret),Buffer.from(attempt.secret))) throw new HttpError(403,"Attempt access denied.")
      if(attempt.uid && attempt.uid!==uid)throw new HttpError(403,'This attempt belongs to another account.')
      if (Date.now() > attempt.expiresAt) throw new HttpError(410,"Attempt expired. Start a new quiz.")
      if(attempt.abandoned)throw new HttpError(410,"This exam was left. Start a new attempt.")
      if(input.action === "leave" && !attempt.submitted){tx.update(ref,{abandoned:true,abandonedAt:new Date().toISOString()});return Response.json({left:true})}
      const questions: Question[] = JSON.parse(attempt.questions)
      const answers = JSON.parse(attempt.answers)
      if (attempt.submitted) return Response.json({result:JSON.parse(attempt.result)})
      const expired = attempt.deadline !== null && Date.now() >= attempt.deadline
      if (input.action === "answer" && !expired) {
        const question = questions.find(q=>q.id===input.questionId)
        if (!question || !validAnswer(question,input.answer)) throw new HttpError(400,"Complete every required answer before saving.")
        if (attempt.mode === "practice" && question.id in answers) throw new HttpError(409,"This practice answer has already been checked.")
        answers[question.id]=input.answer
        tx.update(ref,{answers:JSON.stringify(answers),updatedAt:new Date().toISOString()})
        return Response.json({saved:true, ...(attempt.mode === "practice" ? {feedback:{correct:isCorrect(question,input.answer), correctAnswer:question.correctAnswer, explanation:question.explanation, sourceUrl:question.sourceUrl ?? null}} : {})})
      }
      if (input.action !== "submit" && !expired) throw new HttpError(400,"Invalid attempt action.")
      const result = {...scoreQuestions(questions,answers), timedOut:expired}
      tx.update(ref,{submitted:true, submittedAt:new Date().toISOString(),updatedAt:new Date().toISOString(), result:JSON.stringify(result)})
      return Response.json({result})
    })
  } catch(e) {
    if(bankUnavailable(e)&&input?.action==='start'){
      try{
        await learner(request,true)
        if(input.mode!=='practice')throw new HttpError(503,'Mock Exams are temporarily unavailable while Firebase recovers. Your attempt allowance has not been bypassed. Use Practical Mode for temporary study; saved scores will return when the service recovers.')
        const certification=bankId(input.certification)
        const recovered=recoveredBank(certification)
        const eligible=TESTING_ACCESS?recovered.questions:freeQuestions(certification,recovered.questions)
        const questions=input.section?eligible.filter(q=>questionSection(certification,q)===input.section):eligible
        return Response.json({id:'recovery-'+randomBytes(16).toString('hex'),mode:'practice',deadline:null,questions:questions.map(publicQuestion),recoveryQuestions:questions,invalid:recovered.invalid,recovery:true},{headers:{'Cache-Control':'private, no-store'}})
      }catch(error){return failure(error)}
    }
    return failure(e)
  }
}
