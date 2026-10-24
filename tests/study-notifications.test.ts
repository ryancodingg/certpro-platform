import assert from 'node:assert/strict'
import {studyNotifications} from '../lib/study-notifications'
import {studyPlanSchema} from '../lib/study-plan'
import {certificationById} from '../lib/catalog'
const now=new Date('2026-10-21T08:55:00Z')
const plan=studyPlanSchema.parse({certification:'dp-700',examDate:'2026-10-28',time:'20:00',timezone:'Australia/Sydney',minutes:30,days:[3],reminderMinutes:10,emailRequested:false,inAppReminders:true})
let list=studyNotifications([plan],[],[],now)
assert.equal(list.filter(n=>n.kind==='study').length,1)
assert.equal(list.filter(n=>n.kind==='exam').length,1)
assert.equal(studyNotifications([{...plan,inAppReminders:false}],[],[],now).length,0)
assert.equal(studyNotifications([plan],[],[],new Date('2026-10-21T08:40:00Z')).filter(n=>n.kind==='study').length,0)
assert.equal(studyNotifications([plan],[],[],new Date('2026-10-29T10:00:00Z')).length,0)
const news={id:'update',provider:certificationById('dp-700')!.provider,title:'Exam update',summary:'Details',type:'news',source_url:'https://learn.microsoft.com',published_on:'2026-10-20',verified_on:'2026-10-20',status:'published'}
const saved=[{certification:'dp-700',savedAt:'2026-10-01T00:00:00Z'}]
assert.equal(studyNotifications([],saved,[news],now).length,1)
assert.equal(studyNotifications([],saved,[news],now,false).length,0)
assert.equal(studyNotifications([],[],[news],now).length,0)
assert.equal(studyNotifications([],saved,[{...news,provider:'Cisco'}],now).length,0)
assert.equal(studyNotifications([],saved,[{...news,published_on:'2026-10-22'}],now).length,0)
assert.equal(studyNotifications([],saved,[{...news,expires_on:'2026-10-19'}],now).length,0)
assert.deepEqual(studyNotifications([plan],saved,[news],now).map(n=>n.id),studyNotifications([plan],saved,[news],now).map(n=>n.id))
assert.equal(studyPlanSchema.parse({...plan,inAppReminders:undefined}).inAppReminders,undefined)
console.log('PASS: timezone-aware study alerts, exam milestones, consent, stable IDs, saved-provider news, future/expired exclusions and legacy plans')
