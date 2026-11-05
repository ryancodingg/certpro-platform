export type TextRun={text:string;bold?:boolean;italic?:boolean;underline?:boolean;strike?:boolean;code?:boolean;color?:string;background?:string;link?:string;script?:'sub'|'super'}
export type BlockType = 'paragraph' | 'heading' | 'checklist' | 'callout'
export type Block = {id:string; type:BlockType; text:string; checked:boolean; highlight:'none'|'yellow'|'purple'; selection?:{start:number;end:number};runs?:TextRun[];list?:'bullet'|'number';align?:'left'|'center'|'right';level?:1|2|3}
export type Page = {id:string; title:string; blocks:Block[]; updatedAt:number; deleted?:boolean; deletedAt?:number; starter?:boolean; autoNumber?:number; originId?:string; removedBlocks?:Block[];externalSync?:('google'|'notion')[];comments?:{id:string;quote:string;text:string;createdAt:number}[]}
export type Workspace = {version:1; revision:number; activePage:string; pages:Page[]; purgedIds?:string[]; nextDocumentNumber?:number}
export const EVENT='certpro-study-workspace'
export const MAX_WORKSPACE_BYTES=900000
export const workspaceBytes=(w:Workspace)=>new TextEncoder().encode(JSON.stringify(w)).byteLength
export const storageKey=(uid:string)=>'certpro.study-workspace.v1:'+encodeURIComponent(uid)
const id=()=>crypto.randomUUID()
export const block=(text='',type:BlockType='paragraph'):Block=>({id:id(),type,text,checked:false,highlight:'none'})
export const fromText=(text:string)=>text.trim()?text.split(/\n\s*\n/).map(text=>block(text)): [block()]
export const page=(title:string,text=''):Page=>({id:id(),title,blocks:fromText(text),updatedAt:Date.now()})
export function initial(text:string):Workspace {
 const first=page(text?'My study notes':'Document 1',text)
 if(!text){first.starter=true;first.autoNumber=1}
 return {version:1,revision:0,activePage:first.id,pages:[first],nextDocumentNumber:text?1:2,purgedIds:[]}
}
export function nextDocumentNumber(w:Workspace){
 return Math.max(w.nextDocumentNumber||1,1,...w.pages.map(p=>{const m=/^Document ([1-9]\d*)$/.exec(p.title);return m&&Number.isSafeInteger(Number(m[1]))&&Number(m[1])<1000000000000?Number(m[1])+1:1}))
}
export function addDocument(w:Workspace){
 const n=nextDocumentNumber(w);if(n>=1000000000000)throw Error('Automatic document numbering has reached its limit. Rename an existing document instead.');const p=page('Document '+n);p.autoNumber=n
 w.nextDocumentNumber=n+1;w.pages.push(p);w.activePage=p.id;return p
}
export function moveToTrash(w:Workspace,id:string){
 const p=w.pages.find(p=>p.id===id);if(!p)return
 p.deleted=true;p.deletedAt=Date.now();p.updatedAt=Date.now();p.starter=false
 if(w.activePage===id)w.activePage=w.pages.find(p=>!p.deleted)?.id||''
}
export function restorePage(w:Workspace,id:string){
 const p=w.pages.find(p=>p.id===id);if(!p||w.purgedIds?.includes(id))return
 p.deleted=false;delete p.deletedAt;p.updatedAt=Date.now();p.starter=false;w.activePage=p.id
}
export function permanentlyDelete(w:Workspace,ids:string[]){
 const selected=w.pages.filter(p=>p.deleted&&ids.includes(p.id)).map(p=>p.id)
 w.nextDocumentNumber=nextDocumentNumber(w)
 w.purgedIds=[...new Set([...(w.purgedIds||[]),...selected])].sort()
 w.pages=w.pages.filter(p=>!w.purgedIds!.includes(p.id))
 if(!w.pages.some(p=>p.id===w.activePage&&!p.deleted))w.activePage=w.pages.find(p=>!p.deleted)?.id||''
}
/** Apply permanent deletion even for old clients and reconcile offline-created names. */
export function reconcileWorkspace(w:Workspace,previous?:Workspace|null):Workspace {
 const result=structuredClone(w)
 result.nextDocumentNumber=Math.max(nextDocumentNumber(w),previous?nextDocumentNumber(previous):1)
 result.purgedIds=[...new Set([...(w.purgedIds||[]),...(previous?.purgedIds||[])])].sort()
 const purged=new Set(result.purgedIds)
 result.pages=result.pages.filter(p=>!purged.has(p.id))
 const used=new Set(result.pages.filter(p=>!p.autoNumber||p.title!=='Document '+p.autoNumber).map(p=>p.title))
 for(const p of [...result.pages].sort((a,b)=>a.id.localeCompare(b.id))){
  if(!p.autoNumber||p.title!=='Document '+p.autoNumber)continue
  if(used.has(p.title)){if(result.nextDocumentNumber>=1000000000000)throw Error('Automatic document numbering has reached its limit.');p.autoNumber=result.nextDocumentNumber++;p.title='Document '+p.autoNumber}
  used.add(p.title)
 }
 if(!result.pages.some(p=>p.id===result.activePage&&!p.deleted))result.activePage=result.pages.find(p=>!p.deleted)?.id||''
 return result
}
function untouchedStarter(p:Page){return (p.starter===true||p.title==='My first study page')&&!p.deleted&&p.blocks.length===1&&!p.blocks[0].text&&!p.comments?.length&&!p.removedBlocks?.length&&!p.externalSync?.length&&(p.title==='Document 1'||p.title==='My first study page')}

