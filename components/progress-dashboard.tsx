'use client'
import Link from 'next/link'
import {useEffect,useState} from 'react'
import {ArrowRight,BookOpen,BookmarkMinus,CalendarDays,CheckCircle2,Clock3,Play,RotateCcw,Target,Trophy} from 'lucide-react'
import {useAuth} from '@/hooks/use-auth'
import {useProgress,updateProgress} from './learner-progress'
import {ProviderLogo} from './provider-logo'
import {CountUp} from './react-bits/count-up'
import {certificationById} from '@/lib/catalog'
import {guideFor} from '@/lib/exam-guide'
import {progressCertification,type ProgressData} from '@/lib/device-progress'
import {readDevicePlans} from '@/lib/device-study-plans'
import {matchingStudyPlan} from '@/lib/study-context'
import type {StudyPlan} from '@/lib/study-plan'
import {examGoal,progressCard,visibleProgressCertifications} from '@/lib/progress-view'
import {continueLearning,readPracticeCheckpoint,readStudyTopic,type StudyTopic} from '@/lib/continue-learning'

function openPlan(certification?:string){window.dispatchEvent(new CustomEvent('certpro-open-calendar',{detail:{certification}}))}
function usePlanCards(uid?:string){
 const [state,setState]=useState<{uid:string;plans:StudyPlan[]}>({uid:'',plans:[]})
 const [now,setNow]=useState(()=>new Date())
 useEffect(()=>{
  if(!uid)return
  const load=()=>{try{setState({uid,plans:readDevicePlans(localStorage,uid)})}catch{setState({uid,plans:[]})}}
  const tick=()=>setNow(new Date())
  load();tick()
  // The header's shared calendar also hydrates cloud plans into this account's device store.
  window.addEventListener('certpro-study-plans',load);window.addEventListener('storage',load)
  document.addEventListener('visibilitychange',tick);const timer=setInterval(tick,60000)
  return()=>{clearInterval(timer);window.removeEventListener('certpro-study-plans',load);window.removeEventListener('storage',load);document.removeEventListener('visibilitychange',tick)}
 },[uid])
 return {plans:state.uid===uid?state.plans:[],now}
}

type LearningContext={checkpoints:Record<string,{updatedAt?:string}>;topics:Record<string,StudyTopic>}
function useLearningContext(uid:string|undefined,data:ProgressData){
 const [state,setState]=useState<LearningContext&{uid:string}>({uid:'',checkpoints:{},topics:{}})
 const signature=JSON.stringify({attempts:data.attempts.filter(a=>a.mode==='practice'&&!a.submitted&&!a.abandoned).map(a=>({id:a.id,certification:a.certification,section:a.section})),ids:[...new Set([...data.saved.map(a=>a.certification),...data.attempts.map(a=>a.certification)])]})
 useEffect(()=>{
  if(!uid)return
  const {attempts,ids}=JSON.parse(signature) as {attempts:ProgressData['attempts'];ids:string[]}
  const load=()=>{
   const checkpoints:LearningContext['checkpoints']={},topics:LearningContext['topics']={}
   try{
   for(const a of attempts){const checkpoint=readPracticeCheckpoint(localStorage,uid,a.certification,a.section||'',a.id);if(checkpoint)checkpoints[a.id]={updatedAt:checkpoint.updatedAt}}
   for(const id of ids){const topic=readStudyTopic(localStorage,uid,id);if(topic)topics[progressCertification(id)]=topic}
   }catch{/* Cloud attempts remain resumable when browser storage is blocked. */}
   setState({uid,checkpoints,topics})
  }
  load();window.addEventListener('storage',load);window.addEventListener('certpro-progress',load);document.addEventListener('visibilitychange',load)
  return()=>{window.removeEventListener('storage',load);window.removeEventListener('certpro-progress',load);document.removeEventListener('visibilitychange',load)}
 },[uid,signature])
 return state.uid===uid?state:{checkpoints:{},topics:{}}
}

function Meter({label,value,max}:{label:string;value:number;max:number}){
 const percent=max>0?Math.min(100,Math.max(0,Math.round(value/max*100))):0
 return <div className="cp-learning-meter"><div><span>{label}</span><strong>{value} / {max}<span className="cp-meter-percent"> · {percent}%</span></strong></div><progress aria-label={label} value={value} max={max||1}/></div>
}

