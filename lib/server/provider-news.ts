import 'server-only'
import {automaticSummary} from './news-summary'
import {isacaOffersUrl,parseIsacaNews,parseIsacaOffers} from './isaca-news'
import {services} from './firebase'
import Parser from 'rss-parser'
import {load} from 'cheerio'
import {createHash} from 'node:crypto'
import {unstable_cache} from 'next/cache'
import {news as seed,isActiveNews,type NewsRecord} from '@/lib/catalog'
import {enrichNews,reviewedNews} from '@/lib/news-editorial'
export const sources=[
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
 const response=await fetch(source.url,{signal:AbortSignal.timeout(15000),headers:{'User-Agent':'CertPro official certification news reader'},cache:'no-store'})
 if(!response.ok)throw Error('Source unavailable')
 const text=await response.text();if(text.length>6_000_000)throw Error('Source exceeds size limit')
 const fetched=new Date().toISOString()
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
 unique.set(id,enrichNews({id,provider:source.provider,type:/discount|voucher|save \d|\d+% off|free (?:exam|certification)|exam offer/i.test(title)?'discount':'news',title,...(excerpt?{source_excerpt:excerpt+(excerptText.split(/\s+/).length>excerptWords?'…':'')}:{}),summary:`An official announcement from ${source.provider}. Read the official announcement for details, eligibility, dates, and any offer terms.`,source_url:url.href,verified_on:fetched.slice(0,10),published_on:date&&!Number.isNaN(date.valueOf())?date.toISOString().slice(0,10):null,status:'published'}))
 }
 const items=[...unique.values()].slice(0,15).map(n=>{const old=previous.find(p=>p.source_url===n.source_url);if(n.article_paragraphs?.length)return n;return {...n,...(old?.summary_attempted_on?{summary_attempted_on:old.summary_attempted_on}:{}),...(old?.article_paragraphs?.length?{summary:old.summary,article_paragraphs:old.article_paragraphs,...(old.article_generated_on?{article_generated_on:old.article_generated_on,article_summary_kind:old.article_summary_kind}:{})}:{})}})
 // One new article per feed per hourly refresh bounds free-tier usage and request time.
 // Rotate failed candidates so one inaccessible page cannot starve the queue.
 const pending=items.filter(n=>!n.article_paragraphs?.length).sort((a,b)=>(previous.find(p=>p.id===a.id)?.summary_attempted_on||'').localeCompare(previous.find(p=>p.id===b.id)?.summary_attempted_on||''))
 if(pending[0]){const n=pending[0];const index=items.findIndex(p=>p.id===n.id);items[index]={...await automaticSummary(n,articleBodies.get(n.id)),summary_attempted_on:fetched}}
 return {provider:source.provider,sourceUrl:source.url,label:source.label||source.provider,checkedAt:fetched,items,status:'ok'}
}
function retainedArticleValid(item:NewsRecord){
 if(!isActiveNews(item))return false
 const date=item.published_on?new Date(item.published_on):null
 if(date&&(!Number.isFinite(date.valueOf())||date>new Date()||Date.now()-date.valueOf()>365*86400000))return false
 // Discard malformed records from the earlier HTML parser, including when the source is temporarily unavailable.
 return item.provider!=='ISACA'||(item.article_summary_kind==='source-offer'&&!!item.expires_on)||!!(date&&item.title.split(/\s+/).length<=25&&!/^Press Release\b/i.test(item.title))
}
async function retainedSource(source:typeof sources[number]){
 let previous:any=null
 try{previous=(await services().db.collection('certproConfig').doc(sourceId(source)).get()).data();if(!previous&&!source.label)previous=(await services().db.collection('certproConfig').doc('news_'+source.provider.replace(/[^a-z0-9]/gi,'_')).get()).data()}catch{/* Provider refresh must not depend on Firestore availability. */}
 try{
  const fresh=await readSource(source,previous?.items||[]);const merged=new Map<string,NewsRecord>((source.kind==='offers'?[]:previous?.items||[]).map((n:NewsRecord)=>[n.id,n]));for(const n of fresh.items)merged.set(n.id,n)
  const items=[...merged.values()].filter(retainedArticleValid).sort((a,b)=>(b.published_on||'').localeCompare(a.published_on||'')).slice(0,100)
  let archiveAvailable=true;try{await services().db.collection('certproConfig').doc(sourceId(source)).set({...fresh,items})}catch{archiveAvailable=false}
  return {...fresh,items,archiveAvailable}
 }catch{return {provider:source.provider,sourceUrl:source.url,label:source.label||source.provider,checkedAt:previous?.checkedAt||null,items:((source.kind==='offers'&&(!Number.isFinite(Date.parse(previous?.checkedAt))||Date.now()-Date.parse(previous.checkedAt)>48*3600000)?[]:previous?.items||[]) as NewsRecord[]).filter(retainedArticleValid),status:previous?'stale':'unavailable',archiveAvailable:!!previous}}
}
// An hourly key makes the first visit/cron wait for a refresh, instead of returning stale data and relying on background execution.
const cached=sources.map(source=>(hour:number)=>unstable_cache(()=>retainedSource(source),['official-news-independent-v8',source.url,String(hour)],{revalidate:3600})())
export async function providerNews(){
 const results=await Promise.all(cached.map((read,i)=>read(Math.floor(Date.now()/3600000)).catch(()=>({provider:sources[i].provider,sourceUrl:sources[i].url,label:sources[i].label||sources[i].provider,checkedAt:null,items:[] as NewsRecord[],status:'unavailable'}))))
 const reviewedItems:NewsRecord[]=reviewedNews.filter(n=>!seed.some(s=>s.source_url.replace(/\/$/,'')===n.source_url.replace(/\/$/,''))).map(n=>enrichNews({id:'official-'+createHash('sha256').update(n.source_url).digest('hex').slice(0,24),provider:n.provider,type:'news',title:n.title,summary:n.summary,source_url:n.source_url,verified_on:n.reviewed_on,published_on:n.published_on??null,status:'published'}));
 const offerUrls=new Set(sources.filter(s=>s.kind==='offers').map(s=>s.url))
 const byUrl=new Map([...seed,...reviewedItems].filter(n=>isActiveNews(n)&&!offerUrls.has(n.source_url)).map(n=>[n.source_url,enrichNews(n)]));for(const result of results)for(const n of result.items){if(offerUrls.has(n.source_url))byUrl.set(n.source_url+'#'+n.id,n);else if(!byUrl.has(n.source_url))byUrl.set(n.source_url,enrichNews(n))}
 const seenTitles=new Set<string>();const items=[...byUrl.values()].filter(n=>{const key=n.provider+'|'+n.title.toLowerCase().replace(/[^a-z0-9]/g,'');if(seenTitles.has(key))return false;seenTitles.add(key);return true}).sort((a,b)=>(b.published_on||b.verified_on||'').localeCompare(a.published_on||a.verified_on||'')||a.id.localeCompare(b.id))
 return {items,sources:results.map(({items,...status})=>({...status,matchingArticles:items.length})),refresh:'Official sources are checked hourly as the site is visited, with a daily scheduled refresh. Certification announcements and supported official training offers appear here; coverage is not exhaustive. ISACA training offers are removed when they expire or disappear from the official offer page. New articles receive AI-generated summaries checked against official source text in small batches. Pending summaries retry on later refreshes.'}
}
