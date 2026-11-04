'use client'
import useSWR from 'swr'
import {news as seed,isActiveNews,type NewsRecord} from '@/lib/catalog'
export type NewsSnapshot={items:NewsRecord[];sources:any[];refresh:string}
export function useNews(initialNews?:NewsSnapshot){const {data,error,isLoading}=useSWR('/api/news',async url=>{const r=await fetch(url);if(!r.ok)throw Error('News refresh unavailable');return r.json()},{fallbackData:initialNews,refreshInterval:3600000,revalidateOnFocus:true,dedupingInterval:60000});return {news:((data?.items||seed.filter(n=>isActiveNews(n))) as NewsRecord[]).filter(n=>isActiveNews(n)),sources:data?.sources,refresh:data?.refresh,error,loading:isLoading}}
