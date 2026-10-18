"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { AuthNav } from "@/components/auth-nav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { certificationById, verifiedOn } from "@/lib/catalog"

export default function CertificationDetailPage() {
  const params = useParams<{ id: string }>()
  const certification = certificationById(params.id)

  if (!certification) {
    return <main className="min-h-screen bg-black grid-pattern px-4 py-16 text-white"><div className="mx-auto max-w-xl"><Link href="/certifications" className="mb-8 inline-flex items-center gap-2 text-sm text-gray-300 underline"><ArrowLeft className="h-4 w-4" />Back to certifications</Link><Card className="border-gray-800 bg-gray-900/60"><CardContent className="p-8"><h1 className="text-2xl font-bold">Certification Not Found</h1><p className="mt-2 text-gray-400">This directory entry is not available under that link.</p></CardContent></Card></div></main>
  }

  return <div className="min-h-screen bg-black grid-pattern text-white"><header className="border-b border-gray-800 bg-black/60"><div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4"><Link href="/" className="gradient-text text-2xl font-bold">CertPro</Link><nav className="flex items-center gap-5 text-sm text-gray-300"><Link href="/certifications">Certifications</Link><Link href="/news">News & Discounts</Link><AuthNav /></nav></div></header><main className="mx-auto max-w-6xl px-4 py-10"><Link href="/certifications" className="mb-8 inline-flex items-center gap-2 text-sm text-gray-300 underline"><ArrowLeft className="h-4 w-4" />All certifications</Link><div className="mb-8 flex flex-wrap items-start justify-between gap-5"><div><p className="text-sm uppercase tracking-widest text-blue-300">{certification.provider}</p><h1 className="mt-2 text-4xl font-bold">{certification.name}</h1><p className="mt-3 text-gray-400">Official directory listing, verified {certification.verified_on || verifiedOn}.</p></div><Badge variant="secondary">{certification.status}</Badge></div><div className="mb-6 flex flex-wrap gap-3"><Button asChild><Link href={`/practice?certification=${encodeURIComponent(certification.aliases[0] || certification.id)}`}>Practical Mode</Link></Button><Button asChild variant="outline"><Link href={`/quiz/${encodeURIComponent(certification.aliases[0] || certification.id)}?mode=exam`}>Mock Exam</Link></Button></div><div className="grid gap-6 lg:grid-cols-3"><Card className="border-gray-800 bg-gray-900/60 lg:col-span-2"><CardHeader><CardTitle>Certification details</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><div><p className="text-sm text-gray-500">Provider</p><p className="mt-1">{certification.provider}</p></div><div><p className="text-sm text-gray-500">Type</p><p className="mt-1">{certification.level}</p></div><div><p className="text-sm text-gray-500">Status</p><p className="mt-1">{certification.status}</p></div><div><p className="text-sm text-gray-500">Verified date</p><p className="mt-1">{certification.verified_on || verifiedOn}</p></div></CardContent></Card><Card className="border-gray-800 bg-gray-900/60"><CardHeader><CardTitle>Official source</CardTitle></CardHeader><CardContent><p className="mb-4 text-sm text-gray-400">Use the provider page for eligibility, exam fees, expiry, and current requirements.</p><Button asChild className="w-full"><a href={certification.official_url} target="_blank" rel="noopener noreferrer">Open official page <ExternalLink data-icon="inline-end" /></a></Button></CardContent></Card></div></main></div>
}
