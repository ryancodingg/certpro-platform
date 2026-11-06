import Link from 'next/link'
import {Plus,Mail} from 'lucide-react'
import {TESTING_ACCESS} from '@/lib/testing-access'
import styles from './home-faq.module.css'

export function HomeFaq(){
 return <section className={`cp-section ${styles.section}`} aria-labelledby="home-faq-heading">
  <div className={styles.intro}>
   <h2 id="home-faq-heading">Make your next study session count.</h2>
   <p>Starting your first certification or picking up where you left off? Find the practical details here.</p>
   <aside className={styles.support} aria-labelledby="support-heading">
    <Mail size={22} aria-hidden="true"/><h3 id="support-heading">Something blocking your study?</h3>
    <p>Use email support for urgent platform issues, question corrections or feedback.</p>
    <button type="button" disabled><Mail size={17} aria-hidden="true"/>Email support</button>
    <span className={styles.pending}>Email contact coming soon</span>
    <p className={styles.hint}>When contact opens, include the certification, page link and what happened. For an urgent issue, add “Urgent” to your subject. Do not include your password.</p>
   </aside>
  </div>
  <div className={styles.questions}>
   <div className={styles.group}><h3>Getting started</h3>
    <details><summary>How do I find a certification I can practise today?<Plus size={20} aria-hidden="true"/></summary><div className={styles.answer}><p>Search by exam name, provider or code, such as DP-700. If you are exploring a new path, choose a Career, then narrow by Provider or Level. Select <strong>Practice available</strong> to show certifications with confirmed practice questions.</p><p>Open a certification to read its exam details and choose a study mode. Sign in or create an account before starting a session.</p><Link href="/certifications">Explore certifications →</Link></div></details>
    <details><summary>Is practice free, and does it include the official exam?<Plus size={20} aria-hidden="true"/></summary><div className={styles.answer}><p>{TESTING_ACCESS?'During the testing period, all published practice questions and unlimited Mock Exams are free with an account. New subscriptions are paused.':'A free account includes limited practice access. View plans for the current Free and Premium options.'}</p><p>Official exam bookings and fees are separate. Question availability varies by certification, and a practice result is not an official credential or a guarantee of passing.</p><Link href="/pricing">View access and plans →</Link></div></details>
   </div>
   <div className={styles.group}><h3>Practising with confidence</h3>
    <details><summary>Should I start with Practical Mode or a Mock Exam?<Plus size={20} aria-hidden="true"/></summary><div className={styles.answer}><p><strong>Practical Mode</strong> is for learning at your own pace. Choose a topic, answer a question and select Check Answer to read the explanation and source. Use it to work through unfamiliar topics.</p><p><strong>Mock Exam</strong> is for a timed practice session. Next and Previous save your choices, and you can review unanswered questions before submitting. After submission, filter the review by Correct, Incorrect or Unanswered to focus on what needs work.</p></div></details>
    <details><summary>Where do the questions come from, and how should I use the explanations?<Plus size={20} aria-hidden="true"/></summary><div className={styles.answer}><p>These are independent study questions, not official exam questions. Before publication, questions are checked against official topics and documentation, including the answer, explanation, topic allocation and duplicate checks.</p><p>Read why your choice was right or wrong, then follow the official source to explore the topic. If you use an AI explanation, verify important details against that source. If something looks incorrect, note the certification and question so it can be reviewed.</p></div></details>
    <details><summary>What if a question count is unavailable or a study session will not open?<Plus size={20} aria-hidden="true"/></summary><div className={styles.answer}><p>An unavailable count does not necessarily mean a certification has no questions. Select <strong>Check question counts again</strong>, or use Practice available to find confirmed question sets. When a saved question set is available, the platform identifies it.</p><p>If a session still will not open, check that you are signed in and keep the page link and any error message for your report. Avoid clearing browser data while you have study progress or notes saved only on this device.</p></div></details>
   </div>
   <div className={styles.group}><h3>Coming back to learn</h3>
    <details><summary>How do I return to my unfinished practice?<Plus size={20} aria-hidden="true"/></summary><div className={styles.answer}><p>Sign in with the same account, then use the homepage’s resume action or <strong>Continue learning</strong> in My Progress. When saved unfinished activity is available, it takes you back to that activity rather than the certification overview.</p><p>For practice saved only on your device, return using the same browser. Account-backed attempts are also saved to your account; device-only attempts are not automatically uploaded later.</p><Link href="/progress">Open My Progress →</Link></div></details>
    <details><summary>Where can I review mistakes and keep my own study notes?<Plus size={20} aria-hidden="true"/></summary><div className={styles.answer}><p>Open <strong>My Learning</strong> to revisit recorded missed questions and focus on topics you need to review. In My study space, create and edit pages, highlight key points and keep useful explanations alongside your own notes.</p><p>Check the save status beside your page. Pages marked saved to your account can sync when you sign in elsewhere. If syncing is unavailable, edits stay in that browser until a successful sync. You can also download supported notes as Word or PDF.</p><Link href="/my-learning">Open My Learning →</Link></div></details>
    <details><summary>How do I check whether an event or exam offer is right for me?<Plus size={20} aria-hidden="true"/></summary><div className={styles.answer}><p>Use the separate News, Events and Exam offers tabs. Open an item to read the available dates, eligibility and conditions, then check the linked official provider source before registering or booking.</p><p>Attending an event does not automatically guarantee an exam voucher. Offers may depend on your region, attendance, completion requirements or redemption deadline.</p><Link href="/news">Browse News & Events →</Link></div></details>
   </div>
  </div>
 </section>
}
