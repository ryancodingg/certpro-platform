import recovery from '@/data/published-bank-recovery.json'
import {normalizeQuestion,publication,questionSchema} from '@/lib/questions'
export function bankUnavailable(error:unknown){const code=(error as {code?:string|number})?.code;return code===8||code===14||code==='RESOURCE_EXHAUSTED'||code==='UNAVAILABLE'}
export function recoveredBank(certification:string){const published=recovery.questions.map(q=>normalizeQuestion(q,q.id)).filter(q=>q.certification===certification&&publication(q)==='published');const questions=published.filter(q=>questionSchema.safeParse(q).success).sort((a,b)=>a.id.localeCompare(b.id));return {questions,invalid:published.length-questions.length,recovery:true}}
