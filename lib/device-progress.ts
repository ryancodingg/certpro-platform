import {z} from 'zod'
import {certificationById} from './catalog'
const savedSchema=z.object({certification:z.string(),studiedSections:z.array(z.string()).default([]),savedAt:z.string()})
const attemptSchema=z.object({id:z.string(),certification:z.string(),mode:z.enum(['practice','exam']),section:z.string().nullable(),answeredIds:z.array(z.string()),total:z.number(),submitted:z.boolean(),score:z.number().nullable(),correct:z.number().nullable(),createdAt:z.string(),submittedAt:z.string().nullable(),deviceOnly:z.boolean().optional()})
const schema=z.object({saved:z.array(savedSchema),attempts:z.array(attemptSchema)})
export type ProgressData=z.infer<typeof schema>
export const emptyProgress=():ProgressData=>({saved:[],attempts:[]})
export function progressCertification(id:string){const c=certificationById(id);return c?.aliases[0]||c?.id||id}
export function mergeProgress(local:ProgressData,cloud:ProgressData):ProgressData{
 const saved=new Map(local.saved.map(s=>[progressCertification(s.certification),{...s,certification:progressCertification(s.certification)}]))
 for(const s of cloud.saved){const id=progressCertification(s.certification);if(!saved.has(id))saved.set(id,{...s,certification:id})}
 const attempts=new Map(local.attempts.map(a=>[a.id,a]));for(const a of cloud.attempts)attempts.set(a.id,a)
 return {saved:[...saved.values()],attempts:[...attempts.values()].sort((a,b)=>(b.submittedAt||b.createdAt).localeCompare(a.submittedAt||a.createdAt))}
}
export function readProgress(uid:string):ProgressData{const raw=localStorage.getItem('certpro.progress.v1:'+encodeURIComponent(uid));return raw?schema.parse(JSON.parse(raw)):emptyProgress()}
export function storeProgress(uid:string,value:ProgressData){localStorage.setItem('certpro.progress.v1:'+encodeURIComponent(uid),JSON.stringify(schema.parse(value)));window.dispatchEvent(new Event('certpro-progress'))}
export function saveDeviceCertification(uid:string,input:{certification:string;action:string;section?:string;completed?:boolean}){
 const data=readProgress(uid),id=progressCertification(input.certification);let saved=data.saved.find(s=>s.certification===id)
 if(!saved){saved={certification:id,studiedSections:[],savedAt:new Date().toISOString()};data.saved.push(saved)}
 if(input.action==='study'&&input.section){const sections=new Set(saved.studiedSections);input.completed?sections.add(input.section):sections.delete(input.section);saved.studiedSections=[...sections]}
 storeProgress(uid,data)
}
export function recordDeviceAttempt(uid:string,attempt:z.infer<typeof attemptSchema>){const data=readProgress(uid);const old=data.attempts.find(a=>a.id===attempt.id);data.attempts=data.attempts.filter(a=>a.id!==attempt.id);data.attempts.unshift({...attempt,certification:progressCertification(attempt.certification),createdAt:old?.createdAt||attempt.createdAt});storeProgress(uid,data)}
