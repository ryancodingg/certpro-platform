import {providerNews} from '@/lib/server/provider-news'
export const runtime='nodejs'
export const maxDuration=120
export async function GET(){return Response.json(await providerNews(),{headers:{'Cache-Control':'no-store'}})}
