import Link from "next/link"
import { requireOwner, HttpError } from "@/lib/server/firebase"
export default async function AdminLayout({children}: {children:React.ReactNode}) {
  try { await requireOwner() } catch(e) {
    return <main className="min-h-screen bg-black grid-pattern text-white p-8"><section className="mx-auto max-w-xl flex flex-col gap-5 py-16"><Link href="/" className="gradient-text text-3xl font-bold">CertPro</Link><h1 className="text-2xl font-semibold">Owner access required</h1><p role="alert">{e instanceof HttpError ? e.message : "Owner verification is temporarily unavailable."}</p><Link className="underline" href="/auth/login">Sign in</Link></section></main>
  }
  return children
}
