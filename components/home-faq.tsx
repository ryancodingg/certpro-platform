import Link from 'next/link'
import {Plus} from 'lucide-react'
import {TESTING_ACCESS} from '@/lib/testing-access'
import styles from './home-faq.module.css'

export function HomeFaq(){
 return <section className={`cp-section ${styles.section}`} aria-labelledby="home-faq-heading">
  <div className={styles.intro}><h2 id="home-faq-heading">A few things to know</h2><p>Your questions, answered before you start.</p></div>
  <div className={styles.questions}>
   <details><summary>Is learning on CertPro free?<Plus size={20} aria-hidden="true"/></summary><p>{TESTING_ACCESS?'During testing, all published practice questions and unlimited Mock Exams are free with an account. New subscriptions are paused.':'A free account includes limited practice access. Check our plans for the current Free and Premium options.'} Provider exam fees are separate, and question availability varies by certification. <Link href="/pricing">View plans</Link>.</p></details>
   <details><summary>How are practice questions reviewed?<Plus size={20} aria-hidden="true"/></summary><p>Questions are checked against official exam topics and documentation, with checks for answer accuracy, explanations, duplicates and topic allocation before publication. These are independent study questions, not official exam questions. Use the source links in explanations to check the underlying guidance.</p></details>
   <details><summary>What does C-Fox help me with?<Plus size={20} aria-hidden="true"/></summary><p>C-Fox helps you understand a checked answer: explain each choice, simplify the reasoning or give an example. You can keep useful explanations as learning notes. AI follow-ups can make mistakes, so check the official source; availability and daily limits apply.</p></details>
   <details><summary>How is my learning progress saved?<Plus size={20} aria-hidden="true"/></summary><p>Sign in to save certifications and return to your learning. Practice is saved in this browser, and account-backed attempts also save to your account. If account syncing is unavailable, you can still see this device’s saved history. Device-only attempts are not uploaded automatically, and clearing browser data removes local history.</p></details>
  </div>
 </section>
}
