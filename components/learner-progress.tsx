'use client'
import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {ArrowRight,CalendarDays,Clock3} from 'lucide-react'
import {readDevicePlans} from '@/lib/device-study-plans'
import {localDate,type StudyPlan} from '@/lib/study-plan'
import resumeStyles from './home-resume.module.css'
import {auth} from '@/lib/firebase'
import {certifications,certificationById} from '@/lib/catalog'
import {continueLearning,readPracticeCheckpoint,readStudyTopic} from '@/lib/continue-learning'
import {useEffect,useState} from 'react'
import useSWR from 'swr'
import {useAuth} from '@/hooks/use-auth'
import {learnerFetch} from '@/lib/learner-client'
import previews from '@/data/guide-previews.json'
const guideFor=(id:string)=> (previews as Record<string,{domains:{id:string;title:string}[]}>)[certificationById(id)?.id||id]||{domains:[]}
import {visibleProgressCertifications} from '@/lib/progress-view'
import {readProgress,storeProgress,mergeProgress,emptyProgress,saveDeviceCertification,progressCertification,type ProgressData} from '@/lib/device-progress'
import {Button} from '@/components/ui/button'
type HomeResume={certificationId:string;href:string;title:string;certification:string;answered:number;total:number;isAttempt:boolean}
const activityTime=(value?:string|null)=>value&&Number.isFinite(Date.parse(value))?Date.parse(value):0

export function homeResumeTarget(progress:ProgressData,uid:string,storage?:Pick<Storage,'getItem'>):HomeResume|null{
   const checkpoints:Record<string,{updatedAt?:string}>={}
   if(storage)for(const attempt of progress.attempts){
    if(attempt.mode!=='practice'||attempt.submitted||attempt.abandoned)continue
    const checkpoint=readPracticeCheckpoint(storage,uid,attempt.certification,attempt.section||'',attempt.id)
    if(checkpoint)checkpoints[attempt.id]={updatedAt:checkpoint.updatedAt}
   }
   const ids=[...new Set([...certifications.map(c=>progressCertification(c.id)),...progress.saved.map(s=>progressCertification(s.certification)),...progress.attempts.map(a=>progressCertification(a.certification))])]
   const visible=new Set(visibleProgressCertifications(progress))
   const removed=new Set((progress.unsaved||[]).map(item=>progressCertification(item.certification)))
   // Topic checkpoints and retained attempts must respect Remove, including after reload.
   const candidates=ids.filter(id=>!removed.has(id)||visible.has(id)).map(id=>{
    const guide=guideFor(id),topic=storage?readStudyTopic(storage,uid,id):undefined
    const target=continueLearning(id,progress,guide.domains,checkpoints,topic)
    const saved=progress.saved.find(s=>progressCertification(s.certification)===id)
    const topicActive=topic&&target.section===topic.section&&!saved?.studiedSections.includes(topic.section)&&
     (!topic.section||topic.section==='additional'||guide.domains.some(d=>d.id===topic.section))&&
     !progress.attempts.some(a=>progressCertification(a.certification)===id&&a.mode==='practice'&&a.submitted&&(a.section||'')===topic.section&&activityTime(a.submittedAt)>=activityTime(topic.updatedAt))
    const updated=target.attempt?Math.max(activityTime(target.attempt.updatedAt||target.attempt.createdAt),activityTime(checkpoints[target.attempt.id]?.updatedAt)):topicActive?activityTime(topic.updatedAt):0
    return {updated,target,id}
   }).filter(c=>c.updated>0).sort((a,b)=>b.updated-a.updated)
   const latest=candidates[0]
   return latest?{certificationId:latest.id,href:latest.target.href,title:latest.target.title,certification:certificationById(latest.id)?.name||latest.id,answered:latest.target.attempt?Math.min(new Set(latest.target.attempt.answeredIds).size,latest.target.attempt.total):0,total:latest.target.attempt?.total||0,isAttempt:!!latest.target.attempt}:null
}

