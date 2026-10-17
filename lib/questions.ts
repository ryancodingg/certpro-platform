import { z } from "zod"

const text = z.string().trim().min(1).max(20000)
const safeUrl = z.union([z.literal(""), z.string().url().refine(v => v.startsWith("https://"), "Use HTTPS URLs")]).optional()
export const questionSchema = z.object({
  question: text, options: z.array(text).max(100).default([]),
  correctAnswer: z.union([z.number().int(), z.array(z.number().int()), z.array(z.boolean()), z.array(z.string())]),
  explanation: text, topic: text, difficulty: z.enum(["Easy", "Medium", "Hard"]),
  certification: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{1,100}$/),
  questionType: z.enum(["single", "multiple", "yesno", "dropdown"]).default("single"),
  status: z.enum(["draft", "published", "archived"]).optional(),
  isActive: z.boolean().default(true), isAiGenerated: z.boolean().default(false),
  createdAt: z.string().optional(), sourceUrl: safeUrl, imageUrl: safeUrl,
  scenario: z.string().max(20000).optional(), statements: z.array(text).max(100).optional(),
  dropdownQuestions: z.array(text).max(100).optional(), dropdownOptions: z.array(z.array(text).min(2).max(100)).optional(),
  codeSnippet: z.string().max(30000).optional(), codeLanguage: z.string().optional(), hasCodeSnippet: z.boolean().optional(), hasEmbeddedContent: z.boolean().optional(),
  images: z.array(z.object({url: z.string().url().refine(v => v.startsWith("https://")), alt: z.string(), caption: z.string().optional(), position: z.enum(["top", "middle", "bottom", "inline"])})).max(20).optional(),
}).superRefine((q, ctx) => {
  if (!validAnswer(q, q.correctAnswer)) ctx.addIssue({code: "custom", path: ["correctAnswer"], message: "Answer does not match the question type, options, or required prompts"})
})
export type Question = z.infer<typeof questionSchema> & {id: string; updatedAt?: string; updatedBy?: string; createdBy?: string; archivedAt?: string | null}
export type Answer = number | number[] | boolean[] | string[]
export type PublicQuestion = Omit<Question, "correctAnswer" | "explanation" | "sourceUrl" | "updatedBy" | "createdBy">
type Shape = { questionType?: string; options: string[]; statements?: string[]; dropdownQuestions?: string[]; dropdownOptions?: string[][] }
export function validAnswer(q: Shape, value: unknown): value is Answer {
  const index = (v: unknown) => typeof v === "number" && Number.isInteger(v) && v >= 0 && v < q.options.length
  if (q.questionType === "multiple") return q.options.length >= 2 && Array.isArray(value) && value.length > 0 && new Set(value).size === value.length && value.every(index)
  if (q.questionType === "yesno") return !!q.statements?.length && Array.isArray(value) && value.length === q.statements.length && Array.from(value).every(v => typeof v === "boolean")
  if (q.questionType === "dropdown") return !!q.dropdownQuestions?.length && q.dropdownOptions?.length === q.dropdownQuestions.length && Array.isArray(value) && value.length === q.dropdownQuestions.length && Array.from(value).every((v,i) => typeof v === "string" && q.dropdownOptions?.[i]?.includes(v))
  return q.options.length >= 2 && index(value)
}
export function isCorrect(q: Question, answer: unknown) {
  if (!validAnswer(q, answer)) return false
  if (q.questionType === "multiple") return JSON.stringify([...(answer as number[])].sort((a,b)=>a-b)) === JSON.stringify([...(q.correctAnswer as number[])].sort((a,b)=>a-b))
  return JSON.stringify(answer) === JSON.stringify(q.correctAnswer)
}
export function scoreQuestions(questions: Question[], answers: Record<string, unknown>) {
  const review = questions.map(q => ({...q, answer: answers[q.id] ?? null, correct: isCorrect(q, answers[q.id])}))
  const correct = review.filter(q => q.correct).length
  return {correct, total: questions.length, score: questions.length ? Math.round(correct / questions.length * 100) : 0, review}
}
export function publicQuestion(q: Question): PublicQuestion {
  const {correctAnswer, explanation, sourceUrl, updatedBy, createdBy, ...safe} = q
  return safe
}
export function normalizeQuestion(data: Record<string, any>, id: string): Question {
  const q = {...data}
  if (q.dropdownOptionsFlat) {
    q.dropdownOptions = [[]]
    for (const option of q.dropdownOptionsFlat) {
      if (option === "") q.dropdownOptions.push([])
      else q.dropdownOptions[q.dropdownOptions.length - 1].push(option)
    }
  }
  if ((!q.questionType || q.questionType === "single") && Array.isArray(q.correctAnswer) && q.correctAnswer.length === 1) q.correctAnswer = q.correctAnswer[0]
  for (const key of ["createdAt", "updatedAt", "archivedAt"]) if (q[key]?.toDate) q[key] = q[key].toDate().toISOString()
  return {...q, id} as Question
}
export function fingerprint(q: {certification: string; question: string}) { return `${q.certification.toLowerCase()}:${q.question.trim().replace(/\s+/g, " ").toLowerCase()}` }
export function publication(q: {status?: string; isActive?: boolean}) { return q.status ?? (q.isActive === false ? "draft" : "published") }
