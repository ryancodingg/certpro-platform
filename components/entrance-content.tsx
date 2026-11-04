'use client'
import {useEffect,useRef,type CSSProperties,type ReactNode} from 'react'

// The homepage uses only a translate/fade entrance. Native animation avoids
// downloading the full scroll animation engine for this one transition.
export default function EntranceContent({children,distance=14,duration=.45,initialOpacity=.85,disabled=false,style}:{children:ReactNode;distance?:number;duration?:number;initialOpacity?:number;once?:boolean;disabled?:boolean;style?:CSSProperties}){
 const ref=useRef<HTMLDivElement>(null),played=useRef(false)
 useEffect(()=>{
  const el=ref.current;if(!el||disabled||played.current)return
  const media=matchMedia('(prefers-reduced-motion: reduce)')
  let animation:Animation|undefined
  const stop=()=>{if(media.matches)animation?.cancel()}
  const observer=new IntersectionObserver(entries=>{
   if(!entries.some(entry=>entry.isIntersecting))return
   observer.disconnect();played.current=true
   if(!media.matches)animation=el.animate([{transform:`translateY(${distance}px)`,opacity:initialOpacity},{transform:'translateY(0)',opacity:1}],{duration:duration*1000,easing:'cubic-bezier(.22,1,.36,1)'})
  },{threshold:.1})
  observer.observe(el);media.addEventListener('change',stop)
  return()=>{observer.disconnect();animation?.cancel();media.removeEventListener('change',stop)}
 },[disabled,distance,duration,initialOpacity])
 return <div ref={ref} style={style}>{children}</div>
}
