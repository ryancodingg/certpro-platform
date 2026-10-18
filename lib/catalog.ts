import rawCatalog from "@/data/certifications.json"
import rawNews from "@/data/news-seed.json"

export type CertificationRecord = { id: string; name: string; provider: string; official_url: string; level: string; status: string; verified_on: string }
export type NewsRecord = { id: string; type: string; provider: string; title: string; summary: string; source_url: string; verified_on: string; published_on: string | null; expires_on?: string | null; expiry_note?: string; eligibility?: string; event_on?: string; status: string }

export const certifications = (rawCatalog.certifications as CertificationRecord[]).map((item) => ({ ...item, aliases: item.id === "fabric-data-engineer-associate" ? ["dp-700"] : item.id === "azure-fundamentals" ? ["az-900"] : item.id === "aws-cloud-practitioner" ? ["aws-clf-c02"] : item.id === "aws-solutions-architect-associate" ? ["aws-saa-c03"] : item.id === "databricks-certified-data-engineer-associate" ? ["databricks-certified-data-engineer-associate"] : [] }))
export const news = rawNews.items as NewsRecord[]
export const verifiedOn = rawCatalog.verified_on
export const providers = Array.from(new Set(certifications.map((item) => item.provider)))
export const certificationById = (id: string) => certifications.find((item) => item.id === id || item.aliases.includes(id))
export const isActiveNews = (item: NewsRecord, now = new Date()) => item.status === "published" && (!item.expires_on || new Date(`${item.expires_on}T23:59:59Z`) >= now)
