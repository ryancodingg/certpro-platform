import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ProviderLogo } from "@/components/provider-logo"
import type { NewsRecord } from "@/lib/catalog"
export function NewsCard({item}:{item:NewsRecord}) {
 return <article className="cp-news-card card-hover"><Link href={"/news/"+item.id} className="cp-news-link"><div className="cp-news-top"><span className="cp-news-tag">{item.provider} · {item.type}</span><ProviderLogo provider={item.provider} className="h-7 w-7"/></div><h3>{item.title}</h3><p>{item.summary}</p>{item.eligibility&&<p className="cp-note"><strong>Eligibility:</strong> {item.eligibility}</p>}<div className="cp-card-footer"><span className="cp-note">Verified {item.verified_on}</span><span className="cp-text-link">Read update <ArrowRight size={16}/></span></div></Link></article>
}