function LearningCard({id,data,plan,now,learning,busyId,onUnsave}:{id:string;data:ProgressData;plan?:StudyPlan;now:Date;learning:LearningContext;busyId:string;onUnsave:(id:string)=>void}){
 const cert=certificationById(id),guide=guideFor(id),card=progressCard(id,data,guide.domains)
 const target=continueLearning(id,data,guide.domains,learning.checkpoints,learning.topics[progressCertification(id)])
 const canResume=!!target.attempt
 const resumeAnswered=target.attempt?Math.min(new Set(target.attempt.answeredIds).size,target.attempt.total):0
 const detail='/certification/'+(cert?.id||id),goal=plan?examGoal(plan,now):null
 const section=target.title
 const complete=card.guidePercent===100
 const hasActivity=card.attempts.length>0||card.reviewed>0
 return <article className={'cp-learning-card'+(canResume?' has-resume':'')} aria-labelledby={'progress-'+id}>
  <div className="cp-learning-card-top"><div className="cp-learning-provider"><div className="cp-learning-logo"><ProviderLogo provider={cert?.provider||''} className="h-9 w-9"/></div><div><p>{cert?.provider||'Certification'}<span> · {cert?.level||'Learning path'}</span></p><span className="cp-learning-status">{!card.saved?'History only':complete?'Guide reviewed':hasActivity?'Learning in progress':'Ready when you are'}</span></div></div>{<button type="button" className="cp-learning-unsave" disabled={!!busyId} aria-label={'Remove '+(cert?.name||id)} onClick={()=>onUnsave(id)}><BookmarkMinus size={16} aria-hidden="true"/>{busyId===id?'Removing…':'Remove'}</button>}</div>
  <h2 id={'progress-'+id}><Link href={detail}>{cert?.name||id}</Link></h2>
  <div className={'cp-learning-goal'+(goal&&goal.days>=0&&goal.days<=7?' is-near':'')}><CalendarDays size={20} aria-hidden="true"/><div><strong>{goal?.label||'Give your learning a date'}</strong><span>{goal&&plan?`${goal.date} · ${plan.minutes} min on study days`:'A small daily habit starts with a simple plan.'}</span></div><button type="button" onClick={()=>openPlan(id)}>{goal?'Edit goal':'Set exam goal'}<ArrowRight size={14} aria-hidden="true"/></button></div>
  <div className="cp-learning-progress">
   {guide.domains.length?<Meter label="Exam guide sections reviewed" value={card.reviewed} max={guide.domains.length}/>:<p className="cp-learning-empty-metric">Explore the official guide to plan your first study session.</p>}
   {card.practice&&card.practice.total>0&&<Meter label={'Latest practice session · questions answered'} value={card.practiceAnswered} max={card.practice.total}/>}
   <p className="cp-learning-caption">Progress tracks your study activity, not exam readiness.</p>
  </div>
  <div className="cp-learning-stats"><div><BookOpen size={18} aria-hidden="true"/><span><strong><CountUp to={card.practiced}/></strong> unique questions practiced</span></div><div><Trophy size={18} aria-hidden="true"/><span><strong>{card.mock?`${card.mock.score}%`:'Not taken yet'}</strong> latest Mock Exam{card.mock&&<small>{new Date(card.mock.submittedAt||card.mock.createdAt).toLocaleDateString()}</small>}</span></div></div>
  <div className="cp-learning-next"><span className="cp-learning-next-icon">{complete?<CheckCircle2 size={22}/>:<Play size={22}/>}</span><div><p>{canResume?'PICK UP WHERE YOU LEFT OFF':complete?'BUILD ON WHAT YOU KNOW':'YOUR NEXT SMALL STEP'}</p><strong>{section}</strong><span>{canResume?`${resumeAnswered} ${resumeAnswered===1?'answer':'answers'} saved. Continue your unfinished practice session.`:complete?'Your guide is reviewed. Keep practicing the topics that need attention.':'Study one section, then try a few practice questions.'}</span></div></div>
  <div className="cp-learning-actions"><Link className="cp-primary" href={target.href}>{hasActivity?'Continue learning':'Start learning'}<ArrowRight size={17} aria-hidden="true"/></Link><Link className="cp-secondary" href={'/practice?certification='+encodeURIComponent(id)}>Practice by topic</Link><Link className="cp-text-link" href={'/quiz/'+encodeURIComponent(id)+'?mode=exam'}>Mock Exam →</Link></div>
  <details className="cp-learning-history"><summary>Attempt history <span>{card.attempts.length}</span></summary>{card.attempts.length?<ul>{card.attempts.map(a=><li key={a.id}><div><strong>{a.mode==='exam'?'Mock Exam':'Practical Mode'}</strong><span>{guide.domains.find(d=>d.id===a.section)?.title||(a.section==='additional'?'Additional bank topics':'All available questions')}</span><small>{new Date(a.createdAt).toLocaleString()}{a.deviceOnly?' · Saved on this device':''}</small></div><p>{a.submitted?`${a.score}% (${a.correct}/${a.total})`:`${new Set(a.answeredIds).size}/${a.total} answers saved`}<small>{a.submitted?'Submitted':'Not submitted'}</small></p></li>)}</ul>:<p>Your first practice session will appear here. One question is a good start.</p>}</details>
 </article>
}

