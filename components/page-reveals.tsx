"use client"
import type {ReactNode} from "react"
import {usePathname} from "next/navigation"
import {BlockReveal} from "./block-reveal"

// Reading pages share the homepage reveal. Working surfaces only reveal their title.
export function PageReveals({children}:{children:ReactNode}){
 const pathname=usePathname()
 if(pathname==="/")return <>{children}</>
 const working=/^\/(practice|quiz|my-learning|admin)(\/|$)/.test(pathname||"")
 const headings='h1:not(:has([data-reveal-word]))'+(working?'':', h2:not(:has([data-reveal-word]))')
 const selector=(headings+', .cp-cert-card, .cp-news-card').split(', ').map(target=>target+':not([contenteditable], [contenteditable] *, [role="dialog"] *)').join(', ')
 return <BlockReveal key={pathname} selector={selector}>{children}</BlockReveal>
}
