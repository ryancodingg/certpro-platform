import {certificationById} from '@/lib/catalog'
import {catalogAvailability} from '@/lib/server/catalog-availability'
export const runtime='nodejs'
export const maxDuration=30
export async function GET(request:Request){
 const params=new URL(request.url).searchParams
 const all=params.get('scope')==='all'
 const ids=[...new Set((params.get('ids')||'').split(',').filter(Boolean))]
 if(!all&&(!ids.length||ids.length>12||ids.some(id=>!certificationById(id))))return Response.json({error:'Choose up to 12 catalog certifications or the full catalog scope.'},{status:400})
 const items=await catalogAvailability()
 // Counts only: question text, answer keys and account data never leave this endpoint.
 return Response.json({items:all?items:Object.fromEntries(ids.map(id=>[id,items[id]]))},{headers:{'Cache-Control':'no-store'}})
}
