import {certificationById} from './catalog'
import {progressCertification,type ProgressData} from './device-progress'
import {checkpointKey} from './learning-memory'
import type {PublicQuestion} from './questions'

type AttemptSummary=ProgressData['attempts'][number]
export type StudyTopic={section:string;updatedAt:string}
export type Checkpoint={attempt:{id:string;ownerUid:string;questions:PublicQuestion[];recovery?:boolean;[key:string]:unknown};index:number;answers:Record<string,unknown>;saved:Record<string,unknown>;feedback:Record<string,any>;updatedAt?:string}
export const topicKey=(uid:string,certification:string)=>'certpro.topic.v1:'+encodeURIComponent(uid)+':'+encodeURIComponent(progressCertification(certification))
const record=(value:unknown):value is Record<string,any>=>!!value&&typeof value==='object'&&!Array.isArray(value)
const time=(value?:string)=>value&&Number.isFinite(Date.parse(value))?Date.parse(value):0

export function readStudyTopic(storage:Pick<Storage,'getItem'>,uid:string,certification:string):StudyTopic|undefined{
 try{const raw=storage.getItem(topicKey(uid,certification));const value=raw?JSON.parse(raw):null;return value&&typeof value.section==='string'&&time(value.updatedAt)?value:undefined}catch{return undefined}
}
export function rememberStudyTopic(storage:Pick<Storage,'setItem'>,uid:string,certification:string,section:string){
 storage.setItem(topicKey(uid,certification),JSON.stringify({section,updatedAt:new Date().toISOString()}))
}
export function readPracticeCheckpoint(storage:Pick<Storage,'getItem'>,uid:string,certification:string,section:string,id?:string):Checkpoint|undefined{
 const cert=certificationById(certification)
 const aliases=[...new Set([progressCertification(certification),certification,cert?.id,...(cert?.aliases||[])].filter((v):v is string=>!!v))]
 for(const alias of aliases){try{
  const raw=storage.getItem(checkpointKey(uid,alias,section));const value=raw?JSON.parse(raw):null
  if(value?.attempt?.ownerUid!==uid||(id&&value.attempt.id!==id)||typeof value.attempt.id!=='string'||!Array.isArray(value.attempt.questions)||!value.attempt.questions.length||!value.attempt.questions.every((q:any)=>typeof q?.id==='string'))continue
  return {...value,index:Number.isInteger(value.index)&&value.index>=0?value.index:0,answers:record(value.answers)?value.answers:{},saved:record(value.saved)?value.saved:{},feedback:record(value.feedback)?value.feedback:{}}
 }catch{/* A bad or blocked device checkpoint must not hide account history. */}}
 return undefined
}

export function continueLearning(certification:string,data:ProgressData,domains:{id:string;title:string}[],checkpoints:Record<string,{updatedAt?:string}>={},topic?:StudyTopic){
 const id=progressCertification(certification)
 const attempts=data.attempts.filter(a=>progressCertification(a.certification)===id)
 const activity=(a:AttemptSummary)=>Math.max(time(a.updatedAt||a.createdAt),time(checkpoints[a.id]?.updatedAt))
 const unfinished=attempts.filter(a=>a.mode==='practice'&&!a.submitted&&!a.abandoned&&a.total>0&&(!!checkpoints[a.id]||(!a.deviceOnly&&/^[a-f0-9]{32}$/.test(a.id)))).sort((a,b)=>activity(b)-activity(a))[0]
 const reviewed=new Set(data.saved.find(s=>progressCertification(s.certification)===id)?.studiedSections||[])
 const topicValid=topic&&(!topic.section||topic.section==='additional'||domains.some(d=>d.id===topic.section))&&!reviewed.has(topic.section)
 const topicFinished=topic&&attempts.some(a=>a.mode==='practice'&&a.submitted&&(a.section||'')===topic.section&&time(a.submittedAt||undefined)>=time(topic.updatedAt))
 const newerTopic=topicValid&&!topicFinished&&(!unfinished||topic!.section!==(unfinished.section||'')&&time(topic!.updatedAt)>activity(unfinished))
 const attempt=newerTopic?undefined:unfinished
 const section=attempt?.section||(newerTopic?topic!.section:attempt?'':domains.find(d=>!reviewed.has(d.id))?.id)||''
 const params=new URLSearchParams({certification:id});if(section)params.set('section',section);if(attempt)params.set('resume',attempt.id)
 const title=domains.find(d=>d.id===section)?.title||(section==='additional'?'Additional bank topics':'All available questions')
 return {href:'/practice?'+params.toString(),attempt,section,title}
}

// Keep the exact local question/draft when available. A different device starts at
// the first unchecked question; checked answers and feedback remain authoritative.
export function practiceResumeState(questions:PublicQuestion[],serverAnswers:Record<string,unknown>,serverFeedback:Record<string,any>,checkpoint?:Checkpoint){
 const ids=new Set(questions.map(q=>q.id));const onlyKnown=(entries:Record<string,unknown>)=>Object.fromEntries(Object.entries(entries).filter(([id])=>ids.has(id)))
 const saved=onlyKnown(serverAnswers)
 const answers={...onlyKnown(checkpoint?.answers||{}),...saved}
 const previousId=checkpoint?.attempt.questions[checkpoint.index]?.id
 const previousIndex=previousId?questions.findIndex(q=>q.id===previousId):-1
 const unanswered=questions.findIndex(q=>!Object.hasOwn(saved,q.id))
 const index=previousIndex>=0?previousIndex:unanswered>=0?unanswered:Math.max(0,questions.length-1)
 return {saved,answers,feedback:onlyKnown(serverFeedback),index}
}
