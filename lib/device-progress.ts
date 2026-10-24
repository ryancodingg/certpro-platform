import {z} from 'zod'
import {certificationById} from './catalog'
const savedSchema=z.object({certification:z.string(),studiedSections:z.array(z.string()).default([]),savedAt:z.string()})
const attemptSchema=z.object({id:z.string(),certification:z.string(),mode:z.enum(['practice','exam']),section:z.string().nullable(),answeredIds:z.array(z.string()),total:z.number(),submitted:z.boolean(),score:z.number().nullable(),correct:z.number().nullable(),createdAt:z.string(),submittedAt:z.string().nullable(),deviceOnly:z.boolean().optional(),updatedAt:z.string().optional(),abandoned:z.boolean().optional()})
const schema=z.object({saved:z.array(savedSchema),attempts:z.array(attemptSchema),unsaved:z.array(z.object({certification:z.string(),removedAt:z.string()})).optional()})
export type ProgressData=z.infer<typeof schema>
export const emptyProgress=():ProgressData=>({saved:[],attempts:[]})
export function progressCertification(id:string){const c=certificationById(id);return c?.aliases[0]||c?.id||id}
export function mergeProgress(local:ProgressData,cloud:ProgressData):ProgressData{
 const removed=new Map<string,{certification:string;removedAt:string}>()
 for(const item of [...(cloud.unsaved||[]),...(local.unsaved||[])]){const id=progressCertification(item.certification);if(!removed.has(id)||removed.get(id)!.removedAt<item.removedAt)removed.set(id,{...item,certification:id})}
 const saved=new Map<string,z.infer<typeof savedSchema>>()
 for(const item of [...cloud.saved,...local.saved]){const id=progressCertification(item.certification),tombstone=removed.get(id);if(tombstone&&item.savedAt<=tombstone.removedAt)continue;const old=saved.get(id);if(!old||item.savedAt>=old.savedAt)saved.set(id,{...item,certification:id})}

 const attempts=new Map(local.attempts.map(a=>[a.id,a]));for(const a of cloud.attempts){const local=attempts.get(a.id);const updatedAt=[local?.updatedAt,a.updatedAt,a.createdAt].filter((v):v is string=>!!v).sort().at(-1);attempts.set(a.id,{...a,updatedAt})}
 return {saved:[...saved.values()],unsaved:[...removed.values()],attempts:[...attempts.values()].sort((a,b)=>(b.updatedAt||b.submittedAt||b.createdAt).localeCompare(a.updatedAt||a.submittedAt||a.createdAt))}
}
export function readProgress(uid:string):ProgressData{const raw=localStorage.getItem('certpro.progress.v1:'+encodeURIComponent(uid));return raw?schema.parse(JSON.parse(raw)):emptyProgress()}
export function storeProgress(uid:string,value:ProgressData){localStorage.setItem('certpro.progress.v1:'+encodeURIComponent(uid),JSON.stringify(schema.parse(value)));window.dispatchEvent(new Event('certpro-progress'))}
export function saveDeviceCertification(uid:string,input:{certification:string;action:string;section?:string;completed?:boolean}){
 const data=readProgress(uid),id=progressCertification(input.certification);let saved=data.saved.find(s=>progressCertification(s.certification)===id)
 if(input.action==='unsave'){data.saved=data.saved.filter(s=>progressCertification(s.certification)!==id);data.unsaved=[...(data.unsaved||[]).filter(s=>progressCertification(s.certification)!==id),{certification:id,removedAt:new Date().toISOString()}];storeProgress(uid,data);return}
 const removedAt=(data.unsaved||[]).find(s=>progressCertification(s.certification)===id)?.removedAt
 const savedAt=new Date(Math.max(Date.now(),removedAt?Date.parse(removedAt)+1:0)).toISOString()
 if(!saved){saved={certification:id,studiedSections:[],savedAt};data.saved.push(saved)}
 if(input.action==='study'&&input.section){const sections=new Set(saved.studiedSections);input.completed?sections.add(input.section):sections.delete(input.section);saved.studiedSections=[...sections]}
 storeProgress(uid,data)
}
export function recordDeviceAttempt(uid:string,attempt:z.infer<typeof attemptSchema>){const data=readProgress(uid);const old=data.attempts.find(a=>a.id===attempt.id);data.attempts=data.attempts.filter(a=>a.id!==attempt.id);data.attempts.unshift({...attempt,certification:progressCertification(attempt.certification),createdAt:old?.createdAt||attempt.createdAt});storeProgress(uid,data)}
