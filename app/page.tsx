import HomeContent from '@/components/home-content'
import {newsSnapshot} from '@/lib/server/provider-news'
export const revalidate=300
export default async function Home(){return <HomeContent initialNews={await newsSnapshot()}/>}
