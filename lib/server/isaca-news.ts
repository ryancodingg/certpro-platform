import {load} from 'cheerio'
import {createHash} from 'node:crypto'
import type {NewsRecord} from '@/lib/catalog'

const clean=(value:string)=>value.replace(/\s+/g,' ').trim()
const months=['january','february','march','april','may','june','july','august','september','october','november','december']
export const isacaOffersUrl='https://www.isaca.org/training-and-events/training-topics/featured-training'

/** Read the headline, not the image wrapper whose class also contains "heading". */
export function parseIsacaNews(html:string){
 const $=load(html)
 const entries:{title:string;link:string;isoDate:string;contentSnippet:string}[]=[]
 $('a[href*="/about-us/newsroom/press-releases/"]').each((_,a)=>{
  const link=$(a).attr('href')!
  let url:URL;try{url=new URL(link,'https://www.isaca.org/news')}catch{return}
  if(url.protocol!=='https:'||url.hostname!=='www.isaca.org')return
  const headline=$(a).find('.tile-title,h2,h3,h4,h5,[class*="title"]')
   .toArray().map(e=>clean($(e).text())).find(Boolean)||clean($(a).attr('title')||'')
  const rawDate=$(a).find('time').attr('datetime')||clean($(a).find('.content-addl-details').text())||clean($(a).text()).match(/\b\d{1,2}\s+[A-Za-z]+\s+20\d{2}\b/)?.[0]
  const date=rawDate?new Date(/^\d{4}-/.test(rawDate)?rawDate:rawDate+' UTC'):null
  if(!headline||headline.length<26||headline.length>239||headline.split(/\s+/).length>25||!date||!Number.isFinite(date.valueOf()))return
  entries.push({title:headline,link:url.href,isoDate:date.toISOString(),contentSnippet:clean($(a).find('p').first().text())})
 })
 return entries
}

/** Extract explicit promotion facts. No model is allowed to invent a discount or deadline. */
export function parseIsacaOffers(html:string,now=new Date()):NewsRecord[]{
 const $=load(html)
 $('nav,header,footer,script,style').remove()
 if(!$('main').length||!/train|cyber|offer|saving/i.test($('h1').text()))throw Error('ISACA offers page layout not recognized')
 const offers=new Map<string,NewsRecord>()
 $('main p').each((_,element)=>{
  const text=clean($(element).text())
  // Ignore newsletter sign-up benefits and navigation; require a dated product promotion.
  if(!/%\s*off/i.test(text)||!/offer\s+ends|promo(?:tion)?\s+code/i.test(text))return
  const percent=text.match(/\b(\d{1,2}|100)%\s*off\b/i)?.[1]
  const scope=text.match(/%\s*off\s+(.+?)(?=\s+(?:by using|using|with)\b|[.!?]|$)/i)?.[1]
  const code=text.match(/promo(?:tion)?\s+code\s+([A-Z0-9_-]{3,40})\b/i)?.[1]
  const ending=text.match(/offer\s+ends\s+(\d{1,2})\s+([A-Za-z]+)(?:\s+(20\d{2}))?\b/i)
  // An omitted year must be grounded in the same content block, never rolled into a new year.
  const contextYears=[...new Set($(element).parent().find('p').toArray().map(p=>clean($(p).text())).join(' ').match(/\b20\d{2}\b/g)||[])]
  const year=ending?.[3]||(contextYears.length===1?contextYears[0]:undefined)
  const month=months.indexOf((ending?.[2]||'').toLowerCase())
  if(!percent||!scope||scope.length>100||!code||!ending||!year||month<0)throw Error('ISACA promotion terms need review')
  const expiry=`${year}-${String(month+1).padStart(2,'0')}-${ending[1].padStart(2,'0')}`
  const deadline=new Date(expiry+'T23:59:59Z')
  if(!Number.isFinite(deadline.valueOf())||deadline.toISOString().slice(0,10)!==expiry)throw Error('Invalid ISACA offer deadline')
  if(deadline<now)return
  // Reject stale pages with distant dates rather than treating them as newly announced offers.
  if(deadline.valueOf()-now.valueOf()>366*86400000)throw Error('ISACA offer date outside supported range')
  const members=/\bmembers?\b/i.test(text)
  const productScope=scope.replace(/^select\b/i,'selected')
  const id='official-'+createHash('sha256').update(`${isacaOffersUrl}|${code}|${expiry}`).digest('hex').slice(0,24)
  const dateLabel=`${Number(ending[1])} ${months[month][0].toUpperCase()+months[month].slice(1)} ${year}`
  offers.set(id,{
   id,provider:'ISACA',type:'discount',status:'published',source_url:isacaOffersUrl,
   title:`ISACA ${members?'member ':''}offer: ${percent}% off ${productScope}`,
   summary:`A current ISACA promotion reduces the price of ${productScope} by ${percent}%${members?' for members':''}. Use code ${code} before the offer closes on ${dateLabel}.`,
   article_paragraphs:[
    `The official ISACA training page lists a ${percent}% price reduction on ${productScope}${members?', available to its members':''}. The promotion applies to the products identified in the offer.`,
    `Enter ${code} to claim the promotion. ISACA gives ${dateLabel} as the closing date. Check the provider’s current terms and the amount shown at checkout before paying.`,
    /exam/i.test(scope)?'Check the linked announcement for the eligible exams and any additional conditions before booking.':'Review the official offer page for the qualifying products. The announcement does not establish a discount on certification exam registration fees.'
   ],
   eligibility:members?'ISACA members; qualifying products only.':'Qualifying products only; check ISACA’s offer terms.',
   expires_on:expiry,expiry_note:`Offer ends ${dateLabel}; check ISACA for the applicable cutoff time.`,
   verified_on:now.toISOString().slice(0,10),published_on:null,
   article_generated_on:now.toISOString().slice(0,10),article_summary_kind:'source-offer',
  })
 })
 return [...offers.values()]
}
