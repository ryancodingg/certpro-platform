import {providerNews} from '@/lib/server/provider-news'
export const runtime='nodejs'
export const maxDuration=60
export async function GET(){return Response.json(await providerNews(),{headers:{'Cache-Control':'public, s-maxage=300, stale-while-revalidate=3600'}})}
