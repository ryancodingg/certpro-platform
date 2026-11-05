"use client"
import {useRef,useState} from 'react'
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
import styles from './news-feed.module.css'

const tabs:{id:NewsTab;label:string}[]=[{id:'news',label:'News'},{id:'events',label:'Events'},{id:'offers',label:'Exam offers'}]
function FeedCard({group,tab}:{group:NewsGroup;tab:NewsTab}){
 const {item,related}=group
 const date=tab==='events'?item.event_on||related.find(r=>r.event_on)?.event_on:tab==='offers'?item.expires_on:item.published_on||item.verified_on
 const generic=/^An upcoming .+ event\. Check the official listing/i.test(item.summary)
 return <article className={`cp-news-card ${styles.card} ${tab==='news'?styles.story:''}`}>
  <div className={styles.meta}><span><ProviderLogo provider={item.provider} className="h-6 w-6"/>{item.provider}</span><span>{tab==='news'?newsTypeLabel(item.type):tab==='offers'?'Exam offer':'Event'}</span></div>
  <div className={styles.cardContent}>
   <p className={styles.date}>{tab==='news'?(item.published_on?'Published ':'Source checked '):tab==='offers'?(date?'Deadline · ':'No fixed deadline listed'):(date&&date<new Date().toISOString().slice(0,10)?'Started · ':'Event · ')}{(tab!=='offers'||date)&&readableDate(date)}</p>
   <h2><Link href={'/news/'+item.id}>{item.title}</Link></h2>
   {!generic&&<p className={styles.summary}>{item.summary}</p>}
   {item.attendance&&<p className={styles.condition}>{item.attendance}</p>}
   {!!item.exam_codes?.length&&<p className={styles.exams}>Exams: {item.exam_codes.join(' · ')}</p>}
   {item.eligibility&&<p className={styles.condition}><strong>Eligibility:</strong> {item.eligibility}</p>}
   {tab==='events'&&item.expires_on&&<p className={styles.condition}><strong>Exam deadline:</strong> {readableDate(item.expires_on)}</p>}
   {!!related.length&&<details className={styles.related}><summary>{related.length} related official {related.length===1?'update':'updates'}</summary><ul>{related.map(r=><li key={r.id}><Link href={'/news/'+r.id}>{r.provider}: {r.title}</Link></li>)}</ul></details>}
  </div>
  <Link className={`cp-text-link ${styles.read}`} href={'/news/'+item.id}>{tab==='offers'?'View offer & conditions':tab==='events'?'View event details':hasNewsSummary(item)?'Read article':'View source details'}<ArrowRight size={16}/></Link>
 </article>
}
export function NewsFeed({initialNews}:{initialNews?:NewsSnapshot}){
 const {news,sources,refresh,error}=useNews(initialNews)
 const {user}=useAuth();const {data:progress}=useProgress()
 const [tab,setTab]=useState<NewsTab>('news'),[provider,setProvider]=useState('All'),[query,setQuery]=useState(''),[scope,setScope]=useState('all'),[page,setPage]=useState(1),[filtersOpen,setFiltersOpen]=useState(false)
 const results=useRef<HTMLDivElement>(null)
 const savedProviders=new Set(progress.saved.map(s=>certificationById(s.certification)?.provider).filter(Boolean))
 const active=news.filter(n=>isActiveNews(n))
 const groups=browseNews(active,tab).filter(g=>[g.item,...g.related].some(n=>(provider==='All'||n.provider===provider)&&(scope!=='saved'||!!user&&savedProviders.has(n.provider))&&(scope!=='closing'||isClosingSoon(tab==='events'?{...n,expires_on:n.event_on}:n))&&[n.title,n.summary,n.provider,...(n.exam_codes||[])].join(' ').toLowerCase().includes(query.toLowerCase())))
 const pages=Math.max(1,Math.ceil(groups.length/NEWS_PAGE_SIZE)),current=Math.min(page,pages),shown=groups.slice((current-1)*NEWS_PAGE_SIZE,current*NEWS_PAGE_SIZE)
 const reset=()=>{setQuery('');setProvider('All');setScope('all');setPage(1)}
 const changeTab=(next:NewsTab)=>{setTab(next);setPage(1);setScope('all')}
 const changePage=(next:number)=>{setPage(next);results.current?.focus({preventScroll:true});results.current?.scrollIntoView({block:'start',behavior:'instant'})}
 const sourceList=(sources||[]) as {provider:string;sourceUrl?:string;label?:string;status:string;checkedAt?:string}[]
 const affected=sourceList.filter(s=>(provider==='All'||s.provider===provider)&&s.status!=='ok')
 return <section className={`cp-section ${styles.feed}`}>
  <header className={styles.header}><h1 className="cp-page-title">News & Events</h1><p>Stay informed. Find your next event. Save on your exam.</p></header>
  <div role="tablist" aria-label="Browse news, events and exam offers" className={styles.tabs}>{tabs.map((t,i)=><button key={t.id} id={'news-tab-'+t.id} role="tab" aria-selected={tab===t.id} aria-controls="news-results" tabIndex={tab===t.id?0:-1} onClick={()=>changeTab(t.id)} onKeyDown={e=>{const target=e.key==='ArrowRight'?(i+1)%3:e.key==='ArrowLeft'?(i+2)%3:e.key==='Home'?0:e.key==='End'?2:null;if(target!==null){e.preventDefault();changeTab(tabs[target].id);document.getElementById('news-tab-'+tabs[target].id)?.focus()}}}>{t.label}<span>{browseNews(active,t.id).length}</span></button>)}</div>
  <div className={styles.toolbar}><label className={styles.search}><span className="sr-only">Search updates</span><input aria-label="Search updates" placeholder={tab==='news'?'Search news or exam codes':tab==='events'?'Search events or providers':'Search offers or exam codes'} value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}}/></label><button className="cp-secondary" aria-expanded={filtersOpen} aria-controls="news-filters" onClick={()=>setFiltersOpen(!filtersOpen)}><SlidersHorizontal size={16}/>Filters{(provider!=='All'||scope!=='all')?' · active':''}</button></div>
  {filtersOpen&&<div id="news-filters" className={styles.filters}><label>Provider<select value={provider} onChange={e=>{setProvider(e.target.value);setPage(1)}}><option>All</option>{Array.from(new Set(active.map(n=>n.provider))).sort().map(p=><option key={p}>{p}</option>)}</select></label><label>Show<select value={scope} onChange={e=>{setScope(e.target.value);setPage(1)}}><option value="all">All {tabs.find(t=>t.id===tab)?.label.toLowerCase()}</option>{user&&<option value="saved">My saved providers</option>}{tab!=='news'&&<option value="closing">Dates in the next 30 days</option>}</select></label><button className="cp-text-link" onClick={reset}>Reset filters</button></div>}
  <div id="news-results" role="tabpanel" aria-labelledby={'news-tab-'+tab} ref={results} tabIndex={-1} className={styles.results}>
   <p className={styles.count} aria-live="polite">{groups.length?`${(current-1)*NEWS_PAGE_SIZE+1}–${Math.min(current*NEWS_PAGE_SIZE,groups.length)} of ${groups.length}`:'0'} {tab==='news'?'articles':tab==='events'?'events':'offers'} · {tab==='news'?'Newest first':tab==='events'?'Soonest events first':'Nearest deadlines first'}</p>
   {error&&<p role="status" className={styles.notice}>Live refresh is unavailable. You can still browse saved updates.</p>}
   <div className={tab==='news'?styles.stories:styles.grid}>{shown.map(g=><FeedCard key={tab+g.item.id} group={g} tab={tab}/>)}</div>
   {!groups.length&&<div className="cp-empty"><h2>No {tab==='news'?'articles':tab} match your filters.</h2><p>Try a broader search or another provider.</p><button className="cp-secondary" onClick={reset}>Reset filters</button></div>}
   {groups.length>0&&<nav aria-label="Results pages" className={styles.pagination}><button disabled={current===1} onClick={()=>changePage(current-1)} aria-label="Previous page">Previous</button>{Array.from({length:pages},(_,i)=><button key={i} aria-label={'Page '+(i+1)} aria-current={current===i+1?'page':undefined} onClick={()=>changePage(i+1)}>{i+1}</button>)}<button disabled={current===pages} onClick={()=>changePage(current+1)} aria-label="Next page">Next</button></nav>}
  </div>
  <footer className={styles.sources}><details><summary>Official sources & update status{affected.length?' · Some sources delayed':''}</summary><p>{refresh||'Official sources refresh automatically. Coverage and provider availability may vary.'}</p><ul>{sourceList.map(s=><li key={s.sourceUrl||s.provider}>{s.sourceUrl?<a href={s.sourceUrl} target="_blank" rel="noopener noreferrer">{s.label||s.provider} ↗</a>:s.provider}: {s.status==='ok'?'Up to date':s.status==='stale'?'Saved updates; refresh delayed':'Source unavailable'}{s.checkedAt?' · Checked '+readableDate(s.checkedAt):''}</li>)}</ul><p>Confirm dates and eligibility with the official provider before booking.</p></details><details><summary>Browse official event calendars</summary><p>Event attendance does not guarantee an exam voucher.</p><ul>{providerEventDirectories.map(s=><li key={s.provider}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.provider} ↗</a></li>)}</ul></details></footer>
 </section>
}
