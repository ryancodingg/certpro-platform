"use client"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { onAuthStateChanged, signOut, type User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import useSWR from "swr"
const AuthContext = createContext<{user: {id: string; email: string; name?: string; isVerified: boolean} | null; isLoading: boolean; isOwner: boolean; logout: () => Promise<void>} | undefined>(undefined)
export function AuthProvider({children}: {children: ReactNode}) {
  const [firebaseUser, setUser] = useState<User | null>(null)
  const [isLoading, setLoading] = useState(true)
  useEffect(() => onAuthStateChanged(auth, user => { setUser(user); setLoading(false) }), [])
  const {data, mutate} = useSWR(firebaseUser ? ["/api/auth/session", firebaseUser.uid] : null, async ([url]) => {const r = await fetch(url); return r.ok ? r.json() : {isOwner:false} })
  const logout = async () => { await fetch("/api/auth/session", {method:"DELETE"}); await signOut(auth); await mutate({isOwner:false}) }
  const user = firebaseUser ? {id:firebaseUser.uid, email:firebaseUser.email ?? "", name:firebaseUser.displayName ?? undefined, isVerified:firebaseUser.emailVerified} : null
  return <AuthContext.Provider value={{user, isLoading, isOwner:!!data?.isOwner, logout}}>{children}</AuthContext.Provider>
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error("AuthProvider is required"); return value }
