'use client'
import useSWR from 'swr'
import {useEffect,useState} from 'react'
import {news as seed,isActiveNews,type NewsRecord} from '@/lib/catalog'
export type NewsSnapshot={items:NewsRecord[];sources:any[];refresh:string}
export function useNews(initialNews?:NewsSnapshot){
 // Re-evaluate deadlines even while the visitor leaves this page open overnight.
 const [now,setNow]=useState(()=>new Date())
 useEffect(()=>{const tick=()=>setNow(new Date());const timer=setInterval(tick,60000);window.addEventListener('focus',tick);return()=>{clearInterval(timer);window.removeEventListener('focus',tick)}},[])
const {data,error,isLoading}=useSWR('/api/news',async url=>{const r=await fetch(url);if(!r.ok)throw Error('News refresh unavailable');return r.json()},{fallbackData:initialNews,refreshInterval:3600000,revalidateOnFocus:true,dedupingInterval:60000});return {news:((data?.items||seed.filter(n=>isActiveNews(n))) as NewsRecord[]).filter(n=>isActiveNews(n,now)),sources:data?.sources,refresh:data?.refresh,error,loading:isLoading}}
