"use client"
import {useState} from "react"
import {usePathname} from "next/navigation"
import {useAuth} from "@/hooks/use-auth"
import {WelcomeBack} from "@/components/learner-progress"
import Link from "next/link"
import {Search, Menu, X} from "lucide-react"
import {LearningTools,openLearningCalendar} from "@/components/learning-tools"
import {AuthNav} from "@/components/auth-nav"
import {providers} from "@/lib/catalog"
export function SiteHeader({authReturnTo}:{authReturnTo?:string}){
 const {user}=useAuth();const path=usePathname();const [open,setOpen]=useState(false)
 return <><header className="cp-header cp-learning-header">
 <Link href="/" className="cp-brand" aria-label="CertPro home"><img src="/brand/certpro-fox-b-180.png" alt="" width={38} height={38} className="cp-brand-mascot"/><span className="gradient-text">CertPro</span></Link>
 <Link href="/certifications" className="cp-explore-link">Explore</Link>
 <form action="/certifications" className="cp-search" role="search"><Search size={19} aria-hidden="true"/><input name="q" aria-label="Search certifications" placeholder="Search certifications, providers or exam codes"/><button type="submit" aria-label="Search catalog">Search</button></form>
 <nav aria-label="Main navigation" className="cp-desktop-links"><Link href="/news" aria-current={path==='/news'?'page':undefined}>News & discounts</Link><Link href="/pricing">Subscribe</Link>{user&&<><Link href="/progress">My Progress</Link></>}</nav>
 <LearningTools/><div className="cp-account"><AuthNav returnTo={authReturnTo}/></div><button className="cp-menu-toggle" aria-label={open?'Close navigation':'Open navigation'} aria-expanded={open} aria-controls="certpro-mobile-nav" onClick={()=>setOpen(!open)}>{open?<X size={23}/>:<Menu size={23}/>}</button>
 </header>
 {open&&<nav id="certpro-mobile-nav" className="cp-mobile-links" aria-label="Mobile navigation"><Link onClick={()=>setOpen(false)} href="/certifications">Explore certifications</Link><Link onClick={()=>setOpen(false)} href="/news">News & discounts</Link><Link onClick={()=>setOpen(false)} href="/pricing">Subscribe</Link>{user&&<><Link onClick={()=>setOpen(false)} href="/progress">My Progress</Link><button onClick={()=>{setOpen(false);openLearningCalendar()}}>My Calendar</button></>}</nav>}
 <nav className="cp-category-bar cp-header-providers" aria-label="Browse certification providers">{providers.map(p=><Link key={p} href={'/certifications?provider='+encodeURIComponent(p)}>{p}</Link>)}</nav><WelcomeBack/></>
}
