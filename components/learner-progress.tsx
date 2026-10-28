'use client'
import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {ArrowRight} from 'lucide-react'
import {auth} from '@/lib/firebase'
import {certifications,certificationById} from '@/lib/catalog'
import {continueLearning,readPracticeCheckpoint,readStudyTopic} from '@/lib/continue-learning'
import {useEffect,useState} from 'react'
import useSWR from 'swr'
import {useAuth} from '@/hooks/use-auth'
import {learnerFetch} from '@/lib/learner-client'
import {guideFor} from '@/lib/exam-guide'
import {readProgress,storeProgress,mergeProgress,emptyProgress,saveDeviceCertification,progressCertification,type ProgressData} from '@/lib/device-progress'
import {Button} from '@/components/ui/button'
type HomeResume={href:string;title:string;certification:string;answered:number;total:number;isAttempt:boolean}
const activityTime=(value?:string|null)=>value&&Number.isFinite(Date.parse(value))?Date.parse(value):0

export function homeResumeTarget(progress:ProgressData,uid:string,storage?:Pick<Storage,'getItem'>):HomeResume|null{
   const checkpoints:Record<string,{updatedAt?:string}>={}
   if(storage)for(const attempt of progress.attempts){
    if(attempt.mode!=='practice'||attempt.submitted||attempt.abandoned)continue
    const checkpoint=readPracticeCheckpoint(storage,uid,attempt.certification,attempt.section||'',attempt.id)
    if(checkpoint)checkpoints[attempt.id]={updatedAt:checkpoint.updatedAt}
   }
   const ids=[...new Set([...certifications.map(c=>progressCertification(c.id)),...progress.saved.map(s=>progressCertification(s.certification)),...progress.attempts.map(a=>progressCertification(a.certification))])]
   const candidates=ids.map(id=>{
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
   return latest?{href:latest.target.href,title:latest.target.title,certification:certificationById(latest.id)?.name||latest.id,answered:latest.target.attempt?Math.min(new Set(latest.target.attempt.answeredIds).size,latest.target.attempt.total):0,total:latest.target.attempt?.total||0,isAttempt:!!latest.target.attempt}:null
}

function HomeContinue({uid}:{uid:string}){
 const {data,syncUnavailable,storageUnavailable}=useProgress()
 const signature=JSON.stringify(data)
 const [state,setState]=useState<{uid:string;signature:string;target:HomeResume|null}>({uid:'',signature:'',target:null})
 useEffect(()=>{
  const load=()=>{
   const progress=JSON.parse(signature) as ProgressData
   let storage:Storage|undefined
   try{storage=window.localStorage}catch{/* Account attempts can still be resumed. */}
   setState({uid,signature,target:homeResumeTarget(progress,uid,storage)})
  }
  load();window.addEventListener('storage',load);window.addEventListener('certpro-progress',load);document.addEventListener('visibilitychange',load)
  return()=>{window.removeEventListener('storage',load);window.removeEventListener('certpro-progress',load);document.removeEventListener('visibilitychange',load)}
 },[uid,signature])
 const target=state.uid===uid&&state.signature===signature?state.target:null
 return <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <div className="min-w-0">
   {target?<><p className="font-semibold break-words">{target.certification}</p><p className="mt-1 text-sm text-muted-foreground break-words">{target.title}{target.isAttempt?` · ${target.answered} of ${target.total} answers saved`:''}</p></>:<p className="text-sm text-muted-foreground">Make room for your next milestone.</p>}
   {(syncUnavailable||storageUnavailable)&&<p className="mt-1 text-sm text-muted-foreground">{storageUnavailable?'Device history is unavailable.':'Account sync is unavailable; showing this device’s history.'}</p>}
  </div>
  <div className="flex shrink-0 flex-wrap items-center gap-4">
   {target&&<Link className="cp-primary" href={target.href}>{target.isAttempt?'Resume practice':'Continue topic'}<ArrowRight size={17} aria-hidden="true"/></Link>}
   <Link href="/progress" className="cp-text-link">{target?'View My Progress':'Continue learning'}<ArrowRight size={16} aria-hidden="true"/></Link>
  </div>
 </div>
}
export function WelcomeBack(){
 const {user}=useAuth(),path=usePathname()
 if(!user)return null
 return <section className="mx-auto max-w-7xl px-6 py-5" aria-label="Your next study session">
  <p className="text-xl font-semibold">Welcome back{user.name?.trim()?<>, <span className="gradient-text">{user.name.trim().split(/\s+/)[0]}</span></>:''}</p>
  {path==='/'?<HomeContinue uid={user.id}/>:<p className="text-sm text-muted-foreground">Make room for your next milestone. <Link href="/progress" className="underline">Continue learning →</Link></p>}
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
export function ExamGuide({certification}:{certification:string}){const guide=guideFor(certification);const {user}=useAuth();const {data,mutate}=useProgress();const studied=data?.saved?.find((s:any)=>progressCertification(s.certification)===progressCertification(certification))?.studiedSections||[];const [error,setError]=useState(''),[busy,setBusy]=useState(false);return <section className="cp-info-panel"><h2>Exam guide</h2><p>Use the official outline to study one section at a time, then apply it in Practical Mode.</p>{guide.effectiveNote&&<p className="cp-note">{guide.effectiveNote}</p>}{guide.domains.length?<div className="mt-5 grid gap-4">{guide.domains.map(d=><article className="rounded-xl border p-5" key={d.id}><h3 className="font-semibold">{d.title}</h3><a className="cp-text-link" href={guide.guideUrl} target="_blank" rel="noopener noreferrer">Study the official objectives ↗</a>{user&&<label className="mt-3 flex gap-2 text-sm"><input type="checkbox" checked={studied.includes(d.id)} disabled={busy} onChange={async e=>{setBusy(true);try{await updateProgress(user.id,{action:'study',certification,section:d.id,completed:e.target.checked});await mutate().catch(()=>undefined)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}}/>I have reviewed this section</label>}</article>)}</div>:<p className="my-4">The provider’s current guide is linked below. A verified section breakdown is not yet available here.</p>}{error&&<p role="alert">{error}</p>}<a className="cp-secondary mt-5" href={guide.guideUrl} target="_blank" rel="noopener noreferrer">Open official exam guide ↗</a><p className="cp-note mt-3">Source checked {guide.checkedOn}. Review the provider’s current guide before booking. Review checkboxes track your study activity, not mastery.</p></section>}
