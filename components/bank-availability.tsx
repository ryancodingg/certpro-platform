"use client"
import useSWR from "swr"
export function BankAvailability({certification}: {certification:string}) {
  const {data,error,isLoading}=useSWR(`/api/learning?certification=${encodeURIComponent(certification)}`,async url=>{const r=await fetch(url);if(!r.ok)throw new Error("Unavailable");return r.json()})
  return <span>{isLoading?"Checking bank…":error?"Bank unavailable":data?.count?`${data.count} published questions`:"No published questions"}</span>
}
