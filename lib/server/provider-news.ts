import 'server-only'
import {directorySources,parseDirectoryEvents} from './provider-events'
import {eventSources,parseEventOffers,offerFresh,isEventVoucherTitle} from './event-vouchers'
import rawEventSnapshot from '@/data/event-vouchers-snapshot.json'
import {preserveNewsSummary} from '@/lib/news-presentation'
import {automaticSummary} from './news-summary'
import {isacaOffersUrl,parseIsacaNews,parseIsacaOffers} from './isaca-news'
import {services} from './firebase'
import Parser from 'rss-parser'
import {load} from 'cheerio'
import {createHash} from 'node:crypto'
import {unstable_cache,revalidateTag} from 'next/cache'
import initialSnapshot from '@/data/news-snapshot.json'
import {news as seed,isActiveNews,type NewsRecord} from '@/lib/catalog'
import {enrichNews,reviewedNews} from '@/lib/news-editorial'
const eventSnapshot=rawEventSnapshot as {sources:{provider:string;label:string;sourceUrl:string;checkedAt:string;status:string;items:NewsRecord[]}[]}
export const sources:{provider:string;label?:string;url:string;host:string;kind:string;path?:string;parser?:string}[]=[
 ...eventSources,
 ...directorySources,
 {provider:'Cisco',label:'Cisco certification announcements',url:'https://blogs.cisco.com/tag/cisco-certifications/feed',host:'blogs.cisco.com',kind:'rss'},
 {provider:'CompTIA',label:'CompTIA official certification blog',url:'https://www.comptia.org/en-us/blog/',host:'www.comptia.org',kind:'html',path:'/en-us/blog/'},
 {provider:'ISC2',label:'ISC2 Insights',url:'https://www.isc2.org/isc2insights',host:'www.isc2.org',kind:'html',path:'/insights/'},
 {provider:'ISACA',label:'ISACA official newsroom',url:'https://www.isaca.org/news',host:'www.isaca.org',kind:'html',path:'/about-us/newsroom/press-releases/'},
 {provider:'ISACA',label:'ISACA official training offers',url:isacaOffersUrl,host:'www.isaca.org',kind:'offers'},
 {provider:'GitHub',label:'GitHub certification announcements',url:'https://github.blog/tag/certifications/feed/',host:'github.blog',kind:'rss'},
 {provider:'AWS',label:'AWS training announcements',url:'https://aws.amazon.com/blogs/training-and-certification/category/post-types/announcements/feed/',host:'aws.amazon.com',kind:'rss'},
 {provider:'AWS',url:'https://aws.amazon.com/blogs/training-and-certification/feed/',host:'aws.amazon.com',kind:'rss'},
 {provider:'Microsoft',url:'https://techcommunity.microsoft.com/t5/s/gxcuf89792/rss/board?board.id=skills-hub-blog',host:'techcommunity.microsoft.com',kind:'rss'},
 {provider:'Google Cloud',url:'https://cloud.google.com/blog/topics/training-certifications',host:'cloud.google.com',kind:'html',path:'/blog/topics/training-certifications/'},
 {provider:'Databricks',url:'https://www.databricks.com/feed',host:'www.databricks.com',kind:'rss'},
 {provider:'GitHub',url:'https://github.blog/feed/',host:'github.blog',kind:'rss'},
]
const sourceId=(source:typeof sources[number])=>'news_source_'+createHash('sha256').update(source.url).digest('hex').slice(0,24)
const relevant=/certif|credential|exam|voucher|\b(?:CCNA|CCNP|CCIE|CISM|CISA|CISSP|CCSP|Security\+|CySA\+)\b/i
async function readSource(source:typeof sources[number],previous:NewsRecord[]=[]){
 const response=await fetch(source.url,{signal:AbortSignal.timeout(15000),headers:{'User-Agent':'CertPro official certification news reader'},cache:'no-store',...(['event-offers','event-directory'].includes(source.kind)?{redirect:'error' as const}:{})})
 if(!response.ok)throw Error('Source unavailable')
 const text=await response.text();if(text.length>6_000_000)throw Error('Source exceeds size limit')
 const fetched=new Date().toISOString()
 if(source.kind==='event-offers')return {provider:source.provider,sourceUrl:source.url,label:source.label||source.provider,checkedAt:fetched,items:parseEventOffers(text,source as typeof eventSources[number]),status:'ok'}
 if(source.kind==='event-directory')return {provider:source.provider,sourceUrl:source.url,label:source.label,checkedAt:fetched,items:parseDirectoryEvents(text,source as typeof directorySources[number]),status:'ok'}
 if(source.kind==='offers')return {provider:source.provider,sourceUrl:source.url,label:source.label||source.provider,checkedAt:fetched,items:parseIsacaOffers(text),status:'ok'}
 let entries:{title?:string;link?:string;isoDate?:string;contentSnippet?:string;content?:string;summary?:string;'content:encoded'?:string}[]=[]
 if(source.kind==='rss')entries=(await new Parser().parseString(text)).items
 else if(source.provider==='ISACA')entries=parseIsacaNews(text)
 else {
  const $=load(text)
  $('a[href]').each((_,a)=>{
   const link=$(a).attr('href');if(!link?.includes(source.path!))return
   const cardText=$(a).text().replace(/\s+/g,' ').trim()
   const headline=$(a).find('h2,h3,h4,[class*="title"],[class*="heading"]').first().text().replace(/\s+/g,' ').trim()
   const title=headline||cardText
   const visibleDate=cardText.match(/\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+20\d{2}\b/i)?.[0]
   const date=$(a).find('time').attr('datetime')||(visibleDate?visibleDate+' UTC':undefined)
   if(title.length>25&&title.length<240)entries.push({title,link,isoDate:date})
  })
 }
 if(!entries.length)throw Error('No entries found in provider source')
 const articleBodies=new Map<string,string>();const unique=new Map<string,NewsRecord>()
 for(const entry of entries){if(!entry.title||!entry.link||!relevant.test(entry.title))continue
 let url:URL;try{url=new URL(entry.link,source.url)}catch{continue}
 if(url.protocol!=='https:'||url.hostname!==source.host)continue
 url.hash='';for(const key of [...url.searchParams.keys()])if(/^utm_|^(fbclid|gclid)$/i.test(key))url.searchParams.delete(key);const title=load(entry.title).text().replace(/\s+/g,' ').replace(/^Training and Certifications/,'').replace(/By .+ • \d+-minute read$/,'').trim().slice(0,240)
 const date=entry.isoDate?new Date(entry.isoDate):null
 if(date&&!Number.isNaN(date.valueOf())&&(date>new Date()||Date.now()-date.valueOf()>365*86400000))continue
 const id='official-'+createHash('sha256').update(url.href).digest('hex').slice(0,24)
 articleBodies.set(id,load(entry['content:encoded']||entry.content||'').text().replace(/\s+/g,' ').trim());
 const excerptText=load(entry.contentSnippet||entry.summary||entry.content||'').text().replace(/\s+/g,' ').trim();const excerptWords=Math.max(0,25-title.split(/\s+/).length);const excerpt=excerptText.split(/\s+/).slice(0,excerptWords).join(' ');
 unique.set(id,enrichNews({id,provider:source.provider,type:isEventVoucherTitle(title)?'event-voucher':/discount|voucher|save \d|\d+% off|free (?:exam|certification)|exam offer/i.test(title)?'discount':/\bevent|webinar|conference|training day|learning festival|skills challenge/i.test(title)?'event-announcement':'news',title,...(excerpt?{source_excerpt:excerpt+(excerptText.split(/\s+/).length>excerptWords?'…':'')}:{}),summary:`An official announcement from ${source.provider}. Read the official announcement for details, eligibility, dates, and any offer terms.`,source_url:url.href,verified_on:fetched.slice(0,10),published_on:date&&!Number.isNaN(date.valueOf())?date.toISOString().slice(0,10):null,status:'published'}))
 }
 const fresh=[...unique.values()].slice(0,15).map(n=>{
  const old=previous.find(p=>p.source_url===n.source_url)
  return {...preserveNewsSummary(n,old),...(old?.summary_attempted_on?{summary_attempted_on:old.summary_attempted_on}:{})}
 })
 // Keep older pending articles eligible, even once they fall out of the latest feed window.
 const items=[...fresh,...previous.filter(n=>!fresh.some(f=>f.source_url===n.source_url)&&retainedArticleValid(n))]
 const pending=items.filter(n=>!n.article_paragraphs?.length).sort((a,b)=>(a.summary_attempted_on||'').localeCompare(b.summary_attempted_on||''))
 if(pending[0]){const n=pending[0];const index=items.findIndex(p=>p.id===n.id);items[index]={...await automaticSummary(n,articleBodies.get(n.id)),summary_attempted_on:fetched}}

 return {provider:source.provider,sourceUrl:source.url,label:source.label||source.provider,checkedAt:fetched,items,status:'ok'}
}
function retainedArticleValid(item:NewsRecord){
 if(!isActiveNews(item))return false
 const date=item.published_on?new Date(item.published_on):null
 if(date&&(!Number.isFinite(date.valueOf())||date>new Date()||Date.now()-date.valueOf()>365*86400000))return false
 // Discard malformed records from the earlier HTML parser, including when the source is temporarily unavailable.
 return item.type==='event'||item.provider!=='ISACA'||(item.article_summary_kind==='source-offer'&&!!item.expires_on)||!!(date&&item.title.split(/\s+/).length<=25&&!/^Press Release\b/i.test(item.title))
}
async function archiveDeadline<T>(request:Promise<T>):Promise<T>{
 let timer:ReturnType<typeof setTimeout>|undefined
 try{return await Promise.race([request,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('News archive unavailable')),1200)})])}finally{clearTimeout(timer)}
}
async function retainedSource(source:typeof sources[number]){
 let previous:any=null
 try{previous=(await archiveDeadline(services().db.collection('certproConfig').doc(sourceId(source)).get())).data();if(!previous&&!source.label)previous=(await archiveDeadline(services().db.collection('certproConfig').doc('news_'+source.provider.replace(/[^a-z0-9]/gi,'_')).get())).data()}catch{/* Provider refresh must not depend on Firestore availability. */}
 if(!previous&&['event-offers','event-directory'].includes(source.kind))previous=eventSnapshot.sources.find(s=>s.sourceUrl===source.url)
 try{
  const fresh=await readSource(source,previous?.items||[]);const merged=new Map<string,NewsRecord>((['offers','event-offers','event-directory'].includes(source.kind)?[]:previous?.items||[]).map((n:NewsRecord)=>[n.id,n]));for(const n of fresh.items)merged.set(n.id,n)
  const items=[...merged.values()].filter(retainedArticleValid).sort((a,b)=>(b.published_on||'').localeCompare(a.published_on||'')).slice(0,100)
  let archiveAvailable=true;try{await archiveDeadline(services().db.collection('certproConfig').doc(sourceId(source)).set({...fresh,items}))}catch{archiveAvailable=false}
  return {...fresh,items,archiveAvailable}
 }catch{return {provider:source.provider,sourceUrl:source.url,label:source.label||source.provider,checkedAt:previous?.checkedAt||null,items:((['offers','event-offers','event-directory'].includes(source.kind)&&(!Number.isFinite(Date.parse(previous?.checkedAt))||Date.now()-Date.parse(previous.checkedAt)>48*3600000)?[]:previous?.items||[]) as NewsRecord[]).filter(retainedArticleValid),status:previous?.checkedAt?'stale':'unavailable',archiveAvailable:!!previous}}
}
// Stable keys serve the last result while Next refreshes expired entries in the background.
const cached=sources.map(source=>unstable_cache(()=>retainedSource(source),['official-news-independent-v13',source.url],{revalidate:3600}))
export async function providerNews(){
 const results=await Promise.all(cached.map((read,i)=>read().catch(()=>({provider:sources[i].provider,sourceUrl:sources[i].url,label:sources[i].label||sources[i].provider,checkedAt:null,items:[] as NewsRecord[],status:'unavailable'}))))
 return assembleNews(results)
}
const refreshDescription='Official sources are checked hourly as the site is visited, with a daily scheduled refresh. Official event directories are monitored alongside news feeds for all providers. Dated events are added where the directory supports extraction; blocked or unreadable listings need review. Voucher terms are confirmed separately. Expired or withdrawn offers are removed, and unavailable sources retain checked offers for at most 48 hours. Coverage is not exhaustive. New article summaries are prepared in small batches.'
function assembleNews(results:any[]){
 const reviewedItems:NewsRecord[]=reviewedNews.filter(n=>!seed.some(s=>s.source_url.replace(/\/$/,'')===n.source_url.replace(/\/$/,''))).map(n=>enrichNews({id:'official-'+createHash('sha256').update(n.source_url).digest('hex').slice(0,24),provider:n.provider,type:'news',title:n.title,summary:n.summary,source_url:n.source_url,verified_on:n.reviewed_on,published_on:n.published_on??null,status:'published'}));
 const offerUrls=new Set(sources.filter(s=>['offers','event-offers','event-directory'].includes(s.kind)).map(s=>s.url))
 const byUrl=new Map([...seed,...reviewedItems].filter(n=>isActiveNews(n)&&!offerUrls.has(n.source_url)).map(n=>[n.source_url,enrichNews(n)]));for(const result of results)for(const n of result.items){if(offerUrls.has(n.source_url))byUrl.set(n.source_url+'#'+n.id,n);else if(!byUrl.has(n.source_url))byUrl.set(n.source_url,enrichNews(n))}
 const seenTitles=new Set<string>();const items=[...byUrl.values()].filter(n=>isActiveNews(n)).filter(n=>{const key=n.provider+'|'+n.title.toLowerCase().replace(/[^a-z0-9]/g,'');if(seenTitles.has(key))return false;seenTitles.add(key);return true}).sort((a,b)=>(b.published_on||b.verified_on||'').localeCompare(a.published_on||a.verified_on||'')||a.id.localeCompare(b.id))
 return {items,sources:results.map(({items,...status})=>({...status,matchingArticles:items.length})),refresh:refreshDescription}
}

