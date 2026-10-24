'use client'
import {useRef, useState} from 'react'
import {ArrowLeft, ArrowRight, Check, X, Minus, BookOpen, ExternalLink} from 'lucide-react'
import {QuestionText} from './question-text'
import {answerReview, initialAnswerFilter, partAnswer, type AnswerFilter, type ReviewStatus, type ReviewItem} from '@/lib/answer-review'
import styles from './answer-review.module.css'
export type {ReviewItem} from '@/lib/answer-review'

const PAGE_SIZE = 6
const labels = {correct: 'Correct', incorrect: 'Incorrect', unanswered: 'Unanswered', all: 'All questions'}
const filters: AnswerFilter[] = ['incorrect', 'unanswered', 'correct', 'all']
function StatusIcon({status}: {status: ReviewStatus}) {
  const Icon = status === 'correct' ? Check : status === 'incorrect' ? X : Minus
  return <Icon size={16} aria-hidden="true"/>
}

function AnswerComparison({item}: {item: ReviewItem}) {
  if (item.questionType === 'yesno' || item.questionType === 'dropdown') {
    const prompts = item.questionType === 'yesno' ? item.statements : item.dropdownQuestions
    return <div className={styles.parts}>{prompts?.map((prompt, index) => {
      const yours = partAnswer(item, item.answer, index), correct = partAnswer(item, item.correctAnswer, index)
      const state: ReviewStatus = yours === 'Unanswered' ? 'unanswered' : yours === correct ? 'correct' : 'incorrect'
      return <div className={styles.part} key={index}><p>{prompt}</p><div className={styles.comparison}>
        <div className={styles[state]}><span>Your answer · {labels[state]}</span><strong>{yours}</strong></div>
        <div className={styles.correct}><span>Correct answer</span><strong>{correct}</strong></div>
      </div></div>
    })}</div>
  }
  const selected: unknown[] = item.questionType === 'multiple' ? (Array.isArray(item.answer) ? item.answer : []) : [item.answer]
  const key: unknown[] = Array.isArray(item.correctAnswer) ? item.correctAnswer : [item.correctAnswer]
  return <ul className={styles.choices}>{item.options.map((option, index) => {
    const chosen = selected.includes(index), correct = key.includes(index)
    const state = correct ? styles.correct : chosen ? styles.incorrect : ''
    return <li key={index} className={state}><span className={styles.choiceLetter}>{String.fromCharCode(65 + index)}</span><div><p>{option}</p><div className={styles.choiceLabels}>
      {chosen && <span>{correct ? <Check size={14} aria-hidden="true"/> : <X size={14} aria-hidden="true"/>}Your answer</span>}
      {correct && <span><Check size={14} aria-hidden="true"/>Correct answer{!chosen ? ' · not selected' : ''}</span>}
    </div></div></li>
  })}</ul>
}

