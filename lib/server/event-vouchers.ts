import {load} from 'cheerio'
import Parser from 'rss-parser'
import {createHash} from 'node:crypto'
import type {NewsRecord} from '../catalog'

export const isEventVoucherTitle=(title:string)=>/voucher|exam (?:offer|discount)|free (?:certification )?exam/i.test(title)&&/event|training day|challenge|ignite|data days|skills fest|certification week/i.test(title)

export const eventSources = [
 {provider:'Microsoft',label:'Microsoft Data Days exam vouchers',fetchUrl:'https://community.fabric.microsoft.com/t5/s/rss/board?board.id=community_blog&count=100',url:'https://community.fabric.microsoft.com/blog/community_blog/data-days--certification-vouchers/5376271',host:'community.fabric.microsoft.com',kind:'event-offers',parser:'data-days'},
 {provider:'Microsoft',label:'Microsoft Ignite onsite exam offer',url:'https://learn.microsoft.com/en-us/training/topics/ignite/microsoft-ignite-2026-certification-registration',host:'learn.microsoft.com',kind:'event-offers',parser:'ignite'},
]
// This is Microsoft's syndication of the original administrator-authored article,
// not a community summary. Missing/changed identity must retain the stale-source guard.
export async function dataDaysAnnouncement(xml:string){
 const feed=await new Parser().parseString(xml)
 const matches=feed.items.filter(item=>{
  if(item.creator!=='FabricMau'||item.title?.trim()!=='Data Days | Certification Vouchers'||!item.link)return false
  try{const u=new URL(item.link);return u.protocol==='https:'&&u.hostname==='community.fabric.microsoft.com'&&!u.port&&!u.username&&!u.password&&[
   '/t5/Power-BI-Community-Blog/Data-Days-Certification-Vouchers/ba-p/5376271',
   '/blog/community_blog/data-days--certification-vouchers/5376271'
  ].includes(u.pathname)&&!u.hash&&!u.search}catch{return false}
 })
 if(matches.length!==1||!matches[0].content)throw Error('Official voucher announcement missing from feed')
 return matches[0].content
}
export function offerFresh(checkedAt:string|null|undefined,now=new Date()) {
 const checked=Date.parse(checkedAt||'')
 return Number.isFinite(checked)&&checked<=now.valueOf()&&now.valueOf()-checked<=48*3600000
}
function date(value:string){
 const ms=Date.parse(value+' UTC')
 if(!Number.isFinite(ms))throw Error('Offer date needs review')
 const parts=value.match(/^([A-Za-z]+) (\d{1,2}), (\d{4})$/)
 if(!parts||new Date(ms).getUTCDate()!==Number(parts[2])||new Date(ms).getUTCFullYear()!==Number(parts[3]))throw Error('Invalid offer date')
 return new Date(ms).toISOString().slice(0,10)
}
function content(html:string){
 const $=load(html);$('script,style,nav,footer').remove()
 return ($('main').length?$('main').text():$.root().text()).replace(/\s+/g,' ').trim()
}
export function parseEventOffers(html:string,source:typeof eventSources[number],now=new Date()):NewsRecord[]{
 const pageText=content(html)
 // Exclude community replies and navigation from the administrator-authored announcement.
 const text=source.parser==='data-days'?pageText.split(/Updated\s+\d+\s+(?:days?|hours?|weeks?)\s+ago|Version 2\.0|Comments/i)[0]:pageText
 const make=(key:string,fields:Partial<NewsRecord>):NewsRecord=>({id:'event-'+createHash('sha256').update(source.url+'#'+key).digest('hex').slice(0,24),provider:'Microsoft',type:'event-voucher',title:'',summary:'',source_url:source.url,verified_on:now.toISOString().slice(0,10),published_on:null,status:'published',article_summary_kind:'source-offer',...fields})
 let items:NewsRecord[]=[]
 if(source.parser==='data-days'){
  if(!/Data Days.*Certification Vouchers|Data Days: AI @ Work/i.test(text))throw Error('Event page layout needs review')
  if(/(?:vouchers? (?:are |is )?(?:no longer available|sold out)|offer has ended)/i.test(text))return []
  if(!/one exam voucher/i.test(text)||!/private message/i.test(text)||!/Supplies are limited/i.test(text)||!/Eligibility requirements apply/i.test(text))throw Error('Voucher conditions need review')
  const period=text.match(/Data Days: AI @ Work runs ([A-Za-z]+) (\d{1,2}) [–-] ([A-Za-z]+) (\d{1,2}), (\d{4})/i)
  if(!period)throw Error('Event dates need review')
  const eventStart=date(`${period[1]} ${period[2]}, ${period[5]}`),eventEnd=date(`${period[3]} ${period[4]}, ${period[5]}`)
  const offersText=text.split('Pick your exam voucher offer')[1]?.split('Not quite ready?')[0]
  if(!offersText)throw Error('Offer section needs review')
  const matches=[...offersText.matchAll(/Get (\d{1,3})% of your exam covered\.\s*((?:(?:DP|PL)-\d{3}\s*(?:\|\s*)?)+)Take your exam by ([A-Za-z]+ \d{1,2}, \d{4})\./g)]
  if(!matches.length)throw Error('Voucher offer terms need review')
  for(const m of matches){
   const percent=Number(m[1]);if(![50,100].includes(percent))throw Error('Invalid discount')
   const exams=m[2].match(/(?:DP|PL)-\d{3}/g)!,deadline=date(m[3])
   items.push(make(`${percent}-${deadline}`,{title:`Data Days: ${percent}% exam voucher · take your exam by ${m[3]}`,summary:`Limited vouchers for ${exams.join(', ')}. Eligibility applies; request one through Microsoft’s official offer page.`,expires_on:deadline,eligibility:'One voucher per person; limited supply and eligibility requirements apply.',expiry_note:'Exam completion deadline; your voucher may have an earlier redemption deadline. Confirm the dates on your offer.',event_on:eventStart,event_end:eventEnd,attendance:'Live and on-demand learning; check voucher eligibility separately.',exam_codes:exams,discount_percent:percent,terms_url:`https://aka.ms/dd/cert${percent}/terms`,article_paragraphs:[`This Data Days offer covers ${percent}% of the fee for ${exams.join(', ')}. Complete the exam by ${m[3]}. Availability is limited.`,`Request through Microsoft with your Fabric Community account. If allocated, the code arrives in your community private messages, not email. One voucher is permitted per person.`,`Check the linked terms and your voucher’s redemption deadline before scheduling. Extensions are not available. Attending a session alone does not guarantee a voucher.`]}))
  }
 }else if(source.parser==='ignite'){
  if(!/Microsoft Ignite 2026 Onsite Certification/i.test(text))throw Error('Event page layout needs review')
  if(/offer has ended|no longer available/i.test(text))return []
  const window=text.match(/redemption window for this exam offer starts on ([A-Za-z]+ \d{1,2}, \d{4}), and expires on ([A-Za-z]+ \d{1,2}, \d{4})/i)
  if(!window||!/100% discount/i.test(text)||!/registered to attend Microsoft Ignite 2026 in person/i.test(text)||!/one certification exam offer per person/i.test(text)||!/San Francisco/.test(text))throw Error('Onsite offer terms need review')
  items=[make('onsite',{title:'Microsoft Ignite 2026: one free onsite certification exam',summary:'Registered in-person attendees can take one Microsoft or GitHub certification exam at the San Francisco event. Limited seats; registration required.',discount_percent:100,attendance:'In-person only · San Francisco',event_on:date(window[1]),event_end:date(window[2]),expires_on:date(window[2]),eligibility:'Registered Ignite in-person attendees only. One exam per person; regional restrictions apply.',expiry_note:'Onsite offer window; not a voucher for remote testing.',terms_url:source.url+'#microsoft-and-github-certification-offer-details',article_paragraphs:[`The offer applies to one onsite Microsoft or GitHub exam during ${window[1]}–${window[2]}. It does not provide a free remote exam or free conference admission.`,`Schedule through the certification page and select the Microsoft Ignite Event Test Center in San Francisco. The discount applies at checkout. Seats are limited.`,`Check the official page for eligible exams, regional exclusions and prerequisites. Government employees must confirm eligibility with their employer. The offer cannot be transferred or extended.`]})]
 }
 return items.filter(n=>!!n.expires_on&&n.expires_on>=now.toISOString().slice(0,10))
}
