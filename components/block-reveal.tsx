'use client'
import {useEffect, useRef, type ReactNode} from 'react'

/** Progressive enhancement: children remain visible even when motion cannot run. */
export function BlockReveal({children, selector, paused=false, variant='rise',as:Wrapper='div'}:{children:ReactNode;selector:string;paused?:boolean;variant?:'rise'|'settle'|'words';as?:'div'|'span'}) {
 const root=useRef<HTMLDivElement & HTMLSpanElement>(null)

 useEffect(()=>{
  const container=root.current
  if(!container||paused||typeof IntersectionObserver==='undefined'||typeof Element.prototype.animate!=='function')return
  const preference=matchMedia('(prefers-reduced-motion: reduce)')
  const running=new Map<Element,Animation>()
  const entered=new WeakSet<Element>()
  const cancelAll=()=>{running.forEach(animation=>animation.cancel());running.clear()}
  const finishFocused=(event:FocusEvent)=>{
   running.forEach((animation,element)=>{if(element.contains(event.target as Node)){animation.cancel();running.delete(element)}})
  }
  const observer=new IntersectionObserver(entries=>{
   entries.filter(entry=>!entry.isIntersecting).forEach(entry=>{entered.delete(entry.target);running.get(entry.target)?.cancel();running.delete(entry.target)})
   const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top||a.boundingClientRect.left-b.boundingClientRect.left)
   visible.forEach((entry,index)=>{
    const element=entry.target
    if(entered.has(element))return
    if(document.visibilityState!=='visible')return
    entered.add(element)
    if(element.contains(document.activeElement))return
    const mobile=matchMedia('(max-width: 640px)').matches
    const distance=mobile?24:48
    const transform=variant==='words'?`translateY(${mobile?14:24}px) rotateX(-20deg)`:variant==='rise'?`translateY(${distance}px) scale(.96)`:`translateX(${distance/2}px)`
    const start:Keyframe={opacity:.12,transform}
    const end:Keyframe={opacity:1,transform:'none'}
    if(variant==='words'){start.filter=`blur(${mobile?2:4}px)`;end.filter='blur(0px)'}
    // Reduced motion keeps a brief, gentle fade without translation, rotation or blur.
    const frames=preference.matches?[{opacity:.25},{opacity:1}]:[start,end]
    const animation=element.animate(frames,{
     duration:preference.matches?450:mobile?560:700,delay:preference.matches?0:Math.min(index*(variant==='words'?85:100),variant==='words'?340:200),easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'
    })
    running.set(element,animation)
    animation.onfinish=()=>running.delete(element)
   })
  },{threshold:.15,rootMargin:'0px 0px -36px 0px'})
  const observeInitialCards=()=>{
   const cards=container.querySelectorAll(selector)
   cards.forEach(element=>{observer.observe(element)})
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
 return <Wrapper ref={root} style={{display:'contents'}}>{children}</Wrapper>
}