// External event reads have a 250ms display budget; other feeds and AI run after response. The last persisted
// source results are shared between server rendering and the client endpoint.
export const newsSnapshot=unstable_cache(async()=>{
 const fallback=initialSnapshot as unknown as ReturnType<typeof assembleNews>
 const eventReads=Promise.all(cached.slice(0,eventSources.length+directorySources.length).map(async read=>{
  let timer:ReturnType<typeof setTimeout>|undefined
  try{return await Promise.race([read(),new Promise<null>(resolve=>{timer=setTimeout(()=>resolve(null),250)})])}catch{return null}finally{clearTimeout(timer)}
 }))
 const withEvents=async(snapshot:ReturnType<typeof assembleNews>)=>{
  const events=(await eventReads).filter((s):s is NonNullable<typeof s>=>s!==null)
  const urls=new Set(events.map(s=>s.sourceUrl))
  const eventProviders=new Set(directorySources.filter(s=>urls.has(s.url)).map(s=>s.provider))
  const statuses=[...snapshot.sources.filter(s=>!urls.has(s.sourceUrl)),...events.map(({items,...s})=>({...s,matchingArticles:items.length}))]
  for(const s of sources)if(!statuses.some(old=>old.sourceUrl===s.url))statuses.push({provider:s.provider,label:s.label||s.provider,sourceUrl:s.url,status:'unavailable',checkedAt:null,matchingArticles:0})
  return {...snapshot,refresh:refreshDescription,items:[...snapshot.items.filter(n=>!urls.has(n.source_url)&&!(n.type==='event'&&eventProviders.has(n.provider))),...events.flatMap(s=>s.items).filter(retainedArticleValid)],sources:statuses}
 }
 try{
  const db=services().db
  let timer:ReturnType<typeof setTimeout>|undefined
  const docs=await Promise.race([
   db.getAll(...sources.map(source=>db.collection('certproConfig').doc(sourceId(source)))),
   new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('News archive timed out')),1200)})
  ]).finally(()=>clearTimeout(timer))
  return withEvents(assembleNews(sources.map((source,i)=>{
   const stored=docs[i].data()
   const bootstrap=eventSnapshot.sources.find(s=>s.sourceUrl===source.url)
   const old=bootstrap||fallback.sources.find(s=>s.sourceUrl===source.url)
   const items=stored?.items||bootstrap?.items||(source.kind==='event-directory'?[]:fallback.items.filter(n=>n.provider===source.provider))
   const checkedAt=stored?.checkedAt||old?.checkedAt||null
   const stale=!checkedAt||Date.now()-Date.parse(checkedAt)>3600000
   return {provider:source.provider,sourceUrl:source.url,label:source.label||source.provider,checkedAt,status:stale?'stale':stored?.status||old?.status||'stale',items:(['offers','event-offers','event-directory'].includes(source.kind)&&(!checkedAt||Date.now()-Date.parse(checkedAt)>48*3600000)?[]:items).filter(retainedArticleValid)}
  })))
 }catch{
  const staleOffers=new Set(sources.filter(s=>['offers','event-offers','event-directory'].includes(s.kind)&&(!fallback.sources.find(old=>old.sourceUrl===s.url)?.checkedAt||Date.now()-Date.parse(fallback.sources.find(old=>old.sourceUrl===s.url)!.checkedAt!)>48*3600000)).map(s=>s.url))
  return withEvents({...fallback,items:[...fallback.items.filter(n=>retainedArticleValid(n)&&!staleOffers.has(n.source_url)&&!eventSources.some(s=>s.url===n.source_url)),...eventSnapshot.sources.filter(s=>offerFresh(s.checkedAt)).flatMap(s=>s.items).filter(retainedArticleValid)],sources:[...fallback.sources.filter(s=>!eventSources.some(e=>e.url===s.sourceUrl)).map(s=>({...s,status:'stale'})),...eventSnapshot.sources.map(({items,...s})=>({...s,status:'stale',matchingArticles:offerFresh(s.checkedAt)?items.filter(retainedArticleValid).length:0}))]})
 }
},['news-display-snapshot-v5'],{revalidate:300,tags:['news-display-snapshot']})
export async function refreshNewsInBackground(){
 await providerNews()
 revalidateTag('news-display-snapshot','max')
}
