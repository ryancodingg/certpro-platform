"use client"

import { useId } from "react"
import styles from "./hero-motion.module.css"

export type HeroMotionProps = { paused?: boolean; motionOptIn?: boolean; className?: string }
const layers = ["backPlane", "middlePlane", "frontPlane"] as const

/** Original contour fields on upright transparent planes. The foreground content stays still. */
export function HeroMotion({ paused = false, motionOptIn = false, className }: HeroMotionProps) {
  const id = useId().replace(/:/g, "")
  return <div className={[styles.art, className].filter(Boolean).join(" ")} data-paused={paused} data-motion-opt-in={motionOptIn} aria-hidden="true">
    <div className={styles.ambient} />
    <div className={styles.scene}><div className={styles.stack}>
      {layers.map((layer, index) => {
        const ink = `${id}-ink-${index}`, glass = `${id}-glass-${index}`
        return <div key={layer} className={`${styles.plane} ${styles[layer]}`}>
          <svg className={styles.surface} viewBox="0 0 440 276" fill="none" focusable="false">
            <defs>
              <linearGradient id={ink} x1="15" y1="25" x2="420" y2="250" gradientUnits="userSpaceOnUse"><stop stopColor="#7C47B7"/><stop offset=".55" stopColor="#63369E"/><stop offset="1" stopColor="#5278A4"/></linearGradient>
              <linearGradient id={glass} x1="0" y1="0" x2="440" y2="276" gradientUnits="userSpaceOnUse"><stop stopColor="#FFFFFF" stopOpacity=".2"/><stop offset=".5" stopColor="#D6C3F1" stopOpacity=".09"/><stop offset="1" stopColor="#C7DEF0" stopOpacity=".15"/></linearGradient>
            </defs>
            <rect x="1" y="1" width="438" height="274" rx="22" fill={`url(#${glass})`} stroke={`url(#${ink})`} strokeOpacity=".9" strokeWidth="1.25"/>
            {index === 0 ? <g stroke={`url(#${ink})`} strokeWidth="1.15">
              <g className={styles.contours}>
                <path d="M28 175c15-24 54-18 65-48 13-37 43-29 61-54 22-30 37-32 62-18 21 12 39-4 64 14 22 15 21 47 55 56 35 9 39 40 11 56-31 17-40 54-86 47-34-5-39 17-75 4-33-13-47 3-75-13-29-17-60-16-78-28-6-4-10-8-4-16Z" strokeOpacity=".43"/>
                <path d="M58 174c12-20 39-17 50-42 13-28 41-25 58-46 18-23 31-24 50-12 19 11 35-4 55 10 19 14 16 42 46 50 24 7 31 28 10 41-27 17-34 44-71 37-29-5-33 14-63 3-28-10-42 2-65-11-25-14-49-14-65-23-4-2-8-4-5-7Z" strokeOpacity=".65"/>
                <path d="M92 169c8-15 26-14 36-34 12-20 36-20 50-37 14-17 23-17 38-8 16 10 29-2 45 10 16 12 12 33 35 40 19 6 20 18 6 28-21 15-26 34-56 29-22-4-27 11-51 2-23-8-33 1-51-10-20-12-38-11-51-18Z" strokeOpacity=".7"/>
                <path d="M127 163c7-12 15-12 25-26 11-15 29-16 42-29 10-10 17-10 27-3 13 8 23-2 35 8 11 9 9 24 25 29 12 4 13 12 3 18-16 11-22 25-43 21-17-3-20 8-38 1-19-7-25 1-39-7-14-8-26-7-37-12Z" strokeOpacity=".55"/>
                <path d="M163 155c12-6 19-19 33-26 11-6 22 3 31 1 13-3 18 6 24 14 5 7-4 14-14 15-14 1-18 9-31 5-14-4-27 3-43-9Z" strokeOpacity=".4"/>
              </g>
              <path d="M29 32h382M29 245h382" strokeDasharray="2 8" strokeOpacity=".42"/>
              {[46,91,136,181,226,271,316,361,406].map(x=><circle key={x} cx={x} cy="32" r="3" fill="#F4EDFC" strokeOpacity=".55"/>)}
              <path d="M22 78v26m-4-13h8M418 178v26m-4-13h8" strokeOpacity=".65"/>
            </g> : index === 1 ? <g stroke={`url(#${ink})`} strokeWidth="1.1">
              <path d="M-15 151c43-7 69-35 90-63 21-27 47-2 66-20 27-26 39-2 65 15 25 16 54-9 83 7 27 16 44 61 76 46 35-16 47-7 94 14" strokeOpacity=".68"/>
              <path d="M-15 168c42-7 72-31 93-59 21-26 45-6 66-20 26-18 35 5 61 19 29 15 52-12 83 1 29 13 46 49 78 36 34-14 49-6 93 12" strokeOpacity=".55"/>
              <path d="M-15 185c42-6 74-25 95-51 22-26 46-14 66-18 24-5 35 9 61 16 30 9 49-12 81-1 31 11 47 36 80 26 35-11 52-5 91 11" strokeOpacity=".48"/>
              <path d="M-15 202c44-6 72-18 96-41 24-23 45-18 67-18 25 1 36 10 60 10 29 0 48-11 78-2 33 10 49 25 81 18 36-8 55-4 92 11" strokeOpacity=".42"/>
              <path d="M-15 219c44-6 73-15 98-31 25-17 48-16 68-17 23-2 35 7 60 3 27-4 46-11 75-3 34 10 51 15 82 11 37-5 55-2 91 11" strokeOpacity=".34"/>
              <g strokeDasharray="1.5 8" strokeOpacity=".5"><path d="M24 49h392M24 100h392M24 151h392M24 202h392M24 253h392"/><path d="M67 24v228M171 24v228M275 24v228M379 24v228"/></g>
              <g fill="#F7F1FF" strokeWidth="1.1"><path d="m67 44 5 5-5 5-5-5Zm104 51 5 5-5 5-5-5Zm104 51 5 5-5 5-5-5Zm104 51 5 5-5 5-5-5Z"/><circle cx="379" cy="49" r="3"/><circle cx="67" cy="202" r="3"/></g>
            </g> : <g stroke={`url(#${ink})`} strokeWidth="1.15">
              <path d="M-8 78c37 18 58-13 87 0 30 13 49-26 74-19 29 8 20 42 54 40 26-2 43 13 70 4 24-8 42 16 58 29 27 20 46 0 65 11 18 10 37 9 52 2" strokeOpacity=".8"/>
              <path d="M-8 104c39 15 55-10 84 0 32 10 46-24 74-16 28 8 24 33 56 34 28 1 45 12 69 6 26-6 43 13 63 24 25 14 44 1 63 9 18 9 36 8 51 2" strokeOpacity=".6"/>
              <path d="M-8 130c40 9 55-8 83 0 32 8 44-19 74-11 27 7 27 26 58 27 28 1 46 11 70 7 26-4 42 8 62 17 23 11 43 1 63 8 18 7 34 7 50 2" strokeOpacity=".48"/>
              <path d="M-8 156c41 7 53-5 81 0 34 6 46-14 76-8 27 6 29 19 59 21 28 2 46 9 71 7 25-2 42 4 62 10 22 7 41 2 63 7 17 5 32 6 48 2" strokeOpacity=".36"/>
              <path d="M88 191c15-18 38-7 55-20 17-13 25 8 47 2 20-5 30 11 24 24-7 13-30 7-42 16-12 9-24 0-42 4-19 5-37-6-42-26ZM101 192c15-10 29-5 44-13 14-7 22 7 39 4 13-3 19 5 16 12-4 7-22 3-32 10-10 7-21 1-34 4-13 3-29-4-33-17Z" strokeOpacity=".6"/>
              <path d="M269 42c10-11 23-6 31-10s15 1 17 9-10 13-20 11-21 6-28-10ZM352 219c13-14 20-10 31-13 14-4 21 5 16 14-5 9-22 5-28 11s-17 2-19-12Z" strokeOpacity=".55"/>
              <g strokeDasharray="1.5 7" strokeOpacity=".65"><path d="M24 47h392M24 137h392M24 230h392"/></g>
              <g className={styles.signals} strokeWidth="1.7" strokeDasharray="2 74" strokeLinecap="round"><path d="M24 47h392M24 137h392M24 230h392"/></g>
              <g fill="#F9F5FF" strokeOpacity=".8">{[36,96,156,216,276,336,396].map(x=><path key={x} d={`m${x} 23 3.5 4-3.5 4-3.5-4Z`}/>)}<path d="m40 243 5 8 5-8Zm186 0 5 8 5-8Zm170 0 5 8 5-8Z"/></g>
            </g>}
          </svg>
        </div>
      })}
    </div></div>
  </div>
}
