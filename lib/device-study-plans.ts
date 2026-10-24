import {studyPlanSchema,type StudyPlan} from './study-plan'
type StorageLike=Pick<Storage,'getItem'|'setItem'>
export function devicePlanKey(account:string){return 'certpro.study-plans.v1:'+encodeURIComponent(account)}
export function readDevicePlans(storage:StorageLike,account:string):StudyPlan[]{
 const raw=storage.getItem(devicePlanKey(account));if(!raw)return []
 const data=JSON.parse(raw);if(!Array.isArray(data))throw Error('Saved device plans are unreadable. Your stored data has not been changed.')
 const cancelled=readCancelledPlans(storage,account);return data.map(row=>studyPlanSchema.parse(row)).filter(p=>!cancelled.includes(p.certification))
}
export function writeDevicePlans(storage:StorageLike,account:string,plans:StudyPlan[]){
 const checked=plans.map(p=>studyPlanSchema.parse(p));storage.setItem(devicePlanKey(account),JSON.stringify(checked));storage.setItem(cancelledKey(account),JSON.stringify(readCancelledPlans(storage,account).filter(id=>!checked.some(p=>p.certification===id))));if(typeof window!=='undefined')window.dispatchEvent(new Event('certpro-study-plans'));return checked
}
export function upsertDevicePlan(plans:StudyPlan[],plan:StudyPlan){return [...plans.filter(p=>p.certification!==plan.certification),plan]}

function cancelledKey(account:string){return devicePlanKey(account)+':cancelled'}
export function readCancelledPlans(storage:StorageLike,account:string):string[]{const raw=JSON.parse(storage.getItem(cancelledKey(account))||'[]');if(!Array.isArray(raw)||raw.some(x=>typeof x!=='string'))throw Error('Cancelled plans could not be read.');return raw}
export function cancelDevicePlan(storage:StorageLike,account:string,certification:string){const ids=readCancelledPlans(storage,account);storage.setItem(cancelledKey(account),JSON.stringify([...new Set([...ids,certification])]));if(typeof window!=='undefined')window.dispatchEvent(new Event('certpro-study-plans'));return readDevicePlans(storage,account)}
