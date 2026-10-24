import {certificationById,isActiveNews,type NewsRecord} from './catalog'
import {localDate,studyInstant,type StudyPlan} from './study-plan'
export type StudyNotification={id:string;title:string;body:string;href:string;date:string;kind:'study'|'exam'|'news'}
export function studyNotifications(plans:StudyPlan[],saved:{certification:string;savedAt:string}[],news:NewsRecord[],now:Date,newsEnabled=true):StudyNotification[]{
 const items:StudyNotification[]=[]
 for(const p of plans){if(!p.inAppReminders)continue
  const today=localDate(now,p.timezone),name=certificationById(p.certification)?.name||p.certification
  const days=Math.round((Date.parse(p.examDate)-Date.parse(today))/86400000)
  if([0,1,7].includes(days))items.push({id:`exam:${p.certification}:${p.examDate}:${days}`,title:days===0?'Your target exam date is today':`Exam target in ${days} day${days===1?'':'s'}`,body:name,href:'/certification/'+p.certification,date:today,kind:'exam'})
  if(today>p.examDate||!p.days.includes(new Date(today+'T12:00:00Z').getUTCDay()))continue
  const instant=studyInstant(today,p.time,p.timezone)
  if(instant&&now.valueOf()>=instant.valueOf()-p.reminderMinutes*60000)items.push({id:`study:${p.certification}:${today}:${p.time}`,title:`Time for ${p.minutes} minutes of learning`,body:name+' · '+p.time+' ('+p.timezone+')',href:'/certification/'+p.certification,date:today,kind:'study'})
 }
 if(newsEnabled)for(const n of news){if(!isActiveNews(n,now))continue;const date=n.published_on||n.verified_on
  if(!date||date>now.toISOString().slice(0,10)||now.valueOf()-Date.parse(date)>30*86400000)continue
  const relevant=saved.some(s=>{const c=certificationById(s.certification);return c?.provider===n.provider&&date>=s.savedAt.slice(0,10)})
  if(relevant)items.push({id:'news:'+n.id,title:n.title,body:n.provider+' update related to your saved certifications',href:'/news/'+n.id,date,kind:'news'})
 }
 return items.sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id)).slice(0,50)
}
