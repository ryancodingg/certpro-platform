import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto'
import {publicQuestion,scoreQuestions,validAnswer,type Question} from '@/lib/questions'

type Session={v:1;id:string;uid:string;certification:string;ids:string[];deadline:number;expires:number;answers:Record<string,unknown>;closed?:boolean}
function sign(payload:string,key:string){return createHmac('sha256',key).update('certpro-recovery-exam-v1:'+payload).digest('base64url')}
function encode(s:Session,key:string){const payload=Buffer.from(JSON.stringify(s)).toString('base64url');return payload+'.'+sign(payload,key)}
function decode(token:unknown,key:string,uid:string,now:number):Session{
 if(typeof token!=='string'||token.length>250000)throw Error('Invalid temporary exam session.')
 const [payload,signature,...extra]=token.split('.');const expected=sign(payload||'',key)
 if(extra.length||!signature||signature.length!==expected.length||!timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))throw Error('Invalid temporary exam session.')
 const s=JSON.parse(Buffer.from(payload,'base64url').toString()) as Session
 if(s.v!==1||s.uid!==uid||s.expires<=now)throw Error('Temporary exam session expired or belongs to another account.')
 return s
}
export function startRecoveryExam(uid:string,certification:string,questions:Question[],minutes:number,key:string,now=Date.now()){
 const s:Session={v:1,id:randomBytes(16).toString('hex'),uid,certification,ids:questions.map(q=>q.id),deadline:now+minutes*60000,expires:now+86400000,answers:{}}
 return {id:s.id,mode:'exam',deadline:s.deadline,questions:questions.map(publicQuestion),invalid:0,recovery:true,recoveryToken:encode(s,key)}
}
export function recoveryExamAction(input:{id:string;action:string;recoveryToken:unknown;questionId?:string;answer?:unknown},uid:string,key:string,load:(certification:string)=>Question[],now=Date.now()){
 const s=decode(input.recoveryToken,key,uid,now)
 if(s.id!==input.id||s.closed)throw Error('This temporary exam has ended.')
 const bank=new Map(load(s.certification).map(q=>[q.id,q]));const questions=s.ids.map(id=>bank.get(id))
 if(questions.some(q=>!q))throw Error('The published bank changed. Start a new exam.')
 const all=questions as Question[];const expired=now>=s.deadline
 if(input.action==='leave'){s.closed=true;return {left:true,recoveryToken:encode(s,key)}}
 if(input.action==='answer'&&!expired){const q=bank.get(input.questionId||'');if(!q||!s.ids.includes(q.id)||!validAnswer(q,input.answer))throw Error('Complete every required answer before saving.');s.answers[q.id]=input.answer;return {saved:true,recoveryToken:encode(s,key)}}
 if(input.action!=='submit'&&!expired)throw Error('Invalid temporary exam action.')
 s.closed=true;return {result:{...scoreQuestions(all,s.answers),timedOut:expired},recoveryToken:encode(s,key)}
}
