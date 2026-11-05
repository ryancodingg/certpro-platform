'use client'
import {useEffect,useRef} from 'react'
import styles from './scroll-heading.module.css'

/** Pixel Point soft-blur-in: exact showcase timing, with an accessible opacity-only variant. */
export function SoftBlurText({text,as:Tag='h2',gradient=false,loop=false}:{text:string;as?:'h1'|'h2'|'span';gradient?:boolean;loop?:boolean}){
 const ref=useRef<HTMLHeadingElement & HTMLSpanElement>(null)
 useEffect(()=>{
  const host=ref.current
  if(!host||typeof IntersectionObserver==='undefined'||typeof Element.prototype.animate!=='function')return
  const units=Array.from(host.querySelectorAll<HTMLElement>('[data-soft-blur-unit]'))
  const alignGradient=()=>{
   if(!gradient)return
   host.querySelectorAll<HTMLElement>('[data-soft-blur-word]').forEach(word=>{
    const box=word.getBoundingClientRect()
    word.querySelectorAll<HTMLElement>('[data-soft-blur-unit]').forEach(unit=>{
     unit.style.backgroundSize=`${box.width}px 100%`
     unit.style.backgroundPosition=`${-(unit.getBoundingClientRect().left-box.left)}px 0`
    })
   })
  }
  alignGradient()
  const resize=gradient&&typeof ResizeObserver!=='undefined'?new ResizeObserver(alignGradient):null
  if(resize)host.querySelectorAll('[data-soft-blur-word]').forEach(word=>resize.observe(word))
  const media=matchMedia('(prefers-reduced-motion: reduce)')
  let inView=false,revision=0,timer:ReturnType<typeof setTimeout>|undefined,wake:(()=>void)|undefined
  let animations:Animation[]=[]
  const stop=()=>{revision++;if(timer)clearTimeout(timer);wake?.();wake=undefined;animations.forEach(a=>a.cancel());animations=[]}
  const wait=(ms:number)=>new Promise<void>(resolve=>{wake=resolve;timer=setTimeout(()=>{wake=undefined;resolve()},ms)})
  const phase=async(enter:boolean)=>{
   const from:Keyframe={opacity:enter?0:1},to:Keyframe={opacity:enter?1:0}
   if(!media.matches){
    from.transform=`translate3d(0,${enter?9.28:0}px,0)`;to.transform=`translate3d(0,${enter?0:-9.28}px,0)`
    from.filter=`blur(${enter?12:0}px)`;to.filter=`blur(${enter?0:12}px)`
   }
   const previous=animations
   animations=units.map((unit,i)=>unit.animate([from,to],{duration:enter?648:432,delay:i*(enter?18:11),easing:enter?'cubic-bezier(.22,1,.36,1)':'cubic-bezier(.64,0,.78,0)',fill:'both'}))
   previous.forEach(a=>a.cancel())
   await Promise.all(animations.map(a=>a.finished.catch(()=>undefined)))
  }
  const start=()=>{
   stop()
   if(!inView||document.visibilityState!=='visible')return
   const run=revision
   void (async()=>{
    await wait(Math.round(Math.random()*400))
    if(run!==revision)return
    await phase(true)
    while(loop&&run===revision){
     await wait(550)
     if(run!==revision)return
     await phase(false)
     if(run!==revision)return
     await phase(true)
     if(run!==revision)return
     await wait(320)
    }
    if(run===revision&&!loop){animations.forEach(a=>a.cancel());animations=[]}
   })()
  }
  const observer=new IntersectionObserver(([entry])=>{
   const next=entry.isIntersecting
   if(next===inView)return
   inView=next
   if(inView)start();else stop()
  },{threshold:.15})
  const visibility=()=>{if(document.visibilityState==='visible')start();else stop()}
  observer.observe(host)
  document.addEventListener('visibilitychange',visibility)
  media.addEventListener('change',start)
  return()=>{stop();resize?.disconnect();observer.disconnect();media.removeEventListener('change',start);document.removeEventListener('visibilitychange',visibility)}
 },[text,loop,gradient])
 // Keep whole words together on small screens; spaces still count in the exact character stagger.
 return <Tag ref={ref} className={`${styles.heading} ${gradient?'gradient-text':''}`}><span className="sr-only">{text}</span><span aria-hidden="true">{text.split(/(\s+)/).map((part,i)=><span key={i} data-soft-blur-word className={styles.word}>{Array.from(part).map((char,j)=><span key={j} data-soft-blur-unit className={styles.glyph}>{char}</span>)}</span>)}</span></Tag>
}
