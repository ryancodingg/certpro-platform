import {load} from 'cheerio'
import {createHash} from 'node:crypto'
import type {NewsRecord} from '../catalog'
import {providerEventDirectories} from '../provider-events'
export const directorySources=providerEventDirectories.filter(s=>s.provider!=='CompTIA').map(s=>({...s,host:new URL(s.url).hostname,label:s.provider+' official events',kind:'event-directory'}))
const clean=(s:string)=>s.replace(/\s+/g,' ').trim()
// No inferred year: an undated card is not a confirmed upcoming event.
export function eventDates(text:string):[string,string]|null {
 const months='January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec'
 const a=text.match(new RegExp(`\\b(${months}) (\\d{1,2})(?:[–—-](\\d{1,2}))?,? (20\\d{2})\\b`,'i'))
 const b=text.match(new RegExp(`\\b(\\d{1,2})(?:[–—-](\\d{1,2}))? (${months}) (20\\d{2})\\b`,'i'))
 if(!a&&!b)return null
 const month=a?a[1]:b![3],year=a?a[4]:b![4],start=a?a[2]:b![1],end=a?(a[3]||start):(b![2]||start)
 const parse=(day:string)=>{const d=new Date(`${month} ${day}, ${year} 12:00:00 GMT`);return Number.isFinite(d.valueOf())&&d.getUTCDate()===Number(day)?d.toISOString().slice(0,10):null}
 const from=parse(start),to=parse(end);return from&&to&&from<=to?[from,to]:null
}
export function parseDirectoryEvents(html:string,source:typeof directorySources[number],now=new Date()):NewsRecord[]{
 const $=load(html);$('br').replaceWith(' ');$('div,p,span,h2,h3,h4').append(' ');const rows:{title:string;url:string;dates:[string,string]}[]=[]
 const add=(title:string,url:string,dates:[string,string]|null)=>{if(dates&&title.length>=8&&title.length<=220)rows.push({title:clean(title),url,dates})}
 // Schema.org is used when the provider supplies explicit machine-readable event dates.
 const walk=(value:any)=>{if(!value||typeof value!=='object')return;if([].concat(value['@type']||[]).some((t:string)=>t==='Event'||t.endsWith('Event'))&&typeof value.name==='string'&&typeof value.startDate==='string'&&!/Cancelled|Postponed/.test(value.eventStatus||'')){
  const start=value.startDate.slice(0,10),end=(value.endDate||value.startDate).slice(0,10)
  if([start,end].every(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d)&&start<=end)add(value.name,typeof value.url==='string'?value.url:source.url,[start,end])
 }for(const child of Object.values(value))if(typeof child==='object')walk(child)}
 $('script[type="application/ld+json"]').each((_,e)=>{try{walk(JSON.parse($(e).text()))}catch{/* Invalid structured data is not an event. */}})
 if(source.provider==='ISACA')$('a.hot-tile').each((_,e)=>add($(e).find('.tile-title').text(),$(e).attr('href')||source.url,eventDates(clean($(e).find('.content-addl-details').text()))))
 if(source.provider==='GitHub')$('a[class*="Card__link"]').each((_,e)=>add($(e).text(),source.url,eventDates(clean($(e).parent().parent().text()))))
 if(source.provider==='ISC2')$('a').each((_,e)=>{const text=clean($(e).text());if(text.startsWith('Event')&&text.includes('Event Location'))add(text.slice(5).split('Event Location')[0],source.url,eventDates(text.split('Date').pop()||''))})
 if(source.provider==='Google Cloud')$('a[track-type="card"]').each((_,e)=>{const text=clean($(e).text());if(!/On demand/i.test(text))add($(e).find('.CilWo').text(),$(e).attr('href')||source.url,eventDates(text))})
 if(source.provider==='Microsoft')$('h2,h3').each((_,e)=>{const title=clean($(e).text());if(title==='Microsoft Ignite')add(title,source.url,eventDates(clean($(e).parent().parent().parent().parent().text())))})
 // A changed/JS-only directory must not report a successful empty ingestion.
 if(!rows.length)throw Error('Event dates require provider-page review')
 const unique=new Map<string,NewsRecord>();const today=now.toISOString().slice(0,10)
 for(const row of rows){if(row.dates[1]<today)continue
  let url:URL;try{url=new URL(row.url,source.url)}catch{continue}
  if(url.protocol!=='https:'||url.username||url.password)continue
  if(url.hostname!==source.host&&!(source.provider==='Google Cloud'&&url.hostname==='cloudonair.withgoogle.com'))continue
  url.hash='';for(const k of [...url.searchParams.keys()])if(k.startsWith('utm_'))url.searchParams.delete(k)
  const id='event-'+createHash('sha256').update(source.provider+'|'+row.title+'|'+row.dates[0]).digest('hex').slice(0,24)
  unique.set(id,{id,provider:source.provider,type:'event',title:row.title,summary:`An upcoming ${source.provider} event. Check the official listing for the agenda, registration and attendance requirements.`,source_url:url.href,verified_on:today,published_on:null,status:'published',event_on:row.dates[0],event_end:row.dates[1],attendance:'Provider-wide event · confirm attendance format with the organiser',article_paragraphs:[`${source.provider} lists this event for ${row.dates[0]}${row.dates[1]!==row.dates[0]?' to '+row.dates[1]:''}. Open the official listing to confirm times, timezone, location and registration.`,`This is a provider-wide learning opportunity, not an exam booking. No exam voucher or certification-specific eligibility has been confirmed for this listing.`]})
 }
 return [...unique.values()].sort((a,b)=>a.event_on!.localeCompare(b.event_on!)).slice(0,30)
}
