import {test} from 'node:test'
import assert from 'node:assert/strict'
import {calendarEntries,monthDates,shiftMonth} from '../lib/calendar-view'
import type {StudyPlan} from '../lib/study-plan'
const plan:StudyPlan={certification:'dp-700',examDate:'2026-10-21',time:'19:00',timezone:'Australia/Sydney',minutes:30,days:[0,1,2,3,4,5,6],reminderMinutes:10,emailRequested:false}
test('Month layout handles leap years and year boundaries',()=>{assert.equal(monthDates('2028-02').filter(Boolean).length,29);assert.equal(monthDates('2026-10').length%7,0);assert.equal(shiftMonth('2026-12',1),'2027-01')})
test('Sessions stop at exam date and exclude elapsed sessions',()=>{const events=calendarEntries([plan],'2026-10',new Date('2026-10-18T09:00:00Z'));assert.equal(events.filter(e=>e.kind==='study').length,3);assert.equal(events.filter(e=>e.kind==='exam').length,1);assert.ok(events.every(e=>e.date<='2026-10-21'))})
test('DST nonexistent local times are excluded',()=>{const events=calendarEntries([{...plan,time:'02:30',examDate:'2026-10-04'}],'2026-10',new Date('2026-10-03T20:00:00Z'));assert.equal(events.filter(e=>e.kind==='study').length,0)})
test('Different certification plans remain distinct',()=>{const events=calendarEntries([plan,{...plan,certification:'az-900'}],'2026-10',new Date('2026-10-20T00:00:00Z'));assert.deepEqual([...new Set(events.map(e=>e.certification))].sort(),['az-900','dp-700'])})
