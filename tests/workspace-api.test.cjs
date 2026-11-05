const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
const compile=p=>ts.transpile(fs.readFileSync(p,'utf8').replace(/^import .*$/mg,''),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022});
const model={};new Function('exports',compile('lib/study-workspace.ts'))(model);
let stored=null;class HttpError extends Error{constructor(status,message){super(message);this.status=status}}
const api={};new Function('exports','createHash','body','HttpError','sameOrigin','services','learner','validate','reconcileWorkspace','workspaceBytes','MAX_WORKSPACE_BYTES',compile('app/api/study-workspace/route.ts'))(api,require('node:crypto').createHash,async r=>r.json(),HttpError,()=>{},()=>({db:{collection:()=>({doc:()=>({get:async()=>({data:()=>stored})})}),runTransaction:async fn=>fn({get:async()=>({data:()=>stored}),set:(_,v)=>{stored=v}})}}),async()=> 'owner',model.validate,model.reconcileWorkspace,model.workspaceBytes,model.MAX_WORKSPACE_BYTES);
const put=(workspace,expectedRevision)=>api.PUT(new Request('http://localhost/api/study-workspace',{method:'PUT',body:JSON.stringify({workspace,expectedRevision})}));
(async()=>{
 const original=model.initial('Secret');assert.equal((await put(original,0)).status,200);
 const deleted=structuredClone(original);model.moveToTrash(deleted,original.pages[0].id);model.permanentlyDelete(deleted,[original.pages[0].id]);assert.equal((await put(deleted,1)).status,200);
 assert.equal((await put(original,1)).status,409,'stale revision rejected');
 const response=await put(original,2);assert.equal(response.status,200);const canonical=await response.json();assert.equal(canonical.workspace.pages.length,0,'old-client write cannot revive deleted document');assert.equal(canonical.workspace.purgedIds.length,1);assert.ok(!stored.workspace.includes('Secret'));
 stored.uid='other';assert.equal((await api.GET(new Request('http://localhost'))).status,403);assert.equal((await put(original,3)).status,403);
 console.log('PASS: API CAS conflict, permanent deletion survives old-client writes, canonical response and account isolation');
})().catch(e=>{console.error(e);process.exitCode=1});
