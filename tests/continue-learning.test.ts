import assert from 'node:assert/strict'
import {continueLearning,practiceResumeState,readPracticeCheckpoint,rememberStudyTopic,readStudyTopic} from '../lib/continue-learning'
import {checkpointKey} from '../lib/learning-memory'
import {mergeProgress,type ProgressData} from '../lib/device-progress'
import type {PublicQuestion} from '../lib/questions'
const domains=[{id:'one',title:'First topic'},{id:'two',title:'Second topic'}]
const attempt=(id:string,extra:Partial<ProgressData['attempts'][number]>={}):ProgressData['attempts'][number]=>({id:id.repeat(32),certification:'dp-700',mode:'practice',section:'one',answeredIds:['q1'],total:3,submitted:false,score:null,correct:null,createdAt:'2026-10-20T00:00:00Z',submittedAt:null,...extra})
const data=(attempts:ProgressData['attempts']=[],studiedSections:string[]=[]):ProgressData=>({saved:[{certification:'dp-700',studiedSections,savedAt:'2026-10-20'}],attempts})
const old=attempt('a'),recent=attempt('b',{section:'two',updatedAt:'2026-10-22T00:00:00Z'}),submitted=attempt('c',{submitted:true,submittedAt:'2026-10-23T00:00:00Z'})
let target=continueLearning('dp-700',data([old,recent,submitted]),domains)
assert.equal(target.attempt?.id,recent.id);assert(target.href.includes('section=two'));assert(target.href.includes('resume='+recent.id));assert(target.href.startsWith('/practice?'))
assert.equal(continueLearning('dp-700',data([attempt('a',{answeredIds:[]})]),domains).attempt?.id,old.id)
for(const extra of [{mode:'exam' as const},{abandoned:true},{submitted:true},{deviceOnly:true},{certification:'az-900'}])assert.equal(continueLearning('dp-700',data([attempt('a',extra)]),domains).attempt,undefined)
assert.equal(continueLearning('dp-700',data([attempt('a',{deviceOnly:true})]),domains,{[old.id]:{}}).attempt?.id,old.id)
assert.equal(continueLearning('dp-700',data([old,recent]),domains,{[old.id]:{updatedAt:'2026-10-23T00:00:00Z'}}).attempt?.id,old.id)
assert.equal(continueLearning('dp-700',data([],['one']),domains).section,'two')
assert.equal(continueLearning('dp-700',data([],['one','two']),domains).section,'')
assert.equal(continueLearning('dp-700',data([old]),domains,{}, {section:'two',updatedAt:'2026-10-24T00:00:00Z'}).section,'two')
assert.equal(continueLearning('dp-700',data([old]),domains,{}, {section:'invalid',updatedAt:'2026-10-24T00:00:00Z'}).attempt?.id,old.id)
const merged=mergeProgress(data([attempt('a',{updatedAt:'2026-10-24',answeredIds:['q1','q2']})]),data([old]));assert.equal(merged.attempts[0].updatedAt,'2026-10-24');assert.deepEqual(merged.attempts[0].answeredIds,['q1'])
const entries=new Map<string,string>(),storage={getItem:(key:string)=>entries.get(key)||null,setItem:(key:string,value:string)=>{entries.set(key,value)}}
rememberStudyTopic(storage,'alice','dp-700','two');assert.equal(readStudyTopic(storage,'alice','dp-700')?.section,'two');assert.equal(readStudyTopic(storage,'bob','dp-700'),undefined)
const questions=['q1','q2','q3'].map(id=>({id,question:id,options:['A','B'],questionType:'single'})) as PublicQuestion[]
const checkpoint={attempt:{id:old.id,ownerUid:'alice',questions},index:2,answers:{q1:0,q3:1,unknown:1},saved:{q1:0},feedback:{}}
storage.setItem(checkpointKey('alice','dp-700','one'),JSON.stringify(checkpoint))
assert.equal(readPracticeCheckpoint(storage,'alice','dp-700','one',old.id)?.index,2);assert.equal(readPracticeCheckpoint(storage,'bob','dp-700','one',old.id),undefined);assert.equal(readPracticeCheckpoint(storage,'alice','dp-700','two',old.id),undefined);assert.equal(readPracticeCheckpoint(storage,'alice','dp-700','one',recent.id),undefined)
let restored=practiceResumeState(questions,{q1:1},{q1:{correct:false},unknown:{}},checkpoint)
assert.equal(restored.index,2);assert.deepEqual(restored.answers,{q1:1,q3:1});assert.deepEqual(Object.keys(restored.feedback),['q1'])
assert.equal(practiceResumeState(questions,{q1:1},{},undefined).index,1)
assert.equal(practiceResumeState(questions,{q1:1,q2:0,q3:1},{},undefined).index,2)
assert.equal(practiceResumeState(questions.slice(0,2),{q1:1},{},checkpoint).index,1)
assert.equal(practiceResumeState([...questions].reverse(),{q1:1},{},checkpoint).index,0)
console.log('PASS: latest unfinished practice, topic fallback, canonical links, account/topic isolation, exact position and drafts, cloud-first unanswered, authoritative checked answers')
