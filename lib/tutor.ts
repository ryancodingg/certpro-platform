import type {Question} from './questions'
export const tutorModes=['explain','simplify','example'] as const
export function checkedPracticeQuestion(attempt:any,uid:string,questionId:string,now=Date.now()):{question:Question;answer:unknown}{
 if(!attempt||attempt.uid!==uid)throw Error('This practice attempt belongs to another account.')
 if(attempt.mode!=='practice')throw Error('The learning assistant is available only in Practical Mode.')
 if(attempt.expiresAt<=now)throw Error('This practice attempt has expired. Start a new practice session.')
 const answers=JSON.parse(attempt.answers||'{}');const question:Question|undefined=JSON.parse(attempt.questions||'[]').find((q:Question)=>q.id===questionId)
 if(!question||!Object.prototype.hasOwnProperty.call(answers,questionId))throw Error('Check your answer before asking the learning assistant.')
 return {question,answer:answers[questionId]}
}
export function tutorContext(q:Question,answer:unknown){return {question:q.question,scenario:q.scenario,code:q.codeSnippet,type:q.questionType,options:q.options,statements:q.statements,dropdownQuestions:q.dropdownQuestions,dropdownOptions:q.dropdownOptions,correctAnswer:q.correctAnswer,learnerAnswer:answer,bankExplanation:q.explanation,topic:q.topic}}
