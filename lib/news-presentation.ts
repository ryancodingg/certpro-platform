import type {NewsRecord} from './catalog'
export const newsTypeLabel=(type:string)=>({news:'News',discount:'Discounts',retirement:'Exam retirements','catalog-update':'Catalog updates','exam-update':'Exam updates',beta:'Beta exams'}[type]||type.replace(/-/g,' '))
export const hasNewsSummary=(item:NewsRecord)=>!!item.article_paragraphs?.some(p=>p.trim())
export function newsDeadline(item:NewsRecord){return item.expires_on||item.event_on||null}
export function isClosingSoon(item:NewsRecord,now=new Date()){
 const date=newsDeadline(item)
 if(!date||!/^\d{4}-\d{2}-\d{2}$/.test(date))return false
 const end=Date.parse(date+'T23:59:59Z')
 return Number.isFinite(end)&&new Date(end).toISOString().slice(0,10)===date&&end>=now.valueOf()&&end-now.valueOf()<=30*86400000
}
export function sortNewsForReading(items:NewsRecord[],closingSoon=false){
 return [...items].sort((a,b)=>closingSoon?(newsDeadline(a)||'9999').localeCompare(newsDeadline(b)||'9999'):Number(hasNewsSummary(b))-Number(hasNewsSummary(a))||(b.published_on||b.verified_on).localeCompare(a.published_on||a.verified_on)||a.id.localeCompare(b.id))
}
// A temporarily incomplete refresh must not erase a previously readable article.
export function preserveNewsSummary(item:NewsRecord,previous?:NewsRecord):NewsRecord{
 if(hasNewsSummary(item)||!previous||!hasNewsSummary(previous))return item
 return {...item,summary:previous.summary,article_paragraphs:previous.article_paragraphs,...(previous.article_generated_on?{article_generated_on:previous.article_generated_on}:{}),...(previous.article_reviewed_on?{article_reviewed_on:previous.article_reviewed_on}:{}),...(previous.article_summary_kind?{article_summary_kind:previous.article_summary_kind}:{})}
}
