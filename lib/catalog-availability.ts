import {TESTING_ACCESS} from './testing-access'
export type CatalogAvailability = {source?:'verified'|'backup';count:number|null;practice:'available'|'empty'|'unknown';mock:'available'|'empty'|'unavailable'|'unknown'}
export function bankAvailability(count:number,recovery:boolean):CatalogAvailability{
 if(!Number.isSafeInteger(count)||count<0)return {count:null,practice:'unknown',mock:'unknown'}
 if(recovery)return {count:count||null,practice:count?'available':'unknown',mock:count&&TESTING_ACCESS?'available':'unavailable'}
 return {count,practice:count?'available':'empty',mock:count?'available':'empty'}
}
export const unknownAvailability:CatalogAvailability={count:null,practice:'unknown',mock:'unknown'}
// Filter before pagination so availability applies to the entire matching catalog.
export function filterPracticeAvailability<T extends {id:string}>(items:T[],availability:Record<string,CatalogAvailability>|undefined,practiceOnly:boolean):T[]{
 return practiceOnly?items.filter(item=>availability?.[item.id]?.practice==='available'):items
}
