const fs=require('fs'),path=require('path'),ts=require('typescript'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'..');
function mod(file,mocks={}){const m={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(base+'/'+file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText)(n=>Object.hasOwn(mocks,n)?mocks[n]:require(n),m,m.exports);return m.exports}
const dirs=mod('lib/provider-events.ts'),helpers=mod('lib/server/provider-events.ts',{'../provider-events':dirs});
const now=new Date('2026-11-05T10:00:00Z');
assert.equal(new Set(dirs.providerEventDirectories.map(s=>s.provider)).size,9);
assert.deepEqual(helpers.eventDates('1–3 December 2026'),['2026-12-01','2026-12-03']);
assert.deepEqual(helpers.eventDates('November 17–20, 2026'),['2026-11-17','2026-11-20']);
assert.equal(helpers.eventDates('February 31, 2027'),null);assert.equal(helpers.eventDates('November 17'),null);
const source=helpers.directorySources.find(s=>s.provider==='ISACA');
const html=(date,href='/training-and-events/conferences/example')=>`<a class="hot-tile" href="${href}"><div class="tile-title">Future learning conference</div><span class="content-addl-details">${date}</span></a>`;
assert.equal(helpers.parseDirectoryEvents(html('1–3 December 2026'),source,now).length,1);
assert.equal(helpers.parseDirectoryEvents(html('1–3 October 2026'),source,now).length,0);
assert.equal(helpers.parseDirectoryEvents(html('1–3 December 2026','https://evil.example/event'),source,now).length,0);
assert.throws(()=>helpers.parseDirectoryEvents('<html>Loading...</html>',source,now));
const upcoming=helpers.parseDirectoryEvents(html('1–3 December 2026'),source,now)[0];assert.equal(upcoming.type,'event');assert.equal(upcoming.discount_percent,undefined);assert.equal(upcoming.exam_codes,undefined);
const catalog=mod('lib/catalog.ts',{'@/data/certifications.json':{certifications:[]},'@/data/news-seed.json':{items:[]}});assert(!catalog.isActiveNews(upcoming,new Date('2026-12-04')));assert(catalog.isActiveNews(upcoming,new Date('2026-12-02')));
if(process.argv.includes('--live-fixtures'))for(const s of helpers.directorySources){const key={'Google Cloud':'google','Microsoft':'microsoft','ISC2':'isc2','ISACA':'isaca','GitHub':'github','AWS':'aws','Databricks':'databricks','Cisco':'cisco'}[s.provider];try{const html=fs.readFileSync(base+'/../../output/event-vouchers/directories/'+key+'.html','utf8');const items=helpers.parseDirectoryEvents(html,s,new Date());console.log(s.provider,items.length,items.map(i=>i.event_on+' '+i.title));}catch(e){console.log(s.provider,e.message)}}
console.log('PASS provider directories: nine providers, explicit dates, expiry, URL trust, no implied vouchers');
