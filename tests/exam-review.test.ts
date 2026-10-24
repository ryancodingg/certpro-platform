import assert from 'node:assert/strict'
import {examReview,reviewMatches,nextUnanswered,examTime,reviewPreview,answerNavigation} from '../lib/exam-review'
import type {PublicQuestion} from '../lib/questions'
const base={question:'A long question',options:['First','Second'],topic:'Topic',difficulty:'Easy',certification:'cisco-ccna'}
const questions=[{...base,id:'single',questionType:'single'},{...base,id:'multi',questionType:'multiple'},{...base,id:'yesno',questionType:'yesno',statements:['One','Two']},{...base,id:'dropdown',questionType:'dropdown',dropdownQuestions:['First','Second'],dropdownOptions:[['A','B'],['C','D']]}] as PublicQuestion[]
const answer={single:0,multi:[],yesno:[false],dropdown:['A',null]}
let review=examReview(questions,answer,new Set(['dropdown','unknown']))
assert.deepEqual(review.counts,{all:4,answered:1,unanswered:3,flagged:1})
assert.deepEqual(review.unanswered.map(item=>item.number),[2,3,4])
assert.equal(review.items.filter(item=>reviewMatches(item,'flagged'))[0].index,3)
assert.equal(review.items.filter(item=>reviewMatches(item,'answered')).length,1)
assert.equal(review.items.filter(item=>reviewMatches(item,'all')).length,4)
assert.equal(nextUnanswered(questions,answer,0),1)
assert.equal(nextUnanswered(questions,answer,3),1)
const complete={single:0,multi:[0,1],yesno:[false,true],dropdown:['A','C']}
review=examReview(questions,complete,new Set());assert.equal(review.counts.unanswered,0);assert.equal(nextUnanswered(questions,complete,1),null)
assert.equal(examReview([],{},new Set()).counts.all,0);assert.equal(nextUnanswered([],{},0),null)
assert.equal(examTime(7199),'1:59:59');assert.equal(examTime(0),'0:00:00');assert.equal(examTime(null),'—')
assert.equal(reviewPreview('First\n\nsecond   third'),'First second third')
const hundred=Array.from({length:100},(_,index)=>({...questions[0],id:'q'+index}));review=examReview(hundred,{q0:0},new Set(['q99']));assert.equal(review.counts.unanswered,99);assert.equal(review.unanswered.at(-1)?.number,100);assert.equal(nextUnanswered(hundred,{q0:0},98),99)
console.log('PASS: all four answer types, answer-zero handling, incomplete drafts, status filters, original numbering, flags, wraparound navigation, all-answered/empty states, 100-question bank')

assert.equal(answerNavigation(questions[1],[],[0],'exam'),'blocked');assert.equal(answerNavigation(questions[1],[],undefined,'exam'),'keep-draft');assert.equal(answerNavigation(questions[1],[1],[0],'exam'),'save');assert.equal(answerNavigation(questions[2],[false],undefined,'exam'),'keep-draft');assert.equal(answerNavigation(questions[2],[false],undefined,'practice'),'blocked');console.log('PASS: incomplete edits cannot silently score an older saved answer; fresh drafts remain skippable');
