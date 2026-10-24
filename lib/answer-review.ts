import {validAnswer, type Question} from './questions'

export type ReviewItem = Question & {answer: unknown; correct: boolean}
export type ReviewStatus = 'correct' | 'incorrect' | 'unanswered'
export type AnswerFilter = ReviewStatus | 'all'
export type NumberedReview = {item: ReviewItem; number: number; status: ReviewStatus}

export function answerStatus(item: ReviewItem): ReviewStatus {
  if (!validAnswer(item, item.answer)) return 'unanswered'
  return item.correct ? 'correct' : 'incorrect'
}
export function answerReview(items: ReviewItem[]) {
  const counts = {all: items.length, correct: 0, incorrect: 0, unanswered: 0}
  const numbered = items.map((item, index) => {
    const status = answerStatus(item)
    counts[status]++
    return {item, number: index + 1, status}
  })
  return {numbered, counts}
}
export function initialAnswerFilter(items: ReviewItem[]): AnswerFilter {
  const {counts} = answerReview(items)
  return counts.incorrect ? 'incorrect' : counts.unanswered ? 'unanswered' : 'all'
}
/** Treat a missing part as unanswered, including false/zero as valid selections. */
export function partAnswer(item: ReviewItem, value: unknown, index: number): string {
  const part = Array.isArray(value) ? value[index] : undefined
  if (item.questionType === 'yesno') return typeof part === 'boolean' ? (part ? 'Yes' : 'No') : 'Unanswered'
  return typeof part === 'string' && item.dropdownOptions?.[index]?.includes(part) ? part : 'Unanswered'
}
