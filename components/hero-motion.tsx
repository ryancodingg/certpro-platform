"use client"

import { useId } from "react"
import styles from "./hero-motion.module.css"

export type HeroMotionProps = {
  paused?: boolean
  motionOptIn?: boolean
  className?: string
}

const layers = [
  { name: "KNOWLEDGE", number: "01", className: "backPlane" },
  { name: "PRACTICE", number: "02", className: "middlePlane" },
  { name: "CONFIDENCE", number: "03", className: "frontPlane" },
] as const

/** Original glass-panel artwork. CSS perspective supplies real depth without a canvas or video. */
export function HeroMotion({ paused = false, motionOptIn = false, className }: HeroMotionProps) {
  const id = useId().replace(/:/g, "")
  return (
    <div className={[styles.art, className].filter(Boolean).join(" ")} data-paused={paused} data-motion-opt-in={motionOptIn} aria-hidden="true">
      <div className={styles.floor} />
      <div className={styles.scene}>
        <div className={styles.stack}>
          {layers.map((layer, index) => {
            const gradient = `${id}-layer-${index}`
            return <div key={layer.name} className={`${styles.plane} ${styles[layer.className]}`}>
              <div className={styles.planeLabel}><span>{layer.number}</span><span>{layer.name}</span><i /></div>
              <svg className={styles.surface} viewBox="0 0 420 220" fill="none" focusable="false">
                <defs><linearGradient id={gradient} x1="20" y1="10" x2="400" y2="210" gradientUnits="userSpaceOnUse"><stop stopColor="#9A66F2"/><stop offset=".55" stopColor="#6538CD"/><stop offset="1" stopColor="#7E98E8"/></linearGradient></defs>
                {index === 0 ? <g stroke={`url(#${gradient})`}>
                  {[60,100,140,180].map(y=><path key={y} d={`M20 ${y}H400`} strokeOpacity=".24"/>)}
                  {[40,90,140,190,240,290,340,390].map(x=><path key={x} d={`M${x} 45V205`} strokeOpacity=".24"/>)}
                  <path d="M30 175 105 123 180 155 255 80 330 103 390 57" strokeWidth="2"/>
                  {[[30,175],[105,123],[180,155],[255,80],[330,103],[390,57]].map(([cx,cy])=><circle key={cx} cx={cx} cy={cy} r="5" fill="#EEE5FF" strokeWidth="2"/>)}
                </g> : index === 1 ? <g stroke={`url(#${gradient})`}>
                  {[0,15,30,45,60,75].map((y)=><path key={y} d={`M-10 ${95+y}C50 ${30+y} 95 ${165+y} 166 ${95+y}S270 ${30+y} 330 ${95+y} 395 ${135+y} 430 ${75+y}`} strokeWidth="1.4" strokeOpacity={.35+y/150}/>)}
                  <path d="M22 170C90 55 135 190 205 115S330 65 400 122" strokeWidth="3" strokeDasharray="4 12"/>
                </g> : <g stroke={`url(#${gradient})`}>
                  <path d="M32 157C100 157 90 98 157 98H225" strokeWidth="2.5"/>
                  <path d="M32 178C102 178 102 119 157 119H220M32 198C115 198 112 140 157 140H222" strokeOpacity=".3"/>
                  <circle cx="32" cy="157" r="7" fill="#EDE2FF" strokeWidth="2"/><circle cx="157" cy="98" r="7" fill="#EDE2FF" strokeWidth="2"/>
                  <circle cx="291" cy="126" r="60" strokeOpacity=".24"/><circle cx="291" cy="126" r="47" strokeWidth="1.4" strokeDasharray="3 7"/>
                  <path d="m269 125 16 16 30-33" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M24 59H132M24 69H91M365 178h31m-15-15v30" strokeOpacity=".4"/>
                  <circle cx="365" cy="65" r="4" fill="#9C7BDD"/>
                </g>}
              </svg>
              <div className={styles.edge} />
            </div>
          })}
        </div>
      </div>
    </div>
  )
}
