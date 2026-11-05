'use client'
import {useEffect, useRef, type ReactNode} from 'react'

/** Progressive enhancement: children remain visible even when motion cannot run. */
export function BlockReveal({children, selector, paused=false, variant='rise'}:{children:ReactNode;selector:string;paused?:boolean;variant?:'rise'|'settle'}) {
 const root=useRef<HTMLDivElement>(null)
 const seen=useRef(new WeakSet<Element>())
 useEffect(()=>{
  const container=root.current
  if(!container||paused||typeof IntersectionObserver==='undefined'||typeof Element.prototype.animate!=='function')return
  const preference=matchMedia('(prefers-reduced-motion: reduce)')
  const running=new Map<Element,Animation>()
  const cancelAll=()=>{running.forEach(animation=>animation.cancel());running.clear()}
  const finishFocused=(event:FocusEvent)=>{
   running.forEach((animation,element)=>{if(element.contains(event.target as Node)){animation.cancel();running.delete(element)}})
  }
  const observer=new IntersectionObserver(entries=>{
   const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top||a.boundingClientRect.left-b.boundingClientRect.left)
   visible.forEach((entry,index)=>{
    const element=entry.target
    if(seen.current.has(element))return
    seen.current.add(element);observer.unobserve(element)
    if(preference.matches||document.visibilityState!=='visible'||element.contains(document.activeElement))return
    const distance=matchMedia('(max-width: 640px)').matches?12:24
    const transform=variant==='rise'?`translateY(${distance}px) scale(.985)`:`translateX(${distance/2}px)`
    const animation=element.animate([{opacity:.65,transform},{opacity:1,transform:'none'}],{
     duration:variant==='rise'?480:360,delay:Math.min(index*60,120),easing:'cubic-bezier(.16,1,.3,1)',fill:'none'
    })
    running.set(element,animation)
    animation.onfinish=()=>running.delete(element)
   })
  },{threshold:.08,rootMargin:'0px 0px -24px 0px'})
  const observeInitialCards=()=>{
   const cards=container.querySelectorAll(selector)
   cards.forEach(element=>{if(!seen.current.has(element))observer.observe(element)})
   return cards.length>0
  }
  // The catalog may hydrate after its Suspense fallback. Observe its first batch only.
  const pending=observeInitialCards()?null:new MutationObserver(()=>{if(observeInitialCards())pending?.disconnect()})
  pending?.observe(container,{childList:true,subtree:true})
  const reduce=()=>{if(preference.matches)cancelAll()}
  const visibility=()=>{if(document.visibilityState!=='visible')cancelAll()}
  preference.addEventListener('change',reduce)
  document.addEventListener('visibilitychange',visibility)
  container.addEventListener('focusin',finishFocused)
  return()=>{pending?.disconnect();observer.disconnect();cancelAll();preference.removeEventListener('change',reduce);document.removeEventListener('visibilitychange',visibility);container.removeEventListener('focusin',finishFocused)}
 },[selector,paused,variant])
 return <div ref={root} style={{display:'contents'}}>{children}</div>
}
