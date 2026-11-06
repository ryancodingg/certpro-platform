'use client'
import {useId,useState} from 'react'
import {UpdateTabs} from './discovery-controls'
import Link from 'next/link'
import {ArrowRight} from 'lucide-react'
import type {NewsRecord} from '@/lib/catalog'
import {browseNews,type NewsTab} from '@/lib/news-browse'
import {FeedCard} from './news-feed'
import {BlockReveal} from './block-reveal'
import {ScrollHeading} from './scroll-heading'
import styles from './home-updates.module.css'
const tabs:{id:NewsTab;label:string}[]=[{id:'news',label:'News'},{id:'events',label:'Events'},{id:'offers',label:'Exam offers'}]
export function HomeUpdates({items}:{items:NewsRecord[]}){
 const panelId=useId()
 const [tab,setTab]=useState<NewsTab>('news')
 const groups=browseNews(items,tab).slice(0,3)
 return <section className={`cp-section ${styles.section}`} aria-label="News, events and exam offers">
  <div className="cp-section-heading"><div><ScrollHeading text="Stay informed. Plan your next step."/><p>Official exam updates, upcoming events and verified offer terms.</p></div><Link className="cp-text-link" href={'/news?tab='+tab}>View all {tabs.find(t=>t.id===tab)?.label.toLowerCase()} <ArrowRight size={17}/></Link></div>
  <UpdateTabs value={tab} onChange={setTab} panelId={panelId}/>
  <div id={panelId} role="tabpanel" aria-label={tabs.find(t=>t.id===tab)?.label}>
  <BlockReveal key={tab} selector=".cp-news-card" variant="settle"><div className={styles.grid}>{groups.map(group=><FeedCard key={group.item.id} group={group} tab={tab} variant="compact" headingLevel={3}/>)}</div></BlockReveal>
  {!groups.length&&<p role="status">No active {tabs.find(t=>t.id===tab)?.label.toLowerCase()} available right now. Check back for official updates.</p>}
 </div></section>
}
