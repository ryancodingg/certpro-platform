import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import ts from 'typescript'
import {certifications,certificationById} from '../lib/catalog'
import {continueLearning,readPracticeCheckpoint,readStudyTopic} from '../lib/continue-learning'
import {guideFor} from '../lib/exam-guide'
import {progressCertification,type ProgressData} from '../lib/device-progress'
import {visibleProgressCertifications} from '../lib/progress-view'
// Exercise the actual selector without mounting auth-dependent client UI.
const source=readFileSync('components/learner-progress.tsx','utf8')
const selector=source.slice(source.indexOf('const activityTime='),source.indexOf('\nfunction HomeContinue')) .replace('export function','function')
const code=ts.transpile(selector,{target:ts.ScriptTarget.ES2020})
const select=new Function('certifications','certificationById','continueLearning','readPracticeCheckpoint','readStudyTopic','guideFor','progressCertification','visibleProgressCertifications',code+';return homeResumeTarget')(certifications,certificationById,continueLearning,readPracticeCheckpoint,readStudyTopic,guideFor,progressCertification,visibleProgressCertifications)
const attempt=(id:string,certification:string,createdAt:string)=>({id,certification,mode:'practice' as const,total:100,answeredIds:['q1'],createdAt,updatedAt:createdAt,submitted:false})
const data:ProgressData={saved:[],attempts:[attempt('a'.repeat(32),'dp-700','2026-10-28'),attempt('b'.repeat(32),'az-900','2026-10-30')]}
assert.match(select(data,'owner').href,/az-900/)
const removed={...data,unsaved:[{certification:'az-900',removedAt:'2026-10-30T12:00:00Z'}]}
assert.match(select(removed,'owner').href,/dp-700/,'removed latest exam falls back to eligible older activity')
assert.equal(select({...removed,unsaved:[...removed.unsaved,{certification:'dp-700',removedAt:'2026-10-30T12:00:00Z'}]},'owner'),null,'all removed leaves no suggestion')
assert.match(select({...removed,saved:[{certification:'az-900',savedAt:'2026-10-31',studiedSections:[]}]},'owner').href,/az-900/,'explicit restore allows resume again')
assert.equal(data.attempts.length,2,'selection does not delete underlying history')
console.log('PASS: latest activity, removal fallback, all removed, restore, retained history')
const topicStorage={getItem:(key:string)=>key==='certpro.topic.v1:owner:az-900'?JSON.stringify({section:'',updatedAt:'2026-10-31'}):null}
assert.match(select({saved:[],attempts:[]},'owner',topicStorage).href,/az-900/,'topic-only activity is eligible')
assert.equal(select({saved:[],attempts:[],unsaved:removed.unsaved},'owner',topicStorage),null,'removed topic-only activity remains hidden')
console.log('PASS: topic-only removal and reload')
