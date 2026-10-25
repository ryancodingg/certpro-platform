export type BlockType = 'paragraph' | 'heading' | 'checklist' | 'callout'
export type Block = {id:string; type:BlockType; text:string; checked:boolean; highlight:'none'|'yellow'|'purple'; selection?:{start:number;end:number}}
export type Page = {id:string; title:string; blocks:Block[]; updatedAt:number; deleted?:boolean; removedBlocks?:Block[]}
export type Workspace = {version:1; revision:number; activePage:string; pages:Page[]}
export const EVENT='certpro-study-workspace'
const MAX=1000000
export const storageKey=(uid:string)=>'certpro.study-workspace.v1:'+encodeURIComponent(uid)
const id=()=>crypto.randomUUID()
export const block=(text='',type:BlockType='paragraph'):Block=>({id:id(),type,text,checked:false,highlight:'none'})
export const fromText=(text:string)=>text.trim()?text.split(/\n\s*\n/).map(text=>block(text)): [block()]
export const page=(title:string,text=''):Page=>({id:id(),title,blocks:fromText(text),updatedAt:Date.now()})
export function initial(text:string):Workspace {const first=page(text?'My study notes':'My first study page',text);return {version:1,revision:0,activePage:first.id,pages:[first]}}
function validBlock(b:Block){return !!b&&typeof b.id==='string'&&typeof b.text==='string'&&typeof b.checked==='boolean'&&['paragraph','heading','checklist','callout'].includes(b.type)&&['none','yellow','purple'].includes(b.highlight)&&(b.selection===undefined||(!!b.selection&&Number.isInteger(b.selection.start)&&Number.isInteger(b.selection.end)&&b.selection.start>=0&&b.selection.end>b.selection.start&&b.selection.end<=b.text.length))}
export function validate(value:unknown):value is Workspace {
 if(!value||typeof value!=='object')return false
 const w=value as Workspace
 return w.version===1&&Number.isInteger(w.revision)&&typeof w.activePage==='string'&&Array.isArray(w.pages)&&w.pages.every(p=>!!p&&typeof p.id==='string'&&typeof p.title==='string'&&typeof p.updatedAt==='number'&&(p.deleted===undefined||typeof p.deleted==='boolean')&&Array.isArray(p.blocks)&&p.blocks.every(validBlock)&&(p.removedBlocks===undefined||(Array.isArray(p.removedBlocks)&&p.removedBlocks.every(validBlock))))
}
export function readWorkspace(uid:string):Workspace|null {
 const raw=localStorage.getItem(storageKey(uid));if(raw===null)return null
 let data:unknown;try{data=JSON.parse(raw)}catch{throw Error('Your saved workspace could not be read. It has been kept unchanged. Download any visible notes before reloading.')}
 if(!validate(data))throw Error('Your saved workspace uses an unreadable format. It has been kept unchanged.')
 return data
}
export function persist(uid:string,next:Workspace,expectedRevision:number|null){
 const current=readWorkspace(uid)
 if((current?.revision??null)!==expectedRevision)throw Error('This workspace changed in another tab. Your edits are still visible here. Download them, then reload to see the latest saved version.')
 const serialized=JSON.stringify(next);if(serialized.length>MAX)throw Error('Your workspace is full. Download a copy, then shorten text in existing blocks.')
 localStorage.setItem(storageKey(uid),serialized)
 window.dispatchEvent(new CustomEvent(EVENT,{detail:{uid}}))
}

const pageValue=(p:Page|undefined)=>p?JSON.stringify({...p,updatedAt:0}):''
function conflictId(p:Page){let hash=2166136261;for(const c of pageValue(p)){hash^=c.charCodeAt(0);hash=Math.imul(hash,16777619)}return p.id+'-copy-'+(hash>>>0).toString(16)}
/** Three-way merge: independent pages combine; concurrent edits retain a recovery copy. */
export function mergeWorkspaces(local:Workspace,base:Workspace|null,remote:Workspace):Workspace {
 const pages=structuredClone(remote.pages)
 for(const p of local.pages){
  if(!base&&remote.pages.length&&local.pages.length===1&&p.title==='My first study page'&&p.blocks.length===1&&!p.blocks[0].text&&!p.deleted)continue
  const old=base?.pages.find(x=>x.id===p.id),r=pages.find(x=>x.id===p.id)
  if(pageValue(p)===pageValue(old)||pageValue(p)===pageValue(r))continue
  if(!r){pages.push(structuredClone(p));continue}
  if(pageValue(r)===pageValue(old)){pages[pages.indexOf(r)]=structuredClone(p);continue}
  const copy={...structuredClone(p),id:conflictId(p),title:p.title+' (recovered edit)',deleted:false}
  if(!pages.some(x=>x.id===copy.id))pages.push(copy)
 }
 return {...local,pages,activePage:pages.some(p=>p.id===local.activePage&&!p.deleted)?local.activePage:remote.activePage}
}
