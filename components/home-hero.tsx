'use client'
import {useEffect, useRef, useState} from 'react'
import Link from 'next/link'
import {ArrowRight, Sparkles, Pause, Play} from 'lucide-react'
import {ScrollHeading} from './scroll-heading'
import {HeroMotion} from './hero-motion'
import {ProviderLogo} from './provider-logo'
import {certifications, type NewsRecord} from '@/lib/catalog'
import styles from './home-hero.module.css'
export function HomeHero({updates}: {updates: NewsRecord[]}) {
  const hero = useRef<HTMLElement>(null)
  const [motionOptIn,setMotionOptIn] = useState(false)
  const [ready,setReady] = useState(false), [pausedByUser,setPausedByUser] = useState(false)
  const [reduced,setReduced] = useState(false), [inView,setInView] = useState(true), [visible,setVisible] = useState(true)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateReduced = () => {setReduced(media.matches);setMotionOptIn(false)}
    const updateVisibility = () => setVisible(document.visibilityState === 'visible')
    updateReduced(); updateVisibility()
    setReady(true)
    media.addEventListener('change',updateReduced)
    document.addEventListener('visibilitychange',updateVisibility)
    const observer = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {threshold:0.05}) : null
    if (hero.current) observer?.observe(hero.current)
    return () => {observer?.disconnect();media.removeEventListener('change',updateReduced);document.removeEventListener('visibilitychange',updateVisibility)}
  },[])
  function toggleMotion() {
    const next = reduced && !motionOptIn ? false : !pausedByUser
    if (reduced && !motionOptIn) setMotionOptIn(true)
    setPausedByUser(next)
  }
  const controlPaused = pausedByUser || (reduced && !motionOptIn)
  const paused = !ready || controlPaused || !inView || !visible
  return <section ref={hero} className={`cp-hero ${styles.hero}`} data-motion={paused?'paused':'playing'} aria-label="Start your learning journey">
    <div className={styles.backgroundMotion} aria-hidden="true"><HeroMotion paused={paused} motionOptIn={motionOptIn}/></div>
    <div className={`cp-hero-copy ${styles.copy}`}>
      <p className="cp-eyebrow"><Sparkles size={16} aria-hidden="true"/>LEARNING IS FOR EVERYONE</p>
      <h1><ScrollHeading as="span" text="Build your skills."/><br/><ScrollHeading as="span" text="Practice with purpose." gradient/></h1>
      <p>Find your path across {certifications.length} certifications. Learn at your own pace in Practical Mode, then put your knowledge to the test with a Mock Exam.</p>
      <div className={`cp-actions ${styles.actions}`}><Link className={`cp-primary ${styles.start}`} href="#catalog">Find my certification <ArrowRight size={18} aria-hidden="true"/></Link><Link className="cp-secondary" href="/news">Explore news & discounts</Link></div>
      <p className="cp-note">Free learning and exam preparation for everyone. Provider exam fees may apply.</p>
      <div className={styles.path} aria-label="Your learning path"><span>Learn</span><i aria-hidden="true"/><span>Practice</span><i aria-hidden="true"/><span>Build confidence</span></div>

    </div>
    <aside className={`cp-latest-panel ${styles.newsPanel}`} aria-label="Latest certification updates">
      <p className="cp-eyebrow">YOUR NEXT CHAPTER STARTS HERE</p><ScrollHeading as="h2" text="Stay a step ahead."/><p className="cp-note">Latest official certification updates</p>
      <ol className="cp-highlight-list">{updates.map(n=><li key={n.id}><Link href={'/news/'+n.id}><ProviderLogo provider={n.provider} className="h-7 w-7"/><div><span className="cp-news-tag">{n.provider} · {n.type}</span><h3>{n.title}</h3></div><ArrowRight size={16} aria-hidden="true"/></Link></li>)}</ol>
    </aside>
    <button type="button" className={styles.motionToggle} onClick={toggleMotion} title={reduced&&!motionOptIn?'Paused for your reduced-motion preference. Play only if you want to preview the animation.':undefined} aria-label={controlPaused?'Play homepage animation':'Pause homepage animation'}>{controlPaused?<Play size={13} aria-hidden="true"/>:<Pause size={13} aria-hidden="true"/>}{controlPaused?'Play animation':'Pause animation'}</button>
  </section>
}
