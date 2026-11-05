const fs=require('fs'),ts=require('typescript'),assert=require('node:assert/strict');
function mod(file,mocks={}){const m={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:1,target:9,esModuleInterop:true}}).outputText)(n=>mocks[n]||require(n),m,m.exports);return m.exports}
const helpers=mod('lib/catalog-availability.ts',{'./testing-access':{TESTING_ACCESS:true}});
assert.deepEqual(helpers.bankAvailability(100,false),{count:100,practice:'available',mock:'available'});
assert.deepEqual(helpers.bankAvailability(0,false),{count:0,practice:'empty',mock:'empty'});
assert.deepEqual(helpers.bankAvailability(100,true),{count:100,practice:'available',mock:'available'});
assert.deepEqual(helpers.bankAvailability(0,true),{count:null,practice:'unknown',mock:'unavailable'});
assert.equal(helpers.bankAvailability(NaN,false).count,null);
const seen=[];const route=mod('app/api/catalog-availability/route.ts',{'@/lib/catalog':{certificationById:id=>['a','b'].includes(id)?{id,aliases:id==='a'?['alias-a']:[]}:undefined},'@/lib/catalog-availability':helpers,'@/lib/server/learning-bank':{learningBank:async id=>{seen.push(id);if(id==='b')throw Error('offline');return {questions:[{secret:'answer'}],recovery:false}}}});
(async()=>{let r=await route.GET(new Request('https://example.com/api?ids=a,a,b'));const data=await r.json();assert.deepEqual(seen,['alias-a','b']);assert.equal(data.items.a.count,1);assert.equal(data.items.b.count,null);assert(!JSON.stringify(data).includes('secret'));assert.equal((await route.GET(new Request('https://example.com/api?ids=unknown'))).status,400);assert.equal((await route.GET(new Request('https://example.com/api'))).status,400);console.log('PASS: truthful zero/unknown/recovery states, batch deduplication, aliases, invalid IDs and no question disclosure')})().catch(e=>{console.error(e);process.exitCode=1});
