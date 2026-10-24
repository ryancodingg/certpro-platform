"use client"
import {useEffect,useRef,useState} from 'react'
import styles from './scroll-heading.module.css'
export function ScrollHeading({text,as:Tag='h2',gradient=false}:{text:string;as?:'h1'|'h2'|'span';gradient?:boolean}){
 const ref=useRef<HTMLHeadingElement>(null)
 const [show,setShow]=useState(false)
 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)')
  if(media.matches||!('IntersectionObserver' in window))return
  const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setShow(true);observer.disconnect()}},{threshold:.2})
  if(ref.current)observer.observe(ref.current)
  return ()=>observer.disconnect()
 },[])
 return <Tag ref={ref} aria-label={text} className={`${styles.heading} ${show?styles.revealed:''} ${gradient?'gradient-text':''}`}>{text.split(' ').map((word,i)=><span key={i} className={styles.word} style={{animationDelay:`${i*65}ms`}}>{word}{' '}</span>)}</Tag>
}
