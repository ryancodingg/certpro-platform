import {z} from 'zod'
export const studyPlanSchema=z.object({certification:z.string().regex(/^[a-z0-9-]{1,100}$/),examDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>{const d=new Date(v+'T12:00:00Z');return Number.isFinite(d.valueOf())&&d.toISOString().slice(0,10)===v},'Choose a valid date'),time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),timezone:z.string().max(80).refine(v=>{try{new Intl.DateTimeFormat('en',{timeZone:v});return true}catch{return false}},'Choose a valid timezone'),minutes:z.number().int().min(5).max(480),days:z.array(z.number().int().min(0).max(6)).min(1).max(7).transform(v=>[...new Set(v)].sort()),reminderMinutes:z.union([z.literal(0),z.literal(10),z.literal(30),z.literal(60)]),emailRequested:z.boolean(),inAppReminders:z.boolean().optional()})
export type StudyPlan=z.infer<typeof studyPlanSchema>
export function localDate(now:Date,timezone:string){return new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(now)}
// Convert a civil time to UTC by matching IANA-zone parts; skip nonexistent spring-forward times.
export function studyInstant(date:string,time:string,timezone:string):Date|null{
 const target=Date.parse(date+'T'+time+':00Z');let stamp=target
 const fmt=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'})
 for(let i=0;i<4;i++){const p=Object.fromEntries(fmt.formatToParts(stamp).map(p=>[p.type,p.value]));const civil=Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);const delta=target-civil;if(!delta)return new Date(stamp);stamp+=delta}return null
}
export function sessions(plan:StudyPlan,now=new Date(),daysAhead=90){const start=localDate(now,plan.timezone);const result:Date[]=[];for(let i=0;i<daysAhead;i++){const d=new Date(start+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+i);const date=d.toISOString().slice(0,10);if(date>plan.examDate)break;if(plan.days.includes(d.getUTCDay())){const instant=studyInstant(date,plan.time,plan.timezone);if(instant&&instant>=now)result.push(instant)}}return result}
function escape(s:string){return s.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;')}
function stamp(d:Date){return d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z/,'Z')}
function fold(line:string){let out='',part='';for(const c of line){if(new TextEncoder().encode(part+c).length>73){out+=part+'\r\n ';part=''}part+=c}return out+part}
export function studyCalendar(plan:StudyPlan,title:string,calendarId:string,now=new Date()){
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//CertPro//Study Calendar//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:CertPro study plan']
 for(const d of sessions(plan,now)){lines.push('BEGIN:VEVENT',`UID:${calendarId}-${stamp(d)}@certpro.vercel.app`,`DTSTAMP:${stamp(now)}`,`DTSTART:${stamp(d)}`,`DTEND:${stamp(new Date(d.valueOf()+plan.minutes*60000))}`,`SUMMARY:${escape('Study: '+title)}`,`DESCRIPTION:${escape(`${plan.minutes}-minute learning goal. Practical Mode and Mock Exams: https://certpro.vercel.app/certification/${plan.certification}`)}`,'BEGIN:VALARM','ACTION:DISPLAY',`TRIGGER:-PT${plan.reminderMinutes}M`,'DESCRIPTION:Time to learn with CertPro','END:VALARM','END:VEVENT')}
 const end=new Date(plan.examDate+'T12:00:00Z');end.setUTCDate(end.getUTCDate()+1)
 lines.push('BEGIN:VEVENT',`UID:${calendarId}-exam@certpro.vercel.app`,`DTSTAMP:${stamp(now)}`,`DTSTART;VALUE=DATE:${plan.examDate.replaceAll('-','')}`,`DTEND;VALUE=DATE:${end.toISOString().slice(0,10).replaceAll('-','')}`,`SUMMARY:${escape('Target exam date: '+title)}`,'DESCRIPTION:Personal target only. This does not book an official exam.','BEGIN:VALARM','ACTION:DISPLAY','TRIGGER:-P1D','DESCRIPTION:Your target exam date is tomorrow','END:VALARM','END:VEVENT','END:VCALENDAR')
 return lines.map(fold).join('\r\n')+'\r\n'
}
