import {localDate,studyInstant,type StudyPlan} from './study-plan'
export type CalendarEntry={date:string;certification:string;kind:'study'|'exam';minutes:number;time:string;timezone:string}
export function monthDates(month:string):(string|null)[]{
 const start=new Date(month+'-01T12:00:00Z'),offset=start.getUTCDay()
 const count=new Date(start.getUTCFullYear(),start.getUTCMonth()+1,0).getDate()
 const cells:(string|null)[]=Array(offset).fill(null)
 for(let day=1;day<=count;day++)cells.push(month+'-'+String(day).padStart(2,'0'))
 while(cells.length%7)cells.push(null)
 return cells
}
export function calendarEntries(plans:StudyPlan[],month:string,now:Date):CalendarEntry[]{
 const entries:CalendarEntry[]=[]
 for(const p of plans){
  for(const date of monthDates(month)){
   if(!date||date>p.examDate||date<localDate(now,p.timezone))continue
   if(date===p.examDate)entries.push({date,certification:p.certification,kind:'exam',minutes:0,time:'',timezone:p.timezone})
   if(p.days.includes(new Date(date+'T12:00:00Z').getUTCDay())){
    const instant=studyInstant(date,p.time,p.timezone)
    if(instant&&instant>=now)entries.push({date,certification:p.certification,kind:'study',minutes:p.minutes,time:p.time,timezone:p.timezone})
   }
  }
 }
 return entries.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))
}
export function shiftMonth(month:string,delta:number){const d=new Date(month+'-01T12:00:00Z');d.setUTCMonth(d.getUTCMonth()+delta);return d.toISOString().slice(0,7)}