function HomeContinue({uid}:{uid:string}){
 const {data,syncUnavailable,storageUnavailable}=useProgress()
 const signature=JSON.stringify(data)
 const [state,setState]=useState<{uid:string;signature:string;target:HomeResume|null;plans:StudyPlan[];now:Date}>({uid:'',signature:'',target:null,plans:[],now:new Date()})
 useEffect(()=>{
  const load=()=>{
   const progress=JSON.parse(signature) as ProgressData
   let storage:Storage|undefined,plans:StudyPlan[]=[]
   try{storage=window.localStorage;plans=readDevicePlans(storage,uid)}catch{/* Optional plan details must not prevent resuming saved practice. */}
   setState({uid,signature,target:homeResumeTarget(progress,uid,storage),plans,now:new Date()})
  }
  load();window.addEventListener('storage',load);window.addEventListener('certpro-progress',load);window.addEventListener('certpro-study-plans',load);document.addEventListener('visibilitychange',load)
  const timer=setInterval(load,60000)
  return()=>{clearInterval(timer);window.removeEventListener('storage',load);window.removeEventListener('certpro-progress',load);window.removeEventListener('certpro-study-plans',load);document.removeEventListener('visibilitychange',load)}
 },[uid,signature])
 const current=state.uid===uid&&state.signature===signature
 const target=current?state.target:null
 const plan=target?state.plans.find(p=>progressCertification(p.certification)===target.certificationId):undefined
 const days=plan?Math.round((Date.parse(plan.examDate)-Date.parse(localDate(state.now,plan.timezone)))/86400000):null
 const planDate=plan?new Intl.DateTimeFormat('en-AU',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(plan.examDate+'T12:00:00Z')):''
 return <div className={resumeStyles.card}>
  <div className={resumeStyles.content}>
   <h2 className={resumeStyles.heading}>{target?'Pick up where you left off':'Make room for your next milestone'}</h2>
   {target?<>
    <p className={resumeStyles.certification}>{target.certification}</p>
    <p className={resumeStyles.topic}>{target.title}</p>
    {target.isAttempt&&target.total>0&&<div className={resumeStyles.progress}>
     <div className={resumeStyles.progressLabel}><span>{target.answered} of {target.total} answers saved</span><span>{target.total-target.answered} remaining</span></div>
     <progress max={target.total} value={target.answered} aria-label="Answers saved in this practice session"/>
    </div>}
    <div className={resumeStyles.plan}>
     {plan?<><span><CalendarDays size={16} aria-hidden="true"/>{days===0?'Exam goal: today':days!==null&&days>0?`${days} ${days===1?'day':'days'} until your exam goal`:`Exam goal was ${planDate}`}</span><span><Clock3 size={16} aria-hidden="true"/>{plan.minutes} min per study day</span><Link href={'/study-plan?certification='+encodeURIComponent(target.certificationId)} className="cp-text-link">Edit plan</Link></>:<Link href={'/study-plan?certification='+encodeURIComponent(target.certificationId)} className="cp-text-link"><CalendarDays size={16} aria-hidden="true"/>Set an exam goal</Link>}
    </div>
   </>:<p className={resumeStyles.topic}>Choose a certification to start your first practice session. We’ll help you return to your saved place.</p>}
   {(syncUnavailable||storageUnavailable)&&<p className={resumeStyles.status}>{storageUnavailable?'Device history is unavailable.':'Account sync is unavailable; showing this device’s history.'}</p>}
  </div>
  <div className={resumeStyles.actions}>
   <Link className="cp-primary" href={target?target.href:'/certifications'}>{target?(target.isAttempt?'Resume practice':'Continue topic'):'Find a certification'}<ArrowRight size={17} aria-hidden="true"/></Link>
   <Link href="/progress" className="cp-text-link">View My Progress<ArrowRight size={16} aria-hidden="true"/></Link>
  </div>
 </div>
}
export function WelcomeBack(){
 const {user}=useAuth(),path=usePathname()
 if(!user)return null
 return <section className="mx-auto max-w-7xl px-6 py-5" aria-label="Your next study session">
  <p className="text-xl font-semibold">Welcome back{user.name?.trim()?<>, <span className="gradient-text">{user.name.trim().split(/\s+/)[0]}</span></>:''}</p>
  {path==='/'?<HomeContinue uid={user.id}/>:path==='/progress'?null:<p className="text-sm text-muted-foreground">Make room for your next milestone. <Link href="/progress" className="underline">Continue learning →</Link></p>}
 </section>
}
export function useProgress(){
 const {user}=useAuth();const [local,setLocal]=useState<{uid:string;data:ProgressData}>({uid:'',data:emptyProgress()});const [storageError,setStorageError]=useState('')
 const cloud=useSWR(user?['/api/progress',user.id]:null,async([url,uid])=>{
  // Bind the request to the cache key, even if authentication changes mid-request.
  const account=auth.currentUser
  if(!account||account.uid!==uid)throw Error('Account changed. Reload your progress.')
  const token=await account.getIdToken()
  if(auth.currentUser?.uid!==uid)throw Error('Account changed. Reload your progress.')
  const r=await fetch(url,{headers:{Authorization:`Bearer ${token}`}}),d=await r.json()
  if(auth.currentUser?.uid!==uid)throw Error('Account changed. Reload your progress.')
  if(!r.ok)throw Error(d.error)
  return d
 },{revalidateOnFocus:false,shouldRetryOnError:false,keepPreviousData:false})
 useEffect(()=>{setStorageError('');if(!user){setLocal({uid:'',data:emptyProgress()});return}const load=()=>{try{setLocal({uid:user.id,data:readProgress(user.id)})}catch{setStorageError('Browser storage is unavailable. Device progress cannot be saved.')}};load();window.addEventListener('certpro-progress',load);window.addEventListener('storage',load);return()=>{window.removeEventListener('certpro-progress',load);window.removeEventListener('storage',load)}},[user?.id])
 useEffect(()=>{if(!user||!cloud.data)return;try{storeProgress(user.id,mergeProgress(readProgress(user.id),cloud.data))}catch{setStorageError('Could not keep a device copy of your account history.')}},[user?.id,cloud.data])
 const data=mergeProgress(local.uid===user?.id?local.data:emptyProgress(),cloud.data||emptyProgress())
 return {...cloud,data,error:null,isLoading:false,syncUnavailable:!!cloud.error,storageUnavailable:!!storageError,warning:storageError||(cloud.error?'Account sync is unavailable. Showing history saved on this device; older account history may be missing.':'Device history is retained in this browser. Cloud-backed attempts also save to your account. Device-only attempts are not uploaded automatically.')}
}
export async function updateProgress(uid:string,input:any){saveDeviceCertification(uid,input);try{const r=await learnerFetch('/api/progress',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});if(!r.ok&&r.status!==503)throw Error((await r.json()).error);return r.ok}catch(e){if(e instanceof TypeError)return false;throw e}}
export function SaveCertification({certification}:{certification:string}){const {user,isOwner}=useAuth();const {data,mutate,warning}=useProgress();const [busy,setBusy]=useState(false),[error,setError]=useState('');const saved=data?.saved?.some((s:any)=>progressCertification(s.certification)===progressCertification(certification));return <div className="my-4">{!user?<Link className="cp-secondary" href="/auth/login">Sign in to save this certification</Link>:<Button disabled={busy||saved} onClick={async()=>{setBusy(true);try{await updateProgress(user.id,{action:'save',certification});await mutate().catch(()=>undefined)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}}>{saved?'Saved in My Progress':busy?'Saving…':'Save to My Progress'}</Button>}{saved&&isOwner&&<details className="cp-note mt-2"><summary>Admin: storage status</summary><p>{warning}</p></details>}{error&&<p role="alert">{error}</p>}</div>}
