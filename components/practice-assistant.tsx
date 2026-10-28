'use client'

import {useEffect, useRef, useState} from 'react'
import Link from 'next/link'
import {learnerFetch} from '@/lib/learner-client'
import {useAuth} from '@/hooks/use-auth'
import {CFox, appendStudyDocument} from './cfox-notebook'
import {QuestionText} from './question-text'
import styles from './practice-assistant.module.css'

type Props = {
  attemptId: string
  questionId: string
  review?: boolean
  explanation?: string
  sourceUrl?: string
  aiAvailable?: boolean
}

export function PracticeAssistant({attemptId, questionId, review=false, explanation='', sourceUrl, aiAvailable=true}: Props) {
  const {user} = useAuth()
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [added, setAdded] = useState(false)
  const [paused, setPaused] = useState(false)
  const generation = useRef(0)
  const requestPending = useRef(false)

  useEffect(() => {
    generation.current++
    requestPending.current = false
    setText('')
    setError('')
    setBusy(false)
    setAdded(false)
    return () => { generation.current++ }
  }, [attemptId, questionId, user?.id])

  async function explain(style: string) {
    if (requestPending.current || !aiAvailable || !user) return
    requestPending.current = true
    const current = ++generation.current
    setBusy(true)
    setError('')
    setText('')
    setAdded(false)
    try {
      const response = await learnerFetch(review ? '/api/my-learning' : '/api/learning', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({action: 'explain', id: attemptId, questionId, style}),
      })
      const data = await response.json()
      if (!response.ok) throw Error(data.error || 'C-Fox could not respond. Please try again.')
      if (current === generation.current) setText(data.text)
    } catch (e) {
      if (current === generation.current) setError((e as Error).message)
    } finally {
      if (current === generation.current) {
        requestPending.current = false
        setBusy(false)
      }
    }
  }

  function add() {
    if (!user || !text) return
    try {
      appendStudyDocument(user.id, 'C-FOX AI EXPLANATION · Question ' + questionId + '\n' + text + '\nAI-generated guidance: verify against the question explanation and official source.')
      setAdded(true)
    } catch (e) {
      setError((e as Error).message || 'Could not save this explanation.')
    }
  }

  return <section className={styles.assistant} aria-label="C-Fox learning assistant">
    <div className={styles.companion}>
      <CFox busy={busy} review={Boolean(text)} paused={paused}/>
      <button type="button" className={styles.motion} onClick={() => setPaused(value => !value)} aria-pressed={paused} aria-label={paused ? 'Play fox animation' : 'Pause fox animation'}>
        {paused ? 'Play' : 'Pause'}
      </button>
    </div>
    <div className={styles.bubble}>
      <div className={styles.heading}>
        <h3>C-Fox says</h3>
        {text && <span className={styles.aiLabel}>AI explanation</span>}
      </div>
      <div className={styles.message}>
        <QuestionText text={text || explanation || 'Choose how you’d like me to explain this answer.'}/>
      </div>
      <div className={styles.status} aria-live="polite">
        {busy && <p>Thinking through your answer…</p>}
        {text && !busy && <span className="sr-only">Explanation ready. Read C-Fox’s explanation above.</span>}
      </div>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      {sourceUrl && <a className={styles.source} href={sourceUrl} target="_blank" rel="noopener noreferrer">Read the source ↗</a>}
      {aiAvailable ? <>
        <div className={styles.actions}>
          {([['explain', 'Explain each choice'], ['simplify', 'Explain simply'], ['example', 'Give an example']] as const).map(([style, label]) =>
            <button type="button" key={style} className="cp-secondary text-sm" disabled={busy || !user} onClick={() => void explain(style)}>{label}</button>)}
        </div>
        {text && <div className={styles.notes}>
          <button type="button" className="cp-primary" onClick={add} disabled={added || !user}>{added ? 'Added to your study page ✓' : 'Add to my study page'}</button>
          <Link className="cp-text-link" href="/my-learning">Open my study space →</Link>
          {explanation && <button type="button" className={styles.original} onClick={() => {setText(''); setAdded(false)}}>Show original explanation</button>}
        </div>}
        <p className={styles.disclaimer}>AI follow-ups can make mistakes. Check the source. Daily AI limits apply.</p>
      </> : <p className={styles.disclaimer}>AI follow-ups will be available when your account connection recovers.</p>}
    </div>
  </section>
}
