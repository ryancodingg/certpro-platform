import {load} from 'cheerio'
import {createHash} from 'node:crypto'
import type {NewsRecord} from '../catalog'
import {providerEventDirectories} from '../provider-events'
export const directorySources=providerEventDirectories.map(s=>({...s,...(s.provider==='Databricks'?{fetchUrl:'https://www.databricks.com/en-website-assets/page-data/events/page-data.json'}:{}),host:new URL(s.url).hostname,label:s.provider+' official events',kind:'event-directory'}))
const clean=(s:string)=>s.replace(/\s+/g,' ').trim()
// No inferred year: an undated card is not a confirmed upcoming event.
export function eventDates(text:string):[string,string]|null {
 const months='January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec'
 const cross=text.match(new RegExp(`\\b(${months})\\s+(\\d{1,2})\\s*[–—-]\\s*(${months})\\s+(\\d{1,2}),?\\s+(20\\d{2})\\b`,'i'))
 if(cross){const a=new Date(`${cross[1]} ${cross[2]}, ${cross[5]} 12:00:00 GMT`),b=new Date(`${cross[3]} ${cross[4]}, ${cross[5]} 12:00:00 GMT`);return Number.isFinite(a.valueOf())&&Number.isFinite(b.valueOf())&&a.getUTCDate()===+cross[2]&&b.getUTCDate()===+cross[4]&&a<=b?[a.toISOString().slice(0,10),b.toISOString().slice(0,10)]:null}
 const a=text.match(new RegExp(`\\b(${months}) (\\d{1,2})(?:[–—-](\\d{1,2}))?,? (20\\d{2})\\b`,'i'))
 const b=text.match(new RegExp(`\\b(\\d{1,2})(?:[–—-](\\d{1,2}))? (${months}) (20\\d{2})\\b`,'i'))
 if(!a&&!b)return null
 const month=a?a[1]:b![3],year=a?a[4]:b![4],start=a?a[2]:b![1],end=a?(a[3]||start):(b![2]||start)
 const parse=(day:string)=>{const d=new Date(`${month} ${day}, ${year} 12:00:00 GMT`);return Number.isFinite(d.valueOf())&&d.getUTCDate()===Number(day)?d.toISOString().slice(0,10):null}
 const from=parse(start),to=parse(end);return from&&to&&from<=to?[from,to]:null
}
type EventMetadata=Pick<NewsRecord,'event_format'|'event_location'|'event_timezone'>
// Read only explicit Schema.org values. A venue never implies attendance mode or timezone.
export function structuredEventMetadata(value:Record<string,any>):EventMetadata{
 const text=(v:unknown)=>typeof v==='string'?clean(v).slice(0,240):''
 const modes:Record<string,string>={OnlineEventAttendanceMode:'Online',OfflineEventAttendanceMode:'In person',MixedEventAttendanceMode:'Hybrid'}
 const mode=text(value.eventAttendanceMode).split('/').pop()||''
 const locations=(Array.isArray(value.location)?value.location:[value.location]).filter(Boolean)
 const venue=locations.map((place:any)=>{
  if(typeof place==='string')return text(place)
  if(!place||typeof place!=='object'||(Array.isArray(place['@type'])?place['@type']:[place['@type']]).some((type:unknown)=>typeof type==='string'&&/(^|\/)VirtualLocation$/.test(type)))return ''
  const address=place.address
  const parts=[text(place.name),typeof address==='string'?text(address):address&&typeof address==='object'?[text(address.streetAddress),text(address.addressLocality),text(address.addressRegion),typeof address.addressCountry==='string'?text(address.addressCountry):text(address.addressCountry?.name)].filter(Boolean).join(', '):'']
  return parts.filter(Boolean).join(' · ')
 }).filter(Boolean).join('; ')
 const schedules=Array.isArray(value.eventSchedule)?value.eventSchedule:[value.eventSchedule]
 const zone=schedules.map((s:any)=>text(s?.scheduleTimezone)).find(Boolean)
 const offset=typeof value.startDate==='string'?value.startDate.match(/T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/)?.[1]:undefined
 const timezone=zone||(offset?(offset==='Z'?'UTC':'UTC'+offset)+' at event start':'')
 return {...(Object.hasOwn(modes,mode)?{event_format:modes[mode]}:{}),...(venue?{event_location:venue}:{}),...(timezone?{event_timezone:timezone}:{})}
}
export function parseDirectoryEvents(html:string,source:typeof directorySources[number],now=new Date()):NewsRecord[]{
 const $=load(html);$('br').replaceWith(' ');$('div,p,span,h2,h3,h4').append(' ');const rows:{title:string;url:string;dates:[string,string];metadata:EventMetadata}[]=[]
 const add=(title:string,url:string,dates:[string,string]|null,metadata:EventMetadata={})=>{if(dates&&title.length>=8&&title.length<=220)rows.push({title:clean(title),url,dates,metadata})}
 let recognizedEmpty=false
 if(source.provider==='Databricks'){
  const data=JSON.parse(html)?.result?.pageContext?.globalContext?.eventsData?.eventsEN
  if(!Array.isArray(data))throw Error('Databricks calendar format changed')
  recognizedEmpty=true
  for(const item of data){
   const start=item.fieldDateTimeTimezone?.startDate?.slice(0,10),end=item.fieldDateTimeTimezone?.endDate?.slice(0,10)||start
   if(item.status!==true||!start||!end||![start,end].every(d=>/^20\d{2}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d)||start>end)continue
   if(typeof item.title==='string'&&typeof item.entityUrl?.path==='string')add(item.title,item.entityUrl.path,[start,end])
  }
 }
 if(source.provider==='AWS')$('script[type="application/json"]').each((_,e)=>{try{const data=JSON.parse($(e).text());for(const row of data.data?.items||[]){const f=row.fields;if(typeof f?.heading==='string'&&typeof f.ctaLink==='string')add(f.heading.split('|')[0].trim(),f.ctaLink,eventDates(f.heading))}}catch{/* Unrelated page metadata. */}})
 if(source.provider==='Cisco')$('a').filter((_,e)=>clean($(e).text()).toLowerCase()==='register now').each((_,e)=>{const card=$(e).parent().parent(),city=clean(card.find('p b').first().text());if(city)add('Cisco Live '+city,$(e).attr('href')||source.url,eventDates(clean(card.text())))})
 if(source.provider==='Cisco')$('tr').each((_,e)=>{const cells=$(e).children('th,td');if(cells.length<3)return;const dates=eventDates(clean(cells.eq(1).text()));if(dates)add(clean(cells.eq(0).text()),source.url,dates)})
 // CompTIA currently publishes announcements in its blog, without a separate dated calendar.
 // A valid blog with no explicit Event schema is a successful check, not an invented event.
 if(source.provider==='CompTIA'&&$('h1').text().toLowerCase().includes('blog')&&$('a[href*="/en-us/blog/"]').length>3)recognizedEmpty=true
 // Schema.org is used when the provider supplies explicit machine-readable event dates.
 const walk=(value:any)=>{if(!value||typeof value!=='object')return;if([].concat(value['@type']||[]).some((t:string)=>typeof t==='string'&&(t==='Event'||t.endsWith('Event')))&&typeof value.name==='string'&&typeof value.startDate==='string'&&!/Cancelled|Postponed/.test(value.eventStatus||'')){
  const start=value.startDate.slice(0,10),end=(value.endDate||value.startDate).slice(0,10)
  if([start,end].every(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d)&&start<=end)add(value.name,typeof value.url==='string'?value.url:source.url,[start,end],structuredEventMetadata(value))
 }for(const child of Object.values(value))if(typeof child==='object')walk(child)}
 $('script[type="application/ld+json"]').each((_,e)=>{try{walk(JSON.parse($(e).text()))}catch{/* Invalid structured data is not an event. */}})
 if(source.provider==='ISACA')$('a.hot-tile').each((_,e)=>add($(e).find('.tile-title').text(),$(e).attr('href')||source.url,eventDates(clean($(e).find('.content-addl-details').text()))))
 if(source.provider==='GitHub')$('a[class*="Card__link"]').each((_,e)=>add($(e).text(),source.url,eventDates(clean($(e).parent().parent().text()))))
 if(source.provider==='ISC2')$('a').each((_,e)=>{const text=clean($(e).text());if(text.startsWith('Event')&&text.includes('Event Location'))add(text.slice(5).split('Event Location')[0],source.url,eventDates(text.split('Date').pop()||''))})
 if(source.provider==='Google Cloud')$('a[track-type="card"]').each((_,e)=>{const text=clean($(e).text());if(!/On demand/i.test(text))add($(e).find('.CilWo').text(),$(e).attr('href')||source.url,eventDates(text))})
 if(source.provider==='Microsoft')$('h2,h3').each((_,e)=>{const title=clean($(e).text());if(title==='Microsoft Ignite')add(title,source.url,eventDates(clean($(e).parent().parent().parent().parent().text())))})
 // A changed/JS-only directory must not report a successful empty ingestion.
 if(!rows.length&&!recognizedEmpty)throw Error('Event dates require provider-page review')
 const unique=new Map<string,NewsRecord>();const today=now.toISOString().slice(0,10)
 for(const row of rows){if(row.dates[1]<today)continue
  let url:URL;try{url=new URL(row.url,source.url)}catch{continue}
  if(url.protocol!=='https:'||url.username||url.password)continue
  if(url.hostname!==source.host&&!(source.provider==='Google Cloud'&&url.hostname==='cloudonair.withgoogle.com'))continue
  url.hash='';for(const k of [...url.searchParams.keys()])if(k.startsWith('utm_'))url.searchParams.delete(k)
  const id='event-'+createHash('sha256').update(source.provider+'|'+row.title+'|'+row.dates[0]).digest('hex').slice(0,24)
  const previous=unique.get(id)
  const metadata={...(previous?.event_format?{event_format:previous.event_format}:{}),...(previous?.event_location?{event_location:previous.event_location}:{}),...(previous?.event_timezone?{event_timezone:previous.event_timezone}:{}),...row.metadata}
  unique.set(id,{id,provider:source.provider,type:'event',title:row.title,summary:`An upcoming ${source.provider} event. Check the official listing for the agenda, registration and attendance requirements.`,source_url:url.href,verified_on:today,published_on:null,status:'published',event_on:row.dates[0],event_end:row.dates[1],...metadata,article_paragraphs:[`${source.provider} lists this event for ${row.dates[0]}${row.dates[1]!==row.dates[0]?' to '+row.dates[1]:''}. Open the official listing to confirm times, timezone, location and registration.`,`This is a provider-wide learning opportunity, not an exam booking. No exam voucher or certification-specific eligibility has been confirmed for this listing.`]})
 }
 return [...unique.values()].sort((a,b)=>a.event_on!.localeCompare(b.event_on!)).slice(0,30)
}
