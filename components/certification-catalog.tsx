"use client"
import { Suspense, useEffect, useMemo, useState } from "react"
import {ScrollHeading} from "./scroll-heading"
import Link from "next/link"
import {useSearchParams} from "next/navigation"
import { ArrowRight, SlidersHorizontal } from "lucide-react"
import { certifications, providers } from "@/lib/catalog"
import { jobRoles, certificationMatchesJob, certificationJobLabels } from "@/lib/job-roles"
import {guideFor} from "@/lib/exam-guide"
import { ProviderLogo } from "@/components/provider-logo"
export function CertificationCatalog(props:{compact?:boolean}) {return <Suspense fallback={<p role="status">Loading certifications…</p>}><CatalogContent {...props}/></Suspense>}
function CatalogContent({compact=false}:{compact?:boolean}) {
 const searchParams = useSearchParams()
 const levels = useMemo(() => Array.from(new Set(certifications.map(c => c.level))).sort(), [])
 const query = searchParams.get("q") ?? ""
 const providerValue = searchParams.get("provider") ?? "All"
 const provider = providers.includes(providerValue) ? providerValue : "All"
 const levelValue = searchParams.get("level") ?? "All"
 const level = levels.includes(levelValue) ? levelValue : "All"
 const jobValue = searchParams.get("job") ?? "All"
 const job = jobRoles.some(role => role.id === jobValue) ? jobValue : "All"
 const sortValue = searchParams.get("sort")
 const sort = sortValue === "provider" || sortValue === "name" ? sortValue : "active"
 const [page, setPage] = useState(1)
 const [filtersOpen,setFiltersOpen]=useState(false)
 // Native history is integrated with Next's search params, avoiding a server navigation per keystroke.
 const updateFilter = (key: string, value: string) => {
   const params = new URLSearchParams(window.location.search)
   if (!value || value === "All" || (key === "sort" && value === "active")) params.delete(key)
   else params.set(key, value)
   const suffix = params.toString()
   window.history.replaceState(null, "", window.location.pathname + (suffix ? "?" + suffix : "") + window.location.hash)
   setPage(1)
 }
 useEffect(() => { setPage(1) }, [query, provider, level, job, sort])
 const filtered = useMemo(() => certifications.filter(c =>
   (provider === "All" || c.provider === provider) &&
   (level === "All" || c.level === level) && certificationMatchesJob(c.id, job) &&
   [c.name, c.provider, c.level, ...c.aliases, ...certificationJobLabels(c.id)].join(" ").toLowerCase().includes(query.trim().toLowerCase())
 ).sort((a, b) => sort === "active" ? Number(b.status === "active") - Number(a.status === "active") || a.name.localeCompare(b.name) : sort === "provider" ? a.provider.localeCompare(b.provider) || a.name.localeCompare(b.name) : a.name.localeCompare(b.name)), [query, provider, level, job, sort])
 const catalogParams = new URLSearchParams()
 for (const [key,value] of [["q",query],["provider",provider],["level",level],["job",job],["sort",sort]]) if(value && value !== "All" && !(key === "sort" && value === "active")) catalogParams.set(key,value)
 const catalogHref = "/certifications" + (catalogParams.size ? "?"+catalogParams.toString() : "")
 const size = compact ? 6 : 12
 const pages = Math.max(1, Math.ceil(filtered.length / size))
 const current = Math.min(page, pages)
 const clear = () => {
   const params = new URLSearchParams(window.location.search)
   for (const key of ["q", "provider", "level", "job", "sort"]) params.delete(key)
   const suffix = params.toString()
   window.history.replaceState(null, "", window.location.pathname + (suffix ? "?" + suffix : "") + window.location.hash)
   setPage(1)
 }
 return <section id="catalog" className="cp-section"><div className="cp-section-heading"><div><p className="cp-eyebrow">FIND YOUR PATH</p><ScrollHeading as={compact?'h2':'h1'} text={compact?"What will you learn next?":"Choose your learning path"}/><p>Know your exam? Search by name or code. Exploring a new path? Choose your job role.</p></div>{compact&&<Link className="cp-text-link" href="/certifications">View all {certifications.length} certifications <ArrowRight size={17}/></Link>}</div><div className="cp-catalog-search cp-filters"><label className="cp-filter-search"><span>Search certifications</span><input value={query} onChange={e=>updateFilter("q",e.target.value)} placeholder="Try DP-700, Azure or data engineer"/></label><label><span>Job role</span><select value={job} onChange={e=>updateFilter("job",e.target.value)}><option value="All">All jobs</option>{jobRoles.map(role=><option key={role.id} value={role.id}>{role.label}</option>)}</select></label><button className="cp-secondary" aria-expanded={filtersOpen} aria-controls="catalog-filter-controls" onClick={()=>setFiltersOpen(!filtersOpen)}><SlidersHorizontal size={16}/>{filtersOpen?"Fewer filters":"More filters"}{[provider!=="All",level!=="All",sort!=="active"].filter(Boolean).length>0?` (${[provider!=="All",level!=="All",sort!=="active"].filter(Boolean).length})`:""}</button></div><div id="catalog-filter-controls" className="cp-catalog-secondary" hidden={!filtersOpen}><div className="cp-filters"><label><span>Provider</span><select value={provider} onChange={e=>updateFilter("provider",e.target.value)}><option value="All">All providers</option>{providers.map(p=><option key={p}>{p}</option>)}</select></label><label><span>Level</span><select value={level} onChange={e=>updateFilter("level",e.target.value)}><option value="All">All levels</option>{levels.map(l=><option key={l} value={l}>{l.charAt(0).toUpperCase()+l.slice(1)}</option>)}</select></label><label><span>Sort by</span><select value={sort} onChange={e=>updateFilter("sort",e.target.value)}><option value="active">Active exams first</option><option value="name">Name A–Z</option><option value="provider">Provider</option></select></label></div></div>{(query||provider!=="All"||job!=="All"||level!=="All"||sort!=="active")&&<div className="cp-active-filters"><span>Filters: {[query&&`“${query}”`,provider!=="All"&&provider,job!=="All"&&jobRoles.find(r=>r.id===job)?.label,level!=="All"&&level,sort!=="active"&&`Sort: ${sort}`].filter(Boolean).join(' · ')}</span><button className="cp-clear" onClick={clear}>Reset filters</button></div>}<p className="cp-result-count" aria-live="polite">{compact?`Showing ${Math.min(size,filtered.length)} of ${filtered.length} matching certifications`:`${filtered.length} of ${certifications.length} certifications`}</p><div className="cp-cards">{filtered.slice((current-1)*size,current*size).map(c=><article key={c.id} className="cp-cert-card card-hover"><Link className="cp-card-link" href={"/certification/"+c.id}><div className="cp-card-art"><ProviderLogo provider={c.provider} className="h-12 w-12"/><span>{c.provider}</span><span className="cp-level">{c.level.charAt(0).toUpperCase()+c.level.slice(1)}</span></div><div className="cp-card-body">{c.status!=="active"&&<span className="cp-status">{c.status}</span>}<h3>{c.name}</h3><p>{guideFor(c.id).overview||`Explore ${c.provider} exam objectives for ${c.name}.`}</p>{certificationJobLabels(c.id).length>0&&<p className="cp-note">For {certificationJobLabels(c.id).slice(0,2).join(" · ")}</p>}<div className="cp-card-footer"><span className="cp-text-link">View exam & practice availability <ArrowRight size={16}/></span></div></div></Link></article>)}</div>{!filtered.length&&<div className="cp-empty"><h3>No certifications match those filters.</h3><p>Try an exam code, a broader keyword, or reset your filters.</p><button className="cp-primary" onClick={clear}>Show all certifications</button></div>}{compact?<div className="cp-pagination"><Link className="cp-secondary" href={catalogHref}>Browse all {filtered.length} matching certifications <ArrowRight size={17}/></Link></div>:<div className="cp-pagination"><button disabled={current===1} onClick={()=>setPage(current-1)}>Previous</button><span>Page {current} of {pages}</span><button disabled={current===pages} onClick={()=>setPage(current+1)}>Next</button></div>}</section>
}