export function AnswerReview({items}: {items: ReviewItem[]}) {
  const review = answerReview(items)
  const [filter, setFilter] = useState<AnswerFilter>(() => initialAnswerFilter(items))
  const [position, setPosition] = useState(0)
  const heading = useRef<HTMLHeadingElement>(null), listHeading = useRef<HTMLHeadingElement>(null)
  const matching = review.numbered.filter(row => filter === 'all' || row.status === filter)
  const selectedIndex = Math.min(position, Math.max(0, matching.length - 1)), selected = matching[selectedIndex]
  const page = Math.floor(selectedIndex / PAGE_SIZE), pages = Math.max(1, Math.ceil(matching.length / PAGE_SIZE))
  const visible = matching.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  function chooseFilter(next: AnswerFilter) {setFilter(next); setPosition(0)}
  function chooseQuestion(next: number) {setPosition(next); requestAnimationFrame(() => {heading.current?.focus(); heading.current?.scrollIntoView({block: 'nearest', behavior: 'instant'})})}
  function turnPage(next: number) {setPosition(next * PAGE_SIZE); listHeading.current?.focus()}
  return <section className={styles.review} aria-label="Answer review">
    <header className={styles.header}><p className={styles.eyebrow}>TURN YOUR RESULTS INTO PROGRESS</p><h2>Review your answers</h2><p>Find your mistakes, compare answers, and read the explanation one question at a time.</p></header>
    <div className={styles.filters} role="group" aria-label="Filter submitted answers">{filters.map(value => <button type="button" key={value} aria-pressed={filter === value} className={`${styles.filter} ${value !== 'all' ? styles[value] : ''}`} onClick={() => chooseFilter(value)}>{value !== 'all' && <StatusIcon status={value}/>}<span>{labels[value]}</span><strong>{review.counts[value]}</strong></button>)}</div>
    {!matching.length ? <div className={styles.empty}><BookOpen size={28} aria-hidden="true"/><h3>{items.length ? `No ${filter === 'all' ? '' : labels[filter].toLowerCase() + ' '}questions` : 'No answers to review'}</h3><p>{filter === 'incorrect' ? 'No saved answers were marked incorrect. Check any unanswered questions, or revisit a correct answer.' : 'Choose another filter to explore your results.'}</p>{items.length > 0 && <button type="button" className={styles.secondary} onClick={() => chooseFilter('all')}>Show all questions</button>}</div> : <div className={styles.layout}>
      <aside className={styles.navigator} aria-label="Submitted question list"><div className={styles.listHeading}><h3 ref={listHeading} tabIndex={-1}>{labels[filter]} <span>({matching.length})</span></h3><p aria-live="polite">{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, matching.length)} of {matching.length}</p></div>
        <ol className={styles.list}>{visible.map((row, offset) => <li key={row.item.id}><button type="button" className={`${styles.questionLink} ${selected.item.id === row.item.id ? styles.selected : ''}`} aria-current={selected.item.id === row.item.id ? 'true' : undefined} aria-label={`Review question ${row.number}, ${labels[row.status].toLowerCase()}`} onClick={() => chooseQuestion(page * PAGE_SIZE + offset)}><span className={styles.questionTop}><strong>Question {row.number}</strong><span className={`${styles.badge} ${styles[row.status]}`}><StatusIcon status={row.status}/>{labels[row.status]}</span></span><span className={styles.topic}>{row.item.topic}</span><span className={styles.preview}>{row.item.question.replace(/\s+/g, ' ')}</span></button></li>)}</ol>
        {pages > 1 && <nav className={styles.pagination} aria-label="Submitted review list pages"><button type="button" className={styles.iconButton} aria-label="Previous review page" disabled={page === 0} onClick={() => turnPage(page - 1)}><ArrowLeft size={17}/></button><span>Page {page + 1} of {pages}</span><button type="button" className={styles.iconButton} aria-label="Next review page" disabled={page === pages - 1} onClick={() => turnPage(page + 1)}><ArrowRight size={17}/></button></nav>}
      </aside>
      <article className={styles.detail} aria-labelledby="submitted-question-title" key={selected.item.id}>
        <div className={styles.detailTop}><span className={`${styles.badge} ${styles[selected.status]}`}><StatusIcon status={selected.status}/>{labels[selected.status]}</span><span>{selectedIndex + 1} of {matching.length} in this filter</span></div>
        <h3 id="submitted-question-title" ref={heading} tabIndex={-1}>Question {selected.number}</h3><p className={styles.detailTopic}>{selected.item.topic} · {selected.item.difficulty}</p>
        <div className={styles.prompt}><QuestionText text={selected.item.question}/></div>
        {selected.item.scenario && <section className={styles.scenario}><h4>Case study / scenario</h4><QuestionText text={selected.item.scenario}/></section>}
        {selected.item.imageUrl && <img className={styles.referenceImage} src={selected.item.imageUrl} alt="Question reference"/>}
        {selected.item.images?.map((image, index) => <figure className={styles.figure} key={index}><img className={styles.referenceImage} src={image.url} alt={image.alt || 'Question reference'}/>{image.caption && <figcaption>{image.caption}</figcaption>}</figure>)}
        {selected.item.codeSnippet && <pre className={styles.code}><code>{selected.item.codeSnippet}</code></pre>}
        <section aria-label="Answer comparison"><h4 className={styles.sectionHeading}>Compare your answer</h4>{selected.status === 'unanswered' && <p className={styles.unansweredNote}>No complete answer was submitted for this question. It received zero points.</p>}<AnswerComparison item={selected.item}/></section>
        <section className={styles.explanation} aria-label="Answer explanation"><h4><BookOpen size={18} aria-hidden="true"/>Why this answer is correct</h4><QuestionText text={selected.item.explanation}/>{selected.item.sourceUrl && <a href={selected.item.sourceUrl} target="_blank" rel="noopener noreferrer">Read the official source<ExternalLink size={14} aria-hidden="true"/></a>}</section>
        <nav className={styles.detailNavigation} aria-label="Navigate filtered answers"><button type="button" className={styles.secondary} disabled={selectedIndex === 0} onClick={() => chooseQuestion(selectedIndex - 1)}><ArrowLeft size={16}/>Previous question</button><button type="button" className={styles.primary} disabled={selectedIndex === matching.length - 1} onClick={() => chooseQuestion(selectedIndex + 1)}>Next {filter === 'all' ? '' : labels[filter].toLowerCase() + ' '}question<ArrowRight size={16}/></button></nav>
      </article>
    </div>}
  </section>
}
