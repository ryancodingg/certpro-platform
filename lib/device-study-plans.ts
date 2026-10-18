import {studyPlanSchema,type StudyPlan} from './study-plan'
type StorageLike=Pick<Storage,'getItem'|'setItem'>
export function devicePlanKey(account:string){return 'certpro.study-plans.v1:'+encodeURIComponent(account)}
export function readDevicePlans(storage:StorageLike,account:string):StudyPlan[]{
 const raw=storage.getItem(devicePlanKey(account));if(!raw)return []
 const data=JSON.parse(raw);if(!Array.isArray(data))throw Error('Saved device plans are unreadable. Your stored data has not been changed.')
 return data.map(row=>studyPlanSchema.parse(row))
}
export function writeDevicePlans(storage:StorageLike,account:string,plans:StudyPlan[]){
 const checked=plans.map(p=>studyPlanSchema.parse(p));storage.setItem(devicePlanKey(account),JSON.stringify(checked));return checked
}
export function upsertDevicePlan(plans:StudyPlan[],plan:StudyPlan){return [...plans.filter(p=>p.certification!==plan.certification),plan]}
