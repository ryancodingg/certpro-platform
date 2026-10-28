'use client'
import {useEffect,useRef,useState} from 'react'
import {useAuth} from '@/hooks/use-auth'
import type {missedQuestions} from '@/lib/learning-memory'
import {certificationById} from '@/lib/catalog'
import {StudyWorkspace,appendWorkspaceNote} from './study-workspace'

const key=(uid:string)=>'certpro.cfox.document.v1:'+encodeURIComponent(uid)
const LIMIT=200000
export function readStudyDocument(uid:string){return localStorage.getItem(key(uid))||''}
export function saveStudyDocument(uid:string,text:string){if(text.length>LIMIT)throw Error('Your document is full. Download a copy and shorten it before adding more.');localStorage.setItem(key(uid),text);window.dispatchEvent(new Event('certpro-study-document'))}
export function appendStudyDocument(uid:string,text:string){appendWorkspaceNote(uid,text)}
export function CFox({busy=false,review=false,paused=true}:{busy?:boolean;review?:boolean;paused?:boolean}){
 const avatar=useRef<HTMLSpanElement>(null),[visible,setVisible]=useState(false),[foreground,setForeground]=useState(true)
 useEffect(()=>{const update=()=>setForeground(!document.hidden);update();document.addEventListener('visibilitychange',update);const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting));if(avatar.current)observer.observe(avatar.current);return()=>{observer.disconnect();document.removeEventListener('visibilitychange',update)}},[])
 return <span ref={avatar} className="cfox-avatar" aria-hidden="true" data-state={busy?'thinking':review?'review':'idle'} data-paused={paused||!visible||!foreground}><span className="cfox-sprite"/><style>{`.cfox-avatar{display:inline-flex;flex:none;width:72px;height:78px;overflow:hidden}.cfox-sprite{display:block;width:72px;height:78px;background-image:url('/brand/cfox-pip-spritesheet.png');background-size:576px 858px;filter:hue-rotate(85deg) saturate(1.15);background-position:0 0;animation:cfox-frames 2.4s steps(6) infinite}.cfox-avatar[data-state=thinking] .cfox-sprite{background-position-y:-546px;animation-duration:1.2s}.cfox-avatar[data-state=review] .cfox-sprite{background-position-y:-624px}.cfox-avatar[data-paused=true] .cfox-sprite{animation-play-state:paused}@keyframes cfox-frames{to{background-position-x:-432px}}@media(prefers-reduced-motion:reduce){.cfox-sprite{animation:none!important}}`}</style></span>}


// Minimal uncompressed OOXML package. Text is XML-escaped; no HTML or remote content is executed.
export function studyDocx(text:string,documentBody?:string):Uint8Array{
 const enc=new TextEncoder();const xml=(s:string)=>s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
 const files:Record<string,string>={
 '[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
 '_rels/.rels':'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
 'word/document.xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+(documentBody||(['C-Fox · My study document',...text.split('\n')].map((line,i)=>'<w:p><w:pPr><w:spacing w:after="120"/></w:pPr><w:r><w:rPr>'+(i===0?'<w:b/><w:color w:val="6831B8"/><w:sz w:val="36"/>':'<w:sz w:val="22"/>')+'</w:rPr><w:t xml:space="preserve">'+xml(line)+'</w:t></w:r></w:p>').join('')))+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>'}
 const parts:Uint8Array[]=[];const central:Uint8Array[]=[];let offset=0
 const crc=(data:Uint8Array)=>{let n=0xffffffff;for(const b of data){n^=b;for(let i=0;i<8;i++)n=(n>>>1)^((n&1)?0xedb88320:0)}return (n^0xffffffff)>>>0}
 for(const [path,content]of Object.entries(files)){const name=enc.encode(path),data=enc.encode(content),sum=crc(data);const h=new Uint8Array(30+name.length),v=new DataView(h.buffer);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(12,33,true);v.setUint32(14,sum,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,name.length,true);h.set(name,30);parts.push(h,data);const c=new Uint8Array(46+name.length),cv=new DataView(c.buffer);cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(14,33,true);cv.setUint32(16,sum,true);cv.setUint32(20,data.length,true);cv.setUint32(24,data.length,true);cv.setUint16(28,name.length,true);cv.setUint32(42,offset,true);c.set(name,46);central.push(c);offset+=h.length+data.length}
 const size=central.reduce((n,p)=>n+p.length,0),end=new Uint8Array(22),ev=new DataView(end.buffer);ev.setUint32(0,0x06054b50,true);ev.setUint16(8,central.length,true);ev.setUint16(10,central.length,true);ev.setUint32(12,size,true);ev.setUint32(16,offset,true);const out=new Uint8Array(offset+size+22);let pos=0;for(const p of [...parts,...central,end]){out.set(p,pos);pos+=p.length}return out
}
export function buildStudyNotes(items:ReturnType<typeof missedQuestions>){const groups=new Map<string,typeof items>();for(const item of items){const label=(certificationById(item.certification)?.name||item.certification)+' · '+item.question.topic;groups.set(label,[...(groups.get(label)||[]),item])}return 'KNOWLEDGE AREAS TO REVISIT\nPrepared '+new Date().toLocaleDateString()+'. Based on recorded missed answers, not a complete assessment of your knowledge.\n\n'+[...groups].map(([label,rows])=>label+'\n'+rows.map(row=>'Question: '+row.question.question+'\nMissed '+row.wrong+' of '+row.total+' recorded attempts.\nStudy explanation: '+row.question.explanation+(row.question.sourceUrl?'\nOfficial source: '+row.question.sourceUrl:'')+'\nMy takeaway: \nNext practice step: ').join('\n\n')).join('\n\n')}
export function StudyNotebook({items}:{items:ReturnType<typeof missedQuestions>}){const {user}=useAuth();return user?<Notebook key={user.id} uid={user.id} items={items}/>:null}
function Notebook({uid,items}:{uid:string;items:ReturnType<typeof missedQuestions>}){
 const [legacy,setLegacy]=useState<string|null>(null),[error,setError]=useState('')
 useEffect(()=>{try{setLegacy(readStudyDocument(uid))}catch{setError('Browser storage is unavailable. Your existing notes have not been changed.')}},[uid])
 if(error)return <p role="alert">{error}</p>
 if(legacy===null)return <p>Opening your study space…</p>
 return <StudyWorkspace uid={uid} items={items} legacyText={legacy} generateNotes={buildStudyNotes} downloadDocx={studyDocx}/>
}
