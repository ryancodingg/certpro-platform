import { news, isActiveNews, type CertificationRecord } from "@/lib/catalog"
export function latestNews(limit = 5) {
  return news.filter(item => isActiveNews(item)).sort((a,b) => (b.published_on || b.verified_on).localeCompare(a.published_on || a.verified_on) || a.id.localeCompare(b.id)).slice(0,limit)
}
export function relatedNews(certification: CertificationRecord) {
  return latestNews(news.length).filter(item => item.provider === certification.provider).sort((a,b) => Number(b.source_url === certification.official_url) - Number(a.source_url === certification.official_url)).slice(0,3)
}
