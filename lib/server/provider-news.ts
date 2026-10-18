import 'server-only'
import Parser from 'rss-parser'
import {load} from 'cheerio'
import {createHash} from 'node:crypto'
import {unstable_cache} from 'next/cache'
import {news as seed,isActiveNews,type NewsRecord} from '@/lib/catalog'
const sources=[
 {provider:'AWS',url:'https://aws.amazon.com/blogs/training-and-certification/feed/',host:'aws.amazon.com',kind:'rss'},
 {provider:'Microsoft',url:'https://techcommunity.microsoft.com/t5/s/gxcuf89792/rss/board?board.id=skills-hub-blog',host:'techcommunity.microsoft.com',kind:'rss'},
 {provider:'Google Cloud',url:'https://cloud.google.com/blog/topics/training-certifications',host:'cloud.google.com',kind:'html',path:'/blog/topics/training-certifications/'},
 {provider:'Databricks',url:'https://www.databricks.com/feed',host:'www.databricks.com',kind:'rss'},
 {provider:'GitHub',url:'https://github.blog/feed/',host:'github.blog',kind:'rss'},
]
const relevant=/certif|credential|exam|voucher/i
async function readSource(source:typeof sources[number]){
 const response=await fetch(source.url,{signal:AbortSignal.timeout(15000),headers:{'User-Agent':'CertPro official certification news reader'},next:{revalidate:3600}})
 if(!response.ok)throw Error('Source unavailable')
 const text=await response.text();if(text.length>3_000_000)throw Error('Source exceeds size limit')
 let entries:{title?:string;link?:string;isoDate?:string}[]=[]
 if(source.kind==='rss')entries=(await new Parser().parseString(text)).items
 else {const $=load(text);$('a[href]').each((_,a)=>{const link=$(a).attr('href');const title=$(a).find('h2,h3,h4').first().text().trim()||$(a).text().replace(/\s+/g,' ').trim();if(link?.includes(source.path!)&&title.length>25&&title.length<240)entries.push({title,link})})}
 if(!entries.length)throw Error('No entries found in provider source')
 const fetched=new Date().toISOString();const unique=new Map<string,NewsRecord>()
 for(const entry of entries){if(!entry.title||!entry.link||!relevant.test(entry.title))continue
 let url:URL;try{url=new URL(entry.link,source.url)}catch{continue}
 if(url.protocol!=='https:'||url.hostname!==source.host)continue
 url.hash='';const title=load(entry.title).text().replace(/\s+/g,' ').trim().slice(0,240)
 const date=entry.isoDate?new Date(entry.isoDate):null
 if(date&&!Number.isNaN(date.valueOf())&&(date>new Date()||Date.now()-date.valueOf()>365*86400000))continue
 const id='official-'+createHash('sha256').update(url.href).digest('hex').slice(0,24)
 unique.set(id,{id,provider:source.provider,type:'news',title,summary:`An official announcement from ${source.provider}. Read the official announcement for details, eligibility, dates, and any offer terms.`,source_url:url.href,verified_on:fetched.slice(0,10),published_on:date&&!Number.isNaN(date.valueOf())?date.toISOString().slice(0,10):null,status:'published'})
 }
 return {provider:source.provider,checkedAt:fetched,items:[...unique.values()].slice(0,15),status:'ok'}
}
const cached=sources.map(source=>unstable_cache(()=>readSource(source),['official-news-v2',source.provider],{revalidate:3600}))
export async function providerNews(){
 const results=await Promise.all(cached.map((read,i)=>read().catch(()=>({provider:sources[i].provider,checkedAt:null,items:[] as NewsRecord[],status:'unavailable'}))))
 const byUrl=new Map(seed.filter(n=>isActiveNews(n)).map(n=>[n.source_url,n]));for(const result of results)for(const n of result.items)if(!byUrl.has(n.source_url))byUrl.set(n.source_url,n)
 const items=[...byUrl.values()].sort((a,b)=>(b.published_on||(b.id.startsWith('official-')?'':b.verified_on)).localeCompare(a.published_on||(a.id.startsWith('official-')?'':a.verified_on))||a.id.localeCompare(b.id))
 return {items,sources:results.map(({items,...status})=>({...status,matchingArticles:items.length})),refresh:'Official sources are checked hourly as the site is visited, with a daily scheduled refresh. Only certification-related announcements found in these sources appear here; coverage is not exhaustive.'}
}
