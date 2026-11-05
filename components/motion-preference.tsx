'use client'
import {useState} from 'react'
import {saveFullMotion,useFullMotion} from '@/lib/browser-motion'
export function MotionPreference(){
 const full=useFullMotion(),[error,setError]=useState('')
 function save(value:boolean){try{saveFullMotion(value);setError('')}catch{setError('Your browser could not save this preference.')}}
 return <details style={{maxWidth:360}}><summary className="cp-text-link" style={{cursor:'pointer'}}>Motion settings</summary><p className="cp-note">Choose animations for this browser. Your device settings stay unchanged.</p><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button className="cp-secondary" aria-pressed={!full} onClick={()=>save(false)}>Follow device setting</button><button className="cp-secondary" aria-pressed={full} onClick={()=>save(true)}>Enable full effects</button></div><p className="cp-note" role="status">{error||(full?'Full effects enabled for this browser.':'Following your device’s motion preference.')}</p></details>
}
