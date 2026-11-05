import assert from 'node:assert/strict'
import {readNewsBrowseState,writeNewsBrowseState,eventAttendanceDetails} from '../lib/news-browse-state'
const providers=['Microsoft','Google Cloud']
const saved={tab:'events' as const,provider:'Google Cloud',query:'cloud & security',scope:'closing' as const,page:3}
const url=writeNewsBrowseState(saved,new URLSearchParams('campaign=autumn'))
assert.deepEqual(readNewsBrowseState(new URLSearchParams(url.toString()),providers),saved)
assert.equal(url.get('campaign'),'autumn')
for(const page of ['-1','0','1.2','Infinity','NaN','9007199254740992','1e3'])assert.equal(readNewsBrowseState(new URLSearchParams({page}),providers).page,1)
assert.deepEqual(readNewsBrowseState(new URLSearchParams('tab=bad&provider=unknown&scope=bad&page=-1'),providers),{tab:'news',provider:'All',query:'',scope:'all',page:1})
assert.equal(readNewsBrowseState(new URLSearchParams('tab=news&scope=closing'),providers).scope,'all')
assert.equal(readNewsBrowseState(new URLSearchParams('scope=saved'),providers).scope,'saved')
assert.equal(readNewsBrowseState(new URLSearchParams({q:'x'.repeat(400)}),providers).query.length,300)
const reset=writeNewsBrowseState({...saved,provider:'All',scope:'all',query:'',page:1},url)
for(const key of ['provider','scope','q','page'])assert.equal(reset.has(key),false)
// History entries round-trip independently, including back/forward restoration.
for(const state of [saved,{...saved,tab:'offers' as const,page:1},{...saved,query:'exam',page:2}])assert.deepEqual(readNewsBrowseState(writeNewsBrowseState(state),providers),state)
const known=eventAttendanceDetails({attendance:'In-person only · San Francisco'})
assert.equal(known.attendance,'In-person only · San Francisco');assert.equal(known.details,'');assert.equal(known.fallback,undefined)
const unknown=eventAttendanceDetails({attendance:'Provider-wide event · confirm attendance format with the organiser'})
assert.equal(unknown.attendance,undefined);assert.equal(unknown.details,'');assert.equal(unknown.fallback,'Attendance format and location not confirmed; check organiser details.')
const explicit=eventAttendanceDetails({event_format:'Hybrid',event_location:'Sydney',event_timezone:'Australia/Sydney'})
assert.equal(explicit.details,'Hybrid · Sydney · Australia/Sydney');assert.equal(explicit.fallback,undefined)
assert.equal('voucher' in known,false)
console.log('PASS: browse URL round trips, invalid parameters, reset, history states, and factual event details without inferred benefits')
