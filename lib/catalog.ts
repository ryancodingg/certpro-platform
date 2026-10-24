import rawCatalog from "@/data/certifications.json"
import rawNews from "@/data/news-seed.json"

export type CertificationRecord = { id: string; name: string; provider: string; official_url: string; level: string; status: string; verified_on: string }
export type NewsRecord = { id: string; type: string; provider: string; title: string; summary: string; article_paragraphs?: string[]; article_reviewed_on?: string; article_generated_on?: string; article_summary_kind?: "automatic" | "source-offer"; summary_attempted_on?: string; source_excerpt?: string; source_url: string; verified_on: string; published_on: string | null; expires_on?: string | null; expiry_note?: string; eligibility?: string; event_on?: string; status: string }

export const certifications = (rawCatalog.certifications as CertificationRecord[]).map((item) => ({ ...item, aliases: item.id === "fabric-data-engineer-associate" ? ["dp-700"] : item.id === "azure-fundamentals" ? ["az-900"] : item.id === "aws-cloud-practitioner" ? ["aws-clf-c02"] : item.id === "aws-solutions-architect-associate" ? ["aws-saa-c03"] : item.id === "databricks-certified-data-engineer-associate" ? ["databricks-certified-data-engineer-associate"] : [] }))
export const news = rawNews.items as NewsRecord[]
export const verifiedOn = rawCatalog.verified_on
export const providers = Array.from(new Set(certifications.map((item) => item.provider)))
export const certificationById = (id: string) => certifications.find((item) => item.id === id || item.aliases.includes(id))
export const isActiveNews = (item: NewsRecord, now = new Date()) => { const expiry = item.expires_on; if (item.status !== "published") return false; if (!expiry) return true; if (!/^\d{4}-\d{2}-\d{2}$/.test(expiry)) return false; const parsed = new Date(`${expiry}T23:59:59Z`); return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === expiry && parsed >= now }
