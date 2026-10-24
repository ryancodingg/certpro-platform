import {test} from 'node:test'
import assert from 'node:assert/strict'
import {emptyProgress,mergeProgress,readProgress,recordDeviceAttempt,saveDeviceCertification} from '../lib/device-progress'
const memory=new Map<string,string>();Object.defineProperty(globalThis,'localStorage',{value:{getItem:(k:string)=>memory.get(k)||null,setItem:(k:string,v:string)=>memory.set(k,v)}});Object.defineProperty(globalThis,'window',{value:{dispatchEvent:()=>true}})
test('Saved certifications persist and use canonical aliases without crossing accounts',()=>{saveDeviceCertification('alice',{action:'save',certification:'fabric-data-engineer-associate'});assert.equal(readProgress('alice').saved[0].certification,'dp-700');assert.equal(readProgress('bob').saved.length,0);saveDeviceCertification('alice',{action:'study',certification:'dp-700',section:'section-1',completed:true});assert.deepEqual(readProgress('alice').saved[0].studiedSections,['section-1'])})
test('Practice and mock attempts record start, answers and submitted score without duplicate history rows',()=>{for(const mode of ['practice','exam'] as const){const a={id:mode,certification:'dp-700',mode,section:null,answeredIds:[],total:5,submitted:false,score:null,correct:null,createdAt:'2026-10-19T00:00:00Z',submittedAt:null};recordDeviceAttempt('alice',a);recordDeviceAttempt('alice',{...a,answeredIds:['q1'],submitted:true,score:20,correct:1,submittedAt:'2026-10-19T00:01:00Z'});}const d=readProgress('alice');assert.equal(d.attempts.length,2);assert.ok(d.attempts.every(a=>a.score===20&&a.answeredIds.length===1))})
test('Cloud and device history merge by attempt ID with server results authoritative',()=>{const local=readProgress('alice');const cloud={...emptyProgress(),attempts:[{...local.attempts[0],score:80}]};const merged=mergeProgress(local,cloud);assert.equal(merged.attempts.length,2);assert.equal(merged.attempts.find(a=>a.id===cloud.attempts[0].id)?.score,80)})

test('Unsave retains attempts, blocks stale cloud saves, and is scoped to the account',()=>{
 saveDeviceCertification('remove-test',{action:'save',certification:'dp-700'})
 const old=readProgress('remove-test')
 recordDeviceAttempt('remove-test',{id:'retained',certification:'dp-700',mode:'exam',section:null,answeredIds:['q1'],total:1,submitted:true,score:100,correct:1,createdAt:'2026-10-19T00:00:00Z',submittedAt:'2026-10-19T00:01:00Z'})
 saveDeviceCertification('remove-test',{action:'unsave',certification:'fabric-data-engineer-associate'})
 const removed=readProgress('remove-test')
 assert.equal(removed.saved.length,0);assert.equal(removed.attempts.length,1)
 assert.equal(mergeProgress(removed,old).saved.length,0)
 assert.equal(readProgress('alice').saved.length,1)
 saveDeviceCertification('remove-test',{action:'save',certification:'dp-700'})
 assert.equal(mergeProgress(readProgress('remove-test'),removed).saved.length,1)
 assert.equal(readProgress('remove-test').attempts.length,1)
})
test('Cloud archive removes older device save, and a later explicit save survives',()=>{
 const cloud={...emptyProgress(),unsaved:[{certification:'dp-700',removedAt:'2026-10-21T10:00:00Z'}]}
 const local={...emptyProgress(),saved:[{certification:'fabric-data-engineer-associate',savedAt:'2026-10-20T10:00:00Z',studiedSections:[]}]}
 assert.equal(mergeProgress(local,cloud).saved.length,0)
 local.saved[0].savedAt='2026-10-21T11:00:00Z'
 assert.equal(mergeProgress(local,cloud).saved.length,1)
})
