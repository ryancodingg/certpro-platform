import { auth } from '@/lib/firebase'
export async function learnerFetch(url:string, init:RequestInit={}) {
 const headers=new Headers(init.headers)
 if(auth.currentUser)headers.set('Authorization',`Bearer ${await auth.currentUser.getIdToken()}`)
 return fetch(url,{...init,headers})
}
