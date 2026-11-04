import {newsSnapshot} from '@/lib/server/provider-news'
import {SiteHeader} from "@/components/site-header"
import {NewsFeed} from "@/components/news-feed"
export const revalidate=300
export default async function NewsPage(){return <main className="cp-site"><SiteHeader/><NewsFeed initialNews={await newsSnapshot()}/></main>}
