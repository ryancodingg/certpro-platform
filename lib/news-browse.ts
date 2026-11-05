import {isActiveNews,isActiveEvent,type NewsRecord} from './catalog'
export type NewsTab='news'|'events'|'offers'
export type NewsGroup={item:NewsRecord;related:NewsRecord[]}
export const NEWS_PAGE_SIZE=9
export function belongsToTab(item:NewsRecord,tab:NewsTab){
 if(tab==='offers')return item.type==='discount'||item.type==='event-voucher'
 if(tab==='events')return item.type.startsWith('event')
 return !item.type.startsWith('event')&&item.type!=='discount'
}
export function readableDate(value?:string|null){
 if(!value)return 'Date not announced'
 const date=new Date(value.slice(0,10)+'T12:00:00Z')
 return Number.isNaN(date.valueOf())?value:new Intl.DateTimeFormat('en-AU',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(date)
}
function eventKey(item:NewsRecord){
 // These official provider listings cover the same named event; retain their separate terms and links.
 if(/microsoft ignite/i.test(item.title))return 'microsoft-ignite-'+(item.title.match(/20\d{2}/)?.[0]||item.event_on?.slice(0,4)||item.verified_on.slice(0,4))
 if(/^Data Days:/i.test(item.title)&&item.event_on)return 'data-days-'+item.event_on
 return item.id
}
export function browseNews(items:NewsRecord[],tab:NewsTab,now=new Date()):NewsGroup[]{
 const groups=new Map<string,NewsGroup>()
 for(const item of items.filter(item=>belongsToTab(item,tab)&&isActiveNews(item,now)&&(tab!=='events'||isActiveEvent(item,now)))){
  const key=tab==='events'?eventKey(item):item.id
  const group=groups.get(key)
  if(!group)groups.set(key,{item,related:[]})
  else if(item.type==='event-voucher'&&(group.item.type!=='event-voucher'||(item.expires_on||'9999')<(group.item.expires_on||'9999'))){group.related.push(group.item);group.item=item}
  else group.related.push(item)
 }
 return [...groups.values()].sort((a,b)=>{
  if(tab==='news')return (b.item.published_on||b.item.verified_on).localeCompare(a.item.published_on||a.item.verified_on)||a.item.id.localeCompare(b.item.id)
  const date=(g:NewsGroup)=>tab==='events'?g.item.event_on||g.related.find(r=>r.event_on)?.event_on||'9999':g.item.expires_on||'9999'
  const today=now.toISOString().slice(0,10)
  const ordered=(g:NewsGroup)=>{const d=date(g);return tab==='events'&&d<today?'9998-'+d:d}
  return ordered(a).localeCompare(ordered(b))||a.item.title.localeCompare(b.item.title)
 })
}
