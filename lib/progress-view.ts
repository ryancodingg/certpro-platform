import {checkpointKey} from './learning-memory'
import {progressCertification,type ProgressData} from './device-progress'
import {localDate,type StudyPlan} from './study-plan'

export function examGoal(plan:StudyPlan,now:Date){
 const today=localDate(now,plan.timezone)
 const days=Math.round((Date.parse(plan.examDate)-Date.parse(today))/86400000)
 const date=new Intl.DateTimeFormat('en',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(plan.examDate+'T12:00:00Z'))
 return {days,date,label:days<0?'Time for a new goal':days===0?'Your target is today':days===1?'1 day to your exam goal':`${days} days to your exam goal`}
}

export function progressCard(id:string,data:ProgressData,domains:{id:string;title:string}[]){
 const canonical=progressCertification(id)
 const saved=data.saved.find(s=>progressCertification(s.certification)===canonical)
 const attempts=data.attempts.filter(a=>progressCertification(a.certification)===canonical)
  .sort((a,b)=>(b.updatedAt||b.submittedAt||b.createdAt).localeCompare(a.updatedAt||a.submittedAt||a.createdAt))
 const validSections=new Set(domains.map(d=>d.id))
 const reviewed=new Set((saved?.studiedSections||[]).filter(id=>validSections.has(id)))
 const practiced=new Set(attempts.filter(a=>a.mode==='practice').flatMap(a=>a.answeredIds))
 const mock=attempts.find(a=>a.mode==='exam'&&a.submitted&&typeof a.score==='number'&&Number.isFinite(a.score))
 const practice=attempts.find(a=>a.mode==='practice')
 const active=practice&&!practice.submitted&&practice.answeredIds.length>0?practice:undefined
 const next=domains.find(d=>!reviewed.has(d.id))
 const practiceHref='/practice?certification='+encodeURIComponent(canonical)+(active?.section?'&section='+encodeURIComponent(active.section):'')
 return {saved,attempts,mock,practice,active,next,practiced:practiced.size,reviewed:reviewed.size,
  guidePercent:domains.length?Math.round(reviewed.size/domains.length*100):null,
  practiceAnswered:practice?Math.min(new Set(practice.answeredIds).size,Math.max(0,practice.total)):0,
  practiceHref}
}

export function hasPracticeCheckpoint(storage:Pick<Storage,'getItem'>,uid:string,attempt:ProgressData['attempts'][number]):boolean{
 if(!uid||attempt.mode!=='practice'||attempt.submitted)return false
 try{
  const raw=storage.getItem(checkpointKey(uid,progressCertification(attempt.certification),attempt.section||''))
  const value=raw?JSON.parse(raw):null
  return value?.attempt?.ownerUid===uid&&value.attempt.id===attempt.id&&Array.isArray(value.attempt.questions)&&value.attempt.questions.length>0
 }catch{return false}
}

/** An archived card stays hidden even when old attempts are fetched again. */
export function visibleProgressCertifications(data:ProgressData):string[]{
 const removed=new Map<string,string>()
 for(const item of data.unsaved||[]){const id=progressCertification(item.certification);if((removed.get(id)||'')<item.removedAt)removed.set(id,item.removedAt)}
 const saved=new Map<string,string>()
 for(const item of data.saved){const id=progressCertification(item.certification);if((saved.get(id)||'')<item.savedAt)saved.set(id,item.savedAt)}
 return [...new Set([...data.saved,...data.attempts].map(item=>progressCertification(item.certification)))].filter(id=>!removed.has(id)||(saved.get(id)||'')>removed.get(id)!)
}
