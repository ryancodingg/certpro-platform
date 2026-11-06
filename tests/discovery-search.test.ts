import assert from 'node:assert/strict'
import {matchesDiscoverySearch} from '../lib/discovery-search'
const articles=[['New GitHub credential','Details','Microsoft'],['Microsoft update','Certification announcement','Microsoft'],['AWS changes','Updated exams','AWS']]
const results=(query:string)=>articles.filter(fields=>matchesDiscoverySearch(fields,query))
assert.deepEqual(results(' Microsoft '),results('Microsoft'))
assert.deepEqual(results('\nMICROSOFT\t'),results('Microsoft'))
assert.equal(results(' ').length,3)
assert.equal(results('not-a-real-exam').length,0)
assert.equal(matchesDiscoverySearch(['Fabric Data Engineer','DP-700'],' dp-700 '),true)
console.log('PASS: padded, case-insensitive, empty and unmatched discovery searches')
