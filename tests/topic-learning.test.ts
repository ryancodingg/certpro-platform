import {test} from 'node:test'
import assert from 'node:assert/strict'
import {guideFor,questionSection} from '../lib/exam-guide'
import {certifications} from '../lib/catalog'
test('every catalog credential has sourced domains or requirements',()=>{for(const c of certifications){const g=guideFor(c.id);assert(g.domains.length,c.id);assert(g.sourceUrl.startsWith('https://'));assert(g.guideUrl.startsWith('https://'));assert.equal(new Set(g.domains.map(d=>d.id)).size,g.domains.length)}})
test('exam aliases share guides and verified current domain counts',()=>{assert.equal(guideFor('dp-700').domains.length,3);assert.equal(guideFor('az-900').domains.length,3);assert.equal(guideFor('aws-clf-c02').domains.length,4);assert.equal(guideFor('databricks-data-engineer-associate').domains.length,7)})
test('bank topics map to correct official domain and unclassified questions stay separate',()=>{assert.equal(questionSection('dp-700',{id:'a',topic:'Microsoft Fabric Security'}),'section-1');assert.equal(questionSection('dp-700',{id:'a',topic:'Data Concepts'}),'additional');assert.equal(questionSection('databricks-data-engineer-associate',{id:'a',topic:'Unity Catalog permissions'}),'section-7');assert.equal(questionSection('az-900',{id:'a',topic:'Compute'}),'section-2');assert.equal(questionSection('aws-clf-c02',{id:'a',topic:'Billing and cost'}),'section-4')})
test('owner classification accepts a valid section only',()=>{assert.equal(questionSection('az-900',{id:'a',topic:'New topic',sectionId:'section-3'}),'section-3');assert.equal(questionSection('az-900',{id:'a',topic:'New topic',sectionId:'section-90'}),'additional')})

import {progressSummary} from '../lib/progress-summary'
test('progress isolates accounts, hides answer keys, and sorts by latest submission',()=>{
 const data={uid:'alice',certification:'az-900',mode:'exam',questions:JSON.stringify([{correctAnswer:2,explanation:'secret explanation'}]),answers:'{"q1":2}',secret:'attempt-secret',createdAt:'2026-10-18T01:00:00Z',submitted:true,result:JSON.stringify({score:100,correct:1,review:[{correctAnswer:2}]})}
 const output=progressSummary([{id:'old',data:{...data,submittedAt:'2026-10-18T02:00:00Z'}},{id:'other',data:{...data,uid:'bob',submittedAt:'2026-10-18T05:00:00Z'}},{id:'latest',data:{...data,submittedAt:'2026-10-18T03:00:00Z',result:'{"score":0,"correct":0}'}}],'alice')
 assert.deepEqual(output.attempts.map(a=>a.id),['latest','old']);assert.equal(output.attempts[0].score,0);assert.equal(output.attempts[0].total,1)
 const text=JSON.stringify(output);for(const value of ['correctAnswer','secret explanation','attempt-secret','bob'])assert(!text.includes(value))
})
test('unsubmitted attempts track saved questions but have no mock score',()=>{
 const p=progressSummary([{id:'a',data:{uid:'u',certification:'az-900',mode:'exam',questions:'[{},{}]',answers:'{"one":0}',submitted:false,createdAt:'2026-10-18'}}],'u');assert.equal(p.attempts[0].score,null);assert.deepEqual(p.attempts[0].answeredIds,['one'])
})
