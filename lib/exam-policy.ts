import { certificationById } from './catalog'
import { guideFor } from './exam-guide'

/** Checked against provider scoring policies on 2026-10-21.
 * A raw practice percentage must never be presented as an official scaled score.
 * Durations are standard exam working time, not check-in or accommodations.
 */
export type ExamPolicy = {
  passingScore: string
  passingSource: string
  durationMinutes: number | null
  durationNote: string
  /** CertPro practice benchmark only; NOT a conversion of the official passing score. */
  mockPassPercent: number | null
}
export const PRACTICE_PASS_PERCENT = 70
export const PRACTICE_PASS_NOTE = 'CertPro uses a 70% practice benchmark. This is not the official passing score or a prediction of your exam result; scaled scoring, adaptive testing and performance tasks are not reproduced.'
const microsoftScoring = 'https://learn.microsoft.com/en-us/credentials/certifications/exam-scoring-reports'
const awsScoring = 'https://aws.amazon.com/certification/policies/after-testing/'
const isacaScoring = 'https://www.isaca.org/credentialing/-/media/fa494652c5f149289af38cef18328650.ashx'

const overrides: Record<string, { score: string; source: string; minutes: number; note?: string }> = {
  'comptia-a-plus': { score: 'Core 1 (220-1201): 675; Core 2 (220-1202): 700, each on a 100–900 scaled-score range. Both exams must be passed; these are not percentages.', source: 'https://www.comptia.org/en-us/certifications/a/core-1-and-2-v15/', minutes: 90, note: '90 minutes per Core exam. A+ requires two separate exams. A combined-topic CertPro bank is a practice simulation, not a complete two-exam sitting.' },
  'comptia-network-plus': { score: '720 on a 100–900 scaled-score range; not a percentage.', source: 'https://www.comptia.jp/pdf/Network%2B_N10-009.pdf', minutes: 90 },
  'comptia-security-plus': { score: '750 on a 100–900 scaled-score range; not a percentage.', source: 'https://www.comptia.jp/pdf/Security%2B_SY0-701.pdf', minutes: 90 },
  'comptia-cysa-plus': { score: '750 on a 100–900 scaled-score range; not a percentage.', source: 'https://www.comptia.org/en-us/certifications/cybersecurity-analyst/v4/', minutes: 165 },
  'cisco-ccna': { score: 'Not publicly disclosed by Cisco. Passing standards can vary by exam form.', source: 'https://www.cisco.com/site/us/en/learn/training-certifications/exams/policies.html', minutes: 120 },
  'isc2-certified-in-cybersecurity': { score: '700 out of 1,000 scaled points; not a percentage.', source: 'https://www.isc2.org/certifications/cc/cc-certification-exam-outline', minutes: 120, note: '120 minutes. The official CC uses adaptive testing; this practice exam is a fixed question set with review.' },
  'isaca-cisa': { score: '450 on a 200–800 scaled-score range; not a percentage.', source: isacaScoring, minutes: 240 },
  'isaca-cism': { score: '450 on a 200–800 scaled-score range; not a percentage.', source: isacaScoring, minutes: 240 },
}

/** Only parses unambiguous timing facts, not booking time or conflicting beta timings. */
export function parseExamMinutes(value: string): number | null {
  const normalized = value.trim().toLowerCase()
  const minutes = normalized.match(/^(\d+)\s*minutes?$/)
  if (minutes) return Number(minutes[1]) || null
  const hours = normalized.match(/^(\d+(?:\.\d+)?)\s*hours?$/)
  if (hours) return Number(hours[1]) * 60 || null
  if (normalized === 'two hours') return 120
  return null
}

export function examPolicy(id: string): ExamPolicy {
  const cert = certificationById(id)
  const canonical = cert?.id || id
  const guide = guideFor(canonical)
  const override = overrides[canonical]
  if (override) return {
    passingScore: override.score,
    passingSource: override.source,
    durationMinutes: override.minutes,
    durationNote: override.note || `${override.minutes} minutes of standard exam time.`,
    mockPassPercent: PRACTICE_PASS_PERCENT,
  }
  const timing = guide.facts.find(f => f.label === 'Exam time')?.value || ''
  const discrepancy = guide.facts.find(f => f.label === 'Duration discrepancy')?.value
  const durationMinutes = discrepancy ? null : parseExamMinutes(timing)
  let passingScore = 'A verified numeric passing threshold is not available in this catalog. Consult the official exam guide.'
  let passingSource = guide.guideUrl
  if (cert?.provider === 'Microsoft') {
    passingSource = microsoftScoring
    passingScore = canonical.startsWith('mos-') || canonical.startsWith('microsoft-office-specialist-')
      ? 'Microsoft Office exams use a 1–1,000 scale. The required score varies by exam; check the individual Certiport exam requirements.'
      : '700 or higher on a 1–1,000 scaled-score range; this does not mean 70% correct. Each required exam must be passed.'
  } else if (cert?.provider === 'GitHub') {
    passingSource = guide.guideUrl
    passingScore = '700 or higher on the Microsoft Learn scaled-score system; this does not mean 70% correct.'
  } else if (cert?.provider === 'AWS') {
    const scores: Record<string, number> = { Foundational: 700, Associate: 720, Professional: 750, Specialty: 750 }
    const score = scores[cert.level]
    if (canonical === 'aws-ai-business-strategist') {
      passingScore = '700 on a 100–1,000 scaled-score range; not a percentage.'
      passingSource = 'https://docs.aws.amazon.com/aws-certification/latest/ai-business-strategist-01/ai-business-strategist-01.html'
    } else if (score) {
      passingScore = `${score} on a 100–1,000 scaled-score range; not a percentage.`
      passingSource = awsScoring
    } else {
      const published = guide.facts.find(f => f.label === 'Passing score')?.value
      if (published) passingScore = published
    }
  } else if (cert?.provider === 'Google Cloud') {
    passingScore = 'Numeric passing threshold is not publicly disclosed. Google reports pass/fail results.'
    passingSource = 'https://support.google.com/cloud-certification/answer/9438208?hl=en'
  } else if (cert?.provider === 'Databricks') {
    passingScore = 'Not publicly disclosed. Databricks sets passing scores statistically and may change them when exams are updated.'
    passingSource = 'https://www.databricks.com/learn/certification/faq'
  }
  return {
    passingScore, passingSource, durationMinutes,
    durationNote: discrepancy || (durationMinutes ? `${durationMinutes} minutes of standard exam time, as listed in the official exam guide.` : 'No single verified duration is available here. Check the specific exam and version when booking; multi-exam credentials have separate exam times.'),
    mockPassPercent: cert ? PRACTICE_PASS_PERCENT : null,
  }
}