const color=(s:unknown)=>typeof s==='string'&&/^#[a-fA-F0-9]{6}$/.test(s)
const validRun=(r:TextRun)=>!!r&&typeof r.text==='string'&&['bold','italic','underline','strike','code'].every(k=>(r as any)[k]===undefined||typeof (r as any)[k]==='boolean')&&(r.color===undefined||color(r.color))&&(r.background===undefined||color(r.background))&&(r.link===undefined||/^https?:\/\/[^\s<>"']+$/.test(r.link))&&(r.script===undefined||['sub','super'].includes(r.script))
function validBlock(b:Block){return !!b&&typeof b.id==='string'&&typeof b.text==='string'&&typeof b.checked==='boolean'&&(b.runs===undefined||(Array.isArray(b.runs)&&b.runs.every(validRun)&&b.runs.map(r=>r.text).join('')===b.text))&&(b.list===undefined||['bullet','number'].includes(b.list))&&(b.align===undefined||['left','center','right'].includes(b.align))&&(b.level===undefined||[1,2,3].includes(b.level))&&['paragraph','heading','checklist','callout'].includes(b.type)&&['none','yellow','purple'].includes(b.highlight)&&(b.selection===undefined||(!!b.selection&&Number.isInteger(b.selection.start)&&Number.isInteger(b.selection.end)&&b.selection.start>=0&&b.selection.end>b.selection.start&&b.selection.end<=b.text.length))}
export function validate(value:unknown):value is Workspace {
 if(!value||typeof value!=='object')return false
 const w=value as Workspace
 return (w.purgedIds===undefined||(Array.isArray(w.purgedIds)&&w.purgedIds.every(id=>typeof id==='string'&&id.length>0&&id.length<=200)))&&(w.nextDocumentNumber===undefined||(Number.isSafeInteger(w.nextDocumentNumber)&&w.nextDocumentNumber>0&&w.nextDocumentNumber<=1000000000000))&&w.version===1&&Number.isInteger(w.revision)&&typeof w.activePage==='string'&&Array.isArray(w.pages)&&w.pages.every(p=>!!p&&typeof p.id==='string'&&typeof p.title==='string'&&Number.isFinite(p.updatedAt)&&(p.deletedAt===undefined||Number.isFinite(p.deletedAt))&&(p.starter===undefined||typeof p.starter==='boolean')&&(p.originId===undefined||typeof p.originId==='string')&&(p.autoNumber===undefined||(Number.isSafeInteger(p.autoNumber)&&p.autoNumber>0))&&(p.externalSync===undefined||(Array.isArray(p.externalSync)&&p.externalSync.every(x=>['google','notion'].includes(x))))&&(p.comments===undefined||(Array.isArray(p.comments)&&p.comments.every(c=>!!c&&typeof c.id==='string'&&typeof c.quote==='string'&&typeof c.text==='string'&&Number.isFinite(c.createdAt))))&&(p.deleted===undefined||typeof p.deleted==='boolean')&&Array.isArray(p.blocks)&&p.blocks.every(validBlock)&&(p.removedBlocks===undefined||(Array.isArray(p.removedBlocks)&&p.removedBlocks.every(validBlock))))
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
 if(!validate(next))throw Error('This edit could not be saved safely. Your previous saved workspace is unchanged.');
 const serialized=JSON.stringify(next);if(workspaceBytes(next)>MAX_WORKSPACE_BYTES&&(!current||workspaceBytes(next)>=workspaceBytes(current)))throw Error('Your workspace is full. Download a copy, then empty Trash or shorten your notes. Smaller edits can still be saved while you free space.')
 localStorage.setItem(storageKey(uid),serialized)
 window.dispatchEvent(new CustomEvent(EVENT,{detail:{uid}}))
}

const pageValue=(p:Page|undefined)=>p?JSON.stringify({...p,updatedAt:0}):''
function conflictId(p:Page){let hash=2166136261;for(const c of pageValue(p)){hash^=c.charCodeAt(0);hash=Math.imul(hash,16777619)}return p.id+'-copy-'+(hash>>>0).toString(16)}
/** Three-way merge: independent pages combine; concurrent edits retain a recovery copy. */
export function mergeWorkspaces(local:Workspace,base:Workspace|null,remote:Workspace):Workspace {
 const purged=new Set([...(local.purgedIds||[]),...(remote.purgedIds||[])])
 const pages=structuredClone(remote.pages).filter(p=>!purged.has(p.id))
 for(const p of local.pages){
  if(purged.has(p.id))continue
  if(!base&&local.pages.length===1&&untouchedStarter(p))continue
  const old=base?.pages.find(x=>x.id===p.id),r=pages.find(x=>x.id===p.id)
  if(pageValue(p)===pageValue(old)||pageValue(p)===pageValue(r))continue
  if(!r){pages.push(structuredClone(p));continue}
  if(pageValue(r)===pageValue(old)){pages[pages.indexOf(r)]=structuredClone(p);continue}
  const copy={...structuredClone(p),id:conflictId(p),title:p.title+' (recovered edit)',originId:p.originId||p.id,starter:false,autoNumber:undefined,deleted:false}
  if(!pages.some(x=>x.id===copy.id))pages.push(copy)
 }
 return reconcileWorkspace({...local,pages,activePage:pages.some(p=>p.id===local.activePage&&!p.deleted)?local.activePage:remote.activePage},remote)
}
