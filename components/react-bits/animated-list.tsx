'use client'

import {Children, isValidElement, useEffect, useRef, type ReactNode} from 'react'
import styles from './animated-list.module.css'

/**
 * Adapted from React Bits AnimatedList by David Haz (2026).
 * https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/Components/AnimatedList/AnimatedList.tsx
 * The original spring curve, slide pose and animate-once visibility approach are
 * retained. CertPro uses a semantic list of native disclosure controls instead of
 * a listbox, removes demo data/ornamental layers and never hides unread content.
 *
 * MIT + Commons Clause License Condition v1.0
 * Copyright (c) 2026 David Haz
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, and distribute the Software as part of an
 * application, website, or product, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * You may use this Software, including for any commercial purpose, so long as
 * you do not sell, sublicense, or redistribute the components themselves—whether
 * alone, in a bundle, or as a ported version.
 * The same restriction covers the React Bits tools (Background Studio, Texture
 * Lab, Shape Magic, Center Stage, Sound Lab and any tools added later) and the
 * sounds in the sound library. You may not sell, sublicense, or redistribute the
 * tools or the sounds themselves, or offer the tools or a substantially similar
 * copy of them as a hosted service—whether alone, in a bundle, or as a ported version.
 * What you make with the tools is yours to use. You can use exported code, images,
 * videos, and audio files in any personal or commercial application, website, or
 * product, including paid ones. You may not sell or redistribute the exports on
 * their own, either individually or as the product itself, such as a sound,
 * texture, background, or template pack.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
const SPRING = 'linear(0, 0.0603, 0.2033, 0.3821, 0.5633, 0.7258, 0.8584, 0.9574, 1.0242, 1.0634, 1.0809, 1.0828, 1.0747, 1.0613, 1.046, 1.0313, 1.0186, 1.0085, 1.0012, 0.9965, 0.994, 0.9931, 0.9941, 0.9953, 0.9966, 0.9978, 0.9988, 0.9995, 1)'

export function AnimatedList({children, label}: {children: ReactNode; label: string}) {
  const root = useRef<HTMLUListElement>(null)
  const seen = useRef(new Set<string>())
  const rows = Children.toArray(children)
  const keys = rows.map((child, index) => isValidElement(child) && child.key !== null ? String(child.key) : String(index))
  const identity = JSON.stringify(keys)

  useEffect(() => {
    const list = root.current
    if (!list || typeof IntersectionObserver === 'undefined') return
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const running = new Map<Element, Animation>()
    const stop = () => {running.forEach(animation => animation.cancel()); running.clear()}
    const reducedChanged = () => {if (preference.matches) stop()}
    const focused = (event: FocusEvent) => {
      const item = event.target instanceof Element ? event.target.closest('li') : null
      if (item) {running.get(item)?.cancel(); running.delete(item)}
    }
    const observer = new IntersectionObserver(entries => {
      let order = 0
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const item = entry.target as HTMLLIElement
        const key = item.dataset.motionKey || ''
        observer.unobserve(item)
        if (seen.current.has(key)) continue
        seen.current.add(key)
        if (preference.matches || !item.animate || item.contains(document.activeElement)) continue
        const animation = item.animate([
          {transform: 'translate3d(0, 14px, 0) scale(0.99)', opacity: 0.7},
          {transform: 'translate3d(0, 0, 0) scale(1)', opacity: 1},
        ], {
          duration: 360,
          delay: Math.min(order++, 4) * 35,
          easing: CSS.supports('transition-timing-function', 'linear(0, 1)') ? SPRING : 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'none',
        })
        running.set(item, animation)
        animation.onfinish = () => running.delete(item)
      }
    }, {threshold: 0.08})
    Array.from(list.children).forEach(item => observer.observe(item))
    preference.addEventListener('change', reducedChanged)
    list.addEventListener('focusin', focused)
    return () => {
      observer.disconnect()
      stop()
      preference.removeEventListener('change', reducedChanged)
      list.removeEventListener('focusin', focused)
    }
  }, [identity])

  return <ul ref={root} className={styles.list} aria-label={label}>
    {rows.map((child, index) => <li className={styles.item} key={keys[index]} data-motion-key={keys[index]}>{child}</li>)}
  </ul>
}
