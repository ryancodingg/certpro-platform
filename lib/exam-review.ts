import {validAnswer,type PublicQuestion} from './questions'
export type ReviewFilter='unanswered'|'answered'|'flagged'|'all'
export function examReview(questions:PublicQuestion[],answers:Record<string,unknown>,flagged:ReadonlySet<string>){
 const items=questions.map((question,index)=>({question,index,number:index+1,answered:validAnswer(question,answers[question.id]),flagged:flagged.has(question.id)}))
 const unanswered=items.filter(item=>!item.answered),answered=items.filter(item=>item.answered),marked=items.filter(item=>item.flagged)
 return {items,unanswered,answered,flagged:marked,counts:{all:items.length,unanswered:unanswered.length,answered:answered.length,flagged:marked.length}}
}
export function reviewMatches(item:{answered:boolean;flagged:boolean},filter:ReviewFilter){return filter==='all'||(filter==='unanswered'?!item.answered:filter==='answered'?item.answered:item.flagged)}
export function nextUnanswered(questions:PublicQuestion[],answers:Record<string,unknown>,current:number){
 for(let step=1;step<=questions.length;step++){const index=(current+step)%questions.length;if(!validAnswer(questions[index],answers[questions[index].id]))return index}
 return null
}
export function reviewPreview(text:string){return text.replace(/\s+/g,' ').trim()}
export function examTime(seconds:number|null){if(seconds===null)return '—';return [Math.floor(seconds/3600),Math.floor(seconds%3600/60),seconds%60].map((v,i)=>i?String(v).padStart(2,'0'):String(v)).join(':')}

export function answerNavigation(question:PublicQuestion,draft:unknown,saved:unknown,mode:'practice'|'exam'){
 if(validAnswer(question,draft))return 'save'
 return mode==='practice'||validAnswer(question,saved)?'blocked':'keep-draft'
}
