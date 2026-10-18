'use client'
import useSWR from 'swr'
import {news as seed,isActiveNews,type NewsRecord} from '@/lib/catalog'
export function useNews(){const {data,error,isLoading}=useSWR('/api/news',async url=>{const r=await fetch(url);if(!r.ok)throw Error('News refresh unavailable');return r.json()},{refreshInterval:3600000,revalidateOnFocus:false});return {news:(data?.items||seed.filter(n=>isActiveNews(n))) as NewsRecord[],sources:data?.sources,refresh:data?.refresh,error,loading:isLoading}}
