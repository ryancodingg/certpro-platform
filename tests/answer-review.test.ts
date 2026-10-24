import assert from 'node:assert/strict'
import {answerReview, answerStatus, initialAnswerFilter, partAnswer, type ReviewItem} from '../lib/answer-review'
import {scoreQuestions, type Question} from '../lib/questions'
const base: Question = {id:'one', certification:'cisco-ccna', question:'A question?', questionType:'single', options:['Alpha','Beta'], correctAnswer:0, explanation:'Explanation', topic:'Networking', difficulty:'Easy', isActive:true,isAiGenerated:false}
const questions: Question[] = [
 {...base},
 {...base,id:'two',questionType:'multiple',correctAnswer:[0,1]},
 {...base,id:'three',questionType:'yesno',statements:['First','Second'],correctAnswer:[false,true]},
 {...base,id:'four',questionType:'dropdown',dropdownQuestions:['Operation','Next'],dropdownOptions:[['GET','POST'],['Yes','No']],correctAnswer:['GET','Yes']},
]
const result=scoreQuestions(questions,{one:0,two:[1],three:[false,true]})
assert.deepEqual(answerReview(result.review).counts,{all:4,correct:2,incorrect:1,unanswered:1})
assert.equal(initialAnswerFilter(result.review),'incorrect')
assert.equal(initialAnswerFilter([{...result.review[0],answer:null,correct:false}]),'unanswered')
assert.equal(initialAnswerFilter([result.review[0]]),'all');assert.equal(initialAnswerFilter([]),'all')
assert.equal(answerStatus({...result.review[2],answer:[false]}),'unanswered')
assert.equal(answerStatus({...result.review[1],answer:[]}), 'unanswered')
assert.equal(answerStatus({...result.review[3],answer:['GET',null]}),'unanswered')
assert.equal(partAnswer(result.review[2],[false,true],0),'No')
assert.equal(partAnswer(result.review[2],[null,true],0),'Unanswered')
assert.equal(partAnswer(result.review[3],['GET'],1),'Unanswered')
assert.equal(partAnswer(result.review[3],['GET','No'],1),'No')
const many=Array.from({length:100},(_,i)=>({...base,id:`q${i}`,answer:i<2?i:null,correct:i===0})) as ReviewItem[]
const review=answerReview(many)
assert.deepEqual(review.counts,{all:100,correct:1,incorrect:1,unanswered:98})
assert.equal(review.numbered.filter(x=>x.status==='incorrect')[0].number,2)
assert.equal(review.numbered.filter(x=>x.status==='unanswered')[97].number,100)
assert.deepEqual(answerReview([]).counts,{all:0,correct:0,incorrect:0,unanswered:0})
console.log('PASS: submitted score classification for all formats, zero/false answers, incomplete responses, original numbering, default filters and 100-question counts')
