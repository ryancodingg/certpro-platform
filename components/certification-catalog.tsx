"use client"
import useSWR from "swr"
import {filterPracticeAvailability,type CatalogAvailability} from "@/lib/catalog-availability"
import styles from "./catalog-discovery.module.css"
import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import {ScrollHeading} from "./scroll-heading"
import Link from "next/link"
import {useSearchParams} from "next/navigation"
import { ArrowRight, SlidersHorizontal } from "lucide-react"
import { certifications, providers } from "@/lib/catalog"
import { jobRoles, certificationMatchesJob, certificationJobLabels } from "@/lib/job-roles"
import previews from "@/data/guide-previews.json"
import { ProviderLogo } from "@/components/provider-logo"
const shortcutIds=['data-engineer','cloud-engineer','cybersecurity-specialist','data-analyst','ai-ml-engineer','software-developer']
function Availability({value,loading}:{value?:CatalogAvailability;loading:boolean}){
 return <div className={styles.availability}>
  <strong>{loading?'Checking practice availability…':value?.count!==null&&value?.count!==undefined?`${value.count} ${value.source==='backup'?'backup':'published'} ${value.count===1?'question':'questions'}`:'Question count unavailable'}</strong>
  {!loading&&<span>{value?.practice==='available'?(value?.mock==='available'?'Practical Mode · Mock Exam':'Practical Mode · Mock unavailable'):value?.practice==='empty'?'Questions not yet published':'Availability not confirmed'}</span>}
 </div>
}
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
 const practiceOnly=searchParams.get("availability")==="practice"
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
 useEffect(() => { setPage(1) }, [query, provider, level, job, sort, practiceOnly])
 const matching = useMemo(() => certifications.filter(c =>
   (provider === "All" || c.provider === provider) &&
   (level === "All" || c.level === level) && certificationMatchesJob(c.id, job) &&
   [c.name, c.provider, c.level, ...c.aliases, ...certificationJobLabels(c.id)].join(" ").toLowerCase().includes(query.trim().toLowerCase())
 ).sort((a, b) => sort === "active" ? Number(b.status === "active") - Number(a.status === "active") || a.name.localeCompare(b.name) : sort === "provider" ? a.provider.localeCompare(b.provider) || a.name.localeCompare(b.name) : a.name.localeCompare(b.name)), [query, provider, level, job, sort])
 const {data:availability,isLoading:availabilityLoading,isValidating,error:availabilityError,mutate}=useSWR('/api/catalog-availability?scope=all',async url=>{const response=await fetch(url);if(!response.ok)throw Error('Availability check failed');return response.json() as Promise<{items:Record<string,CatalogAvailability>}>},{revalidateOnFocus:false,shouldRetryOnError:false,dedupingInterval:300000})
 const filtered=filterPracticeAvailability(matching,availability?.items,practiceOnly)
 const unknownCount=matching.filter(c=>!availability?.items[c.id]||availability.items[c.id].practice==='unknown').length
 const retryAt=useRef(0)
 const [retryCooling,setRetryCooling]=useState(false)
 useEffect(()=>{if(!retryCooling)return;const timer=setTimeout(()=>setRetryCooling(false),10000);return()=>clearTimeout(timer)},[retryCooling])
 const retry=()=>{if(Date.now()<retryAt.current||isValidating)return;retryAt.current=Date.now()+10000;setRetryCooling(true);void mutate()}
 const catalogParams = new URLSearchParams()
 for (const [key,value] of [["q",query],["provider",provider],["level",level],["job",job],["sort",sort],["availability",practiceOnly?"practice":"All"]]) if(value && value !== "All" && !(key === "sort" && value === "active")) catalogParams.set(key,value)
 const catalogHref = "/certifications" + (catalogParams.size ? "?"+catalogParams.toString() : "")
 const size = compact ? 6 : 12
 const pages = Math.max(1, Math.ceil(filtered.length / size))
 const current = Math.min(page, pages)
 const shown=filtered.slice((current-1)*size,current*size)
 const clear = () => {
   const params = new URLSearchParams(window.location.search)
   for (const key of ["q", "provider", "level", "job", "sort", "availability"]) params.delete(key)
   const suffix = params.toString()
   window.history.replaceState(null, "", window.location.pathname + (suffix ? "?" + suffix : "") + window.location.hash)
   setPage(1)
 }
 return <section id="catalog" className="cp-section"><div className="cp-section-heading"><div><p className="cp-eyebrow">FIND YOUR PATH</p><ScrollHeading as={compact?'h2':'h1'} text={compact?"What will you learn next?":"Choose your learning path"}/><p>Know your exam? Search by name or code. Exploring a new path? Choose your job role.</p></div>{compact&&<Link className="cp-text-link" href="/certifications">View all {certifications.length} certifications <ArrowRight size={17}/></Link>}</div><div className={styles.roles} role="group" aria-label="Explore by career"><button type="button" aria-pressed={job==='All'} onClick={()=>updateFilter('job','All')}>All careers</button>{shortcutIds.map(id=>{const role=jobRoles.find(r=>r.id===id)!;return <button type="button" key={id} aria-pressed={job===id} onClick={()=>updateFilter('job',id)}>{role.label}</button>})}</div><div className={styles.scope} role="group" aria-label="Practice availability"><button type="button" aria-pressed={!practiceOnly} onClick={()=>updateFilter("availability","All")}>All certifications</button><button type="button" aria-pressed={practiceOnly} onClick={()=>updateFilter("availability","practice")}>Practice available</button></div><div className="cp-catalog-search cp-filters"><label className="cp-filter-search"><span>Search certifications</span><input value={query} onChange={e=>updateFilter("q",e.target.value)} placeholder="Try DP-700, Azure or data engineer"/></label><label><span>More careers</span><select value={job} onChange={e=>updateFilter("job",e.target.value)}><option value="All">All careers</option>{jobRoles.map(role=><option key={role.id} value={role.id}>{role.label}</option>)}</select></label><button className="cp-secondary" aria-expanded={filtersOpen} aria-controls="catalog-filter-controls" onClick={()=>setFiltersOpen(!filtersOpen)}><SlidersHorizontal size={16}/>{filtersOpen?"Fewer filters":"More filters"}{[provider!=="All",level!=="All",sort!=="active"].filter(Boolean).length>0?` (${[provider!=="All",level!=="All",sort!=="active"].filter(Boolean).length})`:""}</button></div><div id="catalog-filter-controls" className="cp-catalog-secondary" hidden={!filtersOpen}><div className="cp-filters"><label><span>Provider</span><select value={provider} onChange={e=>updateFilter("provider",e.target.value)}><option value="All">All providers</option>{providers.map(p=><option key={p}>{p}</option>)}</select></label><label><span>Level</span><select value={level} onChange={e=>updateFilter("level",e.target.value)}><option value="All">All levels</option>{levels.map(l=><option key={l} value={l}>{l.charAt(0).toUpperCase()+l.slice(1)}</option>)}</select></label><label><span>Sort by</span><select value={sort} onChange={e=>updateFilter("sort",e.target.value)}><option value="active">Active exams first</option><option value="name">Name A–Z</option><option value="provider">Provider</option></select></label></div></div>{(query||provider!=="All"||job!=="All"||level!=="All"||sort!=="active"||practiceOnly)&&<div className="cp-active-filters"><span>Filters: {[query&&`“${query}”`,provider!=="All"&&provider,job!=="All"&&jobRoles.find(r=>r.id===job)?.label,level!=="All"&&level,sort!=="active"&&`Sort: ${sort}`,practiceOnly&&"Practice available"].filter(Boolean).join(' · ')}</span><button className="cp-clear" onClick={clear}>Reset filters</button></div>}{(availabilityError||unknownCount>0)&&!availabilityLoading&&<div className={styles.retry} role="status"><span>{practiceOnly?`${unknownCount} matching certifications have unconfirmed availability and are not included below.`:"Some availability could not be confirmed."}</span><button type="button" onClick={retry} disabled={isValidating||retryCooling}>{isValidating?"Checking…":retryCooling?"Try again shortly":"Retry availability"}</button></div>}<p className="cp-result-count" aria-live="polite">{practiceOnly&&availabilityLoading?"Checking practice availability…":compact?`Showing ${Math.min(size,filtered.length)} of ${filtered.length} matching certifications`:`${filtered.length} of ${certifications.length} certifications`}</p><div className="cp-cards">{shown.map(c=><article key={c.id} className="cp-cert-card card-hover"><Link className="cp-card-link" href={"/certification/"+c.id}><div className="cp-card-art"><ProviderLogo provider={c.provider} className="h-12 w-12"/><span>{c.provider}</span><span className="cp-level">{c.level.charAt(0).toUpperCase()+c.level.slice(1)}</span></div><div className="cp-card-body">{c.status!=="active"&&<span className="cp-status">{c.status}</span>}<h3>{c.name}</h3><p>{(previews as Record<string,{overview:string}>)[c.id]?.overview||`Explore ${c.provider} exam objectives for ${c.name}.`}</p>{certificationJobLabels(c.id).length>0&&<p className="cp-note">For {certificationJobLabels(c.id).slice(0,2).join(" · ")}</p>}<Availability value={availability?.items[c.id]} loading={availabilityLoading&&!availabilityError}/><div className="cp-card-footer"><span className="cp-text-link">View certification <ArrowRight size={16}/></span></div></div></Link></article>)}</div>{!filtered.length&&!(practiceOnly&&availabilityLoading)&&<div className="cp-empty"><h3>No certifications match those filters.</h3><p>Try an exam code, a broader keyword, or reset your filters.</p><button className="cp-primary" onClick={clear}>Show all certifications</button></div>}{compact?<div className="cp-pagination"><Link className="cp-secondary" href={catalogHref}>Browse all {filtered.length} matching certifications <ArrowRight size={17}/></Link></div>:<div className="cp-pagination"><button disabled={current===1} onClick={()=>setPage(current-1)}>Previous</button><span>Page {current} of {pages}</span><button disabled={current===pages} onClick={()=>setPage(current+1)}>Next</button></div>}</section>
}
