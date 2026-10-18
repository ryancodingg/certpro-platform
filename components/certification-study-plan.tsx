'use client'

import Link from 'next/link'
import useSWR from 'swr'
import {CalendarDays, Clock, Bell} from 'lucide-react'
import {useAuth} from '@/hooks/use-auth'
import {learnerFetch} from '@/lib/learner-client'
import {matchingStudyPlan,studyPlanHref} from '@/lib/study-context'
import {sessions,type StudyPlan} from '@/lib/study-plan'

const weekdays=['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
export function CertificationStudyPlan({certification}:{certification:string}) {
  const {user,isLoading}=useAuth()
  const {data,error}=useSWR<{plans:StudyPlan[]}>(user?['/api/study-plan',user.id]:null,async([url]:[string,string])=>{
    const response=await learnerFetch(url)
    const result=await response.json()
    if(!response.ok)throw Error(result.error||'Unable to load your study plan.')
    return result
  })
  const plan=matchingStudyPlan(data?.plans||[],certification)
  const next=plan?sessions(plan,new Date(),90)[0]:undefined
  const href=studyPlanHref(certification)
  return <section className="cp-info-panel" aria-labelledby="certification-study-title">
    <div className="flex items-center gap-3 mb-3"><CalendarDays aria-hidden="true" className="text-violet-600"/><h2 id="certification-study-title">Make time for this certification</h2></div>
    <p className="mb-4">Turn your exam goal into a routine. Choose a target date, study days and a daily learning goal, then add your sessions to your calendar.</p>
    {isLoading||user&&!data&&!error?<p role="status">Loading your study plan…</p>:plan?<div className="rounded-xl bg-violet-50 border border-violet-100 p-4 mb-4 space-y-2">
      <p className="font-semibold">Target exam date: <time dateTime={plan.examDate}>{plan.examDate}</time></p>
      <p className="flex items-center gap-2"><Clock size={17} aria-hidden="true"/>{plan.minutes} minutes · {plan.days.map(day=>weekdays[day]).join(', ')} · {plan.time}</p>
      <p className="text-sm">Timezone: {plan.timezone}</p>
      {next&&<p>Next session: {new Intl.DateTimeFormat(undefined,{timeZone:plan.timezone,dateStyle:'medium',timeStyle:'short'}).format(next)}</p>}
      <p className="flex items-center gap-2 text-sm"><Bell size={17} aria-hidden="true"/>Calendar alert: {plan.reminderMinutes?`${plan.reminderMinutes} minutes before`:'At study time'}</p>
    </div>:null}
    {error&&<p role="alert" className="mb-3">Your saved plan could not be loaded. Open the planner to try again.</p>}
    <Link className="cp-primary" href={user?href:'/auth/login?next='+encodeURIComponent(href)}>{user?(plan?'Edit plan & calendar reminders':'Schedule my learning'):'Sign in to schedule learning'}</Link>
    <p className="cp-note mt-3">Works with Google Calendar, Apple Calendar and Outlook through calendar export. Email reminders are not connected yet. Your target date does not book an official exam.</p>
  </section>
}
