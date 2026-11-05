'use client'
import {useSyncExternalStore} from 'react'
const key='certpro.motion.v1'
const changed='certpro:motion-preference'
function read(){try{return localStorage.getItem(key)==='full'}catch{return false}}
function subscribe(callback:()=>void){window.addEventListener('storage',callback);window.addEventListener(changed,callback);return()=>{window.removeEventListener('storage',callback);window.removeEventListener(changed,callback)}}
export function useFullMotion(){return useSyncExternalStore(subscribe,read,()=>false)}
export function saveFullMotion(full:boolean){localStorage.setItem(key,full?'full':'system');window.dispatchEvent(new Event(changed))}
