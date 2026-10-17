import { failure, requireOwner, sameOrigin } from "@/lib/server/firebase"
export async function POST(request: Request) {
  try { sameOrigin(request); await requireOwner(); return Response.json({error:"Automatic question generation is disabled. Import validated, sourced questions through bank management."},{status:410}) } catch(e) { return failure(e) }
}
