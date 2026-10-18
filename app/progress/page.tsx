import { SiteHeader } from '@/components/site-header'
import { ProgressDashboard } from '@/components/learner-progress'
export default function ProgressPage(){return <main className="cp-site"><SiteHeader/><section className="cp-section"><h1 className="text-3xl font-bold mb-3">My Progress</h1><p className="mb-8 text-muted-foreground">Your saved certifications, study sections, practice activity, and mock exam history.</p><ProgressDashboard/></section></main>}
