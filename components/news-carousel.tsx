'use client'
import {useRef,useState,useEffect} from 'react'
import {ArrowLeft,ArrowRight} from 'lucide-react'
import {NewsCard} from './news-card'
import type {NewsRecord} from '@/lib/catalog'
export function NewsCarousel({items}:{items:NewsRecord[]}){
 const ref=useRef<HTMLDivElement>(null);const [ends,setEnds]=useState({first:true,last:false})
 function measure(){const e=ref.current;if(e)setEnds({first:e.scrollLeft<4,last:e.scrollLeft+e.clientWidth>=e.scrollWidth-4})}
 useEffect(()=>{measure();const observer=new ResizeObserver(measure);if(ref.current)observer.observe(ref.current);return()=>observer.disconnect()},[items.length])
 function move(direction:number){const e=ref.current;if(e)e.scrollBy({left:direction*(e.querySelector('article')?.parentElement?.getBoundingClientRect().width||e.clientWidth)*1.03,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}
 return <section aria-label="Latest certification news"><div className="mb-4 flex justify-end gap-2"><button className="cp-secondary" aria-label="Previous news" disabled={ends.first} onClick={()=>move(-1)}><ArrowLeft size={18}/></button><button className="cp-secondary" aria-label="Next news" disabled={ends.last} onClick={()=>move(1)}><ArrowRight size={18}/></button></div><div ref={ref} onScroll={measure} className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4" tabIndex={0} aria-label="News cards; use arrow buttons or swipe">{items.map(item=><div className="min-w-0 shrink-0 basis-[90%] sm:basis-[48%] lg:basis-[32%] snap-start" key={item.id}><NewsCard item={item}/></div>)}</div></section>
}
