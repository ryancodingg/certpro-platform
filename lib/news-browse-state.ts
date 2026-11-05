import type {NewsTab} from './news-browse'
export type NewsBrowseState={tab:NewsTab;provider:string;query:string;scope:'all'|'saved'|'closing';page:number}
export function readNewsBrowseState(params:URLSearchParams,providers:readonly string[],fallback:NewsTab='news'):NewsBrowseState{
 const rawTab=params.get('tab'),tab:NewsTab=rawTab==='news'||rawTab==='events'||rawTab==='offers'?rawTab:rawTab===null?fallback:'news'
 const rawScope=params.get('scope'),scope=rawScope==='saved'?'saved':rawScope==='closing'&&tab!=='news'?'closing':'all'
 const rawPage=params.get('page')||'1',page=/^[1-9]\d*$/.test(rawPage)&&Number.isSafeInteger(Number(rawPage))?Number(rawPage):1
 const rawProvider=params.get('provider')||'All'
 return {tab,provider:providers.includes(rawProvider)?rawProvider:'All',query:(params.get('q')||'').slice(0,300),scope,page}
}
export function writeNewsBrowseState(state:NewsBrowseState,existing=new URLSearchParams()){
 const params=new URLSearchParams(existing)
 params.set('tab',state.tab)
 for(const [key,value] of [['provider',state.provider==='All'?'':state.provider],['q',state.query],['scope',state.scope==='all'?'':state.scope],['page',state.page===1?'':String(state.page)]]){if(value)params.set(key,value);else params.delete(key)}
 return params
}
// Preserve meaningful source wording. Generic placeholders add no event facts.
export function eventAttendanceDetails(item:{attendance?:string;event_format?:string;event_location?:string;event_timezone?:string}){
 const supplied=item.attendance?.trim(),attendance=supplied&&!/^Provider-wide event · confirm attendance format/i.test(supplied)?supplied:undefined
 const metadata=[item.event_format?.trim(),item.event_location?.trim(),item.event_timezone?.trim()].filter(Boolean)
 const details=metadata.join(' · ')
 return {attendance,details,fallback:!attendance&&!details?'Attendance format and location not confirmed; check organiser details.':undefined}
}
