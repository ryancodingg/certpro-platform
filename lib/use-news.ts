'use client'
import useSWR from 'swr'
import {enrichNews} from './news-editorial'
import {news as seed,isActiveNews,type NewsRecord} from '@/lib/catalog'
export function useNews(){const {data,error,isLoading}=useSWR('/api/news',async url=>{const r=await fetch(url);if(!r.ok)throw Error('News refresh unavailable');return r.json()},{refreshInterval:3600000,revalidateOnFocus:true,dedupingInterval:60000});return {news:((data?.items||seed.filter(n=>isActiveNews(n))) as NewsRecord[]).map(enrichNews),sources:data?.sources,refresh:data?.refresh,error,loading:isLoading}}
