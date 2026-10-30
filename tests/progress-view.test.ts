import assert from 'node:assert/strict'
import {examGoal,progressCard,hasPracticeCheckpoint,visibleProgressCertifications} from '../lib/progress-view'
import type {ProgressData} from '../lib/device-progress'
import type {StudyPlan} from '../lib/study-plan'
const plan:StudyPlan={certification:'dp-700',examDate:'2026-10-24',time:'19:00',timezone:'Australia/Sydney',minutes:30,days:[1,2,3,4,5],reminderMinutes:10,emailRequested:false}
assert.equal(examGoal(plan,new Date('2026-10-23T13:01:00Z')).days,0,'Sydney date, not UTC date')
assert.equal(examGoal(plan,new Date('2026-10-22T23:00:00Z')).label,'1 day to your exam goal')
assert.equal(examGoal(plan,new Date('2026-10-25T00:00:00Z')).label,'Time for a new goal')
assert.equal(examGoal({...plan,examDate:'2026-10-05'},new Date('2026-10-03T14:00:00Z')).days,1,'DST transition uses calendar days')
const domains=[{id:'one',title:'One'},{id:'two',title:'Two'}]
const data:ProgressData={saved:[{certification:'fabric-data-engineer-associate',studiedSections:['one','one','removed'],savedAt:'2026-10-01'}],attempts:[
{id:'older',certification:'dp-700',mode:'exam',section:null,answeredIds:['a'],total:1,submitted:true,score:40,correct:0,createdAt:'2026-10-01',submittedAt:'2026-10-02'},
{id:'newer',certification:'dp-700',mode:'exam',section:null,answeredIds:['a'],total:1,submitted:true,score:80,correct:1,createdAt:'2026-10-03',submittedAt:'2026-10-04'},
{id:'practice',certification:'fabric-data-engineer-associate',mode:'practice',section:'one',answeredIds:['a','b','a'],total:10,submitted:false,score:null,correct:null,createdAt:'2026-10-05',submittedAt:null}
]}
const card=progressCard('dp-700',data,domains)
assert.equal(card.reviewed,1);assert.equal(card.guidePercent,50);assert.equal(card.practiced,2);assert.equal(card.practiceAnswered,2)
assert.equal(card.mock?.score,80);assert.equal(card.next?.id,'two');assert.equal(card.attempts.length,3)
assert.equal(card.practiceHref,'/practice?certification=dp-700&section=one')
assert.equal(progressCard('dp-700',data,[]).guidePercent,null)
assert.equal(progressCard('az-900',data,domains).practiced,0,'other certification isolated')
const cleared=progressCard('dp-700',{...data,saved:[]},domains);assert.equal(cleared.saved,undefined);assert.equal(cleared.attempts.length,3,'unsaving retains history')
assert.equal(progressCard('dp-700',{saved:[],attempts:[]},domains).mock,undefined,'no attempt is not 0%')
console.log('PASS: exam countdown timezone/DST, current guide denominator, aliases, deduplication, latest mock, section resume, empty and unsaved states')

const candidate=data.attempts[2]
const checkpoint={attempt:{id:'practice',ownerUid:'owner',questions:[{id:'a'}]}}
assert.equal(hasPracticeCheckpoint({getItem:()=>null},'owner',candidate),false,'cloud history alone cannot promise resume')
assert.equal(hasPracticeCheckpoint({getItem:key=>key==='certpro.practice.v1:owner:dp-700:one'?JSON.stringify(checkpoint):null},'owner',candidate),true,'matching account, certification, topic and attempt resume')
assert.equal(hasPracticeCheckpoint({getItem:()=>JSON.stringify(checkpoint)},'different-owner',candidate),false,'another account checkpoint cannot resume')
assert.equal(hasPracticeCheckpoint({getItem:()=>JSON.stringify({...checkpoint,attempt:{...checkpoint.attempt,id:'old'}})},'owner',candidate),false,'stale attempt checkpoint cannot resume')
assert.equal(hasPracticeCheckpoint({getItem:()=>'{broken'},'owner',candidate),false,'corrupt checkpoint is ignored')
assert.equal(hasPracticeCheckpoint({getItem:()=>{throw Error('blocked')}},'owner',candidate),false,'blocked storage cannot promise resume')
assert.equal(hasPracticeCheckpoint({getItem:()=>JSON.stringify(checkpoint)},'owner',{...candidate,submitted:true}),false,'submitted practice cannot resume')
console.log('PASS: resume requires the exact account/topic/attempt checkpoint; cloud-only, stale, corrupt and blocked checkpoints are excluded')

const removed:ProgressData={...data,unsaved:[{certification:'dp-700',removedAt:'2026-10-10'}]}
assert.deepEqual(visibleProgressCertifications(data),['dp-700'],'aliases deduplicate cards')
assert.deepEqual(visibleProgressCertifications({...data,saved:[]}),['dp-700'],'history-only cards initially visible')
assert.deepEqual(visibleProgressCertifications(removed),[],'removal hides stale saved cards and history')
assert.equal(removed.attempts.length,3,'removal preserves attempts')
assert.deepEqual(visibleProgressCertifications({...removed,saved:[{...data.saved[0],savedAt:'2026-10-11'}]}),['dp-700'],'saving again restores card')
assert.deepEqual(visibleProgressCertifications({...removed,attempts:[...data.attempts,{...data.attempts[0],id:'other',certification:'az-900'}]}),['az-900'],'other certifications unaffected')
console.log('PASS: remove, reload with old history, alias matching, restore and account data isolation')
