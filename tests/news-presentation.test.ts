import assert from 'node:assert/strict'
import {hasNewsSummary,isClosingSoon,newsTypeLabel,preserveNewsSummary,sortNewsForReading} from '../lib/news-presentation'
import type {NewsRecord} from '../lib/catalog'
const base:NewsRecord={id:'old',title:'Official exam update',summary:'A readable summary',provider:'ISC2',type:'news',source_url:'https://www.isc2.org/insights/test',verified_on:'2026-10-30',published_on:'2026-10-20',status:'published'}
const ready={...base,article_paragraphs:['Reviewed text'],article_reviewed_on:'2026-10-29'}
const pending={...base,id:'new',published_on:'2026-10-30'}
assert.equal(sortNewsForReading([pending,ready])[0].id,'old')
assert.equal(hasNewsSummary(pending),false)
assert.equal(hasNewsSummary({...pending,article_paragraphs:[' ']}),false)
assert.equal(newsTypeLabel('exam-update'),'Exam updates')
const now=new Date('2026-10-30T00:00:00Z')
assert(isClosingSoon({...base,expires_on:'2026-10-31'},now))
assert(!isClosingSoon({...base,expires_on:'2026-10-29'},now))
assert(!isClosingSoon({...base,expires_on:'2026-12-31'},now))
assert(!isClosingSoon(base,now))
assert.deepEqual(preserveNewsSummary(pending,ready).article_paragraphs,['Reviewed text'])
assert.equal(preserveNewsSummary(pending,ready).article_reviewed_on,'2026-10-29')
assert.equal(preserveNewsSummary({...pending,article_paragraphs:['New checked summary']},ready).article_paragraphs?.[0],'New checked summary')
console.log('PASS: summary readiness, stable readable-first order, readable type labels, deadline bounds and preserving prior summaries')
