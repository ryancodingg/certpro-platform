import {test} from 'node:test'
import assert from 'node:assert/strict'
import {studyCertification,studyPlanHref,matchingStudyPlan,safeReturnPath} from '../lib/study-context'
import type {StudyPlan} from '../lib/study-plan'

test('Certification context uses a known bank alias and rejects unknown input',()=>{
 assert.equal(studyCertification('fabric-data-engineer-associate'),'dp-700')
 assert.equal(studyCertification('az-900'),'az-900')
 assert.equal(studyCertification('not-an-exam'),null)
 assert.equal(studyPlanHref('fabric-data-engineer-associate'),'/study-plan?certification=dp-700')
})
test('Saved plans match canonical certification and never cross into another exam',()=>{
 const plan={certification:'dp-700',examDate:'2026-11-01'} as StudyPlan
 assert.equal(matchingStudyPlan([plan],'fabric-data-engineer-associate'),plan)
 assert.equal(matchingStudyPlan([plan],'azure-fundamentals'),undefined)
 assert.equal(matchingStudyPlan([plan],'unknown'),undefined)
})
test('Sign-in return paths stay on site and preserve certification context',()=>{
 assert.equal(safeReturnPath('/study-plan?certification=dp-700'),'/study-plan?certification=dp-700')
 for(const value of [null,'https://evil.example','//evil.example','/\\evil.example','/%2fevil.example','/%5cevil.example','/\nevil.example','/auth/login?next=/auth/login','/%ZZ'])assert.equal(safeReturnPath(value),'/',String(value))
})
