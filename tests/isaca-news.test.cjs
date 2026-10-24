const ts=require('typescript'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'..');
function moduleOf(file,mocks={},append=''){
 const built=ts.transpileModule(fs.readFileSync(path.join(base,file),'utf8')+append,{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,target:ts.ScriptTarget.ES2022},reportDiagnostics:true});
 assert.equal(built.diagnostics.length,0,file);const m={exports:{}};
 new Function('require','module','exports',built.outputText)(n=>Object.hasOwn(mocks,n)?mocks[n]:require(n),m,m.exports);return m.exports;
}
const helpers=moduleOf('lib/server/isaca-news.ts');
const catalog=moduleOf('lib/catalog.ts',{'@/data/certifications.json':JSON.parse(fs.readFileSync(base+'/data/certifications.json')),'@/data/news-seed.json':JSON.parse(fs.readFileSync(base+'/data/news-seed.json'))});
// The empty image heading precedes the real title in ISACA's current newsroom cards.
const card=(url,title,date)=>`<a href="${url}"><div class="search-result__heading"><img alt="image"></div><div class="search-result__sub-heading">Press Release</div><div class="tile-title">${title}</div><p>A provider announcement for certification candidates.</p><span class="content-addl-details">${date}</span></a>`;
const newsHtml=card('/about-us/newsroom/press-releases/2026/credential-update','ISACA announces a new certification pathway','22 October 2026')+card('https://evil.test/about-us/newsroom/press-releases/2026/steal','ISACA announces an unrelated certification','22 October 2026')+card('/about-us/newsroom/press-releases/2026/missing','ISACA announces a certification update','invalid date');
const offersHtml=(percent=50,code='PRODCYBERMONTH26',end='31 October',context='The State of Cybersecurity 2026 report is available.')=>`<main><h1>Cybersecurity training offers</h1><div><p>${context}</p><p>Plus, members get <strong>${percent}% off select cybersecurity products</strong> by using <strong>promo code ${code}</strong>. Offer ends ${end}.</p></div></main>`;
const now=new Date('2026-10-23T00:00:00Z');
const entries=helpers.parseIsacaNews(newsHtml);assert.equal(entries.length,1);assert.equal(entries[0].title,'ISACA announces a new certification pathway');assert.equal(entries[0].isoDate,'2026-10-22T00:00:00.000Z');
const [offer]=helpers.parseIsacaOffers(offersHtml(),now);assert.equal(offer.expires_on,'2026-10-31');assert.equal(offer.type,'discount');assert.equal(offer.published_on,null);assert.match(offer.eligibility,/members/);assert.match(offer.summary,/PRODCYBERMONTH26/);assert.match(offer.article_paragraphs.join(' '),/does not establish a discount on certification exam registration/);assert(offer.article_paragraphs.join(' ').split(/\s+/).length<200);
assert.equal(helpers.parseIsacaOffers(offersHtml(),new Date('2026-11-01')).length,0);
assert.equal(helpers.parseIsacaOffers(offersHtml(),new Date('2027-10-01')).length,0,'old promotion must not roll to next year');
assert.throws(()=>helpers.parseIsacaOffers(offersHtml(50,'ABC','31 February 2027'),now),/Invalid/);
assert.throws(()=>helpers.parseIsacaOffers(offersHtml(50,'ABC','31 October','A yearless announcement'),now),/terms/);
assert.throws(()=>helpers.parseIsacaOffers(offersHtml(50,'ABC','31 October','Reports from 2025 and 2026'),now),/terms/);
assert.equal(helpers.parseIsacaOffers(offersHtml(20,'NEWCODE','30 November 2026',''),now)[0].expires_on,'2026-11-30','explicit year does not need surrounding year');
assert.notEqual(helpers.parseIsacaOffers(offersHtml(20,'NEWCODE','30 November 2026'),now)[0].id,offer.id);
assert.throws(()=>helpers.parseIsacaOffers('<html>Access denied</html>',now),/layout/);
const noOffer='<main><h1>Featured training</h1><p>Explore professional learning resources.</p></main>';
assert.deepEqual(helpers.parseIsacaOffers(noOffer,now),[]);
assert.deepEqual(helpers.parseIsacaOffers('<footer><p>Members get 20% off training using promo code NEWSLETTER26. Offer ends 31 October 2026.</p></footer>'+noOffer,now),[]);
const docs=new Map();const ed={enrichNews:n=>n,reviewedNews:[]};
const backend=moduleOf('lib/server/provider-news.ts',{'server-only':{},'./isaca-news':helpers,'./news-summary':{automaticSummary:async n=>n},'./firebase':{services:()=>({db:{collection:()=>({doc:id=>({get:async()=>({data:()=>docs.get(id)}),set:async x=>docs.set(id,x)})})}})},'next/cache':{unstable_cache:f=>f},'@/lib/catalog':catalog,'@/lib/news-editorial':ed},'\nexport {readSource,retainedSource};');
const originalDate=Date;
global.Date=class extends originalDate{constructor(...args){super(...(args.length?args:[now.valueOf()]))}static now(){return now.valueOf()}};
(async()=>{
 const source=backend.sources.find(s=>s.kind==='offers');const newsroom=backend.sources.find(s=>s.provider==='ISACA'&&s.kind==='html');
 global.fetch=async()=>new Response(newsHtml);const n=await backend.readSource(newsroom);assert.equal(n.items.length,1);assert.equal(n.status,'ok');assert(!n.items[0].title.startsWith('Press Release'));
 global.fetch=async()=>new Response(offersHtml());let result=await backend.retainedSource(source);assert.equal(result.items.length,1);
 global.fetch=async()=>new Response('',{status:503});result=await backend.retainedSource(source);assert.equal(result.status,'stale');assert.equal(result.items.length,1);
 for(const doc of docs.values())doc.checkedAt='2026-10-20T00:00:00Z';result=await backend.retainedSource(source);assert.equal(result.items.length,0,'unverified offers expire from fallback after 48h');
 global.fetch=async()=>new Response(offersHtml(20,'NEWCODE','30 November 2026'));result=await backend.retainedSource(source);assert.equal(result.items.length,1);assert.match(result.items[0].title,/20%/);assert(!result.items.some(n=>n.id===offer.id),'new promotion replaces old promotion');
 global.fetch=async()=>new Response(noOffer);result=await backend.retainedSource(source);assert.equal(result.items.length,0,'withdrawn promotion is removed');
 global.fetch=async()=>new Response(offersHtml(50,'OLD','1 October 2026'));result=await backend.retainedSource(source);assert.equal(result.items.length,0,'expired promotion is not published');
 console.log('PASS: ISACA markup, dates, canonical host, promotion terms, expiry, no year rollover, withdrawal, replacement, failure fallback, and retention.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{global.Date=originalDate});
