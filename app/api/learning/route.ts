import { randomBytes, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"
import { body, failure, HttpError, sameOrigin, services } from "@/lib/server/firebase"
import { normalizeQuestion, publication, publicQuestion, questionSchema, scoreQuestions, validAnswer, isCorrect, type Question } from "@/lib/questions"
export const runtime = "nodejs"
async function bank(certification: string) {
  const snapshot = await services().db.collection("questions").where("certification","==",certification).get()
  const published = snapshot.docs.map(d => normalizeQuestion(d.data(),d.id)).filter(q => publication(q) === "published")
  const questions = published.filter(q => questionSchema.safeParse(q).success).sort((a,b)=>a.id.localeCompare(b.id)).slice(0,100)
  return {questions, invalid:published.length - published.filter(q=>questionSchema.safeParse(q).success).length}
}
export async function GET(request: Request) {
  try {
    const certification = new URL(request.url).searchParams.get("certification") ?? ""
    if (!/^[a-z0-9-]{1,100}$/.test(certification)) throw new HttpError(400,"Invalid certification.")
    const {questions,invalid} = await bank(certification)
    return Response.json({count:questions.length, invalid}, {headers:{"Cache-Control":"no-store"}})
  } catch(e) { return failure(e) }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request)
    const input = await body(request)
    const {db} = services()
    if (input.action === "start") {
      if (!/^[a-z0-9-]{1,100}$/.test(input.certification ?? "") || !["practice","exam"].includes(input.mode)) throw new HttpError(400,"Invalid learning mode or certification.")
      const {questions,invalid} = await bank(input.certification)
      if (!questions.length) return Response.json({questions:[], invalid})
      const id = randomBytes(16).toString("hex")
      const secret = randomBytes(32).toString("hex")
      const deadline = input.mode === "exam" ? Date.now() + 90*60*1000 : null
      await db.collection("certproAttempts").doc(id).create({secret, mode:input.mode, questions:JSON.stringify(questions), answers:"{}", deadline, createdAt:new Date().toISOString(), expiresAt:Date.now()+24*60*60*1000, submitted:false})
      ;(await cookies()).set(`cp_${id}`, secret, {httpOnly:true, secure:true, sameSite:"none", path:"/api/learning", maxAge:24*60*60})
      return Response.json({id, mode:input.mode, deadline, questions:questions.map(publicQuestion), invalid})
    }
    if (!/^[a-f0-9]{32}$/.test(input.id ?? "")) throw new HttpError(400,"Invalid attempt.")
    const secret = (await cookies()).get(`cp_${input.id}`)?.value
    if (!secret) throw new HttpError(401,"Attempt session missing. Restart the quiz.")
    return await db.runTransaction(async tx => {
      const ref = db.collection("certproAttempts").doc(input.id)
      const snap = await tx.get(ref)
      const attempt = snap.data()
      if (!attempt || secret.length !== attempt.secret.length || !timingSafeEqual(Buffer.from(secret),Buffer.from(attempt.secret))) throw new HttpError(403,"Attempt access denied.")
      if (Date.now() > attempt.expiresAt) throw new HttpError(410,"Attempt expired. Start a new quiz.")
      const questions: Question[] = JSON.parse(attempt.questions)
      const answers = JSON.parse(attempt.answers)
      if (attempt.submitted) return Response.json({result:JSON.parse(attempt.result)})
      const expired = attempt.deadline !== null && Date.now() >= attempt.deadline
      if (input.action === "answer" && !expired) {
        const question = questions.find(q=>q.id===input.questionId)
        if (!question || !validAnswer(question,input.answer)) throw new HttpError(400,"Complete every required answer before saving.")
        if (attempt.mode === "practice" && question.id in answers) throw new HttpError(409,"This practice answer has already been checked.")
        answers[question.id]=input.answer
        tx.update(ref,{answers:JSON.stringify(answers)})
        return Response.json({saved:true, ...(attempt.mode === "practice" ? {feedback:{correct:isCorrect(question,input.answer), correctAnswer:question.correctAnswer, explanation:question.explanation, sourceUrl:question.sourceUrl ?? null}} : {})})
      }
      if (input.action !== "submit" && !expired) throw new HttpError(400,"Invalid attempt action.")
      const result = {...scoreQuestions(questions,answers), timedOut:expired}
      tx.update(ref,{submitted:true, submittedAt:new Date().toISOString(), result:JSON.stringify(result)})
      return Response.json({result})
    })
  } catch(e) { return failure(e) }
}
