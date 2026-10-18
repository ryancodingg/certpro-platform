import { cookies } from 'next/headers'
import { HttpError, services } from './firebase'
export async function learner(request: Request, required=false) {
 const {auth}=services(); const authorization=request.headers.get('authorization'); const session=(await cookies()).get('__session')?.value
 if(!authorization&&!session){if(required)throw new HttpError(401,'Sign in to save your learning progress.');return null}
 try { const identity=authorization?.startsWith('Bearer ')?await auth.verifyIdToken(authorization.slice(7),true):session?await auth.verifySessionCookie(session,true):null
 if(!identity)throw new Error('Missing identity');return identity.uid
 }catch{throw new HttpError(401,'Your session has expired. Please sign in again.')}
}
