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

assert.equal(helpers.directorySources.length,9);
assert.deepEqual(helpers.eventDates('Nov 30 – Dec 4, 2026'),['2026-11-30','2026-12-04']);
assert.equal(helpers.eventDates('February 30 – March 2, 2027'),null);
const aws=helpers.directorySources.find(s=>s.provider==='AWS');
const awsHtml='<script type="application/json">'+JSON.stringify({data:{items:[{fields:{heading:'AWS re:Invent | Nov 30 – Dec 4, 2026 | Las Vegas',ctaLink:'https://aws.amazon.com/events/reinvent/'}}]}})+'</script>';
assert.equal(helpers.parseDirectoryEvents(awsHtml,aws,now)[0].event_end,'2026-12-04');
const cisco=helpers.directorySources.find(s=>s.provider==='Cisco');
const ciscoHtml='<table><tr><th><a href="https://third-party.example/">Cisco Live Melbourne</a></th><td>November 9-12, 2026</td><td>Education event</td></tr></table>';
const ciscoItem=helpers.parseDirectoryEvents(ciscoHtml,cisco,now)[0];assert.equal(ciscoItem.event_on,'2026-11-09');assert.equal(ciscoItem.source_url,cisco.url,'Third-party registration URL is not auto-trusted');
const db=helpers.directorySources.find(s=>s.provider==='Databricks');
const payload=rows=>JSON.stringify({result:{pageContext:{globalContext:{eventsData:{eventsEN:rows}}}}});
const dbRow={title:'Data Engineering Workshop',status:true,entityUrl:{path:'/events/workshop'},fieldDateTimeTimezone:{startDate:'2026-11-10 10:00:00 UTC',endDate:'2026-11-12 10:00:00 UTC'}};
assert.equal(helpers.parseDirectoryEvents(payload([dbRow]),db,now).length,1);
assert.equal(helpers.parseDirectoryEvents(payload([{...dbRow,status:false}]),db,now).length,0);
assert.equal(helpers.parseDirectoryEvents(payload([{...dbRow,fieldDateTimeTimezone:{startDate:'0026-11-10',endDate:'2026-11-12'}}]),db,now).length,0);
assert.equal(helpers.parseDirectoryEvents(payload([dbRow]),db,new Date('2026-11-13')).length,0);
assert.throws(()=>helpers.parseDirectoryEvents('{}',db,now));
assert.equal(helpers.parseDirectoryEvents(payload([]),db,now).length,0);
const comptia=helpers.directorySources.find(s=>s.provider==='CompTIA');
assert.equal(helpers.parseDirectoryEvents('<h1>CompTIA Blog</h1>'+Array(4).fill('<a href="/en-us/blog/article/">Article</a>').join(''),comptia,now).length,0);
assert.throws(()=>helpers.parseDirectoryEvents('<h1>Access denied</h1>',comptia,now));
console.log('PASS: AWS embedded records, cross-month dates, Cisco tables, Databricks calendar validation/withdrawals, CompTIA valid empty checks');

const liveHtml='<section><p><b>Melbourne</b></p><p>Nov 9-12, 2026</p><div><a href="/apjc.html">Register now</a></div></section>';
const liveItem=helpers.parseDirectoryEvents(liveHtml,cisco,now)[0];assert.equal(liveItem.title,'Cisco Live Melbourne');assert.equal(liveItem.source_url,'https://www.ciscolive.com/apjc.html');assert.equal(liveItem.event_end,'2026-11-12');console.log('PASS: alternative official Cisco Live calendar');
