import assert from 'node:assert/strict'
import {startRecoveryExam,recoveryExamAction} from '../lib/server/recovery-exam'
import {questionSchema,normalizeQuestion,publication,type Question} from '../lib/questions'
import recovery from '../data/published-bank-recovery.json'
const q:Question={id:'q1',certification:'test',question:'Which?',options:['A','B'],correctAnswer:1,explanation:'B is correct',topic:'test',difficulty:'Easy',questionType:'single',isActive:true,isAiGenerated:false,status:'published'}
const key='test-secret',now=10000,load=()=>[q]
const start=startRecoveryExam('user-a','test',[q],1,key,now)
assert(!JSON.stringify(start).includes('correctAnswer'))
assert(!JSON.stringify(start).includes('B is correct'))
const input={id:start.id,recoveryToken:start.recoveryToken,action:'answer',questionId:q.id,answer:1}
assert.throws(()=>recoveryExamAction(input,'user-b',key,load,now+1))
assert.throws(()=>recoveryExamAction({...input,recoveryToken:start.recoveryToken+'x'},'user-a',key,load,now+1))
assert.throws(()=>recoveryExamAction({...input,answer:9},'user-a',key,load,now+1))
const answer=recoveryExamAction(input,'user-a',key,load,now+1)
assert(!JSON.stringify(answer).includes('correctAnswer'))
const submitted=recoveryExamAction({...input,action:'submit',recoveryToken:answer.recoveryToken},'user-a',key,load,now+2)
assert.equal(submitted.result?.score,100)
assert.equal(submitted.result?.timedOut,false)
assert.throws(()=>recoveryExamAction({...input,recoveryToken:submitted.recoveryToken},'user-a',key,load,now+3))
const expired=recoveryExamAction(input,'user-a',key,load,now+60001)
assert.equal(expired.result?.timedOut,true)
assert.equal(expired.result?.score,0)
const left=recoveryExamAction({...input,action:'leave'},'user-a',key,load,now+1)
assert.equal(left.left,true)
assert.throws(()=>recoveryExamAction({...input,recoveryToken:left.recoveryToken},'user-a',key,load,now+2))
assert.throws(()=>recoveryExamAction(input,'user-a',key,()=>[],now+1))
const ids=new Set<string>();const counts:Record<string,number>={}
for(const raw of recovery.questions){const question=normalizeQuestion(raw,raw.id);questionSchema.parse(question);assert.equal(publication(question),'published');assert(!ids.has(question.id));ids.add(question.id);counts[question.certification]=(counts[question.certification]||0)+1}
console.log('PASS: signed state, account isolation, no pre-submit keys, invalid answers, deadline, leave, changed-bank and snapshot validation',counts)
