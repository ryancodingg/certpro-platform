'use client'

import {useEffect, useRef} from 'react'

/**
 * Count-mode adaptation of React Bits CountUp by David Haz (copyright 2026).
 * Source: https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/TextAnimations/CountUp/CountUp.tsx
 * MIT + Commons Clause; see the project's React Bits third-party notice.
 * Retains its exponential easing, clamped interpolation and view trigger while
 * replacing motion/react with requestAnimationFrame for this integer-only use.
 * Final values remain visible during SSR and available to assistive technology.
 */
const expo = (t: number) => t >= 1 ? 1 : (1 - Math.pow(2, -10 * t)) / (1 - Math.pow(2, -10))

export function CountUp({to, duration = 800}: {to: number; duration?: number}) {
  const target = Number.isFinite(to) ? Math.max(0, Math.round(to)) : 0
  const finalText = String(target)
  const host = useRef<HTMLSpanElement>(null)
  const text = useRef<HTMLSpanElement>(null)
  const played = useRef(false)

  useEffect(() => {
    const node = text.current
    const root = host.current
    if (!node || !root) return
    let frame = 0
    let observer: IntersectionObserver | undefined
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const finish = () => {
      cancelAnimationFrame(frame)
      node.textContent = finalText
    }
    finish()
    // Animate only the first view, never restart an already displayed total
    // after a cloud refresh or while the learner is reading their progress.
    if (played.current || reduce.matches || target === 0 || duration <= 0) return
    const start = () => {
      played.current = true
      observer?.disconnect()
      if (reduce.matches || document.hidden) return finish()
      const began = performance.now()
      node.textContent = '0'
      const render = (now: number) => {
        const progress = Math.min(1, Math.max(0, (now - began) / duration))
        node.textContent = String(Math.round(target * expo(progress)))
        if (progress < 1) frame = requestAnimationFrame(render)
        else finish()
      }
      frame = requestAnimationFrame(render)
    }
    const onReducedMotion = () => { if (reduce.matches) { played.current = true; observer?.disconnect(); finish() } }
    const onVisibility = () => { if (document.hidden && played.current) finish() }
    reduce.addEventListener('change', onReducedMotion)
    document.addEventListener('visibilitychange', onVisibility)
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) start()
      }, {threshold: 0.5})
      observer.observe(root)
    }
    return () => {
      cancelAnimationFrame(frame)
      observer?.disconnect()
      reduce.removeEventListener('change', onReducedMotion)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [target, finalText, duration])

  return <span ref={host} style={{display:'inline-grid', fontVariantNumeric:'tabular-nums', position:'relative'}}>
    <span aria-hidden="true" style={{gridArea:'1 / 1', visibility:'hidden'}}>{finalText}</span>
    <span ref={text} aria-hidden="true" style={{gridArea:'1 / 1', textAlign:'end'}}>{finalText}</span>
    <span style={{position:'absolute', width:1, height:1, clipPath:'inset(50%)', whiteSpace:'nowrap'}}>{finalText}</span>
  </span>
}
