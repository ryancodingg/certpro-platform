'use client'
import {auth} from '@/lib/firebase'
import {EVENT,readWorkspace,persist,validate,mergeWorkspaces,type Workspace} from './study-workspace'
const states=new Map<string,{busy:boolean;timer?:ReturnType<typeof setTimeout>;listeners:Set<(text:string)=>void>;message:string}>()
const metaKey=(uid:string)=>'certpro.study-workspace.sync.v1:'+encodeURIComponent(uid)
function state(uid:string){let s=states.get(uid);if(!s){s={busy:false,listeners:new Set(),message:'Connecting to your account…'};states.set(uid,s)}return s}
function announce(uid:string,text:string){const s=state(uid);s.message=text;s.listeners.forEach(fn=>fn(text))}
async function request(uid:string,method='GET',body?:unknown){
 const user=auth.currentUser;if(!user||user.uid!==uid)throw Error('Sign in to sync your pages. Local edits are kept.')
 const token=await user.getIdToken()
 const r=await fetch('/api/study-workspace',{method,cache:'no-store',headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined})
 if(r.status===409){queueWorkspaceSync(uid,200);throw Error('Combining changes from another device…')}
 if(!r.ok)throw Error(r.status===401?'Sign in again to sync. Local edits are kept.':r.status===413?'Workspace is too large to sync. Download a copy and shorten your notes.':'Account sync is unavailable. Your edits are saved on this device; retry when connected.')
 const result=await r.json();if(result.workspace!==null&&!validate(result.workspace))throw Error('The account copy could not be read. Local notes are unchanged.')
 if(auth.currentUser?.uid!==uid)throw Error('Account changed. Sync stopped; local notes are kept.')
 return result as {workspace:Workspace|null;revision:number}
}
export function queueWorkspaceSync(uid:string,delay=1200){const s=state(uid);clearTimeout(s.timer);s.timer=setTimeout(()=>void sync(uid),delay)}
async function sync(uid:string){
 const s=state(uid);if(s.busy){queueWorkspaceSync(uid);return}s.busy=true
 try{
  announce(uid,'Syncing to your account…')
  let base:Workspace|null=null
  const raw=localStorage.getItem(metaKey(uid));if(raw){const parsed=JSON.parse(raw);if(!validate(parsed))throw Error('Sync history could not be read. Local notes are kept.');base=parsed}
  const cloud=await request(uid)
  let local=readWorkspace(uid)
  if(!local&&!cloud.workspace){announce(uid,'Ready to save to your account');return}
  if(cloud.workspace){
   const merged=local?mergeWorkspaces(local,base,cloud.workspace):cloud.workspace
   // The cloud baseline is recorded before installing a merged local copy.
   localStorage.setItem(metaKey(uid),JSON.stringify(cloud.workspace))
   if(!local||JSON.stringify({...merged,revision:0})!==JSON.stringify({...local,revision:0})){
    merged.revision=(local?.revision??0)+1;persist(uid,merged,local?.revision??null);local=merged
   }
  }
  if(!local)return
  const sent=structuredClone(local)
  const same=cloud.workspace&&JSON.stringify({...sent,revision:0})===JSON.stringify({...cloud.workspace,revision:0})
  const saved=same?cloud:await request(uid,'PUT',{workspace:sent,expectedRevision:cloud.revision})
  if(saved.workspace)localStorage.setItem(metaKey(uid),JSON.stringify(saved.workspace))
  const latest=readWorkspace(uid)
  if(latest?.revision!==sent.revision){announce(uid,'New edits waiting to sync…');queueWorkspaceSync(uid)}else {announce(uid,'Saved to your account · available on your other devices');window.dispatchEvent(new CustomEvent('certpro-workspace-synced',{detail:{uid}}))}
 }catch(e){announce(uid,e instanceof Error?e.message:'Sync unavailable. Local edits are kept.')}finally{s.busy=false}
}
export function watchWorkspaceSync(uid:string,listener:(text:string)=>void){
 const s=state(uid);s.listeners.add(listener);listener(s.message)
 const changed=(e:Event)=>{if((e as CustomEvent).detail?.uid===uid){announce(uid,'Saved on this device · waiting to sync…');queueWorkspaceSync(uid)}}
 const resume=()=>{if(document.visibilityState==='visible')queueWorkspaceSync(uid,0)}
 const timer=setInterval(resume,30000)
 window.addEventListener(EVENT,changed);window.addEventListener('online',resume);window.addEventListener('focus',resume);document.addEventListener('visibilitychange',resume)
 queueWorkspaceSync(uid,0)
 return()=>{s.listeners.delete(listener);clearInterval(timer);window.removeEventListener(EVENT,changed);window.removeEventListener('online',resume);window.removeEventListener('focus',resume);document.removeEventListener('visibilitychange',resume)}
}