export function ProgressDashboard(){
 const {user,isLoading}=useAuth(),{data,warning,storageUnavailable,syncUnavailable,mutate}=useProgress()
 const {plans,now}=usePlanCards(user?.id)
 const learning=useLearningContext(user?.id,data)
 const [busyId,setBusyId]=useState(''),[actionError,setActionError]=useState(''),[notice,setNotice]=useState(''),[removedId,setRemovedId]=useState('')
 if(isLoading)return <p role="status">Loading your learning…</p>
 if(!user)return <section className="cp-info-panel"><h2>Your learning, in one place</h2><p>Sign in to save certifications, track your learning and plan your next milestone.</p><Link className="cp-primary" href="/auth/login?next=%2Fprogress">Sign in and continue</Link></section>
 const ids=visibleProgressCertifications(data)
 async function unsave(id:string){
  if(!user)return;setBusyId(id);setActionError('');setNotice('')
  try{const synced=await updateProgress(user.id,{action:'unsave',certification:id});setRemovedId(id);setNotice(synced?'Removed from My Progress. Your answers and exam history are kept.':'Removed in this browser. Account sync is unavailable; your answers and exam history are kept.');await mutate().catch(()=>undefined)}catch(e){setActionError(e instanceof Error?e.message:'Could not remove this certification.')}finally{setBusyId('')}
 }
 async function undo(){
  if(!user||!removedId)return;setBusyId(removedId);setActionError('')
  try{const synced=await updateProgress(user.id,{action:'save',certification:removedId});setRemovedId('');setNotice(synced?'Certification restored to My Progress.':'Certification restored in this browser. Account sync is unavailable.');await mutate().catch(()=>undefined)}catch(e){setActionError(e instanceof Error?e.message:'Could not restore this certification.')}finally{setBusyId('')}
 }
 return <div className="cp-progress-dashboard">
  {ids.length>0&&<div className="cp-learning-toolbar"><div><span className="cp-learning-toolbar-icon"><Target size={25} aria-hidden="true"/></span><div><strong>{ids.length?'Your next chapter is already underway.':'Make room for your next chapter.'}</strong><span>{ids.length} learning path{ids.length===1?'':'s'} · {ids.filter(id=>data.saved.some(s=>progressCertification(s.certification)===progressCertification(id))).length} saved · Others show retained study history.</span></div></div><button className="cp-secondary" onClick={()=>openPlan()}><Clock3 size={17} aria-hidden="true"/>Plan study time</button></div>}
  {ids.length>0&&<div className="cp-progress-quicklinks"><Link href="/my-learning"><RotateCcw size={17} aria-hidden="true"/>My Learning · Revisit missed questions<ArrowRight size={16} aria-hidden="true"/></Link><Link href="/certifications">Find your next certification →</Link></div>}
  {notice&&<p role="status" className="cp-progress-notice">{notice} {removedId&&<button type="button" className="cp-text-link" disabled={!!busyId} onClick={undo}>Undo removal</button>}</p>}{actionError&&<p role="alert" className="cp-progress-notice">{actionError}</p>}{storageUnavailable&&<p role="alert" className="cp-progress-notice">{warning}</p>}
  {!ids.length?<section className="cp-progress-empty"><BookOpen size={36} aria-hidden="true"/><h2>Choose your first certification.</h2><p>Find an exam and save it to My Progress. Your study activity, unfinished practice and exam goal will appear here.</p><Link className="cp-primary" href="/certifications">Find a certification<ArrowRight size={17} aria-hidden="true"/></Link></section>:<div className="cp-learning-grid">{ids.map(id=><LearningCard key={id} id={id} data={data} plan={matchingStudyPlan(plans,id)} now={now} learning={learning} busyId={busyId} onUnsave={unsave}/>)}</div>}
  <footer className="cp-progress-footer"><details><summary>{syncUnavailable?'Account sync is temporarily unavailable':'About saved progress'}</summary><p>{warning}</p><p>Exam dates are personal goals, not official bookings. Your calendar plan controls study reminders.</p></details><Link href="/subscription">My Subscription →</Link></footer>
 </div>
}
