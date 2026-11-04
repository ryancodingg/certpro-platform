import {after} from 'next/server'
import {newsSnapshot,refreshNewsInBackground} from '@/lib/server/provider-news'
export const runtime='nodejs'
export const maxDuration=120
export async function GET(){const snapshot=await newsSnapshot();after(refreshNewsInBackground);return Response.json(snapshot,{headers:{'Cache-Control':'public, s-maxage=60, stale-while-revalidate=300'}})}
