"use client"
import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence, updateProfile } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
export function AuthForm({mode}: {mode:"login"|"signup"|"reset"}) {
  const router = useRouter()
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState("")
  const title = mode === "login" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset your password"
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("")
    const data = new FormData(event.currentTarget)
    const email = String(data.get("email")).trim(), password=String(data.get("password") ?? "")
    try {
      if (mode === "reset") { await sendPasswordResetEmail(auth,email); setMessage("If an account exists, a password-reset email will be sent."); return }
      if (mode === "signup") { const result=await createUserWithEmailAndPassword(auth,email,password); const name=String(data.get("name")||"").trim();if(name)await updateProfile(result.user,{displayName:name}); await sendEmailVerification(result.user); await signOut(auth); setMessage("Account created. Verify your email, then sign in."); return }
      // Embedded previews may block persistent third-party storage. Keep auth usable in the current tab.
      try { await setPersistence(auth,browserLocalPersistence) } catch { try { await setPersistence(auth,browserSessionPersistence) } catch { await setPersistence(auth,inMemoryPersistence) } }
      const credential = await signInWithEmailAndPassword(auth,email,password)
      const response=await fetch("/api/auth/session",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({idToken:await credential.user.getIdToken(true)})})
      const result=await response.json()
      if (!response.ok) { await signOut(auth); throw new Error(result.error) }
      router.push("/"); router.refresh()
    } catch(error) { const code=(error as {code?:string}).code; setMessage(code ? ({"auth/invalid-api-key":"This preview has an invalid Firebase public API key. Open the live site while its configuration is corrected.","auth/invalid-credential":"Email or password is incorrect.","auth/network-request-failed":"Sign-in could not reach Firebase. Try opening this page in a new browser tab.","auth/too-many-requests":"Too many sign-in attempts. Please wait and try again."}[code] || `Sign-in failed (${code}). Please retry or open this page in a browser tab.`) : (error as Error).message) }
    finally {setBusy(false)}
  }
  return <main className="min-h-screen bg-background grid-pattern text-foreground px-4 py-16"><div className="mx-auto max-w-md flex flex-col gap-8"><Link href="/" className="gradient-text font-bold text-3xl">CertPro</Link><Card><CardHeader><CardTitle>{title}</CardTitle><CardDescription>Secure email and password authentication. Embedded previews use a separate sign-in session.</CardDescription></CardHeader><CardContent><form onSubmit={submit} className="flex flex-col gap-5">{mode==="signup"&&<label className="flex flex-col gap-2">Your name<input className="rounded-md border border-input bg-background p-3" name="name" autoComplete="name" maxLength={80} required/></label>}<label className="flex flex-col gap-2">Email<input className="rounded-md border border-input bg-background p-3" name="email" type="email" autoComplete="email" required /></label>{mode!=="reset" && <label className="flex flex-col gap-2">Password<input className="rounded-md border border-input bg-background p-3" name="password" type="password" autoComplete={mode==="signup"?"new-password":"current-password"} minLength={mode==="signup"?8:1} required /></label>}<Button disabled={busy} type="submit">{busy?"Please wait…":mode==="login"?"Sign in":mode==="signup"?"Create account":"Send reset email"}</Button>{message&&<Alert><AlertDescription>{message}</AlertDescription></Alert>}<div className="flex flex-wrap gap-4 text-sm"><Link href="/auth/login">Sign in</Link><Link href="/auth/signup">Create account</Link><Link href="/auth/forgot-password">Forgot password?</Link></div></form></CardContent></Card></div></main>
}
