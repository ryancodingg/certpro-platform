import {test} from 'node:test'
import assert from 'node:assert/strict'
import {initial,page,addDocument,moveToTrash,restorePage,permanentlyDelete,mergeWorkspaces,reconcileWorkspace,validate,workspaceBytes,MAX_WORKSPACE_BYTES,persist,storageKey} from '../lib/study-workspace'

test('numbered blank documents preserve custom titles and never reuse trashed/deleted numbers',()=>{
 const w=initial('');assert.equal(w.pages[0].title,'Document 1');const second=addDocument(w);assert.equal(second.title,'Document 2')
 moveToTrash(w,second.id);permanentlyDelete(w,[second.id]);assert.equal(addDocument(w).title,'Document 3')
 w.pages[0].title='My custom notes';assert.equal(addDocument(w).title,'Document 4');assert.equal(w.pages[0].title,'My custom notes')
 assert.equal(initial('Legacy notes').pages[0].title,'My study notes')
})
test('trash restore and permanent deletion preserve active pages, strip content, and allow an empty workspace',()=>{
 const w=initial('');const p=w.pages[0];p.blocks[0].text='private content';moveToTrash(w,p.id)
 assert.equal(w.activePage,'');assert.equal(w.pages.length,1);assert.ok(p.deletedAt)
 restorePage(w,p.id);assert.equal(w.activePage,p.id);assert.equal(p.blocks[0].text,'private content')
 permanentlyDelete(w,[p.id]);assert.equal(w.pages.length,1,'Active pages cannot be purged')
 moveToTrash(w,p.id);permanentlyDelete(w,[p.id]);assert.equal(w.pages.length,0);assert.deepEqual(w.purgedIds,[p.id]);assert.ok(!JSON.stringify(w).includes('private content'))
 permanentlyDelete(w,[p.id]);assert.equal(w.purgedIds?.length,1);assert.equal(addDocument(w).title,'Document 2')
})
test('permanent deletion wins over offline edits but preserves independently recovered documents',()=>{
 const base=initial('Important notes'),local=structuredClone(base),remote=structuredClone(base)
 local.pages[0].blocks[0].text='offline edit';const id=base.pages[0].id
 moveToTrash(remote,id);permanentlyDelete(remote,[id])
 local.pages.push({...structuredClone(local.pages[0]),id:id+'-copy-abcd',originId:id})
 for(const merged of [mergeWorkspaces(local,base,remote),mergeWorkspaces(remote,base,local)]){
  assert.equal(merged.pages.length,1);assert.equal(merged.pages[0].id,id+'-copy-abcd');assert.ok(merged.purgedIds?.includes(id));assert.ok(validate(merged))
 }
 const legacy=structuredClone(local);delete legacy.purgedIds
 assert.equal(reconcileWorkspace(legacy,remote).pages.length,1,'Old client PUT cannot erase server deletion markers')
})
test('new-device starter is suppressed for both legacy and new names, even with an empty cloud workspace',()=>{
 const cloud=initial('Existing account notes');assert.equal(mergeWorkspaces(initial(''),null,cloud).pages.length,1)
 const legacy=initial('');legacy.pages[0].title='My first study page';delete legacy.pages[0].starter;delete legacy.pages[0].autoNumber
 assert.equal(mergeWorkspaces(legacy,null,cloud).pages.length,1)
 const empty={...cloud,pages:[],activePage:''};assert.equal(mergeWorkspaces(initial(''),null,empty).pages.length,0)
 const edited=initial('');edited.pages[0].blocks[0].text='real notes';assert.equal(mergeWorkspaces(edited,null,cloud).pages.length,2)
})
test('concurrent documents get distinct deterministic names and custom titles are preserved',()=>{
 const base=initial('');const a=structuredClone(base),b=structuredClone(base);addDocument(a);addDocument(b)
 const first=mergeWorkspaces(a,base,b),second=mergeWorkspaces(b,base,a)
 const names=(w:typeof base)=>w.pages.map(p=>[p.id,p.title]).sort()
 assert.deepEqual(names(first),names(second));assert.equal(new Set(first.pages.map(p=>p.title)).size,3)
 assert.deepEqual(names(mergeWorkspaces(first,first,first)),names(first));assert.equal(addDocument(first).title,'Document 4')
})
test('concurrent edits still retain recovery copies without deletion',()=>{
 const base=initial('notes'),a=structuredClone(base),b=structuredClone(base)
 a.pages[0].blocks[0].text='A';b.pages[0].blocks[0].text='B'
 const merged=mergeWorkspaces(a,base,b);assert.equal(merged.pages.length,2);assert.deepEqual(new Set(merged.pages.map(p=>p.blocks[0].text)),new Set(['A','B']))
})
test('UTF-8 budget, account isolation, stale-tab protection and shrinking legacy oversized workspaces',()=>{
 const store=new Map<string,string>();Object.assign(globalThis,{localStorage:{getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>store.set(k,v)},window:{dispatchEvent:()=>{}}})
 const w=initial('');w.pages[0].blocks[0].text='🙂'.repeat(230000);assert.ok(workspaceBytes(w)>MAX_WORKSPACE_BYTES)
 assert.throws(()=>persist('a',w,null),/full/)
 store.set(storageKey('a'),JSON.stringify(w));const smaller=structuredClone(w);smaller.pages[0].blocks[0].text='🙂'.repeat(225000);smaller.revision++
 persist('a',smaller,0);assert.equal(store.has(storageKey('b')),false);assert.throws(()=>persist('a',w,0),/another tab/)
 moveToTrash(smaller,smaller.pages[0].id);permanentlyDelete(smaller,[smaller.pages[0].id]);smaller.revision++;persist('a',smaller,1);assert.ok(workspaceBytes(smaller)<MAX_WORKSPACE_BYTES)
})
test('validate accepts old workspaces and rejects malformed deletion metadata',()=>{
 const w=initial('');delete w.purgedIds;delete w.nextDocumentNumber;assert.ok(validate(w))
 assert.ok(!validate({...w,purgedIds:[123]}));assert.ok(!validate({...w,nextDocumentNumber:-1}))
})

test('oversized custom numeric titles never poison saved data and counter exhaustion is safe',()=>{
 const w=initial('');w.pages[0].title='Document 999999999999999999999999';assert.equal(addDocument(w).title,'Document 2');assert.ok(validate(w))
 w.nextDocumentNumber=1000000000000;const before=JSON.stringify(w);assert.throws(()=>addDocument(w),/limit/);assert.equal(JSON.stringify(w),before)
})
test('permanent deletion affects only selected trashed documents, not an active recovered copy',()=>{
 const base=initial('notes'),a=structuredClone(base),b=structuredClone(base);a.pages[0].blocks[0].text='A';b.pages[0].blocks[0].text='B';
 const merged=mergeWorkspaces(a,base,b);moveToTrash(merged,base.pages[0].id);permanentlyDelete(merged,[base.pages[0].id]);assert.equal(merged.pages.length,1);assert.equal(merged.pages[0].deleted,false);assert.equal(merged.pages[0].blocks[0].text,'A')
})
