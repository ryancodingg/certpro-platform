const fs=require('fs'),ts=require('typescript'),assert=require('node:assert/strict');
function mod(file,mocks={}){const m={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:1,target:9,esModuleInterop:true}}).outputText)(n=>mocks[n]||require(n),m,m.exports);return m.exports}
const helpers=mod('lib/catalog-availability.ts',{'./testing-access':{TESTING_ACCESS:true}});
assert.deepEqual(helpers.bankAvailability(100,false),{count:100,practice:'available',mock:'available'});
assert.deepEqual(helpers.bankAvailability(0,false),{count:0,practice:'empty',mock:'empty'});
assert.deepEqual(helpers.bankAvailability(100,true),{count:100,practice:'available',mock:'available'});
assert.deepEqual(helpers.bankAvailability(0,true),{count:null,practice:'unknown',mock:'unavailable'});
assert.equal(helpers.bankAvailability(NaN,false).count,null);
const catalog=Array.from({length:30},(_,i)=>({id:String(i)}));const availability=Object.fromEntries(catalog.map((c,i)=>[c.id,i%2?helpers.bankAvailability(1,false):helpers.unknownAvailability]));
assert.equal(helpers.filterPracticeAvailability(catalog,availability,false).length,30);
const ready=helpers.filterPracticeAvailability(catalog,availability,true);assert.equal(ready.length,15);assert.equal(ready.slice(12,24).length,3);assert.equal(ready[14].id,'29');assert.equal(helpers.filterPracticeAvailability(catalog,undefined,true).length,0);
const route=mod('app/api/catalog-availability/route.ts',{'@/lib/catalog':{certificationById:id=>['a','b'].includes(id)?{id}:undefined},'@/lib/server/catalog-availability':{catalogAvailability:async()=>({a:helpers.bankAvailability(200,false),b:helpers.unknownAvailability})}});
(async()=>{let r=await route.GET(new Request('https://example.com/api?ids=a,a,b'));const data=await r.json();assert.equal(Object.keys(data.items).length,2);assert.equal(data.items.a.count,200);assert.equal(data.items.b.count,null);assert.equal((await route.GET(new Request('https://example.com/api?ids=unknown'))).status,400);assert.equal((await route.GET(new Request('https://example.com/api'))).status,400);assert.equal(Object.keys((await (await route.GET(new Request('https://example.com/api?scope=all'))).json()).items).length,2);
let reads=0;let fail=false;
const db={collection(name){assert.equal(name,'certproMetadata');return {doc(id){assert.equal(id,'catalogAvailability');return {async get(){reads++;if(fail)throw Error('quota');return {data:()=>({banks:{'alias-a':{count:200,updatedAt:'2026-11-06'},c:{count:0,updatedAt:'2026-11-06'}}})}}}}}}};
const index=mod('lib/server/catalog-availability.ts',{
 'server-only':{},'next/cache':{unstable_cache:fn=>fn},
 '@/lib/catalog':{certifications:[{id:'a',aliases:['alias-a']},{id:'b',aliases:[]},{id:'c',aliases:[]}]},
 '@/data/published-bank-recovery.json':{questions:[{id:'q',certification:'alias-a',status:'published'},{id:'r',certification:'b',status:'published'}]},
 '@/lib/questions':{normalizeQuestion:q=>q,publication:q=>q.status,questionSchema:{safeParse:()=>({success:true})}},
 '@/lib/catalog-availability':helpers,'./firebase':{services:()=>({db})}
});
let counts=await index.catalogAvailability();assert.equal(reads,1);assert.equal(counts.a.count,200);assert.equal(counts.a.source,'verified');assert.equal(counts.b.count,1);assert.equal(counts.b.source,'backup');assert.equal(counts.c.count,0);assert.equal(counts.c.practice,'empty');fail=true;counts=await index.catalogAvailability();assert.equal(counts.a.count,200,'known live count must not regress to smaller backup');await index.catalogAvailability();assert.equal(reads,2,'failure circuit prevents retry storms');
console.log('PASS: full catalog count-only index, aliases, verified zero vs unknown, backup provenance, last-known counts, circuit bound and API validation')})().catch(e=>{console.error(e);process.exitCode=1});
