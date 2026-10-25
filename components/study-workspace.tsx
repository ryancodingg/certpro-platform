'use client'

import {useEffect, useRef, useState} from 'react'
import {StudyDocumentConnections} from './study-document-connections'
import {StudyDocumentEditor} from './study-document-editor'
import {printDocument,wordBody} from '@/lib/study-document'
import type {missedQuestions} from '@/lib/learning-memory'

import {type BlockType,type Block,type Page,type Workspace,EVENT,storageKey,block,fromText,page,initial,readWorkspace,persist} from '@/lib/study-workspace'
import {queueWorkspaceSync,watchWorkspaceSync} from '@/lib/study-workspace-sync'
export {readWorkspace} from '@/lib/study-workspace'
type Props = {uid:string; items:ReturnType<typeof missedQuestions>; legacyText:string; generateNotes:(items:ReturnType<typeof missedQuestions>)=>string; downloadDocx:(text:string,documentBody?:string)=>Uint8Array}
/** C-Fox adds to the currently selected page, preserving the old text document. */
export function appendWorkspaceNote(uid:string,text:string){
 const current=readWorkspace(uid)
 const next=current?structuredClone(current):initial(localStorage.getItem('certpro.cfox.document.v1:'+encodeURIComponent(uid))||'')
 let target=next.pages.find(p=>p.id===next.activePage&&!p.deleted)
 if(!target){target=page('C-Fox notes');next.pages.push(target);next.activePage=target.id}
 target.blocks.push(...fromText(text));target.updatedAt=Date.now();next.revision=(current?.revision??0)+1
 persist(uid,next,current?.revision??null)
 queueWorkspaceSync(uid)
}
/** Preserve highlighted ranges when an edit is wholly before or after them. */
export function updateBlockText(b:Block,text:string):boolean {
 const old=b.text,range=b.selection;b.text=text
 if(!range||old===text)return false
 let start=0;while(start<old.length&&start<text.length&&old[start]===text[start])start++
 let suffix=0;while(suffix<old.length-start&&suffix<text.length-start&&old[old.length-1-suffix]===text[text.length-1-suffix])suffix++
 const oldEnd=old.length-suffix,delta=text.length-old.length
 if(oldEnd<=range.start||(start<=range.start&&range.start+delta>=0&&text.slice(range.start+delta,range.end+delta)===old.slice(range.start,range.end))){b.selection={start:range.start+delta,end:range.end+delta};return false}
 if(start>=range.end)return false
 delete b.selection;return true
}
export function workspacePageText(p:Page){return p.title+'\n\n'+p.blocks.map(b=>(b.type==='checklist'?(b.checked?'[x] ':'[ ] '):'')+b.text).join('\n\n')}
export function StudyWorkspace(props:Props){return <WorkspaceEditor key={props.uid} {...props}/>}
function WorkspaceEditor({uid,items,legacyText,generateNotes,downloadDocx}:Props){
 const [data,setData]=useState<Workspace|null>(null),[query,setQuery]=useState(''),[trash,setTrash]=useState(false),[status,setStatus]=useState(''),[error,setError]=useState('')
 const [syncStatus,setSyncStatus]=useState('Connecting to your account…')
 useEffect(()=>watchWorkspaceSync(uid,setSyncStatus),[uid])
 const currentRef=useRef<Workspace|null>(null),savedRevision=useRef<number|null>(null),saving=useRef(false),unsaved=useRef(false)
 useEffect(()=>{
  function load(){if(saving.current||unsaved.current)return;try{
   let loaded=readWorkspace(uid)
   if(!loaded){
    loaded=initial(legacyText);loaded.revision=1
    // Show legacy notes before attempting storage so a quota failure cannot strand them.
    currentRef.current=loaded;savedRevision.current=null;setData(loaded)
    saving.current=true
    try{persist(uid,loaded,null);savedRevision.current=loaded.revision;unsaved.current=false;setError('')}
    catch(e){unsaved.current=true;setStatus('Unsaved changes — download a copy to keep your notes');setError((e as Error).message||'Browser storage is full. Your notes are visible and can be downloaded.')}
    finally{saving.current=false}
   }else{currentRef.current=loaded;savedRevision.current=loaded.revision;setData(loaded);setError('')}
  }catch(e){setError((e as Error).message)}}
  load();const local=(e:Event)=>{if((e as CustomEvent).detail?.uid===uid)load()};const other=(e:StorageEvent)=>{if(e.key===storageKey(uid))load()}
  window.addEventListener(EVENT,local);window.addEventListener('storage',other)
  const leave=(e:BeforeUnloadEvent)=>{if(unsaved.current){e.preventDefault();e.returnValue=''}};window.addEventListener('beforeunload',leave)
  return()=>{window.removeEventListener(EVENT,local);window.removeEventListener('storage',other);window.removeEventListener('beforeunload',leave)}
 },[uid,legacyText])
 function change(edit:(next:Workspace)=>void,message='Saved in this browser'){
  const previous=currentRef.current;if(!previous)return
  const next=structuredClone(previous);edit(next);next.revision=previous.revision+1
  setData(next);saving.current=true
  try{persist(uid,next,savedRevision.current);savedRevision.current=next.revision;currentRef.current=next;unsaved.current=false;setError('');setStatus(message)}catch(e){unsaved.current=true;setError((e as Error).message||'Could not save. Download your notes to keep your edits.');setStatus('Unsaved changes')}finally{saving.current=false}
 }
 // Keep editing possible after a storage failure without replacing the last saved revision.
 function editPage(edit:(p:Page)=>void){if(!data)return;const visible=data;change(next=>{next.pages=structuredClone(visible.pages);next.activePage=visible.activePage;const p=next.pages.find(p=>p.id===visible.activePage);if(p){edit(p);p.updatedAt=Date.now()}})}
 const selected=data?.pages.find(p=>p.id===data.activePage&&!p.deleted)
 const pages=data?.pages.filter(p=>!!p.deleted===trash&&(p.title+' '+p.blocks.map(b=>b.text).join(' ')).toLowerCase().includes(query.toLowerCase()))||[]
 function download(all=false){if(!data)return;try{const text=all?data.pages.filter(p=>!p.deleted).map(workspacePageText).join('\n\n————\n\n'):selected?workspacePageText(selected):'';const bytes=downloadDocx(text,wordBody(all?data.pages.filter(p=>!p.deleted):selected?[selected]:[]));const url=URL.createObjectURL(new Blob([bytes as BlobPart],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}));const link=document.createElement('a');link.href=url;link.download=all?'CertPro-study-workspace.docx':'CertPro-study-page.docx';link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);setStatus('Word download started.')}catch{setError('Could not create the Word download. Your notes have not been changed.')}}
 return <section className="study-workspace" aria-label="My study workspace">
  <header className="sw-header"><div><p className="sw-eyebrow">YOUR KNOWLEDGE, YOUR WAY</p><h2>My study workspace</h2><p>Capture what matters. Highlight a concept, make a checklist, and turn missed questions into your own notes.</p></div><button type="button" onClick={()=>download(true)} disabled={!data}>Download all pages</button></header>
  <div className="sw-layout"><aside className="sw-sidebar" aria-label="Study pages"><label>Find a page<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search your notes"/></label><button type="button" className="sw-primary" disabled={!data||unsaved.current} onClick={()=>change(next=>{const p=page('Untitled page');next.pages.push(p);next.activePage=p.id;setTrash(false);setQuery('')},'New page created')}>＋ New page</button><div className="sw-page-tabs"><button type="button" aria-pressed={!trash} onClick={()=>setTrash(false)}>Pages</button><button type="button" aria-pressed={trash} onClick={()=>setTrash(true)}>Trash ({data?.pages.filter(p=>p.deleted).length||0})</button></div><nav aria-label={trash?'Deleted study pages':'Study pages'}>{pages.map(p=><div key={p.id} className="sw-page-row">{trash?<><span>{p.title||'Untitled page'}</span><button type="button" disabled={unsaved.current} onClick={()=>change(next=>{const found=next.pages.find(x=>x.id===p.id)!;found.deleted=false;next.activePage=p.id;setTrash(false)},'Page restored')}>Restore</button></>:<button type="button" className={p.id===data?.activePage?'sw-page active':'sw-page'} aria-current={p.id===data?.activePage?'page':undefined} disabled={unsaved.current} onClick={()=>change(next=>{next.activePage=p.id})}><span aria-hidden="true">▤ </span>{p.title||'Untitled page'}</button>}</div>)}</nav>{!pages.length&&<p className="sw-muted">{trash?'No pages in trash.':query?'No matching pages.':'Create a page to start.'}</p>}<p className="sw-muted">Pages sync to your account. Offline edits stay in this browser until the next successful sync.</p></aside>
  <div className="sw-editor" role="region" aria-label="Study page editor">{selected?<><div className="sw-editor-top"><span className="sw-muted">Personal study page</span><button type="button" disabled={unsaved.current} onClick={()=>change(next=>{next.pages.find(p=>p.id===selected.id)!.deleted=true;let remaining=next.pages.find(p=>!p.deleted);if(!remaining){remaining=page('My study page');next.pages.push(remaining)}next.activePage=remaining.id},'Page moved to Trash. You can restore it anytime.')}>Move to trash</button></div><label className="sw-title-label">Page title<input className="sw-title" maxLength={160} value={selected.title} onChange={e=>editPage(p=>{p.title=e.target.value})}/></label><div className="sw-actions"><button type="button" className="sw-primary" disabled={!items.length} onClick={()=>editPage(p=>{p.blocks.push(...fromText(generateNotes(items)))})}>Add notes from missed topics ({items.length})</button><button type="button" onClick={()=>download()}>Download page (.docx)</button></div><button type="button" onClick={()=>{try{printDocument(selected)}catch(e){setError((e as Error).message)}}}>Print / Save as PDF</button><StudyDocumentConnections key={selected.id+'-connections'} page={selected} onChange={editPage}/><StudyDocumentEditor key={selected.id} page={selected} onChange={editPage}/><div className="sw-add"><button type="button" onClick={()=>editPage(p=>{p.blocks.push(block('','paragraph'))})}>＋ Paragraph</button><button type="button" onClick={()=>editPage(p=>{p.blocks.push(block('Next study step','checklist'))})}>＋ Checklist</button></div></>:<p>{error?'Your saved workspace has been kept unchanged.':'Opening your workspace…'}</p>}</div></div>
  <footer className="sw-footer"><span role="status">{syncStatus}</span><button type="button" onClick={()=>queueWorkspaceSync(uid,0)}>Sync now</button><span role="status">{status}</span>{error&&<p role="alert">{error}</p>}<span className="sw-muted">Word and PDF exports preserve supported text formatting, highlights and comments.</span></footer>
  <style>{`.study-workspace{margin:28px 0;border:1px solid #e0d5f1;border-radius:22px;background:white;overflow:hidden;color:#29243b}.study-workspace button,.study-workspace input,.study-workspace select,.study-workspace textarea{font:inherit}.study-workspace button{border:1px solid #d9cde9;background:#fff;color:#53308a;border-radius:9px;padding:9px 12px;font-size:13px;font-weight:600;cursor:pointer;line-height:1.45}.study-workspace button:disabled{opacity:.45;cursor:default}.study-workspace :is(button,input,select,textarea):focus-visible{outline:3px solid #9370db;outline-offset:3px}.study-workspace button:hover:not(:disabled){background:#f4effd}.study-workspace .sw-primary{background:#6b35c5;color:#fff;border-color:#6b35c5}.study-workspace .sw-primary:hover:not(:disabled){background:#5626a6}.sw-header{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:28px;background:linear-gradient(120deg,#faf7ff,#fff)}.sw-header h2{font-size:27px;margin:4px 0 10px}.sw-header p{max-width:650px;font-size:14px;line-height:1.6;margin:0}.sw-header .sw-eyebrow{font-size:10px;letter-spacing:.17em;font-weight:700;color:#7242b5}.sw-layout{display:grid;grid-template-columns:230px minmax(0,1fr);border-top:1px solid #ece5f6}.sw-sidebar{padding:20px;background:#faf9fc;border-right:1px solid #ece5f6}.sw-sidebar>label{display:block;font-size:12px;font-weight:600}.sw-sidebar input{width:100%;box-sizing:border-box;margin:7px 0 14px;padding:10px;border:1px solid #ded4eb;border-radius:8px;background:white;font-size:13px}.sw-sidebar>.sw-primary{width:100%}.sw-page-tabs{display:flex;gap:6px;margin:22px 0 12px}.sw-page-tabs button{flex:1}.sw-page-tabs [aria-pressed=true]{background:#eee5fc;border-color:#c6adea}.sw-page-row{margin:6px 0;overflow-wrap:anywhere}.sw-page-row>span{font-size:13px;display:block;margin-bottom:6px}.study-workspace .sw-page{width:100%;text-align:left;border-color:transparent;background:transparent;color:#534a63;font-weight:500;overflow-wrap:anywhere}.study-workspace .sw-page.active{background:#ede4fa;color:#5729a1;font-weight:700}.sw-muted{font-size:12px;line-height:1.6;color:#71667e}.sw-sidebar>p:last-child{margin-top:24px}.sw-editor{padding:26px;min-width:0}.sw-editor-top{display:flex;justify-content:space-between;align-items:center;gap:12px}.sw-title-label{display:block;font-size:11px;font-weight:600;color:#7c6f8b;margin-top:20px}.study-workspace .sw-title{display:block;width:100%;box-sizing:border-box;border:0;border-bottom:1px solid #ede7f4;background:transparent;color:#2d2540;font-size:28px;font-weight:750;padding:8px 0 14px}.sw-actions{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0 12px}.sw-blocks{display:grid;gap:14px;margin-top:20px}.sw-block{padding:12px;border:1px solid #e5dfee;border-radius:12px;background:white}.sw-block-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px}.study-workspace select{border:1px solid #ded5e9;border-radius:6px;padding:5px 7px;background:#ffffffd9;color:#695c78;font-size:12px;max-width:100%}.sw-block-move{display:flex;gap:4px;margin-left:auto}.study-workspace .sw-block-move button{padding:4px 9px;min-width:30px}.sw-block-content{display:flex;align-items:flex-start;gap:10px}.sw-block-content input{margin-top:10px;width:18px;height:18px;accent-color:#713fc4;flex:none}.sw-block textarea{width:100%;min-width:0;box-sizing:border-box;resize:vertical;border:0;background:transparent;color:#332c41;font-size:15px;line-height:1.8;padding:4px}.sw-heading textarea{font-size:21px;font-weight:700;line-height:1.4}.sw-callout{border-left:4px solid #9772cf;background:#f8f4fd}.sw-highlight-yellow{background:#fff5bf;border-color:#e7d68c}.sw-highlight-purple{background:#eee2ff;border-color:#d0b5f0}.sw-highlight-preview{white-space:pre-wrap;overflow-wrap:anywhere;border-top:1px dashed #cbb8dd;padding-top:12px;line-height:1.8;font-size:15px}.sw-highlight-preview mark{background:#ffe57c;color:#332600;border-radius:3px;padding:2px 0}.sw-add{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding-top:20px}.sw-add>span{font-size:12px;color:#756883;margin-right:6px}.sw-footer{border-top:1px solid #ece5f6;padding:14px 24px;display:flex;flex-wrap:wrap;gap:8px 20px;justify-content:space-between;font-size:12px;color:#61526e}.sw-footer [role=alert]{color:#a3313d;width:100%;font-weight:600;margin:4px 0}.sw-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@media(max-width:760px){.sw-layout{grid-template-columns:1fr}.sw-sidebar{border-right:0;border-bottom:1px solid #ece5f6}.sw-sidebar nav{max-height:170px;overflow:auto}.sw-sidebar>p:last-child{margin:12px 0 0}.sw-header{padding:20px;align-items:flex-start;flex-direction:column;gap:14px}.sw-editor{padding:18px}.study-workspace .sw-title{font-size:23px}.sw-header h2{font-size:24px}.sw-actions>button{width:100%}}`}</style>
 </section>
}
