import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ProviderLogo } from "@/components/provider-logo"
import type { NewsRecord } from "@/lib/catalog"
import {newsTypeLabel,hasNewsSummary} from "@/lib/news-presentation"
export function NewsCard({item}:{item:NewsRecord}) {
 return <article className="cp-news-card card-hover" style={{ height: "100%", minWidth: 0 }}><Link href={"/news/"+item.id} className="cp-news-link" style={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}><div className="cp-news-top"><span className="cp-news-tag">{item.provider} · {newsTypeLabel(item.type)}</span><ProviderLogo provider={item.provider} className="h-7 w-7"/></div><h3>{item.title}</h3><p>{item.summary}</p>{!hasNewsSummary(item)&&<span className="cp-summary-pending">Official source available · summary pending</span>}{(item.expires_on||item.event_on)&&<p className="cp-news-deadline"><strong>{item.expires_on?"Offer ends":"Key date"}:</strong> {item.expires_on||item.event_on}</p>}{item.eligibility&&<p className="cp-note"><strong>Eligibility:</strong> {item.eligibility}</p>}<div className="cp-card-footer"><span className="cp-note">{item.published_on?"Published "+item.published_on:"Source checked "+item.verified_on}</span><span className="cp-text-link">{hasNewsSummary(item)?"Read summary":"View source details"} <ArrowRight size={16}/></span></div></Link></article>
}
