'use client'
import {useId} from 'react'
import {X} from 'lucide-react'
import type {NewsTab} from '@/lib/news-browse'
import styles from './discovery-controls.module.css'
export const updateTabs:{id:NewsTab;label:string}[]=[{id:'news',label:'News'},{id:'events',label:'Events'},{id:'offers',label:'Exam offers'}]
export function UpdateTabs({value,onChange,panelId}:{value:NewsTab;onChange:(value:NewsTab)=>void;panelId:string}){
 const id=useId()
 return <div role="tablist" aria-label="Browse news, events and exam offers" className={styles.tabs}>{updateTabs.map((tab,index)=><button type="button" key={tab.id} id={`${id}-${tab.id}`} role="tab" aria-selected={value===tab.id} aria-controls={panelId} tabIndex={value===tab.id?0:-1} onClick={()=>onChange(tab.id)} onKeyDown={event=>{const next=event.key==='ArrowRight'?(index+1)%3:event.key==='ArrowLeft'?(index+2)%3:event.key==='Home'?0:event.key==='End'?2:null;if(next!==null){event.preventDefault();onChange(updateTabs[next].id);const buttons=event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');buttons?.[next]?.focus()}}}>{tab.label}</button>)}</div>
}
export function ActiveFilters({items,onClear}:{items:{key:string;label:string;remove:()=>void}[];onClear:()=>void}){
 if(!items.length)return null
 return <div className={styles.active} aria-label="Applied filters">{items.map(item=><button type="button" key={item.key} onClick={item.remove} aria-label={`Remove ${item.label} filter`}>{item.label}<X size={14} aria-hidden="true"/></button>)}<button type="button" className={styles.clear} onClick={onClear}>Clear all</button></div>
}
