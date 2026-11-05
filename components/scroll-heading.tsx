"use client"
import {BlockReveal} from './block-reveal'
import styles from './scroll-heading.module.css'
export function ScrollHeading({text,as:Tag='h2',gradient=false}:{text:string;as?:'h1'|'h2'|'span';gradient?:boolean}){
 return <BlockReveal as={Tag==='span'?'span':'div'} selector="[data-reveal-word]" variant="words"><Tag className={`${styles.heading} ${gradient?'gradient-text':''}`}><span className="sr-only">{text}</span><span aria-hidden="true">{text.split(' ').map((word,i)=><span key={i} data-reveal-word className={styles.word}>{word}{' '}</span>)}</span></Tag></BlockReveal>
}
