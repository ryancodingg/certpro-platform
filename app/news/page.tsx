import {newsSnapshot} from '@/lib/server/provider-news'
import {SiteHeader} from "@/components/site-header"
import {NewsFeed} from "@/components/news-feed"
export const revalidate=300
export default async function NewsPage({searchParams}:{searchParams:Promise<{tab?:string}>}){const {tab}=await searchParams;const initialTab=tab==='events'||tab==='offers'?tab:'news';return <main className="cp-site"><SiteHeader/><NewsFeed initialTab={initialTab} initialNews={await newsSnapshot()}/></main>}
