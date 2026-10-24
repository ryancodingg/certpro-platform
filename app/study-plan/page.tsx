'use client'
import {useEffect} from 'react'
import {useRouter} from 'next/navigation'
export default function StudyPlanner(){const router=useRouter();useEffect(()=>{const q=new URLSearchParams(window.location.search);const target='/?planner=1'+(q.get('certification')?'&certification='+encodeURIComponent(q.get('certification')!):'');router.replace(target)},[router]);return <p className="cp-section" role="status">Opening your calendar…</p>}
