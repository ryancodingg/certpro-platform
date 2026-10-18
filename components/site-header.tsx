import { WelcomeBack } from "@/components/learner-progress"
import Link from "next/link"
import { Search } from "lucide-react"
import { AuthNav } from "@/components/auth-nav"
export function SiteHeader(){return <><header className="cp-header"><Link href="/" className="gradient-text text-3xl font-bold" aria-label="CertPro home">CertPro</Link><form action="/certifications" className="cp-search" role="search"><Search size={19} aria-hidden="true"/><input name="q" aria-label="Search certifications" placeholder="What do you want to get certified in?"/><button type="submit" aria-label="Search catalog">Search</button></form><nav aria-label="Main navigation" className="cp-nav"><Link href="/certifications">Explore certifications</Link><Link href="/news">News & discounts</Link><Link href="/progress">My Progress</Link><AuthNav/></nav></header><WelcomeBack/></>}
