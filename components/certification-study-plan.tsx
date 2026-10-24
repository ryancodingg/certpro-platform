'use client'
import Link from 'next/link'
import {CalendarDays} from 'lucide-react'
import {useAuth} from '@/hooks/use-auth'
import {openLearningCalendar} from './learning-tools'
export function CertificationStudyPlan({certification}:{certification:string}){const {user}=useAuth();return <section className="cp-inline-study"><CalendarDays size={22} aria-hidden="true"/><div><h2>Make time for this certification</h2><p>Set an exam target, daily study goal and in-app reminders.</p></div>{user?<button className="cp-secondary" onClick={()=>openLearningCalendar(certification)}>Plan my learning</button>:<Link className="cp-secondary" href={'/auth/login?next='+encodeURIComponent('/study-plan?certification='+certification)}>Sign in to plan</Link>}</section>}
