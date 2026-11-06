"use client"
import {useEffect,useId,useRef,useState} from 'react'
import Link from 'next/link'
import {ArrowRight,SlidersHorizontal} from 'lucide-react'
import {providerEventDirectories} from '@/lib/provider-events'
import {ProviderLogo} from './provider-logo'
import {useNews,type NewsSnapshot} from '@/lib/use-news'
import {useAuth} from '@/hooks/use-auth'
import {useProgress} from './learner-progress'
import {hasNewsSummary,isClosingSoon,newsTypeLabel} from '@/lib/news-presentation'
import {certificationById,isActiveNews} from '@/lib/catalog'
import {browseNews,readableDate,NEWS_PAGE_SIZE,type NewsTab,type NewsGroup} from '@/lib/news-browse'
import {readNewsBrowseState,writeNewsBrowseState,eventAttendanceDetails,type NewsBrowseState} from '@/lib/news-browse-state'
import styles from './news-feed.module.css'
import {UpdateTabs,ActiveFilters} from './discovery-controls'
import {matchesDiscoverySearch} from '@/lib/discovery-search'

const tabs:{id:NewsTab;label:string}[]=[{id:'news',label:'News'},{id:'events',label:'Events'},{id:'offers',label:'Exam offers'}]
export function FeedCard({group,tab,variant='default',headingLevel=2}:{group:NewsGroup;tab:NewsTab;variant?:'default'|'compact';headingLevel?:2|3}){
 const Heading=headingLevel===3?'h3':'h2',compact=variant==='compact'
 const {item,related}=group
 const eventDetails=eventAttendanceDetails(item)
 const date=tab==='events'?item.event_on||related.find(r=>r.event_on)?.event_on:tab==='offers'?item.expires_on:item.published_on||item.verified_on
 const generic=/^An upcoming .+ event\. Check the official listing/i.test(item.summary)
 return <article className={`cp-news-card ${styles.card} ${tab==='news'?styles.story:''} ${compact?styles.compact:''}`} >
  <div className={styles.meta}><span><ProviderLogo provider={item.provider} className="h-6 w-6"/>{item.provider}</span><span>{tab==='news'?newsTypeLabel(item.type):tab==='offers'?'Exam offer':'Event'}</span></div>
  <div className={styles.cardContent}>
   <p className={styles.date}>{tab==='news'?(item.published_on?'Published ':'Source checked '):tab==='offers'?(date?'Deadline · ':'No fixed deadline listed'):(date&&date<new Date().toISOString().slice(0,10)?'Started · ':'Event · ')}{(tab!=='offers'||date)&&readableDate(date)}</p>
   <Heading><Link href={'/news/'+item.id}>{item.title}</Link></Heading>
   {!generic&&<p className={styles.summary}>{item.summary}</p>}
   {!compact&&tab==='events'&&<div className={styles.condition}>{eventDetails.attendance&&<p>{eventDetails.attendance}</p>}{eventDetails.details&&<p>{eventDetails.details}</p>}{eventDetails.fallback&&<p>{eventDetails.fallback}</p>}</div>}
   {!compact&&tab!=='events'&&item.attendance&&<p className={styles.condition}>{item.attendance}</p>}
   {!compact&&!!item.exam_codes?.length&&<p className={styles.exams}>Exams: {item.exam_codes.join(' · ')}</p>}
   {!compact&&item.eligibility&&<p className={styles.condition}><strong>Eligibility:</strong> {item.eligibility}</p>}
   {!compact&&tab==='events'&&item.expires_on&&<p className={styles.condition}><strong>Exam deadline:</strong> {readableDate(item.expires_on)}</p>}
   {!compact&&!!related.length&&<details className={styles.related}><summary>{related.length} related official {related.length===1?'update':'updates'}</summary><ul>{related.map(r=><li key={r.id}><Link href={'/news/'+r.id}>{r.provider}: {r.title}</Link></li>)}</ul></details>}
  </div>
  <Link className={`cp-text-link ${styles.read}`} href={'/news/'+item.id}>{tab==='offers'?'View offer & conditions':tab==='events'?'View event details':hasNewsSummary(item)?'Read article':'View source details'}<ArrowRight size={16}/></Link>
 </article>
}
export function NewsFeed({initialNews,initialTab='news'}:{initialNews?:NewsSnapshot;initialTab?:NewsTab}){
 const panelId=useId()
 const {news,sources,refresh,error}=useNews(initialNews)
 const {user}=useAuth();const {data:progress}=useProgress()
 const [browse,setBrowse]=useState<NewsBrowseState>({tab:initialTab,provider:'All',query:'',scope:'all',page:1}),[filtersOpen,setFiltersOpen]=useState(false)
 const {tab,provider,query,scope,page}=browse
 const providerNames=Array.from(new Set(news.map(n=>n.provider))).sort(),providerKey=providerNames.join('|')
 useEffect(()=>{
  const restore=()=>{const next=readNewsBrowseState(new URLSearchParams(window.location.search),providerKey.split('|'),initialTab);setBrowse(next);setFiltersOpen(next.provider!=='All'||next.scope!=='all')}
  restore();window.addEventListener('popstate',restore);return()=>window.removeEventListener('popstate',restore)
 },[initialTab,providerKey])
 const updateBrowse=(patch:Partial<NewsBrowseState>,replace=false)=>{
  const next={...browse,...patch};setBrowse(next)
  const params=writeNewsBrowseState(next,new URLSearchParams(window.location.search)),url=window.location.pathname+'?'+params.toString()+window.location.hash
  if(replace)window.history.replaceState(null,'',url);else window.history.pushState(null,'',url)
 }
 const results=useRef<HTMLDivElement>(null)
 const savedProviders=new Set(progress.saved.map(s=>certificationById(s.certification)?.provider).filter(Boolean))
 const active=news.filter(n=>isActiveNews(n))
 const groups=browseNews(active,tab).filter(g=>[g.item,...g.related].some(n=>(provider==='All'||n.provider===provider)&&(scope!=='saved'||!!user&&savedProviders.has(n.provider))&&(scope!=='closing'||isClosingSoon(tab==='events'?{...n,expires_on:n.event_on}:n))&&matchesDiscoverySearch([n.title,n.summary,n.provider,...(n.exam_codes||[])],query)))
 const pages=Math.max(1,Math.ceil(groups.length/NEWS_PAGE_SIZE)),current=Math.min(page,pages),shown=groups.slice((current-1)*NEWS_PAGE_SIZE,current*NEWS_PAGE_SIZE)
 const reset=()=>updateBrowse({query:'',provider:'All',scope:'all',page:1})
 const changeTab=(next:NewsTab)=>updateBrowse({tab:next,page:1,scope:'all'})
 const changePage=(next:number)=>{updateBrowse({page:next});results.current?.focus({preventScroll:true});results.current?.scrollIntoView({block:'start',behavior:'instant'})}
 const sourceList=(sources||[]) as {provider:string;sourceUrl?:string;label?:string;status:string;checkedAt?:string}[]
 const affected=sourceList.filter(s=>(provider==='All'||s.provider===provider)&&s.status!=='ok')
 return <section className={`cp-section ${styles.feed}`}>
  <header className={styles.header}><h1 className="cp-page-title">News & Events</h1><p>Stay informed. Find your next event. Save on your exam.</p></header>
  <UpdateTabs value={tab} onChange={changeTab} panelId={panelId}/>
  <div className={styles.toolbar}><label className={styles.search}><span>Search {tab==='offers'?'exam offers':tab}</span><input aria-label="Search updates" placeholder={tab==='news'?'Search news or exam codes':tab==='events'?'Search events or providers':'Search offers or exam codes'} value={query} maxLength={300} onChange={e=>{updateBrowse({query:e.target.value,page:1},true)}}/></label><button className="cp-secondary" aria-expanded={filtersOpen} aria-controls="news-filters" onClick={()=>setFiltersOpen(!filtersOpen)}><SlidersHorizontal size={16}/>Filters{[provider!=='All',scope!=='all'].filter(Boolean).length?` (${[provider!=='All',scope!=='all'].filter(Boolean).length})`:''}</button></div>
  {filtersOpen&&<div id="news-filters" className={styles.filters}><label>Provider<select value={provider} onChange={e=>{updateBrowse({provider:e.target.value,page:1})}}><option value="All">All providers</option>{providerNames.map(p=><option key={p}>{p}</option>)}</select></label><label>Show<select value={scope} onChange={e=>{updateBrowse({scope:e.target.value as NewsBrowseState['scope'],page:1})}}><option value="all">All {tabs.find(t=>t.id===tab)?.label.toLowerCase()}</option><option value="saved" disabled={!user}>My saved providers{!user?' (sign in)':''}</option>{tab!=='news'&&<option value="closing">{tab==='events'?'Events in the next 30 days':'Offers ending in the next 30 days'}</option>}</select></label></div>}
  <ActiveFilters items={[
 ...(query?[{key:'q',label:`Search: ${query}`,remove:()=>updateBrowse({query:'',page:1})}]:[]),
 ...(provider!=='All'?[{key:'provider',label:provider,remove:()=>updateBrowse({provider:'All',page:1})}]:[]),
 ...(scope!=='all'?[{key:'scope',label:scope==='saved'?'My saved providers':tab==='events'?'Events in the next 30 days':'Offers ending in the next 30 days',remove:()=>updateBrowse({scope:'all',page:1})}]:[])
 ]} onClear={reset}/>
  <div id={panelId} role="tabpanel" aria-label={tabs.find(t=>t.id===tab)?.label} ref={results} tabIndex={-1} className={styles.results}>
   <p className={styles.count} aria-live="polite">{groups.length?`${(current-1)*NEWS_PAGE_SIZE+1}–${Math.min(current*NEWS_PAGE_SIZE,groups.length)} of ${groups.length}`:'0'} {tab==='news'?'articles':tab==='events'?'events':'offers'} · {tab==='news'?'Newest first':tab==='events'?'Soonest events first':'Nearest deadlines first'}</p>
   {error&&<p role="status" className={styles.notice}>Live refresh is unavailable. You can still browse saved updates.</p>}
   <div className={tab==='news'?styles.stories:styles.grid}>{shown.map(g=><FeedCard key={tab+g.item.id} group={g} tab={tab}/>)}</div>
   {!groups.length&&<div className="cp-empty"><h2>No {tab==='news'?'articles':tab} match your filters.</h2><p>Try a broader search or another provider.</p><button className="cp-secondary" onClick={reset}>Clear all</button></div>}
   {groups.length>0&&<nav aria-label="Results pages" className={styles.pagination}><button disabled={current===1} onClick={()=>changePage(current-1)} aria-label="Previous page">Previous</button>{Array.from({length:pages},(_,i)=><button key={i} aria-label={'Page '+(i+1)} aria-current={current===i+1?'page':undefined} onClick={()=>changePage(i+1)}>{i+1}</button>)}<button disabled={current===pages} onClick={()=>changePage(current+1)} aria-label="Next page">Next</button></nav>}
  </div>
  <footer className={styles.sources}><details><summary>Official sources & update status{affected.length?' · Some sources delayed':''}</summary><p>{refresh||'Official sources refresh automatically. Coverage and provider availability may vary.'}</p><ul>{sourceList.map((s,index)=><li key={[s.provider,s.sourceUrl,s.label,index].join('|')}>{s.sourceUrl?<a href={s.sourceUrl} target="_blank" rel="noopener noreferrer">{s.label||s.provider} ↗</a>:s.provider}: {s.status==='ok'?'Up to date':s.status==='stale'?'Saved updates; refresh delayed':'Source unavailable'}{s.checkedAt?' · Checked '+readableDate(s.checkedAt):''}</li>)}</ul><p>Confirm dates and eligibility with the official provider before booking.</p></details><details><summary>Browse official event calendars</summary><p>Event attendance does not guarantee an exam voucher.</p><ul>{providerEventDirectories.map(s=><li key={s.provider}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.provider} ↗</a></li>)}</ul></details></footer>
 </section>
}
