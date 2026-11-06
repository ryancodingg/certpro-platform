import Link from 'next/link'
import {BlockReveal} from './block-reveal'
import {Linkedin,Instagram,Mail,AtSign} from 'lucide-react'
import styles from './site-footer.module.css'
// Destinations are intentionally not guessed. Replace these placeholders with verified public links.
const channels=[{name:'LinkedIn',Icon:Linkedin},{name:'Instagram',Icon:Instagram},{name:'Email',Icon:Mail},{name:'Threads',Icon:AtSign}]
export function SiteFooter(){
 return <BlockReveal selector="[data-footer-reveal]"><footer className={styles.footer}>
  <div className={styles.brand} data-footer-reveal><Link href="/" className="cp-footer-logo" aria-label="CertPro home"><img src="/brand/certpro-fox-c-v1-192.png" alt="" width={32} height={32}/><span className="gradient-text text-2xl">CertPro</span></Link><p>Learn. Practice. Build confidence.</p></div>
  <nav className={styles.navigation} data-footer-reveal aria-label="Footer"><Link href="/certifications">Certifications</Link><Link href="/news">News & Events</Link><Link href="/progress">My Progress</Link><Link href="/my-learning">My Learning</Link></nav>
  <div className={styles.contact} data-footer-reveal><h2>Contact & follow</h2><p id="footer-contact-status">Our email and social links are coming soon.</p><div className={styles.channels}>{channels.map(({name,Icon})=><button key={name} type="button" disabled aria-label={`${name} — coming soon`} aria-describedby="footer-contact-status"><Icon size={19} aria-hidden="true"/><span>{name}</span></button>)}</div></div>
 </footer></BlockReveal>
}
