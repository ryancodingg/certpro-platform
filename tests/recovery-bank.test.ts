import {test} from 'node:test'
import assert from 'node:assert/strict'
import {bankUnavailable,recoveredBank} from '../lib/recovery-bank'
import {freeQuestions} from '../lib/learning-access'
import {questionSection} from '../lib/exam-guide'
import {publicQuestion,scoreQuestions} from '../lib/questions'
test('Recovery includes only previously published valid questions',()=>{for(const [id,count] of [['aws-clf-c02',100],['az-900',100],['databricks-data-engineer-associate',20]] as const){const b=recoveredBank(id);assert.equal(b.questions.length,count);assert.equal(b.invalid,0);assert.ok(b.questions.every(q=>q.certification===id&&q.isActive!==false))}assert.equal(recoveredBank('unknown').questions.length,0)})
test('Outage practice respects five-question topic cap and hides keys in public questions',()=>{const eligible=freeQuestions('aws-clf-c02',recoveredBank('aws-clf-c02').questions);const counts=new Map<string,number>();for(const q of eligible){const section=questionSection('aws-clf-c02',q);counts.set(section,(counts.get(section)||0)+1);assert.ok(!('correctAnswer' in publicQuestion(q)))}assert.ok([...counts.values()].every(n=>n<=5));assert.equal(scoreQuestions(eligible,{}).score,0)})
test('Recovery applies to availability/quota failures, never permissions or malformed credentials',()=>{for(const code of [8,14,'RESOURCE_EXHAUSTED','UNAVAILABLE'])assert.equal(bankUnavailable({code}),true);for(const code of [7,16,'PERMISSION_DENIED','UNAUTHENTICATED',undefined])assert.equal(bankUnavailable({code}),false)})
