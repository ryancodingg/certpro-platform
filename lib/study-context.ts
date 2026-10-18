import {certificationById} from './catalog'
import type {StudyPlan} from './study-plan'

export function studyCertification(value:string|null|undefined):string|null {
  const certification=value?certificationById(value):undefined
  return certification ? certification.aliases[0] || certification.id : null
}
export function studyPlanHref(certification:string):string {
  return '/study-plan?certification='+encodeURIComponent(studyCertification(certification)||certification)
}
export function matchingStudyPlan(plans:StudyPlan[],certification:string):StudyPlan|undefined {
  const canonical=studyCertification(certification)
  return canonical ? plans.find(plan=>studyCertification(plan.certification)===canonical) : undefined
}
// Never allow a login link to redirect to an external origin or an auth loop.
export function safeReturnPath(value:string|null):string {
  if(!value||!value.startsWith('/')||value.startsWith('//')||/[\\\u0000-\u0020]/.test(value))return '/'
  try {const decoded=decodeURIComponent(value);if(decoded.startsWith('//')||/[\\\u0000-\u0020]/.test(decoded)||decoded.startsWith('/auth/'))return '/';const url=new URL(value,'https://certpro.local');return url.origin==='https://certpro.local'?url.pathname+url.search+url.hash:'/'}catch{return '/'}
}
